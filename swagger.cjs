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
  tags: [
    { name: "Reviews", description: "Operaciones sobre reseñas" },
    { name: "Users", description: "Gestión de usuarios" },
    { name: "Movies", description: "Gestión de películas" },
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
const endpointsFiles = [
  path.resolve(__dirname, "index.js"),
  path.resolve(__dirname, "routes/reviews.js"),
  path.resolve(__dirname, "routes/users.js"),
  path.resolve(__dirname, "routes/movies.js"),
];

(async () => {
  // 1) Generar
  await swaggerAutgenSafe();

  // 2) Prefijos por tag
  const spec = JSON.parse(fs.readFileSync(outputFile, "utf8"));
  const withPrefixes = addPrefixesByTag(spec, {
    Users: "/users",
    Reviews: "/reviews",
    Movies: "/movies",
  });

  // 3) Fallback: si no están Users, inyectarlos
  ensureUsersFallback(withPrefixes);

  fs.writeFileSync(outputFile, JSON.stringify(withPrefixes, null, 2), "utf8");
})().catch((err) => {
  console.error("❌ Error generando Swagger:", err);
  process.exit(1);
});

function swaggerAutgenSafe() {
  if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
  return swaggerAutogen(outputFile, endpointsFiles, doc);
}

function addPrefixesByTag(spec, prefByTag) {
  const oldPaths = spec.paths || {};
  const newPaths = {};
  for (const rawPath of Object.keys(oldPaths)) {
    const item = oldPaths[rawPath];
    const methods = Object.keys(item);

    const firstTag = methods
      .map((m) =>
        item[m] && Array.isArray(item[m].tags) ? item[m].tags[0] : null
      )
      .find(Boolean);

    const base = prefByTag[firstTag] || "";
    let clean = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
    const finalPath = base ? (clean === "/" ? base : `${base}${clean}`) : clean;

    newPaths[finalPath] = Object.assign({}, newPaths[finalPath] || {}, item);
  }
  return { ...spec, paths: newPaths };
}

function ensureUsersFallback(spec) {
  const paths = spec.paths || {};
  const hasUsers = Object.keys(paths).some(
    (p) => p === "/users" || p.startsWith("/users/")
  );
  if (hasUsers) return;

  paths["/users"] = {
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
  paths["/users/{id}"] = {
    get: {
      tags: ["Users"],
      summary: "Obtener usuario por ID",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          type: "integer",
          description: "ID del usuario",
        },
      ],
      responses: {
        200: { description: "OK", schema: { $ref: "#/definitions/User" } },
        404: { description: "No encontrado" },
      },
    },
  };
  spec.paths = paths;
}
