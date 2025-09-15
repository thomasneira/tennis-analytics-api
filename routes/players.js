const express = require('express');
const router = express.Router();
const { query } = require('../utils/database');

// Get all players (with pagination)
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const result = await query(`
      SELECT id, name, country, current_rank
      FROM players 
      ORDER BY 
        CASE WHEN current_rank IS NULL THEN 1 ELSE 0 END,
        current_rank ASC,
        name ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const countResult = await query('SELECT COUNT(*) as total FROM players');
    
    res.json({
      players: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Players list error:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Search players
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }
    
    const result = await query(`
      SELECT id, name, country, current_rank
      FROM players 
      WHERE name ILIKE $1 
      ORDER BY 
        CASE WHEN current_rank IS NULL THEN 1 ELSE 0 END,
        current_rank ASC,
        name ASC
      LIMIT $2
    `, [`%${q}%`, limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Player search error:', error);
    res.status(500).json({ error: 'Failed to search players' });
  }
});

// Get player details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT * FROM players WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Player fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

module.exports = router;
