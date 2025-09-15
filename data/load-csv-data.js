require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parser');
const { query } = require('../utils/database');

async function loadData() {
  console.log('🎾 Starting tennis data import...');
  
  const players = new Set();
  const matches = [];
  
  // Step 1: Read the entire CSV and collect all data
  console.log('📖 Reading CSV file...');
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./data/atp_matches_2024.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Collect unique players
        if (row.winner_id) players.add(row.winner_id);
        if (row.loser_id) players.add(row.loser_id);
        
        // Store match data
        matches.push(row);
      })
      .on('end', async () => {
        try {
          console.log(`Found ${players.size} unique players and ${matches.length} matches`);
          
          // Step 2: Insert all players first
          console.log('👥 Inserting players...');
          for (const playerId of players) {
            await query(
              'INSERT INTO players (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
              [parseInt(playerId), `Player ${playerId}`]
            );
          }
          console.log(`✅ Inserted ${players.size} players`);
          
          // Step 3: Insert all matches
          console.log('🎾 Inserting matches...');
          let matchCount = 0;
          for (const match of matches) {
            try {
              // Only insert columns that exist in your database schema
              await query(`
                INSERT INTO matches (
                  tourney_id, tourney_name, surface, tourney_level, tourney_date,
                  winner_id, loser_id, score, best_of, round, minutes,
                  w_ace, w_df, w_svpt, w_1stin, w_1stwon, w_2ndwon, w_svgms, 
                  w_bpsaved, w_bpfaced, l_ace, l_df, l_svpt, l_1stin, l_1stwon, 
                  l_2ndwon, l_svgms, l_bpsaved, l_bpfaced,
                  winner_rank, winner_rank_points, loser_rank, loser_rank_points
                ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                  $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
                  $30, $31, $32, $33
                )
              `, [
                match.tourney_id,
                match.tourney_name,
                match.surface,
                match.tourney_level,
                match.tourney_date,
                parseInt(match.winner_id),
                parseInt(match.loser_id),
                match.score,
                match.best_of ? parseInt(match.best_of) : null,
                match.round,
                match.minutes ? parseInt(match.minutes) : null,
                match.w_ace ? parseInt(match.w_ace) : null,
                match.w_df ? parseInt(match.w_df) : null,
                match.w_svpt ? parseInt(match.w_svpt) : null,
                match.w_1stIn ? parseInt(match.w_1stIn) : null,
                match.w_1stWon ? parseInt(match.w_1stWon) : null,
                match.w_2ndWon ? parseInt(match.w_2ndWon) : null,
                match.w_SvGms ? parseInt(match.w_SvGms) : null,
                match.w_bpSaved ? parseInt(match.w_bpSaved) : null,
                match.w_bpFaced ? parseInt(match.w_bpFaced) : null,
                match.l_ace ? parseInt(match.l_ace) : null,
                match.l_df ? parseInt(match.l_df) : null,
                match.l_svpt ? parseInt(match.l_svpt) : null,
                match.l_1stIn ? parseInt(match.l_1stIn) : null,
                match.l_1stWon ? parseInt(match.l_1stWon) : null,
                match.l_2ndWon ? parseInt(match.l_2ndWon) : null,
                match.l_SvGms ? parseInt(match.l_SvGms) : null,
                match.l_bpSaved ? parseInt(match.l_bpSaved) : null,
                match.l_bpFaced ? parseInt(match.l_bpFaced) : null,
                match.winner_rank ? parseInt(match.winner_rank) : null,
                match.winner_rank_points ? parseInt(match.winner_rank_points) : null,
                match.loser_rank ? parseInt(match.loser_rank) : null,
                match.loser_rank_points ? parseInt(match.loser_rank_points) : null
              ]);
              
              matchCount++;
              if (matchCount % 100 === 0) {
                console.log(`📊 Processed ${matchCount}/${matches.length} matches`);
              }
            } catch (error) {
              console.error(`Error inserting match ${matchCount + 1}:`, error.message);
              // Continue with next match instead of stopping
            }
          }
          
          console.log(`✅ Successfully imported ${matchCount} matches`);
          console.log('🎉 Data import completed!');
          resolve();
        } catch (error) {
          console.error('❌ Data import failed:', error);
          reject(error);
        }
      })
      .on('error', reject);
  });
}

loadData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
