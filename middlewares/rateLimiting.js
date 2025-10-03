// Rate limiting simple en memoria (para producción usar Redis)
const requestCounts = new Map(); // Cache limpiado
const WINDOW_SIZE = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS = 1000; // máximo 1000 requests por ventana (aumentado para pruebas)

function rateLimiter(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Limpiar entradas expiradas
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.windowStart > WINDOW_SIZE) {
      requestCounts.delete(ip);
    }
  }
  
  // Obtener o crear entrada para esta IP
  let clientData = requestCounts.get(clientIP);
  if (!clientData) {
    clientData = {
      count: 0,
      windowStart: now
    };
    requestCounts.set(clientIP, clientData);
  }
  
  // Reset si estamos en una nueva ventana
  if (now - clientData.windowStart > WINDOW_SIZE) {
    clientData.count = 0;
    clientData.windowStart = now;
  }
  
  // Incrementar contador
  clientData.count++;
  
  // Verificar límite
  if (clientData.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Demasiadas solicitudes',
      message: `Máximo ${MAX_REQUESTS} solicitudes por ${WINDOW_SIZE / 60000} minutos`,
      retryAfter: Math.ceil((WINDOW_SIZE - (now - clientData.windowStart)) / 1000)
    });
  }
  
  // Headers informativos
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - clientData.count);
  res.setHeader('X-RateLimit-Reset', new Date(clientData.windowStart + WINDOW_SIZE).toISOString());
  
  next();
}

// Rate limiter específico para creación de contenido
function createContentLimiter(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress;
  const key = `create_${clientIP}`;
  const now = Date.now();
  const CREATE_WINDOW = 60 * 1000; // 1 minuto
  const MAX_CREATES = 5; // máximo 5 creaciones por minuto
  
  let clientData = requestCounts.get(key);
  if (!clientData) {
    clientData = {
      count: 0,
      windowStart: now
    };
    requestCounts.set(key, clientData);
  }
  
  if (now - clientData.windowStart > CREATE_WINDOW) {
    clientData.count = 0;
    clientData.windowStart = now;
  }
  
  clientData.count++;
  
  if (clientData.count > MAX_CREATES) {
    return res.status(429).json({
      error: 'Demasiadas creaciones',
      message: `Máximo ${MAX_CREATES} creaciones por minuto`,
      retryAfter: Math.ceil((CREATE_WINDOW - (now - clientData.windowStart)) / 1000)
    });
  }
  
  next();
}
export { rateLimiter, createContentLimiter };
/* module.exports = {
  rateLimiter,
  createContentLimiter,
}; */
