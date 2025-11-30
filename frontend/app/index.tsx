import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
      
      setTimeout(() => {
        if (token) {
          router.replace('/(tabs)/home');
        } else if (onboardingCompleted) {
          router.replace('/auth/phone');
        } else {
          router.replace('/onboarding');
        }
      }, 2000);
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/onboarding');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>HailO</Text>
        <Text style={styles.tagline}>Mumbai's Commute Genius</Text>
      </View>
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
});
