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
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function EmailScreen() {
  const router = useRouter();
  const { sendEmailLink, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendLink = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const result = await sendEmailLink(email);
      
      if (result.success) {
        setEmailSent(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to send email link. Please try again.');
      }
    } catch (error: any) {
      console.error('Send email link error:', error);
      Alert.alert('Error', 'Failed to send email link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || authLoading;

  if (emailSent) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.gradient.start, Colors.gradient.middle, Colors.gradient.end]}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.blob, styles.blobTop]} />
        <View style={[styles.blob, styles.blobBottom]} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconBackground, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="mail" size={40} color={Colors.success} />
              </View>
            </View>

            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We've sent a magic link to{"\n"}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <View style={styles.instructionsContainer}>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>1</Text>
                </View>
                <Text style={styles.instructionText}>Open the email on this device</Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>2</Text>
                </View>
                <Text style={styles.instructionText}>Click the magic link</Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>3</Text>
                </View>
                <Text style={styles.instructionText}>You'll be signed in automatically</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setEmailSent(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color={Colors.text.primary} style={styles.buttonIconLeft} />
              <Text style={styles.secondaryButtonText}>Use a different email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.back()}
            >
              <Text style={styles.linkButtonText}>Sign in with phone instead</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Ionicons name="mail" size={32} color={Colors.primary.main} />
              </View>
            </View>

            <Text style={styles.title}>Sign in with Email</Text>
            <Text style={styles.subtitle}>
              We'll send you a magic link to sign in without a password
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={22} color={Colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleSendLink}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.text.inverse} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Send Magic Link</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.text.inverse} style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={styles.linkButtonText}>Sign in with phone instead</Text>
            </TouchableOpacity>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emailText: {
    fontWeight: '600',
    color: Colors.primary.main,
  },
  inputContainer: {
    marginBottom: 24,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    height: '100%',
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
  buttonIcon: {
    marginLeft: 8,
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
    marginBottom: 16,
  },
  buttonIconLeft: {
    marginRight: 10,
  },
  secondaryButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  linkButtonText: {
    fontSize: 15,
    color: Colors.primary.main,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary.subtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary.main,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.secondary,
  },
});
