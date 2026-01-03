import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration - Personal Project (hailo-1ba05)
export const firebaseConfig = {
  apiKey: 'AIzaSyAI4kcJJvHPQlRP6lxmEon2hpkSxYn9IhI',
  authDomain: 'hailo-1ba05.firebaseapp.com',
  projectId: 'hailo-1ba05',
  storageBucket: 'hailo-1ba05.firebasestorage.app',
  messagingSenderId: '369818132526',
  appId: '1:369818132526:web:2fb425f6dc47f14ea0ffbf',
  measurementId: 'G-Y8XRDF29PJ',
};

// Initialize Firebase App (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistence
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // Use AsyncStorage for persistence on native
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // If already initialized, get the existing instance
    auth = getAuth(app);
  }
}

export { app, auth };
export default app;
