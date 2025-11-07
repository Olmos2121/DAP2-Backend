import fetch from "node-fetch";
import crypto from "crypto";

const CORE_URL =
  process.env.CORE_URL ||
  "http://core-letterboxd.us-east-2.elasticbeanstalk.com/events/receive";

/**
 * sysDate en formato [year, month, day, hour, minute, second, nanos]
 * igual al que usa el Core.
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

/**
 * Envía evento al Core:
 * - type = routingKey
 * - query ?routingKey=<routingKey>
 * - data = payload de acuerdo al contrato que definiste
 */
async function publishReviewEvent(routingKey, data) {
  const event = {
    id: crypto.randomUUID(),
    type: routingKey,
    source: "/reviews/api",
    datacontenttype: "application/json",
    sysDate: buildSysDate(),
    data, // 👈 acá va el JSON de tu contrato (con "event": "resena_creada", etc.)
  };

  const url = `${CORE_URL}?routingKey=${encodeURIComponent(routingKey)}`;

  console.log("➡️ Enviando evento al core");
  console.log("   RK:", routingKey);
  console.log("   URL:", url);
  console.log("   Body:", JSON.stringify(event));

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (err) {
    console.error("❌ Error de red al enviar evento al core:", err);
    throw err;
  }

  const text = await response.text().catch(() => "");
  console.log("⬅️ Respuesta core:", response.status, text);

  if (!response.ok) {
    throw new Error(
      `Error enviando evento al core (${routingKey}): ${response.status} - ${text}`
    );
  }

  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

// ================= PUBLICADOS SEGÚN TU CONTRATO =================

export async function publishReviewCreated(review) {
  // review viene de la DB con los campos correctos
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
    tags: review.tags,
    created_at: review.created_at, // viene del RETURNING
  };

  return publishReviewEvent(routingKey, payload);
}

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
    tags: review.tags,
    updated_at: review.updated_at, // seteado en UPDATE
  };

  return publishReviewEvent(routingKey, payload);
}

export async function publishReviewDeleted(id) {
  const routingKey = "resenas.resena.eliminada";

  const payload = {
    event: "resena_eliminada",
    id,
    updated_at: new Date().toISOString(), // o lo que uses
  };

  return publishReviewEvent(routingKey, payload);
}
