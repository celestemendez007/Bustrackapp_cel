import { getFirestoreInstance } from '../config/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Interfaz para un punto de coordenadas
 */
export interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * Interfaz para los datos de una ruta de autobús
 */
export interface BusRouteData {
  routeId: string;
  name: string;
  coordinates: Coordinate[];
  metadata?: {
    description?: string;
    company?: string;
    routeNumber?: string;
    type?: string;
    active?: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
  };
}

/**
 * Interfaz para el documento completo de ruta en Firestore
 */
export interface RouteDocument {
  routeId: string;
  name: string;
  coordinates: Coordinate[];
  coordinateCount: number;
  metadata: {
    description?: string;
    company?: string;
    routeNumber?: string;
    type?: string;
    active: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };
  // Campo calculado para búsquedas eficientes
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

/**
 * Calcula los límites geográficos (bounding box) de un array de coordenadas
 * Útil para búsquedas geográficas eficientes
 */
function calculateBounds(coordinates: Coordinate[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate bounds for empty coordinates array');
  }

  let north = coordinates[0].lat;
  let south = coordinates[0].lat;
  let east = coordinates[0].lng;
  let west = coordinates[0].lng;

  coordinates.forEach((coord) => {
    north = Math.max(north, coord.lat);
    south = Math.min(south, coord.lat);
    east = Math.max(east, coord.lng);
    west = Math.min(west, coord.lng);
  });

  return { north, south, east, west };
}

/**
 * Guarda o actualiza una ruta de autobús en Firestore
 * 
 * Diseño optimizado para lectura:
 * - Todas las coordenadas se guardan en un solo documento
 * - Los puntos se almacenan como array de objetos { lat, lng }
 * - Se incluyen metadatos y bounds para búsquedas eficientes
 * - Usa batch writes para operaciones masivas si es necesario
 * 
 * @param routeData - Datos de la ruta incluyendo ID, nombre y coordenadas
 * @returns Promise con el ID del documento guardado
 * @throws Error si la operación falla
 */
export async function saveBusRoute(routeData: BusRouteData): Promise<string> {
  const db = getFirestoreInstance();
  const routesCollection = db.collection('routes');

  try {
    // Validaciones
    if (!routeData.routeId || !routeData.routeId.trim()) {
      throw new Error('routeId is required and cannot be empty');
    }

    if (!routeData.name || !routeData.name.trim()) {
      throw new Error('name is required and cannot be empty');
    }

    if (!Array.isArray(routeData.coordinates) || routeData.coordinates.length === 0) {
      throw new Error('coordinates must be a non-empty array');
    }

    // Validar formato de coordenadas
    routeData.coordinates.forEach((coord, index) => {
      if (typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
        throw new Error(`Invalid coordinate at index ${index}: lat and lng must be numbers`);
      }
      if (coord.lat < -90 || coord.lat > 90) {
        throw new Error(`Invalid latitude at index ${index}: must be between -90 and 90`);
      }
      if (coord.lng < -180 || coord.lng > 180) {
        throw new Error(`Invalid longitude at index ${index}: must be between -180 and 180`);
      }
    });

    // Calcular bounds para búsquedas geográficas
    const bounds = calculateBounds(routeData.coordinates);

    // Preparar el documento
    const now = Timestamp.now();
    const routeDocument: RouteDocument = {
      routeId: routeData.routeId.trim(),
      name: routeData.name.trim(),
      coordinates: routeData.coordinates,
      coordinateCount: routeData.coordinates.length,
      bounds,
      metadata: {
        description: routeData.metadata?.description || '',
        company: routeData.metadata?.company || '',
        routeNumber: routeData.metadata?.routeNumber || '',
        type: routeData.metadata?.type || 'Bus',
        active: routeData.metadata?.active !== undefined ? routeData.metadata.active : true,
        createdAt: routeData.metadata?.createdAt || now,
        updatedAt: now,
      },
    };

    // Usar routeId como ID del documento para facilitar búsquedas
    const docRef = routesCollection.doc(routeData.routeId);

    // Verificar si el documento ya existe para preservar createdAt
    const existingDoc = await docRef.get();
    if (existingDoc.exists) {
      const existingData = existingDoc.data() as RouteDocument;
      routeDocument.metadata.createdAt = existingData.metadata.createdAt;
      console.log(`📝 Updating existing route: ${routeData.routeId}`);
    } else {
      console.log(`✨ Creating new route: ${routeData.routeId}`);
    }

    // Guardar en Firestore
    await docRef.set(routeDocument, { merge: false });

    console.log(
      `✅ Route saved successfully: ${routeData.routeId} (${routeData.coordinates.length} coordinates)`
    );

    return docRef.id;
  } catch (error) {
    console.error(`❌ Error saving route ${routeData.routeId}:`, error);
    throw error;
  }
}

/**
 * Obtiene una ruta por su ID
 * 
 * @param routeId - ID de la ruta
 * @returns Promise con los datos de la ruta o null si no existe
 */
export async function getBusRoute(routeId: string): Promise<RouteDocument | null> {
  const db = getFirestoreInstance();
  const routesCollection = db.collection('routes');

  try {
    const docRef = routesCollection.doc(routeId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as RouteDocument;
  } catch (error) {
    console.error(`❌ Error getting route ${routeId}:`, error);
    throw error;
  }
}

/**
 * Guarda múltiples rutas de manera eficiente usando batch writes
 * Firestore permite hasta 500 operaciones por batch
 * 
 * @param routes - Array de rutas a guardar
 * @returns Promise con el número de rutas guardadas
 */
export async function saveMultipleBusRoutes(
  routes: BusRouteData[]
): Promise<number> {
  const db = getFirestoreInstance();
  const BATCH_SIZE = 500; // Límite de Firestore

  try {
    let savedCount = 0;

    // Procesar en lotes de 500
    for (let i = 0; i < routes.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const batchRoutes = routes.slice(i, i + BATCH_SIZE);

      for (const routeData of batchRoutes) {
        // Validaciones básicas
        if (!routeData.routeId || !routeData.name || !routeData.coordinates?.length) {
          console.warn(`⚠️ Skipping invalid route at index ${i + batchRoutes.indexOf(routeData)}`);
          continue;
        }

        const bounds = calculateBounds(routeData.coordinates);
        const now = Timestamp.now();

        const routeDocument: RouteDocument = {
          routeId: routeData.routeId.trim(),
          name: routeData.name.trim(),
          coordinates: routeData.coordinates,
          coordinateCount: routeData.coordinates.length,
          bounds,
          metadata: {
            description: routeData.metadata?.description || '',
            company: routeData.metadata?.company || '',
            routeNumber: routeData.metadata?.routeNumber || '',
            type: routeData.metadata?.type || 'Bus',
            active: routeData.metadata?.active !== undefined ? routeData.metadata.active : true,
            createdAt: routeData.metadata?.createdAt || now,
            updatedAt: now,
          },
        };

        const docRef = db.collection('routes').doc(routeData.routeId);
        batch.set(docRef, routeDocument, { merge: false });
      }

      // Ejecutar batch
      await batch.commit();
      savedCount += batchRoutes.length;
      console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} saved: ${batchRoutes.length} routes`);
    }

    console.log(`✅ Total routes saved: ${savedCount}/${routes.length}`);
    return savedCount;
  } catch (error) {
    console.error('❌ Error saving multiple routes:', error);
    throw error;
  }
}

export default {
  saveBusRoute,
  getBusRoute,
  saveMultipleBusRoutes,
};

