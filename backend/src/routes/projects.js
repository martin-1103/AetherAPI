import express from 'express';
import { query } from '../database.js';
import { authenticateToken, checkProjectRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT p.*, pm.role 
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
       WHERE p.owner_id = $1 OR pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json({ projects: result.rows });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/', async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const result = await query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', req.user.id]
    );

    res.status(201).json({ project: result.rows[0] });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/:projectId', authenticateToken, checkProjectRole(['Owner', 'Admin', 'Editor', 'Viewer']), async (req, res) => {
  try {
    const result = await query('SELECT * FROM projects WHERE id = $1', [req.params.projectId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project: result.rows[0] });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.put('/:projectId', checkProjectRole(['Owner', 'Admin']), async (req, res) => {
  const { name, description } = req.body;

  try {
    const result = await query(
      'UPDATE projects SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, description, req.params.projectId]
    );

    res.json({ project: result.rows[0] });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/:projectId', checkProjectRole(['Owner']), async (req, res) => {
  try {
    await query('DELETE FROM projects WHERE id = $1', [req.params.projectId]);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

router.get('/:projectId/members', checkProjectRole(['Owner', 'Admin', 'Editor', 'Viewer']), async (req, res) => {
  try {
    const result = await query(
      `SELECT pm.id, pm.role, u.id as user_id, u.username, u.email
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [req.params.projectId]
    );

    res.json({ members: result.rows });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.post('/:projectId/members', checkProjectRole(['Owner', 'Admin']), async (req, res) => {
  const { userEmail, role } = req.body;

  if (!userEmail || !role) {
    return res.status(400).json({ error: 'User email and role are required' });
  }

  try {
    const userResult = await query('SELECT id FROM users WHERE email = $1', [userEmail]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    const result = await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3 RETURNING *',
      [req.params.projectId, userId, role]
    );

    res.status(201).json({ member: result.rows[0] });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

export default router;
