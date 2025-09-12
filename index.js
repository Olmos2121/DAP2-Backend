require("dotenv").config();
require('./workers/aiModerationWorker');
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

const reviewsRoutes = require("./routes/reviews");
const app = express();
app.use(express.json());

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Rutas
app.use("/reviews", reviewsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server http://localhost:${PORT}`);
  console.log(`📘 Swagger http://localhost:${PORT}/api-docs`);
});