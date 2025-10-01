import fetch from "node-fetch"; // Si usás Node 18+ podés usar global fetch
import crypto from "crypto";

const CORE_URL = "http://core-letterboxd.us-east-2.elasticbeanstalk.com/events/receive";

/**
 * Envía un evento al core
 * @param {string} eventType - Tipo de evento (ej: "review.created")
 * @param {string} routingKey - Routing key (ej: "review.created")
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


export async function publishReviewCreated(review) {
  return publishReviewEvent("rating.created", "rating.created", review);
}


export async function publishReviewUpdated(review) {
  return publishReviewEvent("rating.updated", "rating.updated", review);
}


export async function publishReviewDeleted(reviewId) {
  return publishReviewEvent("rating.deleted", "rating.deleted", { id: reviewId });
}
