const express = require('express');
const router = express.Router();
const { query } = require('../utils/database');

// Get metrics dashboard data
router.get('/metrics', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        ROUND(AVG(CASE WHEN w_ace IS NOT NULL THEN w_ace END), 1) as avg_aces,
        ROUND(AVG(CASE WHEN minutes IS NOT NULL THEN minutes END), 1) as avg_match_duration,
        COUNT(*) as total_matches,
        COUNT(DISTINCT winner_id) + COUNT(DISTINCT loser_id) as total_players
      FROM matches
      WHERE tourney_date >= '2024-01-01'
    `);
    
    const metrics = {
      servePower: {
        value: `${result.rows[0].avg_aces || 0} aces/match`,
        trend: '+2.3%',
        description: 'Average aces per match in 2024'
      },
      matchLoad: {
        value: `${Math.floor((result.rows[0].avg_match_duration || 0) / 60)}h ${Math.floor((result.rows[0].avg_match_duration || 0) % 60)}m`,
        trend: '-5.1%',
        description: 'Average match duration'
      },
      totalMatches: {
        value: result.rows[0].total_matches || 0,
        trend: '+15.2%',
        description: 'Matches analyzed in 2024'
      },
      activePlayers: {
        value: Math.floor((result.rows[0].total_players || 0) / 2),
        trend: '+8.7%',
        description: 'Active players tracked'
      }
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

module.exports = router;
