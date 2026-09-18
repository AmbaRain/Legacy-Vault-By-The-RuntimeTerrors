/**
 * Runs every .sql file in this folder, in filename order, against DATABASE_URL.
 * Usage: npm run migrate
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const dir = __dirname;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration(s): ${files.join(', ')}`);

  // pgcrypto is needed for gen_random_uuid()
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`\n--> Running ${file}`);
    await pool.query(sql);
    console.log(`    done.`);
  }

  console.log('\nAll migrations applied.');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
