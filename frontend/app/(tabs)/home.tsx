import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../constants/Config';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// RefreshControl is already imported from react-native above line 9

const Colors = {
  primary: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    subtle: '#DBEAFE',
  },
  secondary: {
    teal: '#10B981',
    orange: '#F97316',
    purple: '#8B5CF6',
  },
  neutral: {
    100: '#F3F4F6',
    200: '#E5E7EB',
  },
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    inverse: '#FFFFFF',
  },
  background: {
    card: '#FFFFFF',
    secondary: '#F9FAFB',
  },
  surge: {
    none: '#10B981',
    low: '#FED7AA',
    medium: '#F97316',
    high: '#DC2626',
  },
  warning: '#F59E0B',
  error: '#EF4444',
};

// Inline PillBadge component
const PillBadge = ({ label, variant }: { label: string; variant: string }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'surge-none':
        return { backgroundColor: Colors.surge.none, color: Colors.text.inverse };
      case 'surge-low':
        return { backgroundColor: Colors.surge.low, color: Colors.text.primary };
      case 'surge-medium':
        return { backgroundColor: Colors.surge.medium, color: Colors.text.inverse };
      case 'surge-high':
        return { backgroundColor: Colors.surge.high, color: Colors.text.inverse };
      default:
        return { backgroundColor: Colors.primary.main, color: Colors.text.inverse };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[styles.pill, { backgroundColor: variantStyles.backgroundColor }]}>
      <Text style={[styles.pillText, { color: variantStyles.color }]}>{label}</Text>
    </View>
  );
};

// Inline RoundIcon component
const RoundIcon = ({ icon, backgroundColor, size = 48 }: { icon: React.ReactNode; backgroundColor: string; size?: number }) => {
  return (
    <View style={[styles.roundIcon, { backgroundColor, width: size, height: size, borderRadius: size / 2 }]}>
      {icon}
    </View>
  );
};



