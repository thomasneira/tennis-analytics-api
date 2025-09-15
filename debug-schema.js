require('dotenv').config({ path: '.env.local' });
const { query } = require('./utils/database');

async function auditSchema() {
  try {
    // Check what tables exist
    console.log('=== TABLES IN DATABASE ===');
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(tables.rows.map(row => row.table_name));
    
    // Check columns in matches table
    console.log('\n=== COLUMNS IN MATCHES TABLE ===');
    const matchColumns = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'matches'
      ORDER BY ordinal_position
    `);
    matchColumns.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check columns in players table
    console.log('\n=== COLUMNS IN PLAYERS TABLE ===');
    const playerColumns = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'players'
      ORDER BY ordinal_position
    `);
    playerColumns.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

auditSchema();
