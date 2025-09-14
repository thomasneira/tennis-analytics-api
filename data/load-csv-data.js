const fs = require('fs');
const csv = require('csv-parser');
const { query } = require('../utils/database');

async function loadData() {
  console.log('🎾 Starting tennis data import...');
  
  try {
    await loadPlayers();
    await loadMatches();
    console.log('✅ Data import completed successfully!');
  } catch (error) {
    console.error('❌ Data import failed:', error);
  }
}

async function loadPlayers() {
  console.log('📝 Loading players...');
  const players = new Map();
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./data/atp_matches_2024.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (row.winner_id && !players.has(row.winner_id)) {
          players.set(row.winner_id, {
            atp_id: parseInt(row.winner_id),
            name: row.winner_name,
            country: row.winner_ioc,
            height: row.winner_ht ? parseInt(row.winner_ht) : null,
            hand: row.winner_hand,
            current_rank: row.winner_rank ? parseInt(row.winner_rank) : null
          });
        }
        
        if (row.loser_id && !players.has(row.loser_id)) {
          players.set(row.loser_id, {
            atp_id: parseInt(row.loser_id),
            name: row.loser_name,
            country: row.loser_ioc,
            height: row.loser_ht ? parseInt(row.loser_ht) : null,
            hand: row.loser_hand,
            current_rank: row.loser_rank ? parseInt(row.loser_rank) : null
          });
        }
      })
      .on('end', async () => {
        try {
          console.log(`Found ${players.size} unique players`);
          
          for (const [id, player] of players) {
            await query(`
              INSERT INTO players (atp_id, name, country, height, hand, current_rank)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (atp_id) DO UPDATE SET
                name = EXCLUDED.name,
                country = EXCLUDED.country,
                height = EXCLUDED.height,
                hand = EXCLUDED.hand,
                current_rank = EXCLUDED.current_rank
            `, [player.atp_id, player.name, player.country, player.height, player.hand, player.current_rank]);
          }
          
          console.log('✅ Players loaded successfully!');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });
}

async function loadMatches() {
  console.log('🏆 Loading matches...');
  let matchCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('./data/atp_matches_2024.csv')
      .pipe(csv())
      .on('data', async (row) => {
        try {
          await query(`
            INSERT INTO matches (
              tourney_id, tourney_name, surface, tourney_level, tourney_date,
              winner_id, loser_id, score, best_of, round, minutes,
              w_ace, w_df, w_svpt, w_1stin, w_1stwon, w_2ndwon, w_svgms, w_bpsaved, w_bpfaced,
              l_ace, l_df, l_svpt, l_1stin, l_1stwon, l_2ndwon, l_svgms, l_bpsaved, l_bpfaced,
              winner_rank, winner_rank_points, loser_rank, loser_rank_points
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
          `, [
            row.tourney_id, row.tourney_name, row.surface, row.tourney_level, 
            row.tourney_date, parseInt(row.winner_id), parseInt(row.loser_id),
            row.score, parseInt(row.best_of), row.round, 
            row.minutes ? parseInt(row.minutes) : null,
            row.w_ace ? parseInt(row.w_ace) : null,
            row.w_df ? parseInt(row.w_df) : null,
            row.w_svpt ? parseInt(row.w_svpt) : null,
            row.w_1stIn ? parseInt(row.w_1stIn) : null,
            row.w_1stWon ? parseInt(row.w_1stWon) : null,
            row.w_2ndWon ? parseInt(row.w_2ndWon) : null,
            row.w_SvGms ? parseInt(row.w_SvGms) : null,
            row.w_bpSaved ? parseInt(row.w_bpSaved) : null,
            row.w_bpFaced ? parseInt(row.w_bpFaced) : null,
            row.l_ace ? parseInt(row.l_ace) : null,
            row.l_df ? parseInt(row.l_df) : null,
            row.l_svpt ? parseInt(row.l_svpt) : null,
            row.l_1stIn ? parseInt(row.l_1stIn) : null,
            row.l_1stWon ? parseInt(row.l_1stWon) : null,
            row.l_2ndWon ? parseInt(row.l_2ndWon) : null,
            row.l_SvGms ? parseInt(row.l_SvGms) : null,
            row.l_bpSaved ? parseInt(row.l_bpSaved) : null,
            row.l_bpFaced ? parseInt(row.l_bpFaced) : null,
            row.winner_rank ? parseInt(row.winner_rank) : null,
            row.winner_rank_points ? parseInt(row.winner_rank_points) : null,
            row.loser_rank ? parseInt(row.loser_rank) : null,
            row.loser_rank_points ? parseInt(row.loser_rank_points) : null
          ]);
          
          matchCount++;
          if (matchCount % 100 === 0) {
            console.log(`Loaded ${matchCount} matches...`);
          }
        } catch (error) {
          console.error('Error inserting match:', error);
        }
      })
      .on('end', () => {
        console.log(`✅ ${matchCount} matches loaded successfully!`);
        resolve();
      });
  });
}

if (require.main === module) {
  loadData();
}
