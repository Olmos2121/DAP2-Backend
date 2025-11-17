import fetch from "node-fetch";
import crypto from "crypto";

// =================== CONFIG ===================
const CORE_URL =
  process.env.CORE_URL ||
  "http://core-letterboxd.us-east-2.elasticbeanstalk.com/events/receive";

const CORE_API_KEY = process.env.CORE_API_KEY || null;

if (!CORE_API_KEY) {
  console.warn(
    "⚠️  CORE_API_KEY no configurada. El Core rechazará los eventos (401)."
  );
}

// =================== HELPERS ===================
/**
 * Devuelve sysDate en el formato que usa el Core:
 * [YYYY, MM, DD, hh, mm, ss, nanos]
 */
function buildSysDate() {
  const now = new Date();
  return [
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds() * 1_000_000,
  ];
}

function normalizeTags(tags) {
  if (!tags) return [];

  if (Array.isArray(tags)) return tags;

  if (typeof tags === "string") {
    if (tags.startsWith("{") && tags.endsWith("}")) {
      const inner = tags.slice(1, -1).trim();
      if (!inner) return [];
      return inner.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
    }

    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed;
    } catch {}

    return [tags];
  }

  return [];
}

/**
 * Envia un evento al Core.
 * @param {string} routingKey - ej: "resenas.resena.creada"
 * @param {object} data - contenido del evento según contrato
 */
async function publishReviewEvent(routingKey, data) {
  console.log(`📤 Preparando evento al Core: ${routingKey}`);
  const event = {
    id: crypto.randomUUID(),
    type: routingKey,
    source: "/ratings/api",
    datacontenttype: "application/json",
    sysDate: buildSysDate(),
    data,
  };

  const url = `${CORE_URL}?routingKey=${encodeURIComponent(routingKey)}`;

  console.log("📤 Request al Core:", {
    url,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": CORE_API_KEY || "(VACÍA)",
    },
    body: event,
  });

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": CORE_API_KEY || "",
      },
      body: JSON.stringify(event),
    });
  } catch (err) {
    console.error("❌ Error de red al enviar evento al Core:", err);
    throw err;
  }

  const text = await response.text().catch(() => "");

  console.log("📥 Status del Core:", response.status, "body:", text);

  if (!response.ok) {
    throw new Error(
      `Error enviando evento al Core: ${response.status} - ${text}`
    );
  }

  console.log(`✅ Evento aceptado por el Core: ${routingKey}`);

  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

// =================== PUBLISHERS SEGÚN CONTRATO ===================

/**
 * Crear reseña
 * Routing Key: resenas.resena.creada
 */
export async function publishReviewCreated(review) {
  const routingKey = "resenas.resena.creada";
  const payload = {
    event: "resena_creada",
    id: review.id,
    movie_id: review.movie_id,
    user_id: review.user_id,
    title: review.title,
    body: review.body,
    rating: review.rating,
    has_spoilers: review.has_spoilers,
    tags: normalizeTags(review.tags),
    created_at: review.created_at,
  };

  return publishReviewEvent(routingKey, payload);
}

/**
 * Editar reseña
 * Routing Key: resenas.resena.actualizada
 */
export async function publishReviewUpdated(review) {
  const routingKey = "resenas.resena.actualizada";
  const payload = {
    event: "resena_actualizada",
    id: review.id,
    movie_id: review.movie_id,
    user_id: review.user_id,
    title: review.title,
    body: review.body,
    rating: review.rating,
    has_spoilers: review.has_spoilers,
    tags: normalizeTags(review.tags),
    updated_at: review.updated_at || new Date().toISOString(),
  };

  return publishReviewEvent(routingKey, payload);
}

/**
 * Eliminar reseña
 * Routing Key: resenas.resena.eliminada
 */
export async function publishReviewDeleted(id) {
  const routingKey = "resenas.resena.eliminada";
  const payload = {
    event: "resena_eliminada",
    id,
    updated_at: new Date().toISOString(),
  };

  return publishReviewEvent(routingKey, payload);
}
