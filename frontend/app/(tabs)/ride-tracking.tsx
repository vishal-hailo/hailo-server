import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_URL } from '../../constants/Config';
import Colors from '../../constants/Colors';

// Only import MapView on native platforms
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const MapModule = require('react-native-maps');
  MapView = MapModule.default;
  Marker = MapModule.Marker;
  PROVIDER_GOOGLE = MapModule.PROVIDER_GOOGLE;
}

const { width } = Dimensions.get('window');


export default function RideTrackingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [region, setRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    loadActiveRide();

    // Connect to WebSocket
    const newSocket = io(API_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (activeRide && socket) {
      const transactionId = activeRide.transactionId || activeRide.id; // Fallback

      console.log('Listening for updates on:', `status_update_${transactionId}`);

      socket.on(`status_update_${transactionId}`, (data: any) => {
        console.log('Received Status Update:', data);

        // Navigate to Analytics if completed
        if (data.state === 'COMPLETED') {
          console.log('Ride Completed! Navigating to Analytics...');
          // Add a small delay for user to see "Completed" state if desired, or go immediately
          setTimeout(() => {
            router.replace({
              pathname: '/ride-analytics',
              params: { transactionId }
            });
          }, 1000);
          return;
        }

        setActiveRide((prev: any) => {
          // Update status
          const updated = { ...prev };
          if (data.state) updated.status = data.state;

          // Update driver location (if available)
          if (data.location) {
            updated.driverLocation = data.location;
          }
          return updated;
        });
      });

      // Also trigger a status check immediately
      statusCheck(transactionId);
    }
  }, [activeRide, socket]);

  const statusCheck = async (transactionId: string) => {
    try {
      await axios.post(`${API_URL}/ondc/status`, { transactionId });
    } catch (err) {
      console.error("Status check failed", err);
    }
  };

  const loadActiveRide = async () => {
    try {
      setLoading(true);
      // ... existing load logic
      // For Demo: If no upcoming ride API, maybe we check local storage or context?
      // Since specific API for active ride might not be ready, let's grab from props or context if passed.
      // But adhering to file:

      const token = await AsyncStorage.getItem('authToken');
      if (!token) { setLoading(false); return; }

      // We need to fetch the Transaction details actually, not just 'rides'.
      // But for now assuming /api/v1/rides/upcoming returns the ONDC transaction format we need.

      // ... existing fetch ...
      const response = await axios.get(`${API_URL}/api/v1/rides/upcoming`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // ...
    } catch (error) {
      console.error('Load active ride error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Loading ride details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeRide) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ride Tracking</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={80} color={Colors.neutral[200]} />
          <Text style={styles.emptyTitle}>No Active Ride</Text>
          <Text style={styles.emptySubtitle}>
            You don't have any rides in progress. Schedule a ride to track it here.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/explorer')}
          >
            <Text style={styles.emptyButtonText}>Schedule a Ride</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, {
            backgroundColor: activeRide.status === 'IN_PROGRESS' ? '#10B981' : '#F59E0B'
          }]} />
          <Text style={styles.statusText}>
            {activeRide.status === 'IN_PROGRESS' ? 'On the way' : 'Waiting for driver'}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Route Info Card */}
      <View style={styles.routeCard}>
        <View style={styles.routeItem}>
          <View style={[styles.routeDot, { backgroundColor: Colors.primary.main }]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Pickup</Text>
            <Text style={styles.routeText}>
              {activeRide.from.label || activeRide.from.address}
            </Text>
          </View>
        </View>

        <View style={styles.routeItem}>
          <View style={[styles.routeDot, { backgroundColor: Colors.secondary.teal }]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Drop-off</Text>
            <Text style={styles.routeText}>
              {activeRide.to.label || activeRide.to.address}
            </Text>
          </View>
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          // Web fallback - show a nice map placeholder
          <View style={styles.webMapPlaceholder}>
            <View style={styles.mapPlaceholderContent}>
              <Ionicons name="map" size={64} color={Colors.primary.main} />
              <Text style={styles.mapPlaceholderTitle}>Map View</Text>
              <Text style={styles.mapPlaceholderText}>
                Open this on mobile to see the live map
              </Text>
              <View style={styles.routePreview}>
                <View style={styles.routePreviewItem}>
                  <View style={[styles.routePreviewDot, { backgroundColor: Colors.primary.main }]} />
                  <Text style={styles.routePreviewText}>
                    {activeRide.from.label || activeRide.from.address}
                  </Text>
                </View>
                <Ionicons name="arrow-down" size={20} color={Colors.text.secondary} />
                <View style={styles.routePreviewItem}>
                  <View style={[styles.routePreviewDot, { backgroundColor: Colors.secondary.teal }]} />
                  <Text style={styles.routePreviewText}>
                    {activeRide.to.label || activeRide.to.address}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          // Native platforms - show real map
          MapView && (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={region}
              showsUserLocation
              showsMyLocationButton
              showsTraffic
            >
              {/* Pickup Marker */}
              {activeRide.from.latitude && activeRide.from.longitude && Marker && (
                <Marker
                  coordinate={{
                    latitude: activeRide.from.latitude,
                    longitude: activeRide.from.longitude,
                  }}
                  title="Pickup"
                  description={activeRide.from.address}
                  pinColor={Colors.primary.main}
                />
              )}

              {/* Drop-off Marker */}
              {activeRide.to.latitude && activeRide.to.longitude && Marker && (
                <Marker
                  coordinate={{
                    latitude: activeRide.to.latitude,
                    longitude: activeRide.to.longitude,
                  }}
                  title="Drop-off"
                  description={activeRide.to.address}
                  pinColor={Colors.secondary.teal}
                />
              )}

              {/* Live Driver Marker */}
              {activeRide.driverLocation && Marker && (
                <Marker
                  coordinate={{
                    latitude: activeRide.driverLocation.latitude,
                    longitude: activeRide.driverLocation.longitude
                  }}
                  title="Your Ride"
                  description="Driver is on the way"
                >
                  <View style={{ backgroundColor: 'white', borderRadius: 15, padding: 5, elevation: 5 }}>
                    <Ionicons name="car" size={20} color="black" />
                  </View>
                </Marker>
              )}
            </MapView>
          )
        )}

        {/* Floating Car Icon */}
        <View style={styles.carIcon}>
          <Ionicons name="car-sport" size={32} color={Colors.text.inverse} />
        </View>
      </View>

      {/* Ride Info Card */}
      <View style={styles.rideInfoCard}>
        <View style={styles.rideTimeRow}>
          <View style={styles.rideTimeItem}>
            <Text style={styles.rideTimeLabel}>Scheduled Time</Text>
            <Text style={styles.rideTimeValue}>
              {new Date(activeRide.scheduledTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {activeRide.duration && (
            <View style={styles.rideTimeItem}>
              <Text style={styles.rideTimeLabel}>Duration</Text>
              <Text style={styles.rideTimeValue}>{activeRide.duration} min</Text>
            </View>
          )}

          {activeRide.estimatedPrice && (
            <View style={styles.rideTimeItem}>
              <Text style={styles.rideTimeLabel}>Estimated Price</Text>
              <Text style={styles.rideTimeValue}>₹{activeRide.estimatedPrice}</Text>
            </View>
          )}
        </View>

        {/* Driver Info (if available) */}
        {activeRide.driver ? (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>
                {activeRide.driver.name?.charAt(0) || 'D'}
              </Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{activeRide.driver.name}</Text>
              <Text style={styles.driverVehicle}>{activeRide.driver.vehicle}</Text>
              <Text style={styles.driverPlate}>{activeRide.driver.plateNumber}</Text>
            </View>
            {activeRide.driver.rating && (
              <View style={styles.driverRating}>
                <Ionicons name="star" size={16} color="#10B981" />
                <Text style={styles.driverRatingText}>{activeRide.driver.rating}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.waitingCard}>
            <Ionicons name="time-outline" size={24} color={Colors.primary.main} />
            <Text style={styles.waitingText}>Waiting for driver assignment...</Text>
          </View>
        )}

        {/* Action Buttons */}
        {activeRide.driver && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call" size={24} color={Colors.text.inverse} />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
              <Ionicons name="chatbubble" size={24} color={Colors.text.primary} />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Safety Center */}
      <TouchableOpacity style={styles.safetyButton}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#EF4444" />
        <Text style={styles.safetyText}>Safety Center</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },

  // Loading
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

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 24,
    textAlign: 'center',
  },
  emptySubtitle: {
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
    marginTop: 32,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Route Card
  routeCard: {
    backgroundColor: Colors.background.card,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Map
  mapContainer: {
    flex: 1,
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  webMapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.primary.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderContent: {
    alignItems: 'center',
    padding: 32,
  },
  mapPlaceholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  routePreview: {
    marginTop: 24,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    minWidth: 200,
  },
  routePreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routePreviewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routePreviewText: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },
  carIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Ride Info
  rideInfoCard: {
    backgroundColor: Colors.background.card,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  rideTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  rideTimeItem: {
    alignItems: 'center',
  },
  rideTimeLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  rideTimeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  // Driver Card
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  driverVehicle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  driverPlate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 2,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  driverRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Waiting Card
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.primary.subtle,
    borderRadius: 12,
  },
  waitingText: {
    fontSize: 14,
    color: Colors.text.primary,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary.main,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonSecondary: {
    backgroundColor: Colors.background.secondary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  actionButtonTextSecondary: {
    color: Colors.text.primary,
  },

  // Safety
  safetyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  safetyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
