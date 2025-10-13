// testPublisher.js
import { publishReviewCreated, publishReviewUpdated, publishReviewDeleted } from '../utils/corePublisher.js';


const review = {
  id: 104,
  movie_id: 25,
  user_id: 7,
  title: "Una obra maestra del suspenso",
  body: "La película mantiene la tensión de principio a fin.",
  rating: 5,
  has_spoilers: false,
  tags: ["suspenso", "thriller"],
  created_at: LocalDateNow().toString(),
  updated_at: LocalDateNow().toString()
};

(async () => {
  try {
    // 1. Crear
    await publishReviewCreated(review);
    console.log("✅ publishReviewCreated enviado");

    // 2. Actualizar
    const updatedReview = {
      ...review,
      title: "Una obra maestra del suspenso (editada)",
      rating: 4,
      updated_at: new Date().toISOString()
    };
    await publishReviewUpdated(updatedReview);
    console.log("✅ publishReviewUpdated enviado");

    // 3. Eliminar
    await publishReviewDeleted(review.id);
    console.log("✅ publishReviewDeleted enviado");
  } catch (err) {
    console.error("❌ Error en pruebas de publicación:", err.message);
  }
})();


/* import { publishReviewCreated } from "./utils/corePublisher.js";

const review = {
  id: 101,
  movie_id: 25,
  user_id: 7,
  title: "Una obra maestra del suspenso",
  body: "La película mantiene la tensión de principio a fin.",
  rating: 5,
  has_spoilers: false,
  tags: ["suspenso","thriller"],
  created_at: "2025-09-27T14:32:00Z",
  updated_at: "2025-09-27T14:32:00Z"
};

await publishReviewCreated(review); */
