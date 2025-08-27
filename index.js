//Punto de entrada del servidor
const express = require('express');
const pool = require('./db');
require('dotenv').config();

const reviewsRoutes = require('./routes/reviews');
const usersRoutes = require('./routes/users');

const app = express();
app.use(express.json());

app.use('/reviews', reviewsRoutes);
app.use('/users', usersRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando 🚀' });
});
/* app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Conectado a PostgreSQL en AWS', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en la conexión con PostgreSQL' });
  }
});
 */
// Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

//const PORT = process.env.PORT || 3000;
//app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
