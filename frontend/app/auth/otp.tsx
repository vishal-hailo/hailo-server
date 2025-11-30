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

// API_URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function OTPScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit OTP');
      return;
    }

    setLoading(true);
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
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Invalid OTP. Please try again.');
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
            <Text style={styles.hint}>Enter OTP: 1234</Text>
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
