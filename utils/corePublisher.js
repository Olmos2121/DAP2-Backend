import fetch from "node-fetch"; // Si usás Node 18+ podés usar global fetch
import crypto from "crypto";

//const CORE_URL = "http://core-letterboxd.us-east-2.elasticbeanstalk.com/events/receive";
const CORE_URL = "https://webhook.site/77a7edd6-6009-40e4-a9f8-da61e59a574c";

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
  return publishReviewEvent("reseña.creada", "reseñas.reseña.creada", review);
}

export async function publishReviewUpdated(review) {
  return publishReviewEvent("reseña.actualizada", "reseñas.reseña.actualizada", review);
}

export async function publishReviewDeleted(reviewId) {
  return publishReviewEvent("reseña.eliminada", "reseñas.reseña.eliminada", { id: reviewId });
}

/* export async function publishReviewCreated(review) {
  return publishReviewEvent("review.created", "review.created", review);
}


export async function publishReviewUpdated(review) {
  return publishReviewEvent("review.updated", "review.updated", review);
}


export async function publishReviewDeleted(reviewId) {
  return publishReviewEvent("review.deleted", "review.deleted", { id: reviewId });
} */
