import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCZsnFLpR9RkeYB_AxU9syWM4bp3sCdQ-g',
  authDomain: 'hailo-deb7b.firebaseapp.com',
  projectId: 'hailo-deb7b',
  storageBucket: 'hailo-deb7b.firebasestorage.app',
  messagingSenderId: '90094118448',
  appId: '1:90094118448:web:92dda6d7ac892ada8daff5',
  measurementId: 'G-KBSYYBEYRD',
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
