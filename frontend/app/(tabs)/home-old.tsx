import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Animated,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

// API_URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadData();
    startPulseAnimation();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadData = async () => {
    try {
      setError(null);
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }

      // Load user's saved locations
      const token = await AsyncStorage.getItem('authToken');
      const locationsResponse = await axios.get(`${API_URL}/api/v1/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userLocations = locationsResponse.data || [];
      setLocations(userLocations);

      if (userLocations.length === 0) {
        setLoading(false);
        return;
      }

      // Generate common routes from saved locations
      await generateRoutes(userLocations);

    } catch (error: any) {
      console.error('Load error:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        await AsyncStorage.clear();
        router.replace('/auth/phone');
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network')) {
        setError('No internet connection. Pull to refresh when online.');
      } else {
        setError('Failed to load data. Pull to refresh to try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateRoutes = async (userLocations: any[]) => {
    const token = await AsyncStorage.getItem('authToken');
    const generatedRoutes = [];

    // Find Home and Office locations
    const homeLocation = userLocations.find(loc => loc.type === 'HOME');
    const officeLocation = userLocations.find(loc => loc.type === 'OFFICE');

    // If both Home and Office exist, create bidirectional routes
    if (homeLocation && officeLocation) {
      // Home to Office
      try {
        const toWorkResponse = await axios.post(
          `${API_URL}/api/v1/commute/search`,
          {
            mode: 'EXPLORER',
            origin: { latitude: homeLocation.latitude, longitude: homeLocation.longitude },
            destination: { latitude: officeLocation.latitude, longitude: officeLocation.longitude },
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        generatedRoutes.push({
          id: 'home-to-office',
          title: 'Go to Work',
          from: homeLocation,
          to: officeLocation,
          estimate: toWorkResponse.data,
          icon: 'briefcase',
        });
      } catch (error) {
        console.error('Load home-to-office estimate error:', error);
      }

      // Office to Home
      try {
        const toHomeResponse = await axios.post(
          `${API_URL}/api/v1/commute/search`,
          {
            mode: 'EXPLORER',
            origin: { latitude: officeLocation.latitude, longitude: officeLocation.longitude },
            destination: { latitude: homeLocation.latitude, longitude: homeLocation.longitude },
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        generatedRoutes.push({
          id: 'office-to-home',
          title: 'Go Home',
          from: officeLocation,
          to: homeLocation,
          estimate: toHomeResponse.data,
          icon: 'home',
        });
      } catch (error) {
        console.error('Load office-to-home estimate error:', error);
      }
    }

    // Add other common routes (first 3 OTHER locations)
    const otherLocations = userLocations.filter(loc => loc.type === 'OTHER').slice(0, 3);
    if (homeLocation) {
      for (const otherLoc of otherLocations) {
        try {
          const response = await axios.post(
            `${API_URL}/api/v1/commute/search`,
            {
              mode: 'EXPLORER',
              origin: { latitude: homeLocation.latitude, longitude: homeLocation.longitude },
              destination: { latitude: otherLoc.latitude, longitude: otherLoc.longitude },
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          generatedRoutes.push({
            id: `home-to-${otherLoc.id}`,
            title: `To ${otherLoc.label}`,
            from: homeLocation,
            to: otherLoc,
            estimate: response.data,
            icon: 'location',
          });
        } catch (error) {
          console.error(`Load route to ${otherLoc.label} error:`, error);
        }
      }
    }

    setRoutes(generatedRoutes);
  };

  const handleSmartBook = async (estimate: any) => {
    if (!estimate) return;

    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.post(
        `${API_URL}/api/v1/commute/handoff`,
        { commuteLogId: estimate.commuteLogId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const supported = await Linking.canOpenURL(estimate.deepLinkUrl);
      if (supported) {
        await Linking.openURL(estimate.deepLinkUrl);
      } else {
        Alert.alert('Error', 'Cannot open Uber app. Please install Uber.');
      }
    } catch (error) {
      console.error('Smart book error:', error);
      Alert.alert('Error', 'Failed to open Uber. Please try again.');
    }
  };

  const handleViewSurgeRadar = (route: any) => {
    router.push({
      pathname: '/surge-radar',
      params: {
        originLat: route.from.latitude,
        originLng: route.from.longitude,
        destLat: route.to.latitude,
        destLng: route.to.longitude,
        routeName: `${route.from.label} → ${route.to.label}`,
      },
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getSurgeEmoji = (surgePercent?: number) => {
    if (!surgePercent || surgePercent < 5) return '🟢';
    if (surgePercent < 15) return '🟡';
    return '🔴';
  };

  // Empty state when no locations
  if (!loading && locations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.emptyContainer}>
          <Ionicons name= "location-outline" size={80} color="#6B7280" />
          <Text style={styles.emptyTitle}>No Locations Added</Text>
          <Text style={styles.emptyText}>
            Add your frequently visited places to get smart commute estimates and surge alerts
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/locations-manager')}
          >
            <Text style={styles.primaryButtonText}>Add Locations</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
      >
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name || 'there'}! ☀️
            </Text>
            <Text style={styles.time}>
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/locations-manager')}>
            <Ionicons name="settings-outline" size={28} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Dynamic Route Cards */}
        {routes.map((route) => (
          <Animated.View key={route.id} style={[styles.cardWrapper, { transform: [{ scale: pulseAnim }] }]}>
            <View style={[styles.card, styles.pulsingCard]}>
              <View style={styles.liveDot} />
              <View style={styles.cardHeader}>
                <Ionicons name={route.icon} size={24} color="#FF6B35" />
                <Text style={styles.cardTitle}>{route.title}</Text>
              </View>
              <Text style={styles.route}>
                {route.from.label} → {route.to.label}
              </Text>
              {route.estimate ? (
                <>
                  <View style={styles.estimateRow}>
                    <Text style={styles.eta}>{route.estimate.etaMinutes} min</Text>
                    <Text style={styles.price}>
                      ₹{route.estimate.estimateMin} {getSurgeEmoji(route.estimate.surgePercent)}
                    </Text>
                  </View>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.primaryButtonSmall}
                      onPress={() => handleSmartBook(route.estimate)}
                    >
                      <Text style={styles.primaryButtonTextSmall}>🚀 Smart Book</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryButtonSmall}
                      onPress={() => handleViewSurgeRadar(route)}
                    >
                      <Text style={styles.secondaryButtonTextSmall}>Surge Radar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <Text style={styles.loadingText}>Loading...</Text>
              )}
            </View>
          </Animated.View>
        ))}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/explorer')}
          >
            <Ionicons name="search" size={24} color="#3B82F6" />
            <Text style={styles.quickActionText}>Explore Routes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/locations-manager')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#10B981" />
            <Text style={styles.quickActionText}>Add Location</Text>
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
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  time: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  cardWrapper: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  pulsingCard: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  liveDot: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  route: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eta: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButtonSmall: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  primaryButtonTextSmall: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonSmall: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  secondaryButtonTextSmall: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 8,
  },
});
