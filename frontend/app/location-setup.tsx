import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// API_URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function LocationSetupScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkExistingLocations();
  }, []);

  const checkExistingLocations = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/api/v1/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data && response.data.length > 0) {
        // User already has locations, skip setup
        await AsyncStorage.setItem('locationsSetup', 'true');
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Check locations error:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSetupLater = async () => {
    await AsyncStorage.setItem('locationsSetup', 'true');
    router.replace('/(tabs)/home');
  };

  const handleAddLocations = () => {
    router.push('/locations-manager');
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="location" size={80} color="#FF6B35" />
        </View>

        <Text style={styles.title}>Set Up Your Locations</Text>
        <Text style={styles.subtitle}>
          Add your frequently visited places like Home and Office to get quick commute estimates and smart surge alerts.
        </Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="home" size={24} color="#10B981" />
            <Text style={styles.featureText}>Save unlimited locations</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="navigate" size={24} color="#3B82F6" />
            <Text style={styles.featureText}>Auto-detect current location</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="time" size={24} color="#F59E0B" />
            <Text style={styles.featureText}>Get real-time estimates</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleAddLocations}>
          <Text style={styles.primaryButtonText}>Add Locations Now</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSetupLater}>
          <Text style={styles.secondaryButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  features: {
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
