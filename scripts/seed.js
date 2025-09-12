// scripts/seed.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function buildPgConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
}

(async () => {
  const pool = new Pool(buildPgConfig());
  const sqlPath = path.join(__dirname, 'seed.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = await pool.connect();

  try {
    console.log('💾 Ejecutando scripts/seed.sql ...');
    // IMPORTANTE: no hagas BEGIN/COMMIT aquí si el archivo ya los trae.
    await client.query(sql);
    console.log('✅ Seed completado');
  } catch (err) {
    console.error('❌ Error al sembrar:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();

