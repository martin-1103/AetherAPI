import jwt from 'jsonwebtoken';
import { query } from '../database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await query('SELECT id, username, email FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const checkProjectRole = (requiredRoles) => {
  return async (req, res, next) => {
    const projectId = req.params.projectId || req.body.projectId;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID required' });
    }

    try {
      const result = await query(
        `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2
         UNION
         SELECT 'Owner' as role FROM projects WHERE id = $1 AND owner_id = $2`,
        [projectId, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }

      const userRole = result.rows[0].role;
      
      if (!requiredRoles.includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('Error checking project role:', error);
      res.status(500).json({ error: 'Failed to verify permissions' });
    }
  };
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};
