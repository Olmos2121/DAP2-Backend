//require("dotenv").config();
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();
//require('./workers/aiModerationWorker');
import './workers/aiModerationWorker.js';
//const express = require("express");
import express from 'express';
//const swaggerUi = require("swagger-ui-express");
import swaggerUi from 'swagger-ui-express';
//const swaggerFile = require("./swagger-output.json");
//import swaggerFile from './swagger-output.json' assert { type: "json" };
//const cors = require('cors');
import cors from 'cors';

//const reviewsRoutes = require("./routes/reviews");
import reviewsRoutes from './routes/reviews.js';
//const usersRoutes = require("./routes/users");
import usersRoutes from './routes/users.js'; // ✅ con extensión .js
//const moviesRoutes = require("./routes/movies");
import moviesRoutes from './routes/movies.js';
import './consumers/movieConsumer.js';


const swaggerFile = JSON.parse(
  await readFile(new URL('./swagger-output.json', import.meta.url))
);


// Middlewares de seguridad y performance
//const { rateLimiter, createContentLimiter } = require('./middlewares/rateLimiting');
import { rateLimiter, createContentLimiter } from './middlewares/rateLimiting.js';
//const { securityHeaders, validateNumericParams, sanitizeRequest, validateContentType } = require('./middlewares/security');
import {
  securityHeaders,
  validateNumericParams,
  sanitizeRequest,
  validateContentType
} from './middlewares/security.js';
const app = express();

// Configuración mejorada para producción
const PORT = process.env.PORT || 8080;

// Middlewares de seguridad (aplicar primero)
app.set('trust proxy', 1); // Para obtener IP real detrás de proxy
app.use(securityHeaders);
app.use(rateLimiter);

// Middleware de parsing con límites de seguridad
app.use(express.json({ 
  limit: '1mb',
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb',
  parameterLimit: 20
}));

// Middlewares de validación y sanitización
app.use(validateContentType);
app.use(sanitizeRequest);

// Configuración CORS mejorada para producción
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_PROD
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Middleware de logging para producción
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

app.get('/health', (req, res) => {
  /*
    #swagger.tags = ['Health']
    #swagger.summary = 'Healthcheck'
    #swagger.description = 'Liveness del servicio'
    #swagger.produces = ['application/json']
    #swagger.responses[200] = { description: 'OK' }
  */
  res.set('Cache-Control', 'no-store');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Rutas con validación de parámetros numéricos
app.use("/reviews", validateNumericParams, reviewsRoutes);
app.use("/users", validateNumericParams, usersRoutes);
app.use("/movies", validateNumericParams, moviesRoutes);

// Aplicar rate limiting adicional a operaciones de creación
app.use("/reviews", (req, res, next) => {
  if (req.method === 'POST') {
    return createContentLimiter(req, res, next);
  }
  next();
});

app.use("/users", (req, res, next) => {
  if (req.method === 'POST') {
    return createContentLimiter(req, res, next);
  }
  next();
});

app.use("/movies", (req, res, next) => {
  if (req.method === 'POST') {
    return createContentLimiter(req, res, next);
  }
  next();
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message 
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📘 Documentación API: http://localhost:${PORT}/api-docs`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

