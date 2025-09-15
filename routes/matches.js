const express = require('express');
const router = express.Router();
const { query } = require('../utils/database');

// Get matches with filters
router.get('/', async (req, res) => {
  try {
    const { 
      surface, 
      player_id, 
      limit = 20, 
      offset = 0,
      year = 2024 
    } = req.query;
    
    let whereClause = `WHERE EXTRACT(YEAR FROM tourney_date) = $1`;
    let params = [year];
    let paramCount = 1;
    
    if (surface) {
      whereClause += ` AND surface = $${++paramCount}`;
      params.push(surface);
    }
    
    if (player_id) {
      whereClause += ` AND (winner_id = $${++paramCount} OR loser_id = $${++paramCount})`;
      params.push(player_id, player_id);
      paramCount++;
    }
    
    const result = await query(`
      SELECT 
        m.*,
        pw.name as winner_name,
        pl.name as loser_name
      FROM matches m
      JOIN players pw ON m.winner_id = pw.id
      JOIN players pl ON m.loser_id = pl.id
      ${whereClause}
      ORDER BY tourney_date DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `, [...params, limit, offset]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Matches query error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Head-to-head comparison
router.get('/head-to-head/:player1/:player2', async (req, res) => {
  try {
    const { player1, player2 } = req.params;
    
    const result = await query(`
      SELECT 
        COUNT(*) as total_matches,
        SUM(CASE WHEN winner_id = $1 THEN 1 ELSE 0 END) as player1_wins,
        SUM(CASE WHEN winner_id = $2 THEN 1 ELSE 0 END) as player2_wins,
        surface,
        COUNT(*) as matches_on_surface
      FROM matches 
      WHERE (winner_id = $1 AND loser_id = $2) 
         OR (winner_id = $2 AND loser_id = $1)
      GROUP BY surface
      ORDER BY matches_on_surface DESC
    `, [player1, player2]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Head-to-head error:', error);
    res.status(500).json({ error: 'Failed to fetch head-to-head data' });
  }
});

module.exports = router;
