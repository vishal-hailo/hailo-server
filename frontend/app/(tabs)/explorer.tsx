import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API_URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ExplorerScreen() {
  const router = useRouter();
  const [from, setFrom] = useState<any>(null);
  const [to, setTo] = useState<any>(null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedLocations();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadSavedLocations();
    }, [])
  );

  const loadSavedLocations = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/api/v1/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedLocations(response.data || []);
    } catch (error) {
      console.error('Load locations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (type: 'from' | 'to', location: any) => {
    if (type === 'from') {
      setFrom(location);
    } else {
      setTo(location);
    }
  };

  const handleSearch = () => {
    if (!from || !to) {
      Alert.alert('Missing Locations', 'Please select both From and To locations');
      return;
    }

    router.push({
      pathname: '/surge-radar',
      params: {
        originLat: from.latitude,
        originLng: from.longitude,
        destLat: to.latitude,
        destLng: to.longitude,
        routeName: `${from.label} → ${to.label}`,
      },
    });
  };

  const getIconForType = (type: string) => {
    if (type === 'HOME') return 'home';
    if (type === 'OFFICE') return 'briefcase';
    return 'location';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading locations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (savedLocations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={80} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Locations Saved</Text>
          <Text style={styles.emptyText}>
            Add your frequently visited places to explore routes and get surge predictions
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/locations-manager')}
          >
            <Text style={styles.addButtonText}>Add Locations</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Explorer</Text>
            <Text style={styles.subtitle}>Find the best time for any route</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/locations-manager')}>
            <Ionicons name="add-circle" size={32} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {/* From Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>From</Text>
          {from ? (
            <View style={styles.selectedLocation}>
              <View style={styles.selectedLocationHeader}>
                <View style={styles.selectedLocationIcon}>
                  <Ionicons name={getIconForType(from.type)} size={24} color="#FF6B35" />
                </View>
                <View style={styles.selectedLocationInfo}>
                  <Text style={styles.selectedLocationLabel}>{from.label}</Text>
                  <Text style={styles.selectedLocationType}>{from.type}</Text>
                  <Text style={styles.selectedLocationAddress}>{from.address}</Text>
                </View>
                <TouchableOpacity onPress={() => setFrom(null)}>
                  <Ionicons name="close-circle" size={28} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.locationGrid}>
              {savedLocations.map((location: any) => (
                <TouchableOpacity
                  key={location.id}
                  style={styles.locationCard}
                  onPress={() => handleLocationSelect('from', location)}
                >
                  <Ionicons name={getIconForType(location.type)} size={24} color="#FF6B35" />
                  <Text style={styles.locationCardLabel}>{location.label}</Text>
                  <Text style={styles.locationCardType}>{location.type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Swap Button */}
        {from && to && (
          <View style={styles.swapContainer}>
            <TouchableOpacity
              style={styles.swapButton}
              onPress={() => {
                const temp = from;
                setFrom(to);
                setTo(temp);
              }}
            >
              <Ionicons name="swap-vertical" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* To Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To</Text>
          {to ? (
            <View style={styles.selectedLocation}>
              <View style={styles.selectedLocationHeader}>
                <View style={styles.selectedLocationIcon}>
                  <Ionicons name={getIconForType(to.type)} size={24} color="#10B981" />
                </View>
                <View style={styles.selectedLocationInfo}>
                  <Text style={styles.selectedLocationLabel}>{to.label}</Text>
                  <Text style={styles.selectedLocationType}>{to.type}</Text>
                  <Text style={styles.selectedLocationAddress}>{to.address}</Text>
                </View>
                <TouchableOpacity onPress={() => setTo(null)}>
                  <Ionicons name="close-circle" size={28} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.locationGrid}>
              {savedLocations
                .filter((loc: any) => !from || loc.id !== from.id)
                .map((location: any) => (
                  <TouchableOpacity
                    key={location.id}
                    style={styles.locationCard}
                    onPress={() => handleLocationSelect('to', location)}
                  >
                    <Ionicons name={getIconForType(location.type)} size={24} color="#10B981" />
                    <Text style={styles.locationCardLabel}>{location.label}</Text>
                    <Text style={styles.locationCardType}>{location.type}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[
            styles.searchButton,
            (!from || !to) && styles.searchButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={!from || !to}
        >
          <Ionicons name="search" size={20} color="#FFFFFF" />
          <Text style={styles.searchButtonText}>View Surge Radar</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
    maxWidth: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  locationCardType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  selectedLocation: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedLocationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedLocationInfo: {
    flex: 1,
  },
  selectedLocationLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedLocationType: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedLocationAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: -16,
    zIndex: 10,
  },
  swapButton: {
    backgroundColor: '#FF6B35',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
