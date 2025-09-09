// Funciones de validación para datos de entrada

// Validar datos de usuario
function validateUserData(userData) {
  const errors = [];
  
  if (!userData.name || userData.name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  
  if (!userData.email || !isValidEmail(userData.email)) {
    errors.push('Email inválido');
  }
  
  if (userData.bio && userData.bio.length > 500) {
    errors.push('La biografía no puede exceder 500 caracteres');
  }
  
  return errors;
}

// Validar datos de película
function validateMovieData(movieData) {
  const errors = [];
  
  if (!movieData.title || movieData.title.trim().length < 1) {
    errors.push('El título es obligatorio');
  }
  
  if (movieData.year && (movieData.year < 1888 || movieData.year > new Date().getFullYear() + 5)) {
    errors.push('Año inválido');
  }
  
  if (movieData.description && movieData.description.length > 1000) {
    errors.push('La descripción no puede exceder 1000 caracteres');
  }
  
  return errors;
}

// Validar datos de reseña
function validateReviewData(reviewData) {
  const errors = [];
  
  if (!reviewData.title || reviewData.title.trim().length < 5) {
    errors.push('El título debe tener al menos 5 caracteres');
  }
  
  if (!reviewData.body || reviewData.body.trim().length < 20) {
    errors.push('El contenido debe tener al menos 20 caracteres');
  }
  
  if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
    errors.push('La calificación debe estar entre 1 y 5');
  }
  
  if (!reviewData.movie_id || !Number.isInteger(Number(reviewData.movie_id))) {
    errors.push('ID de película inválido');
  }
  
  if (!reviewData.user_id || !Number.isInteger(Number(reviewData.user_id))) {
    errors.push('ID de usuario inválido');
  }
  
  if (reviewData.tags && (!Array.isArray(reviewData.tags) || reviewData.tags.length > 10)) {
    errors.push('Las etiquetas deben ser un array de máximo 10 elementos');
  }
  
  return errors;
}

// Validar comentario
function validateCommentData(commentData) {
  const errors = [];
  
  if (!commentData.comment || commentData.comment.trim().length < 3) {
    errors.push('El comentario debe tener al menos 3 caracteres');
  }
  
  if (commentData.comment && commentData.comment.length > 500) {
    errors.push('El comentario no puede exceder 500 caracteres');
  }
  
  if (!commentData.user_id || !Number.isInteger(Number(commentData.user_id))) {
    errors.push('ID de usuario inválido');
  }
  
  return errors;
}

// Utilidades
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

function validatePagination(query) {
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
  const offset = Math.max(parseInt(query.offset) || 0, 0);
  return { limit, offset };
}

module.exports = {
  validateUserData,
  validateMovieData,
  validateReviewData,
  validateCommentData,
  isValidEmail,
  sanitizeInput,
  validatePagination,
};
