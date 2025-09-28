//Configuración de conexión a PostgreSQL
/* const { Pool } = require('pg');
require('dotenv').config(); */

import pg from 'pg';
import dotenv from 'dotenv';


dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  //ssl: {rejectUnauthorized: false,}, // importante para RDS si tiene SSL activado
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
});

// opcional: log para confirmar conexión
pool.connect()
  .then(() => console.log('✅ Conectado a PostgreSQL'))
  .catch(err => console.error('❌ Error de conexión a PostgreSQL', err));
//pool.on('connect', () => {console.log('Conectado a PostgreSQL en AWS RDS');});
export default pool;
//module.exports = pool;
