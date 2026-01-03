import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');

// HailO Logo Component
const HailOLogo = () => (
  <View style={styles.logoContainer}>
    <View style={styles.logoIconWrapper}>
      <Svg width="32" height="32" viewBox="0 0 32 32">
        <Path 
          d="M8 8 L24 16 L8 24 L12 16 Z" 
          fill={Colors.text.inverse}
          stroke={Colors.text.inverse}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  </View>
);

export default function PhoneScreen() {
  const router = useRouter();
  const { sendOTP, loading: authLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    const fullPhone = '+91' + cleanPhone;
    setLoading(true);
    
    try {
      // Store phone for OTP verification
      await AsyncStorage.setItem('pendingPhone', fullPhone);
      console.log('Sending OTP to:', fullPhone);
      
      const result = await sendOTP(fullPhone);
      console.log('OTP result:', result);
      
      if (result.success) {
        console.log('Navigating to OTP screen...');
        router.push({
          pathname: '/auth/otp',
          params: { phone: fullPhone, verificationId: result.verificationId || 'mock' }
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = () => {
    router.push('/auth/email');
  };

  const isLoading = loading || authLoading;

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.middle, Colors.gradient.end]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Logo Section */}
            <HailOLogo />
            <Text style={styles.appName}>HailO</Text>
            <Text style={styles.tagline}>Your Daily Commute, Optimized.</Text>

            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome back</Text>
              <Text style={styles.welcomeSubtitle}>Sign in to your account to continue</Text>
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.countryCode}>+91</Text>
                <View style={styles.divider} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone Number"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Info message */}
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={16} color={Colors.success} />
              <Text style={styles.infoText}>Demo mode: Use OTP 1234</Text>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.text.inverse} />
              ) : (
                <Text style={styles.primaryButtonText}>Continue with Phone</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Sign In Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleEmailSignIn}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Ionicons name="mail-outline" size={20} color={Colors.text.primary} style={styles.buttonIconLeft} />
              <Text style={styles.secondaryButtonText}>Sign in with Email</Text>
            </TouchableOpacity>

            {/* Terms */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
              </Text>
              <TouchableOpacity>
                <Text style={styles.termsLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}> and </Text>
              <TouchableOpacity>
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.4,
  },
  blobTop: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: Colors.primary.muted,
    top: -width * 0.3,
    left: -width * 0.2,
  },
  blobBottom: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: '#D1FAE5',
    bottom: 0,
    right: -width * 0.2,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    paddingHorizontal: 16,
    height: 56,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginRight: 12,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border.light,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    height: '100%',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: Colors.text.inverse,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.light,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.tertiary,
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: Colors.background.card,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border.light,
  },
  buttonIconLeft: {
    marginRight: 10,
  },
  secondaryButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  termsLink: {
    fontSize: 14,
    color: Colors.primary.main,
    fontWeight: '600',
    lineHeight: 22,
  },
});
