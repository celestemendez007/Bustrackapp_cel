/**
 * CAPA DE CACHÉ REDIS PARA OPTIMIZACIÓN
 * Compatible con Upstash Redis, AWS ElastiCache, Redis Cloud, o Redis local
 * 
 * Estrategia de caché:
 * - Rutas más consultadas: TTL 1 hora
 * - Paradas cercanas: TTL 15 minutos
 * - Búsquedas de rutas: TTL 30 minutos
 * - Datos de usuario: TTL 5 minutos
 */

import { createClient } from 'redis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '..', '.env') });

let redisClient = null;
let isConnected = false;

// Verificar si Redis está configurado
const isRedisConfigured = () => {
  return !!(process.env.REDIS_URL || process.env.REDIS_HOST);
};

// Función para verificar si Redis está realmente disponible
export const isRedisAvailable = () => {
  return isRedisConfigured() && isConnected && redisClient !== null;
};

// Configuración de Redis
const getRedisConfig = () => {
  // Si hay URL completa (Upstash, Redis Cloud, etc.)
  if (process.env.REDIS_URL) {
    return {
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis: Máximo de reintentos alcanzado');
            return new Error('Máximo de reintentos alcanzado');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    };
  }
  
  // Configuración individual (solo si REDIS_HOST está configurado)
  if (process.env.REDIS_HOST) {
    return {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Máximo de reintentos alcanzado');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    };
  }
  
  // No hay configuración, retornar null
  return null;
};

// Inicializar cliente Redis
export const initRedis = async () => {
  try {
    // Si Redis no está configurado, no intentar conectarse
    if (!isRedisConfigured()) {
      console.log('ℹ️ Redis no configurado. Continuando sin caché.');
      isConnected = false;
      return null;
    }

    if (redisClient && isConnected) {
      return redisClient;
    }

    const config = getRedisConfig();
    if (!config) {
      console.log('ℹ️ Redis no configurado. Continuando sin caché.');
      isConnected = false;
      return null;
    }

    redisClient = createClient(config);

    // Contador para limitar mensajes de error repetitivos
    let errorCount = 0;
    let lastErrorTime = 0;

    // Manejo de eventos
    redisClient.on('error', (err) => {
      const now = Date.now();
      // Solo mostrar error cada 5 segundos para evitar spam
      if (now - lastErrorTime > 5000) {
        errorCount = 0;
      }
      if (errorCount === 0) {
        console.error('❌ Redis Client Error:', err.message);
      }
      errorCount++;
      lastErrorTime = now;
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('🔄 Redis: Conectando...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis: Conectado y listo');
      isConnected = true;
      errorCount = 0; // Resetear contador al conectar
    });

    redisClient.on('reconnecting', () => {
      // Solo mostrar mensaje de reconexión ocasionalmente
      if (Math.random() < 0.1) { // 10% de probabilidad
        console.log('🔄 Redis: Reconectando...');
      }
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    // Solo mostrar error una vez
    if (!isConnected) {
      console.error('❌ Error al inicializar Redis:', error.message);
      console.warn('⚠️ Continuando sin caché. La aplicación funcionará pero será más lenta.');
    }
    isConnected = false;
    return null;
  }
};

// Obtener cliente Redis (lazy initialization)
export const getRedis = async () => {
  // Si Redis no está configurado, retornar null inmediatamente
  if (!isRedisConfigured()) {
    return null;
  }
  
  if (!redisClient || !isConnected) {
    return await initRedis();
  }
  return redisClient;
};

// Funciones de caché con TTL configurable
export const cache = {
  // Obtener valor del caché
  get: async (key) => {
    try {
      const client = await getRedis();
      if (!client) return null;
      
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error al obtener caché para key "${key}":`, error.message);
      return null;
    }
  },

  // Guardar valor en caché
  set: async (key, value, ttlSeconds = 3600) => {
    try {
      const client = await getRedis();
      if (!client) return false;
      
      await client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error al guardar caché para key "${key}":`, error.message);
      return false;
    }
  },

  // Eliminar del caché
  del: async (key) => {
    try {
      const client = await getRedis();
      if (!client) return false;
      
      await client.del(key);
      return true;
    } catch (error) {
      console.error(`Error al eliminar caché para key "${key}":`, error.message);
      return false;
    }
  },

  // Eliminar múltiples keys por patrón
  delPattern: async (pattern) => {
    try {
      const client = await getRedis();
      if (!client) return false;
      
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`Error al eliminar patrón "${pattern}":`, error.message);
      return false;
    }
  },

  // Verificar si existe una key
  exists: async (key) => {
    try {
      const client = await getRedis();
      if (!client) return false;
      
      return await client.exists(key) === 1;
    } catch (error) {
      console.error(`Error al verificar existencia de key "${key}":`, error.message);
      return false;
    }
  }
};

// Funciones específicas para el dominio de la aplicación
export const routeCache = {
  // Caché de rutas activas (TTL: 1 hora)
  getRoutes: async () => {
    return await cache.get('routes:active');
  },
  
  setRoutes: async (routes) => {
    return await cache.set('routes:active', routes, 3600); // 1 hora
  },
  
  // Caché de ruta específica (TTL: 1 hora)
  getRoute: async (routeId) => {
    return await cache.get(`route:${routeId}`);
  },
  
  setRoute: async (routeId, route) => {
    return await cache.set(`route:${routeId}`, route, 3600);
  },
  
  // Invalidar caché de rutas
  invalidate: async () => {
    await cache.delPattern('route:*');
    await cache.del('routes:active');
  }
};

export const stopCache = {
  // Caché de paradas cercanas (TTL: 15 minutos)
  getNearby: async (lat, lng, radius) => {
    const key = `stops:nearby:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;
    return await cache.get(key);
  },
  
  setNearby: async (lat, lng, radius, stops) => {
    const key = `stops:nearby:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;
    return await cache.set(key, stops, 900); // 15 minutos
  },
  
  // Caché de todas las paradas activas (TTL: 1 hora)
  getAll: async () => {
    return await cache.get('stops:active');
  },
  
  setAll: async (stops) => {
    return await cache.set('stops:active', stops, 3600);
  },
  
  // Invalidar caché de paradas
  invalidate: async () => {
    await cache.delPattern('stops:*');
  }
};

export const searchCache = {
  // Caché de búsquedas de rutas (TTL: 30 minutos)
  getRouteSearch: async (originLat, originLng, destLat, destLng) => {
    const key = `search:route:${originLat.toFixed(4)}:${originLng.toFixed(4)}:${destLat.toFixed(4)}:${destLng.toFixed(4)}`;
    return await cache.get(key);
  },
  
  setRouteSearch: async (originLat, originLng, destLat, destLng, results) => {
    const key = `search:route:${originLat.toFixed(4)}:${originLng.toFixed(4)}:${destLat.toFixed(4)}:${destLng.toFixed(4)}`;
    return await cache.set(key, results, 1800); // 30 minutos
  }
};

// Cerrar conexión Redis
export const closeRedis = async () => {
  try {
    if (redisClient && isConnected) {
      await redisClient.quit();
      isConnected = false;
      console.log('✅ Redis: Conexión cerrada');
    }
  } catch (error) {
    console.error('Error al cerrar Redis:', error);
  }
};

// Inicializar automáticamente solo si Redis está configurado y no está en modo test
if (process.env.NODE_ENV !== 'test' && isRedisConfigured()) {
  initRedis().catch(() => {
    // Error ya manejado en initRedis, no hacer nada
  });
}

export default { cache, routeCache, stopCache, searchCache, initRedis, closeRedis, isRedisAvailable };


