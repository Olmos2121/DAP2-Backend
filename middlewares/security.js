// Middleware de seguridad
function securityHeaders(req, res, next) {
  // Headers de seguridad básicos
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CSP básico para APIs
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none';");
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
}

// Validar parámetros numéricos para evitar inyecciones
function validateNumericParams(req, res, next) {
  const numericParams = ['id', 'movieId', 'userId', 'commentId'];
  
  for (const param of numericParams) {
    if (req.params[param]) {
      const value = parseInt(req.params[param], 10);
      if (!Number.isFinite(value) || value < 1) {
        return res.status(400).json({ 
          error: 'Parámetro inválido',
          message: `${param} debe ser un número entero positivo`
        });
      }
      req.params[param] = value;
    }
  }
  
  next();
}

// Middleware para limpiar datos de entrada
function sanitizeRequest(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  next();
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Remover HTML/scripts básicos
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .trim();
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? item.trim().substring(0, 100) : item
        );
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

// Middleware para verificar Content-Type en POST/PUT
function validateContentType(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Content-Type inválido',
        message: 'Se requiere application/json'
      });
    }
  }
  next();
}

module.exports = {
  securityHeaders,
  validateNumericParams,
  sanitizeRequest,
  validateContentType,
};
