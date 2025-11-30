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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

// Detect environment and use appropriate API URL
const getApiUrl = () => {
  // @ts-ignore - web only
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // On web, use relative path which will be proxied
    return '';
  }
  // On native, use localhost (works in emulator/simulator)
  return 'http://localhost:8002';
};

const API_URL = getApiUrl();

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('+91');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (phone.length < 13) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    console.log('Attempting to send OTP to:', phone);
    console.log('API URL:', API_URL);
    setLoading(true);
    
    try {
      console.log('Making request to:', `${API_URL}/api/v1/auth/request-otp`);
      const response = await axios.post(`${API_URL}/api/v1/auth/request-otp`, { phone }, {
        timeout: 10000, // 10 second timeout
      });
      console.log('OTP Response:', response.data);
      
      if (response.data.success) {
        console.log('OTP sent successfully, navigating to OTP screen');
        router.push({ pathname: '/auth/otp', params: { phone } });
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('Request OTP error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      let errorMessage = 'Failed to send OTP. ';
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out.';
      } else if (error.response) {
        errorMessage += error.response.data?.error || 'Server error.';
      } else if (error.request) {
        errorMessage += 'Cannot reach server. Check your connection.';
      } else {
        errorMessage += error.message;
      }
      
      Alert.alert('Error', errorMessage);
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
          <Text style={styles.title}>Welcome to HailO</Text>
          <Text style={styles.subtitle}>Mumbai's Commute Genius</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91XXXXXXXXXX"
              keyboardType="phone-pad"
              maxLength={13}
              autoFocus
            />
            <Text style={styles.hint}>We'll send you an OTP for verification</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : 'Continue'}
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  hint: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
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
