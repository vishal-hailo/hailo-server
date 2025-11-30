import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
// API_URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const MUMBAI_LOCATIONS = [
  { name: 'Andheri East', lat: 19.1188, lng: 72.8913 },
  { name: 'BKC', lat: 19.0661, lng: 72.8354 },
  { name: 'Bandra', lat: 19.0634, lng: 72.8350 },
  { name: 'Powai', lat: 19.1249, lng: 72.9077 },
  { name: 'Colaba', lat: 18.9067, lng: 72.8147 },
  { name: 'Juhu', lat: 19.0990, lng: 72.8267 },
];

export default function LocationSetupScreen() {
  const router = useRouter();
  const [home, setHome] = useState<any>(null);
  const [office, setOffice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to detect your current location. You can still select from preset locations.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const useCurrentLocation = async (type: 'home' | 'office') => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        name: 'Current Location',
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      
      if (type === 'home') {
        setHome(coords);
      } else {
        setOffice(coords);
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (type: 'home' | 'office', location: any) => {
    if (type === 'home') {
      setHome(location);
    } else {
      setOffice(location);
    }
  };

  const handleContinue = async () => {
    if (!home || !office) {
      Alert.alert('Required', 'Please select both Home and Office locations');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      // Save home location
      await axios.post(
        `${API_URL}/api/v1/locations`,
        {
          type: 'HOME',
          label: home.name,
          address: home.name,
          latitude: home.lat,
          longitude: home.lng,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Save office location
      await axios.post(
        `${API_URL}/api/v1/locations`,
        {
          type: 'OFFICE',
          label: office.name,
          address: office.name,
          latitude: office.lat,
          longitude: office.lng,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await AsyncStorage.setItem('locationsSetup', 'true');
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Save locations error:', error);
      Alert.alert('Error', 'Failed to save locations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Setup',
      'You can add locations later in Settings',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => router.replace('/(tabs)/home'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Set Your Locations</Text>
          <Text style={styles.subtitle}>Quick access to daily commutes</Text>
        </View>

        {/* Home Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="home" size={24} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Home</Text>
          </View>
          
          {home ? (
            <View style={styles.selectedCard}>
              <Text style={styles.selectedText}>{home.name}</Text>
              <TouchableOpacity onPress={() => setHome(null)}>
                <Ionicons name="close-circle" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={() => useCurrentLocation('home')}
              >
                <Ionicons name="locate" size={20} color="#FF6B35" />
                <Text style={styles.currentLocationText}>Use Current Location</Text>
              </TouchableOpacity>
              
              <View style={styles.locationGrid}>
                {MUMBAI_LOCATIONS.map((loc, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.locationButton}
                    onPress={() => selectLocation('home', loc)}
                  >
                    <Text style={styles.locationButtonText}>{loc.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Office Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase" size={24} color="#6B46C1" />
            <Text style={styles.sectionTitle}>Office</Text>
          </View>
          
          {office ? (
            <View style={styles.selectedCard}>
              <Text style={styles.selectedText}>{office.name}</Text>
              <TouchableOpacity onPress={() => setOffice(null)}>
                <Ionicons name="close-circle" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={() => useCurrentLocation('office')}
              >
                <Ionicons name="locate" size={20} color="#6B46C1" />
                <Text style={styles.currentLocationText}>Use Current Location</Text>
              </TouchableOpacity>
              
              <View style={styles.locationGrid}>
                {MUMBAI_LOCATIONS.map((loc, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.locationButton}
                    onPress={() => selectLocation('office', loc)}
                  >
                    <Text style={styles.locationButtonText}>{loc.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.continueButton, (!home || !office) && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!home || !office || loading}
          >
            <Text style={styles.continueButtonText}>
              {loading ? 'Saving...' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
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
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  buttons: {
    padding: 24,
  },
  continueButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
