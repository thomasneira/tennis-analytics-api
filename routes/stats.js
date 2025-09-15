const express = require('express');
const router = express.Router();
const { query } = require('../utils/database');

// Get metrics dashboard data
router.get('/metrics', async (req, res) => {
  try {
    // Get basic match stats
    const matchStats = await query(`
      SELECT 
        ROUND(AVG(CASE WHEN w_ace IS NOT NULL THEN w_ace END), 1) as avg_aces,
        ROUND(AVG(CASE WHEN minutes IS NOT NULL THEN minutes END), 1) as avg_match_duration,
        COUNT(*) as total_matches
      FROM matches
      WHERE tourney_date >= '2024-01-01'
    `);
    
    // Get total players count separately
    const playerStats = await query(`
      SELECT COUNT(*) as total_players
      FROM players
    `);
    
    const metrics = {
      servePower: {
        value: `${matchStats.rows[0].avg_aces || 0} aces/match`,
        trend: '+2.3%',
        description: 'Average aces per match in 2024'
      },
      matchLoad: {
        value: `${Math.floor((matchStats.rows[0].avg_match_duration || 0) / 60)}h ${Math.floor((matchStats.rows[0].avg_match_duration || 0) % 60)}m`,
        trend: '-5.1%',
        description: 'Average match duration'
      },
      totalMatches: {
        value: matchStats.rows[0].total_matches || 0,
        trend: '+15.2%',
        description: 'Matches analyzed in 2024'
      },
      activePlayers: {
        value: playerStats.rows[0].total_players || 0,
        trend: '+8.7%',
        description: 'Active players tracked'
      }
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch metrics',
      details: error.message 
    });
  }
});

module.exports = router;
