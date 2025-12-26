import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function RideTrackingScreen() {
  const router = useRouter();
  const [rideStatus, setRideStatus] = useState('arriving'); // arriving, onboard, completed

  // Mock ride data
  const rideData = {
    driver: {
      name: 'Rajesh Kumar',
      rating: 4.8,
      vehicle: 'White Swift Dzire',
      plateNumber: 'KA 05 MN 1234',
      phone: '+91 98765 43210',
    },
    pickup: 'Indiranagar, Bangalore',
    dropoff: 'Phoenix Mall, Whitefield',
    eta: 3,
    distance: '0.8 km away',
    rideDuration: '25 min',
    price: '₹185',
    rideType: 'Uber',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Driver arriving</Text>
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
            <Text style={styles.routeText}>{rideData.pickup}</Text>
          </View>
        </View>
        
        <View style={styles.routeItem}>
          <View style={[styles.routeDot, { backgroundColor: Colors.secondary.teal }]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Drop-off</Text>
            <Text style={styles.routeText}>{rideData.dropoff}</Text>
          </View>
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={80} color={Colors.neutral[300]} />
          <Text style={styles.mapPlaceholderText}>Map View</Text>
        </View>
        
        {/* Floating Car Icon */}
        <View style={styles.carIcon}>
          <Ionicons name="car-sport" size={32} color={Colors.text.inverse} />
        </View>
      </View>

      {/* ETA Info */}
      <View style={styles.etaContainer}>
        <View style={styles.etaLeft}>
          <Text style={styles.etaLabel}>Arriving in</Text>
          <Text style={styles.etaValue}>{rideData.eta} min</Text>
        </View>
        <View style={styles.etaRight}>
          <Text style={styles.distanceLabel}>Distance</Text>
          <Text style={styles.distanceValue}>{rideData.distance}</Text>
        </View>
      </View>

      {/* Driver Info Card */}
      <View style={styles.driverCard}>
        <View style={styles.driverHeader}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>{rideData.driver.name.charAt(0)}</Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{rideData.driver.name}</Text>
            <Text style={styles.driverVehicle}>{rideData.driver.vehicle}</Text>
            <Text style={styles.driverPlate}>{rideData.driver.plateNumber}</Text>
          </View>
          <View style={styles.driverRating}>
            <Ionicons name="star" size={16} color="#10B981" />
            <Text style={styles.driverRatingText}>{rideData.driver.rating}</Text>
          </View>
        </View>
        
        <View style={styles.driverActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="call" size={24} color={Colors.text.inverse} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIconContainer, { backgroundColor: Colors.neutral[200] }]}>
              <Ionicons name="chatbubble" size={24} color={Colors.text.primary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ride Details */}
      <View style={styles.rideDetails}>
        <View style={styles.rideDetailItem}>
          <View style={styles.rideTypeContainer}>
            <View style={styles.rideTypeBadge}>
              <Text style={styles.rideTypeText}>{rideData.rideType}</Text>
            </View>
            <Text style={styles.rideTypeLabel}>UberGo</Text>
          </View>
          <View style={styles.rideDuration}>
            <Ionicons name="time-outline" size={18} color={Colors.text.secondary} />
            <Text style={styles.rideDurationText}>{rideData.rideDuration} ride</Text>
          </View>
          <Text style={styles.ridePrice}>{rideData.price}</Text>
        </View>
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
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
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  carIcon: {
    position: 'absolute',
    bottom: '40%',
    left: '50%',
    marginLeft: -30,
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

  // ETA
  etaContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background.card,
    marginTop: 16,
  },
  etaLeft: {
    flex: 1,
  },
  etaLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  etaValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  etaRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  distanceLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Driver Card
  driverCard: {
    backgroundColor: '#EEF2FF',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    backgroundColor: Colors.background.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  driverRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  actionIconContainer: {
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  // Ride Details
  rideDetails: {
    backgroundColor: Colors.background.card,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
  },
  rideDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rideTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rideTypeBadge: {
    backgroundColor: Colors.text.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rideTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  rideTypeLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  rideDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rideDurationText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  ridePrice: {
    fontSize: 20,
    fontWeight: '700',
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