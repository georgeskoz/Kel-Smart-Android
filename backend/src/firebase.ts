import * as admin from "firebase-admin";
import { env } from "./env";

/**
 * Check if Firebase is configured by verifying required environment variables
 */
function isFirebaseConfigured(): boolean {
  return !!(
    env.FIREBASE_PROJECT_ID &&
    env.FIREBASE_CLIENT_EMAIL &&
    env.FIREBASE_PRIVATE_KEY
  );
}

/**
 * Initialize Firebase Admin SDK
 * Returns null if Firebase is not configured
 */
function initializeFirebase(): admin.app.App | null {
  if (!isFirebaseConfigured()) {
    console.log(
      "Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables to enable Firebase."
    );
    return null;
  }

  // Check if Firebase is already initialized
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        // Private key comes as a string with escaped newlines, need to replace them
        privateKey: env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
    });

    console.log("Firebase initialized successfully");
    return app;
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    return null;
  }
}

// Initialize Firebase app
const firebaseApp = initializeFirebase();

/**
 * Get Firestore instance
 * Returns null if Firebase is not configured
 */
export function getFirestore(): admin.firestore.Firestore | null {
  if (!firebaseApp) {
    return null;
  }
  return admin.firestore();
}

/**
 * Get Firebase Auth instance
 * Returns null if Firebase is not configured
 */
export function getAuth(): admin.auth.Auth | null {
  if (!firebaseApp) {
    return null;
  }
  return admin.auth();
}

/**
 * Check if Firebase is available and configured
 */
export function isFirebaseAvailable(): boolean {
  return firebaseApp !== null;
}

// Export instances for convenience
export const firestore = getFirestore();
export const auth = getAuth();
export { firebaseApp };
