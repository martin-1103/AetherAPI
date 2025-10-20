import express from 'express';
import { query } from '../database.js';
import { authenticateToken, checkProjectRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/projects/:projectId/environments', checkProjectRole(['Owner', 'Admin', 'Editor', 'Viewer']), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM environments WHERE project_id = $1 ORDER BY created_at DESC',
      [req.params.projectId]
    );

    res.json({ environments: result.rows });
  } catch (error) {
    console.error('Error fetching environments:', error);
    res.status(500).json({ error: 'Failed to fetch environments' });
  }
});

router.post('/projects/:projectId/environments', checkProjectRole(['Owner', 'Admin', 'Editor']), async (req, res) => {
  const { name, variables } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Environment name is required' });
  }

  try {
    const result = await query(
      'INSERT INTO environments (project_id, name, variables) VALUES ($1, $2, $3) RETURNING *',
      [req.params.projectId, name, JSON.stringify(variables || {})]
    );

    res.status(201).json({ environment: result.rows[0] });
  } catch (error) {
    console.error('Error creating environment:', error);
    res.status(500).json({ error: 'Failed to create environment' });
  }
});

router.put('/environments/:environmentId', authenticateToken, async (req, res) => {
  const { name, variables } = req.body;

  try {
    const result = await query(
      'UPDATE environments SET name = $1, variables = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, JSON.stringify(variables), req.params.environmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Environment not found' });
    }

    res.json({ environment: result.rows[0] });
  } catch (error) {
    console.error('Error updating environment:', error);
    res.status(500).json({ error: 'Failed to update environment' });
  }
});

router.delete('/environments/:environmentId', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM environments WHERE id = $1', [req.params.environmentId]);
    res.json({ message: 'Environment deleted successfully' });
  } catch (error) {
    console.error('Error deleting environment:', error);
    res.status(500).json({ error: 'Failed to delete environment' });
  }
});

export default router;
