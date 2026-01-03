import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  PhoneAuthProvider,
  signInWithCredential,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  ConfirmationResult,
  RecaptchaVerifier,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the API URL based on platform
const getApiUrl = (): string => {
  // For web, use relative path to hit the proxy
  if (Platform.OS === 'web') {
    // Use the current origin + /api prefix
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
  }
  // For native, use the configured backend URL
  return process.env.EXPO_PUBLIC_BACKEND_URL || Constants.expoConfig?.extra?.backendUrl || '';
};

const API_URL = getApiUrl();

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  // Phone Auth
  sendOTP: (phoneNumber: string) => Promise<{ success: boolean; verificationId?: string; error?: string }>;
  verifyOTP: (verificationId: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  // Email Auth
  sendEmailLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailLink: (email: string, link: string) => Promise<{ success: boolean; error?: string }>;
  // General
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateUserProfile: (data: { name?: string; email?: string }) => Promise<void>;
}

interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  rating: number;
  totalRides: number;
  totalDistance: number;
  totalSaved: number;
  timeSaved: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.phoneNumber || firebaseUser?.email || 'No user');
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Get Firebase ID token and sync with backend
        try {
          const idToken = await firebaseUser.getIdToken();
          await syncWithBackend(idToken);
        } catch (err) {
          console.error('Failed to sync with backend:', err);
        }
      } else {
        setUserProfile(null);
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
      }
      
      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Sync Firebase user with our backend
  const syncWithBackend = async (firebaseIdToken: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/firebase-login`, {
        firebaseIdToken,
      });

      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        setUserProfile(response.data.user);
      }
    } catch (err: any) {
      console.error('Backend sync error:', err.response?.data || err.message);
      // If backend sync fails, still allow the user to proceed
      // They can complete registration later
    }
  };

  // Send OTP to phone number
  const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; verificationId?: string; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // For web/development, we'll use the backend mock OTP
      // In production with proper setup, use Firebase Phone Auth
      const response = await axios.post(`${API_URL}/api/v1/auth/request-otp`, {
        phone: phoneNumber,
      });

      if (response.data.success) {
        return {
          success: true,
          verificationId: 'mock-verification-id',
        };
      }

      return { success: false, error: 'Failed to send OTP' };
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send OTP';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async (verificationId: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Use backend verification for now
      // This will be replaced with Firebase Phone Auth when properly configured
      const phone = await AsyncStorage.getItem('pendingPhone');
      
      const response = await axios.post(`${API_URL}/api/v1/auth/verify-otp`, {
        phone,
        otp,
      });

      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        setUserProfile(response.data.user);
        return { success: true };
      }

      return { success: false, error: 'Verification failed' };
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Invalid OTP';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Send email magic link
  const sendEmailLink = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Use the authorized domain for email links
      const actionCodeSettings = {
        url: 'https://stage-view-1.preview.emergentagent.com/auth/email-callback',
        handleCodeInApp: true,
        iOS: {
          bundleId: 'com.hailo.app',
        },
        android: {
          packageName: 'com.hailo.app',
          installApp: true,
        },
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      // Save email for later verification
      await AsyncStorage.setItem('emailForSignIn', email);
      
      return { success: true };
    } catch (err: any) {
      console.error('Send email link error:', err);
      const errorMessage = err.message || 'Failed to send email link';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Verify email magic link
  const verifyEmailLink = async (email: string, link: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      if (isSignInWithEmailLink(auth, link)) {
        const result = await signInWithEmailLink(auth, email, link);
        
        if (result.user) {
          const idToken = await result.user.getIdToken();
          await syncWithBackend(idToken);
          await AsyncStorage.removeItem('emailForSignIn');
          return { success: true };
        }
      }

      return { success: false, error: 'Invalid email link' };
    } catch (err: any) {
      const errorMessage = err.message || 'Email verification failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      await AsyncStorage.multiRemove(['authToken', 'user', 'onboardingCompleted', 'locationsSetup']);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh user profile from backend
  const refreshUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/v1/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setUserProfile(response.data);
        await AsyncStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (err) {
      console.error('Refresh profile error:', err);
    }
  };

  // Update user profile
  const updateUserProfile = async (data: { name?: string; email?: string }) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');

      const response = await axios.post(
        `${API_URL}/api/v1/me/update`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        setUserProfile(prev => prev ? { ...prev, ...response.data } : response.data);
        await AsyncStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (err: any) {
      console.error('Update profile error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    initialized,
    error,
    sendOTP,
    verifyOTP,
    sendEmailLink,
    verifyEmailLink,
    signOut,
    refreshUserProfile,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
