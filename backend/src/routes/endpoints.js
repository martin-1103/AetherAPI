import express from 'express';
import axios from 'axios';
import { query } from '../database.js';
import { authenticateToken, checkProjectRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/projects/:projectId/endpoints', checkProjectRole(['Owner', 'Admin', 'Editor', 'Viewer']), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM endpoints WHERE project_id = $1 ORDER BY created_at DESC',
      [req.params.projectId]
    );

    res.json({ endpoints: result.rows });
  } catch (error) {
    console.error('Error fetching endpoints:', error);
    res.status(500).json({ error: 'Failed to fetch endpoints' });
  }
});

router.post('/projects/:projectId/endpoints', checkProjectRole(['Owner', 'Admin', 'Editor']), async (req, res) => {
  const { name, method, url, headers, body, description, folder } = req.body;

  if (!name || !method || !url) {
    return res.status(400).json({ error: 'Name, method, and URL are required' });
  }

  try {
    const result = await query(
      `INSERT INTO endpoints (project_id, name, method, url, headers, body, description, folder) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.params.projectId, name, method, url, JSON.stringify(headers || {}), body || '', description || '', folder || '']
    );

    res.status(201).json({ endpoint: result.rows[0] });
  } catch (error) {
    console.error('Error creating endpoint:', error);
    res.status(500).json({ error: 'Failed to create endpoint' });
  }
});

router.put('/endpoints/:endpointId', authenticateToken, async (req, res) => {
  const { name, method, url, headers, body, description, folder } = req.body;

  try {
    const result = await query(
      `UPDATE endpoints 
       SET name = $1, method = $2, url = $3, headers = $4, body = $5, description = $6, folder = $7, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $8 RETURNING *`,
      [name, method, url, JSON.stringify(headers), body, description, folder, req.params.endpointId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    res.json({ endpoint: result.rows[0] });
  } catch (error) {
    console.error('Error updating endpoint:', error);
    res.status(500).json({ error: 'Failed to update endpoint' });
  }
});

router.delete('/endpoints/:endpointId', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM endpoints WHERE id = $1', [req.params.endpointId]);
    res.json({ message: 'Endpoint deleted successfully' });
  } catch (error) {
    console.error('Error deleting endpoint:', error);
    res.status(500).json({ error: 'Failed to delete endpoint' });
  }
});

router.post('/endpoints/:endpointId/execute', authenticateToken, async (req, res) => {
  const { environment } = req.body;

  try {
    const endpointResult = await query('SELECT * FROM endpoints WHERE id = $1', [req.params.endpointId]);
    
    if (endpointResult.rows.length === 0) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    const endpoint = endpointResult.rows[0];
    let url = endpoint.url;
    let headers = endpoint.headers;

    if (environment) {
      const envResult = await query('SELECT variables FROM environments WHERE id = $1', [environment]);
      if (envResult.rows.length > 0) {
        const variables = envResult.rows[0].variables;
        Object.keys(variables).forEach(key => {
          url = url.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
        });
      }
    }

    const startTime = Date.now();
    try {
      const response = await axios({
        method: endpoint.method.toLowerCase(),
        url: url,
        headers: headers,
        data: endpoint.body ? JSON.parse(endpoint.body) : undefined,
        timeout: 30000,
        validateStatus: () => true
      });

      const duration = Date.now() - startTime;

      res.json({
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        duration: duration
      });
    } catch (execError) {
      const duration = Date.now() - startTime;
      res.json({
        status: 0,
        statusText: 'Request Failed',
        error: execError.message,
        duration: duration
      });
    }
  } catch (error) {
    console.error('Error executing endpoint:', error);
    res.status(500).json({ error: 'Failed to execute endpoint' });
  }
});

export default router;
