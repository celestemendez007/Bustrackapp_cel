import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp: App | null = null;
let firestore: Firestore | null = null;

/**
 * Inicializa Firebase Admin SDK de manera segura usando variables de entorno
 * Soporta dos métodos de autenticación:
 * 1. GOOGLE_APPLICATION_CREDENTIALS (ruta al archivo JSON de credenciales)
 * 2. FIREBASE_CREDENTIALS (contenido JSON como string de las credenciales)
 */
export function initializeFirebase(): App {
  // Si ya está inicializado, retornar la instancia existente
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Verificar que existe alguna forma de autenticación
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const credentialsJson = process.env.FIREBASE_CREDENTIALS;

    if (!credentialsPath && !credentialsJson) {
      throw new Error(
        'Firebase credentials not found. Please set either GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_CREDENTIALS environment variable.'
      );
    }

    let credential;

    if (credentialsJson) {
      // Opción 1: Credenciales como JSON string en variable de entorno
      try {
        const credentials = JSON.parse(credentialsJson);
        credential = cert(credentials);
      } catch (parseError) {
        throw new Error(
          `Failed to parse FIREBASE_CREDENTIALS. Ensure it's valid JSON: ${parseError}`
        );
      }
    } else if (credentialsPath) {
      // Opción 2: Ruta al archivo de credenciales
      credential = cert(credentialsPath);
    }

    // Inicializar Firebase Admin si no hay apps inicializadas
    const existingApps = getApps();
    if (existingApps.length === 0) {
      firebaseApp = initializeApp({
        credential: credential,
        projectId: process.env.FIREBASE_PROJECT_ID || undefined,
      });
    } else {
      firebaseApp = existingApps[0];
    }

    console.log('✅ Firebase Admin initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    throw error;
  }
}

/**
 * Obtiene una instancia de Firestore
 * Inicializa Firebase si es necesario
 */
export function getFirestoreInstance(): Firestore {
  if (firestore) {
    return firestore;
  }

  if (!firebaseApp) {
    initializeFirebase();
  }

  firestore = getFirestore(firebaseApp!);
  return firestore;
}

/**
 * Verifica la conexión a Firestore
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const db = getFirestoreInstance();
    // Intentar leer una colección de prueba (no crea nada si no existe)
    await db.collection('_health').limit(1).get();
    console.log('✅ Firestore connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection test failed:', error);
    return false;
  }
}

export default {
  initializeFirebase,
  getFirestoreInstance,
  testFirestoreConnection,
};

