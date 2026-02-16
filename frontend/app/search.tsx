import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import Colors from '../constants/Colors';
import { PillBadge, RoundIcon } from '../components/shared/DesignSystemComponents';

// Simple predefined locations for Mumbai
const POPULAR_LOCATIONS = [
  { _id: 'pop1', label: 'Bandra Station', address: 'Bandra West, Mumbai', latitude: 19.0544, longitude: 72.8406, type: 'POPULAR' },
  { _id: 'pop2', label: 'Gateway of India', address: 'Apollo Bandar, Mumbai', latitude: 18.9220, longitude: 72.8347, type: 'POPULAR' },
  { _id: 'pop3', label: 'CST Station', address: 'Fort, Mumbai', latitude: 18.9398, longitude: 72.8355, type: 'POPULAR' },
  { _id: 'pop4', label: 'Andheri Station', address: 'Andheri West, Mumbai', latitude: 19.1197, longitude: 72.8464, type: 'POPULAR' },
  { _id: 'pop5', label: 'BKC', address: 'Bandra Kurla Complex, Mumbai', latitude: 19.0653, longitude: 72.8687, type: 'POPULAR' },
];



export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentLocations, setRecentLocations] = useState<any[]>([]);
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch user saved locations
      const locationsResponse = await axios.get(`${API_URL}/api/v1/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedLocations(locationsResponse.data);

      // Fetch recent rides to show as recent locations
      const ridesResponse = await axios.get(`${API_URL}/api/v1/rides/history?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentLocations(ridesResponse.data);

    } catch (error) {
      console.error('Load locations error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();

    // Search in saved, popular, and recent ride destinations
    const savedFiltered = savedLocations.filter(loc =>
      loc.label.toLowerCase().includes(query) || loc.address.toLowerCase().includes(query)
    );

    const popularFiltered = POPULAR_LOCATIONS.filter(loc =>
      loc.label.toLowerCase().includes(query) || loc.address.toLowerCase().includes(query)
    );

    const recentFiltered = recentLocations
      .filter(ride => ride.to.label?.toLowerCase().includes(query) || ride.to.address?.toLowerCase().includes(query))
      .map(ride => ({
        _id: ride._id,
        label: ride.to.label || ride.to.address,
        address: ride.to.address,
        latitude: ride.to.latitude,
        longitude: ride.to.longitude,
        type: 'RECENT'
      }));

    // Combine and remove duplicates based on address
    const combined = [...savedFiltered, ...popularFiltered, ...recentFiltered];
    const unique = combined.filter((v, i, a) => a.findIndex(t => t.address === v.address) === i);

    setSearchResults(unique);
  }, [searchQuery, savedLocations, recentLocations]);

  const handleSelectLocation = (location: any) => {
    router.push({
      pathname: '/plan-ride',
      params: {
        destLat: location.latitude,
        destLng: location.longitude,
        destLabel: location.label || location.name,
        destAddress: location.address
      }
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Destination</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Where do you want to go?"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
          placeholderTextColor={Colors.text.secondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Location */}
        <TouchableOpacity style={styles.currentLocationCard}>
          <View style={styles.currentLocationIcon}>
            <Ionicons name="navigate" size={24} color={Colors.text.inverse} />
          </View>
          <Text style={styles.currentLocationText}>Use current location</Text>
        </TouchableOpacity>

        {/* Peak Hour Alert */}
        <View style={styles.alertCard}>
          <Ionicons name="warning" size={20} color={Colors.warning} />
          <Text style={styles.alertText}>
            Peak hours (5-7 PM). Expect higher prices and longer wait times.
          </Text>
        </View>

        {/* Recent Searches */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.main} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* Search Results */}
            {searchQuery.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Results</Text>
                {searchResults.length > 0 ? searchResults.map((location) => (
                  <TouchableOpacity
                    key={location._id || location.address}
                    style={styles.locationCard}
                    onPress={() => handleSelectLocation(location)}
                  >
                    <RoundIcon
                      icon={
                        <Ionicons
                          name={location.type === 'HOME' ? 'home' : location.type === 'OFFICE' ? 'briefcase' : 'location'}
                          size={24}
                          color={Colors.primary.main}
                        />
                      }
                      backgroundColor={Colors.primary.subtle}
                      size={48}
                    />
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{location.label}</Text>
                      <Text style={styles.locationSubtext}>{location.address}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
                  </TouchableOpacity>
                )) : (
                  <View style={styles.noResults}>
                    <Text style={styles.noResultsText}>No matches found</Text>
                  </View>
                )}
              </View>
            ) : (
              <>
                {/* Saved Locations */}
                {savedLocations.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Saved Locations</Text>
                    {savedLocations.map((location) => (
                      <TouchableOpacity
                        key={location._id}
                        style={styles.locationCard}
                        onPress={() => handleSelectLocation(location)}
                      >
                        <RoundIcon
                          icon={
                            <Ionicons
                              name={location.type === 'HOME' ? 'home' : location.type === 'OFFICE' ? 'briefcase' : 'location'}
                              size={24}
                              color={Colors.primary.main}
                            />
                          }
                          backgroundColor={Colors.primary.subtle}
                          size={48}
                        />
                        <View style={styles.locationInfo}>
                          <Text style={styles.locationName}>{location.label}</Text>
                          <Text style={styles.locationSubtext}>{location.address}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Recent Rides */}
                {recentLocations.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent</Text>
                    {recentLocations.slice(0, 3).map((ride) => (
                      <TouchableOpacity
                        key={ride._id}
                        style={styles.locationCard}
                        onPress={() => handleSelectLocation({
                          latitude: ride.to.latitude,
                          longitude: ride.to.longitude,
                          label: ride.to.label || ride.to.address,
                          address: ride.to.address
                        })}
                      >
                        <RoundIcon
                          icon={<Ionicons name="time-outline" size={24} color={Colors.text.secondary} />}
                          backgroundColor={Colors.neutral[100]}
                          size={48}
                        />
                        <View style={styles.locationInfo}>
                          <Text style={styles.locationName}>{ride.to.label || ride.to.address}</Text>
                          <Text style={styles.locationSubtext}>From {ride.from.label || ride.from.address}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Empty State */}
                {savedLocations.length === 0 && recentLocations.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={64} color={Colors.neutral[200]} />
                    <Text style={styles.emptyTitle}>No locations yet</Text>
                    <Text style={styles.emptySubtext}>
                      Start by adding your favorite locations or booking your first ride
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyButton}
                      onPress={() => router.push('/location-setup')}
                    >
                      <Text style={styles.emptyButtonText}>Add Location</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary.light,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
    marginTop: 16,
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.main,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surge.low,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  locationSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 24,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  noResults: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
});
