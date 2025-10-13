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
  tags: [
    { name: "Reviews", description: "Operaciones sobre reseñas" },
    { name: "Users",   description: "Gestión de usuarios" },
    { name: "Movies",  description: "Gestión de películas" },
    { name: "Social",  description: "Operaciones sociales" },
    { name: "Health",  description: "Salud del servicio" },
  ],
  definitions: {
    User: { user_id: 1, role: "user", full_name: "Ada Lovelace", email: "ada@example.com" },
    Review: { id: 1, movie_id: 456, user_id: 789, rating: 8.5, body: "Excelente..." },
    ReviewCreateInput: { movie_id: 456, user_id: 789, rating: 8.5, body: "Texto..." },
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
];

(async () => {
  if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
  await swaggerAutogen(outputFile, endpointsFiles, doc);

  const spec = JSON.parse(fs.readFileSync(outputFile, "utf8"));

  // Prefijos por tag (de tus app.use)
  const prefByTag = {
    Reviews: "/reviews",
    Users:   "/users",
    Movies:  "/movies",
    Social:  "/social",
    Health:  "/",        // Health queda tal cual
  };

  const fixed = addPrefixesByTagSafe(spec, prefByTag);
  fs.writeFileSync(outputFile, JSON.stringify(fixed, null, 2), "utf8");
})().catch(err => {
  console.error("❌ Error generando Swagger:", err);
  process.exit(1);
});

/**
 * Agrega prefijo por tag SOLO si el path aún no lo tiene.
 * No toca /swagger.json ni /health.
 */
function addPrefixesByTagSafe(spec, prefByTag) {
  const oldPaths = spec.paths || {};
  const newPaths = {};
  const knownBases = Object.values(prefByTag).filter(Boolean);

  for (const rawPath of Object.keys(oldPaths)) {
    const item = oldPaths[rawPath];
    const methods = Object.keys(item);

    // no tocar estos paths "globales"
    if (rawPath === "/swagger.json" || rawPath === "/health") {
      newPaths[rawPath] = item;
      continue;
    }

    // tag principal (el primero definido en el método)
    const firstTag =
      methods
        .map(m => (item[m] && Array.isArray(item[m].tags)) ? item[m].tags[0] : null)
        .find(Boolean) || null;

    let clean = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

    // Si ya está prefijado con alguno de los bases conocidos, no tocar
    const alreadyHasBase = knownBases.some(b => b !== "/" && (clean === b || clean.startsWith(`${b}/`)));
    if (alreadyHasBase) {
      newPaths[clean] = { ...(newPaths[clean] || {}), ...item };
      continue;
    }

    const base = prefByTag[firstTag] || "";
    const finalPath =
      base && base !== "/"
        ? (clean === "/" ? base : `${base}${clean}`)
        : clean;

    newPaths[finalPath] = { ...(newPaths[finalPath] || {}), ...item };
  }

  return { ...spec, paths: newPaths };
}
