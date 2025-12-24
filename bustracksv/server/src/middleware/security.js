/**
 * MIDDLEWARE DE SEGURIDAD PARA PRODUCCIÓN
 * Configuración de CORS, Headers de seguridad, Rate Limiting
 * Optimizado para acceso global y protección contra ataques comunes
 */

import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Configuración de CORS para acceso global
export const corsConfig = cors({
  origin: (origin, callback) => {
    // En desarrollo, permitir localhost
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Lista de orígenes permitidos (puedes usar variables de entorno)
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['https://bustracksv.vercel.app', 'https://bustracksv.com'];
    
    // Si no hay origin (peticiones desde Postman, mobile apps, etc.), permitir
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar si el origen está permitido
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Origen no permitido: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true, // Permitir cookies y headers de autenticación
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
  maxAge: 86400 // 24 horas de caché para preflight
});

// Configuración de Helmet para headers de seguridad
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Ajustar según necesidades
      connectSrc: ["'self'", process.env.API_URL || 'https://api.bustracksv.com'],
    },
  },
  crossOriginEmbedderPolicy: false, // Necesario para algunos servicios externos
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir recursos desde otros orígenes
});

// Rate Limiting - Protección contra abuso
export const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs, // Ventana de tiempo en ms
    max, // Máximo de peticiones por ventana
    message: {
      error: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true, // Retornar rate limit info en headers `RateLimit-*`
    legacyHeaders: false, // Deshabilitar `X-RateLimit-*` headers
    // Usar Redis para rate limiting distribuido (si está disponible)
    store: process.env.REDIS_URL ? undefined : undefined, // TODO: Implementar Redis store
    skip: (req) => {
      // Saltar rate limiting para IPs de confianza (opcional)
      const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
      return trustedIPs.includes(req.ip);
    }
  });
};

// Rate limiters específicos por tipo de endpoint
export const rateLimiters = {
  // General API (100 peticiones cada 15 minutos)
  general: createRateLimiter(15 * 60 * 1000, 100),
  
  // Autenticación (5 intentos cada 15 minutos)
  auth: createRateLimiter(15 * 60 * 1000, 5),
  
  // Búsquedas de rutas (50 búsquedas cada 15 minutos)
  search: createRateLimiter(15 * 60 * 1000, 50),
  
  // Endpoints pesados (20 peticiones cada hora)
  heavy: createRateLimiter(60 * 60 * 1000, 20),
};

// Middleware para agregar request ID (útil para debugging)
export const requestIdMiddleware = (req, res, next) => {
  req.id = req.headers['x-request-id'] || 
           `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Middleware para logging de peticiones
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.id
    };
    
    if (res.statusCode >= 400) {
      console.error('❌', JSON.stringify(logData));
    } else {
      console.log('✅', JSON.stringify(logData));
    }
  });
  
  next();
};

// Middleware para validar Content-Type en POST/PUT
export const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Content-Type debe ser application/json'
      });
    }
  }
  next();
};

// Middleware para sanitizar inputs básicos
export const sanitizeInput = (req, res, next) => {
  // Sanitizar strings básicos (prevenir XSS simple)
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  
  next();
};

export default {
  corsConfig,
  helmetConfig,
  rateLimiters,
  requestIdMiddleware,
  requestLogger,
  validateContentType,
  sanitizeInput
};


