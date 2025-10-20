import pool from "../db.js";
import * as model from "../models/reviewsModel.js";
import {
  publishReviewCreated,
  publishReviewUpdated,
  publishReviewDeleted,
} from "../utils/corePublisher.js";

import { validateReviewData, sanitizeInput } from "../utils/validation.js";

const VALID_SORTS = {
  recent: "r.created_at DESC, r.id DESC",
  rating_asc: "r.rating ASC, r.created_at DESC",
  rating_desc: "r.rating DESC, r.created_at DESC",
  helpful: "likes_count DESC, r.created_at DESC",
};

function mapPgErrorToHttp(err) {
  switch (err.code) {
    case "23502":
      return {
        status: 400,
        message: "Dato requerido ausente (NOT NULL violation).",
      };
    case "23503":
      return { status: 409, message: "Referencia inválida (FK violation)." };
    case "23505":
      return { status: 409, message: "Valor duplicado (UNIQUE violation)." };
    case "23514":
      return { status: 400, message: "Restricción CHECK violada." };
    default:
      return { status: 500, message: err.message || "Error en base de datos." };
  }
}

function parsePositiveInt(value, def) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : def;
}

function parseRating(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

async function createReview(req, res) {
  try {
    const authUserId = req.user?.user_id;

    if (!authUserId) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const errors = validateReviewData(req.body);
    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: "Datos inválidos", details: errors });
    }

    const sanitized = {
      ...req.body,
      title: sanitizeInput(req.body.title),
      body: sanitizeInput(req.body.body),
      user_id: authUserId,
    };

    const review = await model.createReview(sanitized);

    publishReviewCreated(review).catch((err) => {
      console.error("[Eventos] resena.creada fallo:", err.message);
    });

    return res.status(201).json(review);
  } catch (err) {
    const mapped = mapPgErrorToHttp(err);
    return res.status(mapped.status).json({ error: mapped.message });
  }
}

async function getReview(req, res) {
  try {
    const review = await model.getReview(req.params.id);
    if (!review) return res.status(404).json({ error: "Reseña no encontrada" });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateReview(req, res) {
  try {
    const { id } = req.params;

    const current = await model.getReview(id);
    if (!current) return res.status(404).json({ error: "Reseña no encontrada" });

    const isPrivileged = ["admin", "moderator"].includes(req.user?.role);
    if (!isPrivileged && current.user_id !== req.user?.userId) {
      return res.status(403).json({ error: "No autorizado para modificar esta reseña" });
    }
    const { user_id, ...rest } = req.body || {};
    const review = await model.updateReview(id, rest);

    publishReviewUpdated(review).catch((err) => {
      console.error("[Eventos] resena.actualizada fallo:", err.message);
    });

    return res.json(review);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const deleted = await model.deleteReview(id);
    if (!deleted)
      return res.status(404).json({ error: "Reseña no encontrada" });

    publishReviewDeleted(id).catch((err) => {
      console.error("[Eventos] resena.eliminada fallo:", err.message);
    });

    return res.json({ message: "Reseña eliminada" });
  } catch (err) {
    const mapped = mapPgErrorToHttp(err);
    return res.status(mapped.status).json({ error: mapped.message });
  }
}

async function filterReviews(req, res) {
  try {
    const {
      movie_id,
      user_id,
      min_rating,
      max_rating,
      has_spoilers,
      genre,
      tags,
      date_range,
      sort = "recent",
      limit = "20",
      offset = "0",
    } = req.query;

    const orderBy = VALID_SORTS[sort] || VALID_SORTS.recent;

    const pageSize = Math.min(parsePositiveInt(limit, 20), 100);
    const pageOffset = parsePositiveInt(offset, 0);

    const minR = parseRating(min_rating);
    const maxR = parseRating(max_rating);
    if (minR !== undefined && (minR < 1 || minR > 5))
      return badRequest(res, "min_rating fuera de rango (1..5)");
    if (maxR !== undefined && (maxR < 1 || maxR > 5))
      return badRequest(res, "max_rating fuera de rango (1..5)");
    if (minR !== undefined && maxR !== undefined && minR > maxR)
      return badRequest(res, "min_rating no puede ser mayor a max_rating");

    const hs =
      has_spoilers === "true"
        ? true
        : has_spoilers === "false"
        ? false
        : undefined;

    // Procesar tags si vienen como string o array
    let tagsArray = [];
    if (tags) {
      if (Array.isArray(tags)) tagsArray = tags;
      else if (typeof tags === "string") {
        try {
          tagsArray = JSON.parse(tags);
        } catch {
          tagsArray = [tags];
        }
      }
    }

    const filters = {
      movie_id,
      user_id,
      min_rating: minR,
      max_rating: maxR,
      has_spoilers: hs,
      genre,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      date_range,
    };

    const { rows, total } = await model.filterReviews(filters, {
      orderBy,
      limit: pageSize,
      offset: pageOffset,
    });

    res.set("X-Total-Count", String(total ?? 0));
    return res.json({
      total: total ?? 0,
      limit: pageSize,
      offset: pageOffset,
      data: rows,
    });
  } catch (err) {
    console.error("filterReviews error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export { createReview, getReview, updateReview, deleteReview, filterReviews };
