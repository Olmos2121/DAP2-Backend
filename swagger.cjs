// swagger.cjs
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const swaggerAutogen = require("swagger-autogen")();

const PORT = process.env.PORT || 8080;

const doc = {
  info: {
    title: "Movie Reviews API",
    description: "API para reseñas de películas",
    version: "1.0.0",
  },
  schemes: ["http"],
  host: `localhost:${PORT}`,
  basePath: "/",
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Formato: Bearer <token>",
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: "Reviews", description: "Operaciones sobre reseñas" },
    { name: "Users", description: "Gestión de usuarios" },
    { name: "Movies", description: "Gestión de películas" },
    { name: "Social", description: "Operaciones sociales" },
    { name: "Debug", description: "Operaciones de depuración" },
    { name: "Health", description: "Salud del servicio" },
  ],
  definitions: {
    User: {
      user_id: 1,
      role: "user",
      full_name: "Ada Lovelace",
      email: "ada@example.com",
    },
    Review: {
      id: 1,
      movie_id: 456,
      user_id: 789,
      rating: 8.5,
      body: "Excelente...",
    },
    ReviewCreateInput: {
      movie_id: 456,
      user_id: 789,
      rating: 8.5,
      body: "Texto...",
    },
  },
};

const outputFile = path.resolve(__dirname, "swagger-output.json");

// 👇 Incluimos index.js para que tome /health y /swagger.json
const endpointsFiles = [
  path.resolve(__dirname, "index.js"),
  path.resolve(__dirname, "routes/reviews.js"),
  path.resolve(__dirname, "routes/users.js"),
  path.resolve(__dirname, "routes/movies.js"),
  path.resolve(__dirname, "routes/social.js"),
  path.resolve(__dirname, "routes/debug.js"),
];

(async () => {
  if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
  await swaggerAutogen(outputFile, endpointsFiles, doc);

  const spec = JSON.parse(fs.readFileSync(outputFile, "utf8"));

  // Prefijos por tag (de tus app.use)
  const prefByTag = {
    Reviews: "/reviews",
    Users: "/users",
    Movies: "/movies",
    Social: "/social",
    Debug: "/debug",
    Health: "/", // Health queda tal cual
  };

  const fixed = addPrefixesByTagSafe(spec, prefByTag);

  const withFallbacks = ensureUsersFallback(fixed);

  fs.writeFileSync(outputFile, JSON.stringify(withFallbacks, null, 2), "utf8");
})().catch((err) => {
  console.error("❌ Error generando Swagger:", err);
  process.exit(1);
});

function addPrefixesByTagSafe(spec, prefByTag) {
  const oldPaths = spec.paths || {};
  const newPaths = {};
  const knownBases = Object.values(prefByTag).filter(Boolean);

  for (const rawPath of Object.keys(oldPaths)) {
    const item = oldPaths[rawPath];
    const methods = Object.keys(item); // get, post, put, delete...

    // no tocar estos paths "globales"
    if (rawPath === "/swagger.json" || rawPath === "/health") {
      newPaths[rawPath] = Object.assign(newPaths[rawPath] || {}, item);
      continue;
    }

    for (const m of methods) {
      const operation = item[m];
      // si no hay tags, lo dejamos en el rawPath tal cual
      const firstTag =
        operation && Array.isArray(operation.tags) && operation.tags.length
          ? operation.tags[0]
          : null;

      let clean = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

      // Si YA tiene alguno de los prefijos conocidos, no lo toques
      const alreadyHasBase = knownBases.some(
        (b) => b !== "/" && (clean === b || clean.startsWith(`${b}/`))
      );

      let finalPath = clean;
      if (!alreadyHasBase) {
        const base = (firstTag && prefByTag[firstTag]) || "";
        finalPath =
          base && base !== "/"
            ? clean === "/"
              ? base
              : `${base}${clean}`
            : clean;
      }

      // Merge seguro por método
      newPaths[finalPath] = newPaths[finalPath] || {};
      newPaths[finalPath][m] = operation;
    }
  }

  return { ...spec, paths: newPaths };
}

function ensureUsersFallback(spec) {
  spec.paths = spec.paths || {};

  if (!spec.paths["/users"]) {
    spec.paths["/users"] = {
      get: {
        tags: ["Users"],
        summary: "Obtener todos los usuarios",
        responses: {
          200: {
            description: "OK",
            schema: { type: "array", items: { $ref: "#/definitions/User" } },
          },
        },
      },
    };
  }

  if (!spec.paths["/users/{id}"]) {
    spec.paths["/users/{id}"] = {
      get: {
        tags: ["Users"],
        summary: "Obtener usuario por ID",
        parameters: [
          { name: "id", in: "path", required: true, type: "integer" },
        ],
        responses: {
          200: { description: "OK", schema: { $ref: "#/definitions/User" } },
          404: { description: "No encontrado" },
        },
      },
    };
  }

  return spec;
}
