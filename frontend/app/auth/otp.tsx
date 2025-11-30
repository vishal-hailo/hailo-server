import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { auth } from '../../firebaseConfig';

const API_URL = Platform.OS === 'web' ? '' : 'http://localhost:8001';

export default function OTPScreen() {
  const router = useRouter();
  const { phone, useFirebase } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyFirebase = async () => {
    try {
      // Get the confirmation result from global storage
      const confirmationResult = globalThis.firebaseConfirmationResult;
      
      if (!confirmationResult) {
        throw new Error('Firebase confirmation not found. Please request OTP again.');
      }

      // Confirm the OTP code
      const userCredential = await confirmationResult.confirm(otp);
      console.log('Firebase OTP verified successfully');

      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();
      console.log('Got Firebase ID token');

      // Send token to our backend
      const response = await axios.post(`${API_URL}/api/v1/auth/firebase-login`, {
        firebaseIdToken: idToken,
      });

      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        
        // Check if user has a name (existing user) or needs registration
        if (response.data.user.name) {
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
          // Check if locations are setup
          const locationsSetup = await AsyncStorage.getItem('locationsSetup');
          if (locationsSetup) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/location-setup');
          }
        } else {
          // New user - go to registration
          router.replace({
            pathname: '/auth/register',
            params: { phone, token: response.data.token },
          });
        }
      }
    } catch (error: any) {
      console.error('Firebase OTP verification error:', error);
      
      let errorMessage = 'Invalid or expired code. ';
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code. Please try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code expired. Please request a new code.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleVerifyMock = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/verify-otp`, {
        phone,
        otp,
      });

      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        
        // Check if user has a name (existing user) or needs registration
        if (response.data.user.name) {
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
          const locationsSetup = await AsyncStorage.getItem('locationsSetup');
          if (locationsSetup) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/location-setup');
          }
        } else {
          router.replace({
            pathname: '/auth/register',
            params: { phone, token: response.data.token },
          });
        }
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Invalid OTP. Please try again.');
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6 && otp.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      // Use Firebase verification if useFirebase param is present
      if (useFirebase === 'true') {
        await handleVerifyFirebase();
      } else {
        await handleVerifyMock();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Enter OTP</Text>
          <Text style={styles.subtitle}>Sent to {phone}</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="1234"
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
            />
            <Text style={styles.hint}>Mock OTP: 1234</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 24,
    left: 24,
  },
  backText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 48,
  },
  form: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 32,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    letterSpacing: 16,
  },
  hint: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