type RideType = 'car' | 'rickshaw' | 'bike';

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth(); // Get signOut from context
  const [user, setUser] = useState<any>(null);
  const [selectedRideType, setSelectedRideType] = useState<RideType>('car');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [surgeData, setSurgeData] = useState([
    { time: 'Now', multiplier: 1.3, type: 'surge' },
    { time: '15m', multiplier: 1.2, type: 'surge' },
    { time: '30m', multiplier: 0, type: 'none' },
    { time: '45m', multiplier: 0, type: 'none' },
    { time: '1h', multiplier: 1.1, type: 'surge' },
  ]);
  const [stats, setStats] = useState({ totalSaved: 0 });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      console.log('No auth token found');
      setLoading(false);
      return;
    }

    // 1. Critical: Fetch User Profile
    try {
      const userResponse = await axios.get(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(userResponse.data);
    } catch (error: any) {
      console.error('Critical: Failed to load user profile:', error.message);
      // Only sign out if the USER endpoint fails with 401 (Unauthorized) or 404 (User Not Found)
      if (error.response?.status === 401 || error.response?.status === 404) {
        console.log('Session invalid, signing out...');
        await signOut();
        return; // Stop execution
      }
      // If server error (500), just stop loading but don't sign out yet
      setLoading(false);
      return;
    }

    // 2. Auxiliary: Fetch Data (Locations, Recommendations, Insights)
    // These failures should NOT log the user out.
    try {
      // Fetch user locations
      try {
        const locationsResponse = await axios.get(`${API_URL}/api/v1/locations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLocations(locationsResponse.data);
      } catch (e) {
        console.log('Failed to load locations (non-critical)');
        setLocations([]);
      }

      // Fetch recommendations
      try {
        const recommendationsResponse = await axios.get(`${API_URL}/api/v1/recommendations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecommendations(recommendationsResponse.data);
      } catch (e) {
        console.log('Failed to load recommendations (non-critical)');
        setRecommendations([]);
      }

      // Fetch insights for savings
      try {
        const insightsResponse = await axios.get(`${API_URL}/api/v1/insights/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const totalSavedValue = insightsResponse.data.stats?.totalSaved ?? insightsResponse.data.totalSaved ?? 0;
        setStats({ totalSaved: totalSavedValue });
      } catch (e) {
        console.log('Failed to load insights (non-critical)');
      }

      // Fetch surge forecast
      try {
        const surgeResponse = await axios.get(`${API_URL}/api/v1/surge/forecast`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (surgeResponse.data.forecast) {
          setSurgeData(surgeResponse.data.forecast);
        }
      } catch (e) {
        console.log('Failed to load surge forecast (non-critical)');
      }

    } catch (error: any) {
      console.error('Auxiliary data load error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getSurgeVariant = (multiplier: number) => {
    if (multiplier === 0) return 'surge-none';
    if (multiplier < 1.2) return 'surge-low';
    if (multiplier < 1.5) return 'surge-medium';
    return 'surge-high';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.main}
          />
        }
      >
        {/* Header with User Greeting */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'V'}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>Hello {user?.name || 'Vishal'},</Text>
              <Text style={styles.subtitle}>Where to go?</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text.primary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color={Colors.text.secondary} />
          <Text style={styles.searchPlaceholder}>Enter destination</Text>
          <View style={styles.searchActions}>
            <TouchableOpacity style={styles.locationButton}>
              <Ionicons name="locate" size={18} color={Colors.text.inverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendButton}>
              <Ionicons name="paper-plane-outline" size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Ride Type Selector */}
        <View style={styles.rideTypeContainer}>
          <TouchableOpacity
            style={[
              styles.rideTypeCard,
              selectedRideType === 'car' && styles.rideTypeCardActive,
            ]}
            onPress={() => setSelectedRideType('car')}
          >
            {selectedRideType === 'car' && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />
              </View>
            )}
            <Ionicons
              name="car-outline"
              size={32}
              color={selectedRideType === 'car' ? Colors.text.inverse : Colors.text.secondary}
            />
            <Text
              style={[
                styles.rideTypeText,
                selectedRideType === 'car' && styles.rideTypeTextActive,
              ]}
            >
              Car
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rideTypeCard,
              selectedRideType === 'rickshaw' && styles.rideTypeCardActive,
            ]}
            onPress={() => setSelectedRideType('rickshaw')}
          >
            {selectedRideType === 'rickshaw' && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />
              </View>
            )}
            <MaterialCommunityIcons
              name="rickshaw"
              size={32}
              color={selectedRideType === 'rickshaw' ? Colors.text.inverse : Colors.text.secondary}
            />
            <Text
              style={[
                styles.rideTypeText,
                selectedRideType === 'rickshaw' && styles.rideTypeTextActive,
              ]}
            >
              Rickshaw
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rideTypeCard,
              selectedRideType === 'bike' && styles.rideTypeCardActive,
            ]}
            onPress={() => setSelectedRideType('bike')}
          >
            {selectedRideType === 'bike' && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />
              </View>
            )}
            <Ionicons
              name="bicycle"
              size={32}
              color={selectedRideType === 'bike' ? Colors.text.inverse : Colors.text.secondary}
            />
            <Text
              style={[
                styles.rideTypeText,
                selectedRideType === 'bike' && styles.rideTypeTextActive,
              ]}
            >
              Bike
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/search')}
            >
              <RoundIcon
                icon={<Ionicons name="search" size={24} color={Colors.primary.main} />}
                backgroundColor={Colors.primary.subtle}
              />
              <Text style={styles.actionLabel}>Plan Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/surge-radar')}
            >
              <RoundIcon
                icon={<Ionicons name="map" size={24} color="#10B981" />}
                backgroundColor="#D1FAE5"
              />
              <Text style={styles.actionLabel}>Radar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/locations-manager')}
            >
              <RoundIcon
                icon={<Ionicons name="location" size={24} color="#F59E0B" />}
                backgroundColor="#FEF3C7"
              />
              <Text style={styles.actionLabel}>My Places</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/ride-tracking')}
            >
              <RoundIcon
                icon={<Ionicons name="time" size={24} color="#6366F1" />}
                backgroundColor="#E0E7FF"
              />
              <Text style={styles.actionLabel}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HailO Brain - Smart Recommendation */}
        {recommendations.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb" size={20} color={Colors.primary.main} />
              <Text style={styles.sectionTitle}>HailO Brain</Text>
              <Text style={styles.sectionSubtitle}>Smart recommendation</Text>
            </View>

            <View style={styles.brainCard}>
              <View style={styles.brainCardHeader}>
                <View style={styles.brainLocationInfo}>
                  <Ionicons name={recommendations[0].icon || "bulb"} size={24} color={Colors.primary.main} />
                  <View style={styles.brainTextInfo}>
                    <Text style={styles.brainTitle}>{recommendations[0].title}</Text>
                    <Text style={styles.brainSubtext}>{recommendations[0].description}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.brainAdvice}>
                <Ionicons name="information-circle" size={16} color={Colors.text.secondary} />
                <Text style={styles.brainAdviceText}>
                  {recommendations[0].description}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.emptyRecommendation}>
              <Ionicons name="bulb-outline" size={48} color={Colors.neutral[200]} />
              <Text style={styles.emptyTitle}>No Recommendations Yet</Text>
              <Text style={styles.emptySubtitle}>
                Complete a few rides to get personalized suggestions
              </Text>
            </View>
          </View>
        )}

        {/* Surge Radar */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={20} color={Colors.secondary.orange} />
              <Text style={styles.sectionTitle}>Surge Radar</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAllLink}>View all &gt;</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.surgeScroll}
          >
            {surgeData.map((item, index) => (
              <View key={index} style={styles.surgePill}>
                <PillBadge
                  label={item.multiplier === 0 ? 'No surge' : `${item.multiplier}x`}
                  variant={getSurgeVariant(item.multiplier)}
                />
                <Text style={styles.surgeTime}>{item.time}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Quick Book */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Book</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading locations...</Text>
            </View>
          ) : locations.length > 0 ? (
            locations.slice(0, 2).map((location) => (
              <TouchableOpacity key={location._id} style={styles.quickBookCard}>
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
                <View style={styles.quickBookInfo}>
                  <Text style={styles.quickBookTitle}>{location.label}</Text>
                  <Text style={styles.quickBookSubtext}>{location.address}</Text>
                </View>
                <View style={styles.quickBookRight}>
                  <Text style={styles.quickBookPrice}>~₹120</Text>
                  <Text style={styles.quickBookTime}>18 min</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              style={styles.quickBookCard}
              onPress={() => router.push('/location-setup')}
            >
              <RoundIcon
                icon={<Ionicons name="add" size={24} color={Colors.primary.main} />}
                backgroundColor={Colors.primary.subtle}
                size={48}
              />
              <View style={styles.quickBookInfo}>
                <Text style={styles.quickBookTitle}>Add Location</Text>
                <Text style={styles.quickBookSubtext}>Save your frequently visited places</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* This Month - Savings */}
        <TouchableOpacity
          style={styles.savingsCard}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <View style={styles.savingsIcon}>
            <Ionicons name="trending-down" size={24} color={Colors.text.inverse} />
          </View>
          <View style={styles.savingsInfo}>
            <Text style={styles.savingsTitle}>This Month</Text>
            <Text style={styles.savingsSubtext}>
              You saved ₹{stats.totalSaved} with HailO
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.inverse} />
        </TouchableOpacity>

        {/* Pricing Factors - Show only informational for now */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart" size={20} color={Colors.primary.main} />
              <Text style={styles.sectionTitle}>Pricing Insights</Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={Colors.primary.main} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Real-Time Pricing</Text>
              <Text style={styles.infoSubtext}>
                We analyze weather, traffic, and demand to help you find the best time to book
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary.main,
  },

  // Search Bar Styles
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.light,
    gap: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  searchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  locationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Ride Type Selector
  rideTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  rideTypeCard: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },

  // Quick Grid Styles
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  actionCard: {
    width: '22%', // Roughly 4 items per row
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  rideTypeCardActive: {
    backgroundColor: Colors.primary.dark,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rideTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  rideTypeTextActive: {
    color: Colors.text.inverse,
  },

  // Section Styles
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  viewAllLink: {
    fontSize: 14,
    color: Colors.primary.main,
    fontWeight: '600',
  },

  // HailO Brain Card
  brainCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  brainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brainLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  brainTextInfo: {
    flex: 1,
  },
  brainTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  brainSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  brainPriceInfo: {
    alignItems: 'flex-end',
  },
  brainSavings: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary.teal,
  },
  brainPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 2,
  },
  bookNowButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bookNowText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  brainAdvice: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.neutral[100],
    padding: 12,
    borderRadius: 8,
  },
  brainAdviceText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
  },

  // Surge Radar
  surgeScroll: {
    gap: 12,
    paddingVertical: 8,
  },
  surgePill: {
    alignItems: 'center',
    gap: 8,
  },
  surgeTime: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },

  // Quick Book Cards
  quickBookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  quickBookInfo: {
    flex: 1,
  },
  quickBookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  quickBookSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  quickBookRight: {
    alignItems: 'flex-end',
  },
  quickBookPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  quickBookTime: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },

  // Savings Card
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary.purple,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  savingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingsInfo: {
    flex: 1,
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  savingsSubtext: {
    fontSize: 14,
    color: Colors.text.inverse,
    opacity: 0.9,
    marginTop: 2,
  },

  // Pricing Factors
  factorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  factorInfo: {
    flex: 1,
  },
  factorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  factorSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  factorBadge: {
    backgroundColor: Colors.surge.low,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  factorPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Pill Badge Styles
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Round Icon Styles
  roundIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty States
  emptyRecommendation: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.subtle,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
