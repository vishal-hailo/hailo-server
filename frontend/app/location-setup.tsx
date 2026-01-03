import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocations } from '../hooks/useLocations';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

export default function LocationSetupScreen() {
  const router = useRouter();
  const { locations, loading: locationsLoading, fetchLocations } = useLocations();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkExistingLocations();
  }, []);

  const checkExistingLocations = async () => {
    try {
      const fetchedLocations = await fetchLocations();
      
      if (fetchedLocations && fetchedLocations.length > 0) {
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

  if (checking || locationsLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.gradient.start, Colors.gradient.middle, Colors.gradient.end]}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.main} />
            <Text style={styles.loadingText}>Loading...</Text>
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
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="location" size={48} color={Colors.primary.main} />
            </View>
          </View>

          <Text style={styles.title}>Set Up Your Locations</Text>
          <Text style={styles.subtitle}>
            Add your frequently visited places like Home and Office to get quick commute estimates and smart surge alerts.
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="home" size={24} color={Colors.success} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Save unlimited locations</Text>
                <Text style={styles.featureSubtitle}>Home, Office, Gym, and more</Text>
              </View>
            </View>
            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: Colors.primary.subtle }]}>
                <Ionicons name="navigate" size={24} color={Colors.primary.main} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>One-tap booking</Text>
                <Text style={styles.featureSubtitle}>Quick access to your daily routes</Text>
              </View>
            </View>
            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: '#FEF3E2' }]}>
                <Ionicons name="flash" size={24} color={Colors.secondary.orange} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Surge alerts</Text>
                <Text style={styles.featureSubtitle}>Get notified when prices drop</Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleAddLocations}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color={Colors.text.inverse} style={styles.buttonIconLeft} />
            <Text style={styles.primaryButtonText}>Add Locations Now</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleSetupLater}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
  featuresContainer: {
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
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
    marginBottom: 12,
  },
  buttonIconLeft: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: Colors.text.inverse,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
