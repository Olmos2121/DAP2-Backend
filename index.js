import dotenv from "dotenv";
dotenv.config();

import "./workers/aiModerationWorker.js";

import { readFile } from "fs/promises";

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";

import reviewsRoutes from "./routes/reviews.js";
import usersRoutes from "./routes/users.js";
import moviesRoutes from "./routes/movies.js";
import debugRoutes from "./routes/debug.js";
import socialRoutes from "./routes/social.js";

import { startCoreConsumer } from "./consumers/reviewsCoreConsumer.js";

const swaggerFile = JSON.parse(
  await readFile(new URL("./swagger-output.json", import.meta.url))
);

import {
  rateLimiter,
  createContentLimiter,
} from "./middlewares/rateLimiting.js";
import {
  securityHeaders,
  validateNumericParams,
  sanitizeRequest,
  validateContentType,
} from "./middlewares/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:8080",
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_PROD,
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));

app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(rateLimiter);

app.use(
  express.json({
    limit: "1mb",
    strict: true,
    type: "application/json",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
    parameterLimit: 20,
  })
);

app.use(validateContentType);
app.use(sanitizeRequest);

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    next();
  });
}

app.get("/health", (req, res) => {
  /*
    #swagger.tags = ['Health']
    #swagger.summary = 'Healthcheck'
    #swagger.description = 'Liveness del servicio'
    #swagger.produces = ['application/json']
    #swagger.responses[200] = { description: 'OK' }
  */
  res.set("Cache-Control", "no-store");
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/debug", debugRoutes);

// Swagger UI
app.get("/swagger.json", (req, res) => {
  const p = path.resolve(__dirname, "swagger-output.json");
  res.set("Cache-Control", "no-store");
  res.sendFile(p);
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: { url: "/swagger.json" },
  })
);

// Rutas con validación de parámetros numéricos
app.use("/reviews", validateNumericParams, reviewsRoutes);
app.use("/users", validateNumericParams, usersRoutes);
app.use("/movies", validateNumericParams, moviesRoutes);
app.use("/social", validateNumericParams, socialRoutes);

// Aplicar rate limiting adicional a operaciones de creación
app.use("/reviews", (req, res, next) => {
  if (req.method === "POST") {
    return createContentLimiter(req, res, next);
  }
  next();
});

app.use("/users", (req, res, next) => {
  if (req.method === "POST") {
    return createContentLimiter(req, res, next);
  }
  next();
});

app.use("/movies", (req, res, next) => {
  if (req.method === "POST") {
    return createContentLimiter(req, res, next);
  }
  next();
});

app.use("/social", (req, res, next) => {
  if (req.method === "POST") {
    return createContentLimiter(req, res, next);
  }
  next();
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Error interno del servidor"
        : err.message,
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(PORT, async () => {
  console.log(`✅ Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📘 Documentación API: http://localhost:${PORT}/api-docs`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV || "development"}`);

  if (process.env.ENABLE_CORE_CONSUMER !== "false") {
    try {
      await startCoreConsumer();
      console.log("🐇 Core consumer iniciado y escuchando eventos del Core");
    } catch (err) {
      console.error("❌ No se pudo iniciar el core consumer:", err.message);
    }
  } else {
    console.log("⚠️ Core consumer deshabilitado (ENABLE_CORE_CONSUMER=false)");
  }
});
