const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const SQL_FILE = path.join(__dirname, '..', 'database', 'm5_events.sql');
const sql = fs.readFileSync(SQL_FILE, 'utf8');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://communium:communium_dev_password@localhost:5433/communium';

(async () => {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    console.log('Connecting to', DATABASE_URL);
    const client = await pool.connect();
    console.log('Executing SQL file:', SQL_FILE);
    await client.query(sql);
    console.log('SQL executed successfully.');
    client.release();
  } catch (err) {
    console.error('Error executing SQL:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
