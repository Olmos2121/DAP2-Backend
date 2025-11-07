import fetch from "node-fetch";
import crypto from "crypto";

const CORE_URL = "http://core-letterboxd.us-east-2.elasticbeanstalk.com/events/receive";

/**
 * Envía un evento al core
 * @param {string} eventType - Tipo de evento (ej: "review.created")
 * @param {string} routingKey - Routing key (ej: "reseñas.reseña.creada")
 * @param {object} reviewData - Datos de la reseña
 */
async function publishReviewEvent(eventType, routingKey, reviewData) {
  const event = {
    id: crypto.randomUUID(),
    type: eventType,
    source: "/reviews/api",
    datacontenttype: "application/json",
    sysDate: new Date().toISOString(),
    data: reviewData,
  };

  const url = `${CORE_URL}?routingKey=${routingKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error enviando evento al core: ${response.status} - ${error}`);
  }

  console.log(`✅ Evento enviado al core: ${eventType}`);
  return response.json().catch(() => ({}));
}

// Métodos públicos
export async function publishReviewCreated(review) {
  console.log("Publicando evento de creación de reseña:", review);
  return publishReviewEvent("resena.creada", "resenas.resena.creada", review);
}

export async function publishReviewUpdated(review) {
  console.log("Publicando evento de actualización de reseña:", review);
  return publishReviewEvent("resena.actualizada", "resenas.resena.actualizada", review);
}

export async function publishReviewDeleted(id) {
  console.log("Publicando evento de eliminación de reseña:", id);
  return publishReviewEvent("resena.eliminada", "resenas.resena.eliminada", { id });
}