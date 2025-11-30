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
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

export default function PhoneFirebaseScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('+91');
  const [loading, setLoading] = useState(false);

  const setupRecaptcha = () => {
    if (Platform.OS === 'web') {
      // For web, setup reCAPTCHA
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
        });
      }
      return (window as any).recaptchaVerifier;
    }
    return null;
  };

  const handleContinue = async () => {
    if (phone.length < 13) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending OTP to:', phone);
      
      // Setup reCAPTCHA for web
      const recaptchaVerifier = setupRecaptcha();
      
      // Send OTP via Firebase
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phone,
        recaptchaVerifier
      );
      
      console.log('OTP sent successfully');
      
      // Store confirmation result globally for OTP screen
      (global as any).firebaseConfirmationResult = confirmationResult;
      
      // Navigate to OTP screen
      router.push({ 
        pathname: '/auth/otp',
        params: { phone, useFirebase: 'true' }
      });
    } catch (error: any) {
      console.error('Send OTP error:', error);
      
      let errorMessage = 'Failed to send OTP. ';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format.';
      } else if (error.code === 'auth/missing-phone-number') {
        errorMessage = 'Please enter a phone number.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else {
        errorMessage += error.message || 'Please check your number and try again.';
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
              placeholder=\"+91XXXXXXXXXX\"
              keyboardType=\"phone-pad\"
              maxLength={13}
              autoFocus
            />
            <Text style={styles.hint}>We'll send you a real SMS with verification code</Text>
            <Text style={styles.firebaseBadge}>🔐 Secured by Firebase Phone Auth</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Text>
          </TouchableOpacity>
          
          {/* Invisible reCAPTCHA container for web */}
          {Platform.OS === 'web' && <div id=\"recaptcha-container\"></div>}
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
  firebaseBadge: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
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
