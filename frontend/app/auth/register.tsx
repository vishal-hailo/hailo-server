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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const { phone, token } = useLocalSearchParams<{ phone: string; token: string }>();
  const { updateUserProfile, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({ name: name.trim() });
      router.replace('/location-setup');
    } catch (error: any) {
      console.error('Register error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || authLoading;

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
          <View style={styles.content}>
            {/* Welcome Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Text style={styles.welcomeEmoji}>👋</Text>
              </View>
            </View>

            <Text style={styles.title}>Welcome to HailO!</Text>
            <Text style={styles.subtitle}>What should we call you?</Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={22} color={Colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={Colors.text.tertiary}
                  autoFocus
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Features Preview */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>You're almost there! With HailO you can:</Text>
              <View style={styles.featureItem}>
                <Ionicons name="flash" size={20} color={Colors.secondary.orange} />
                <Text style={styles.featureText}>Avoid surge pricing with smart timing</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="location" size={20} color={Colors.primary.main} />
                <Text style={styles.featureText}>Save your frequent routes</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="analytics" size={20} color={Colors.success} />
                <Text style={styles.featureText}>Track your savings over time</Text>
              </View>
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
                <>
                  <Text style={styles.primaryButtonText}>Let's Go!</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.text.inverse} style={styles.buttonIcon} />
                </>
              )}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBackground: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 32,
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
    fontSize: 18,
    color: Colors.text.primary,
    height: '100%',
  },
  featuresContainer: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: Colors.text.primary,
    marginLeft: 12,
    flex: 1,
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
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
