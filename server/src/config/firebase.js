import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let firebaseApp;

try {
  // Initialize Firebase Admin SDK
  // Option 1: Using service account JSON file
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccountPath = resolve(__dirname, '../../', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    const serviceAccountJson = readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK initialized with service account');
  } 
  // Option 2: Using individual env variables
  else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin SDK initialized with env variables');
  }
  // Option 3: Default credentials (works on Cloud Run, App Engine, etc.)
  else {
    console.warn('⚠️  No Firebase credentials found. Using default credentials.');
    console.warn('⚠️  Phone authentication will not work until you configure Firebase.');
    firebaseApp = admin.initializeApp();
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
  console.warn('⚠️  Firebase Phone Authentication will be disabled');
}

export const verifyFirebaseToken = async (idToken) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase is not initialized');
    }
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error.message);
    throw error;
  }
};

export default firebaseApp;
