import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp;

try {
  // Initialize Firebase Admin SDK
  // Option 1: Using service account JSON file
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } 
  // Option 2: Using individual env variables
  else if (process.env.FIREBASE_PROJECT_ID) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
  // Option 3: Default credentials (works on Cloud Run, App Engine, etc.)
  else {
    console.warn('⚠️  No Firebase credentials found. Using default credentials.');
    console.warn('⚠️  Phone authentication will not work until you configure Firebase.');
    firebaseApp = admin.initializeApp();
  }
  
  console.log('✅ Firebase Admin SDK initialized successfully');
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
