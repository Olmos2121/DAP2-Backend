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
  const sqlPath = path.join(__dirname, 'seed-simple.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = await pool.connect();

  try {
    console.log('💾 Ejecutando scripts/seed-simple.sql ...');
    
    // Ejecutar el script completo como una transacción
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Seed completado exitosamente');
    
    // Verificar los datos
    const result = await client.query(`
      SELECT 'users' AS tabla, COUNT(*) AS registros FROM users
      UNION ALL
      SELECT 'movies' AS tabla, COUNT(*) AS registros FROM movies
      UNION ALL
      SELECT 'reviews' AS tabla, COUNT(*) AS registros FROM reviews
      UNION ALL
      SELECT 'review_likes' AS tabla, COUNT(*) AS registros FROM review_likes
      UNION ALL
      SELECT 'review_comments' AS tabla, COUNT(*) AS registros FROM review_comments
    `);
    
    console.log('\n📊 Estado de la base de datos:');
    result.rows.forEach(row => {
      console.log(`   ${row.tabla}: ${row.registros} registros`);
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error al sembrar:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();

