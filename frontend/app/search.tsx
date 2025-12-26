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
import Colors from '../constants/Colors';
import { PillBadge, RoundIcon } from '../components/shared/DesignSystemComponents';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [recentLocations, setRecentLocations] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          {recentLocations.map((location, index) => (
            <TouchableOpacity key={index} style={styles.locationCard}>
              <RoundIcon
                icon={<Ionicons name="time-outline" size={24} color={Colors.text.secondary} />}
                backgroundColor={Colors.neutral[100]}
                size={48}
              />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationSubtext}>{location.subtext}</Text>
                <View style={styles.locationMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color={Colors.text.secondary} />
                    <Text style={styles.metaText}>{location.distance}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
                    <Text style={styles.metaText}>{location.time}</Text>
                  </View>
                  <Text style={styles.priceText}>{location.price}</Text>
                  {location.surge > 0 && (
                    <PillBadge
                      label={`⚡ ${location.surge}x`}
                      variant={location.surge > 1.3 ? 'surge-high' : 'surge-medium'}
                    />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Destinations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          {popularDestinations.map((location, index) => (
            <TouchableOpacity key={index} style={styles.locationCard}>
              <RoundIcon
                icon={<Ionicons name="trending-up" size={24} color={Colors.primary.main} />}
                backgroundColor={Colors.primary.subtle}
                size={48}
              />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationSubtext}>{location.subtext}</Text>
                <View style={styles.locationMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color={Colors.text.secondary} />
                    <Text style={styles.metaText}>{location.distance}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
                    <Text style={styles.metaText}>{location.time}</Text>
                  </View>
                  <Text style={styles.priceText}>{location.price}</Text>
                  {location.surge > 0 && (
                    <PillBadge
                      label={`⚡ ${location.surge}x`}
                      variant={location.surge > 1.2 ? 'surge-medium' : 'surge-low'}
                    />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

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
});
