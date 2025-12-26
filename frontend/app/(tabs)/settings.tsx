import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{name?: string; phone?: string} | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview');

  const [stats, setStats] = useState({
    totalRides: 0,
    distance: 0,
    timeSaved: 0,
    avgRating: 0,
    totalSaved: 0,
    percentageChange: {
      rides: 0,
      distance: 0,
      time: 0,
      rating: 0,
    }
  });
  const [savingsBreakdown, setSavingsBreakdown] = useState([]);
  const [topRoutes, setTopRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      
      // Fetch user profile
      const userResponse = await axios.get(`${API_URL}/api/v1/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(userResponse.data);
      
      // Fetch insights
      const insightsResponse = await axios.get(`${API_URL}/api/v1/insights/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const insightsData = insightsResponse.data;
      setStats({
        totalRides: insightsData.stats.totalRides || 0,
        distance: insightsData.stats.totalDistance || 0,
        timeSaved: insightsData.stats.timeSaved || 0,
        avgRating: insightsData.stats.rating || 4.9,
        totalSaved: insightsData.stats.totalSaved || 0,
        percentageChange: {
          rides: 8,
          distance: 12,
          time: 15,
          rating: 0,
        }
      });
      
      setSavingsBreakdown(insightsData.savingsBreakdown || []);
      setTopRoutes(insightsData.topRoutes || []);
      
    } catch (error) {
      console.error('Load user data error:', error);
      // Set default values on error
      setStats({
        totalRides: 0,
        distance: 0,
        timeSaved: 0,
        avgRating: 4.9,
        totalSaved: 0,
        percentageChange: { rides: 0, distance: 0, time: 0, rating: 0 }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'authToken',
                'user',
                'locationsSetup',
                'onboardingCompleted'
              ]);
              router.replace('/auth/phone');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={Colors.text.inverse} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || 'Vishal Rao'}</Text>
              <Text style={styles.userPhone}>{user?.phone || '+91 98765 43210'}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.ratingText}>{stats.avgRating} rider rating</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsIcon}>
            <Ionicons name="settings-outline" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Smart Rider PRO Badge */}
        <TouchableOpacity style={styles.proBadge}>
          <View style={styles.proIcon}>
            <Ionicons name="ribbon" size={24} color={Colors.primary.main} />
          </View>
          <View style={styles.proInfo}>
            <Text style={styles.proTitle}>Smart Rider</Text>
            <Text style={styles.proSubtitle}>Top 10% savings in your area</Text>
          </View>
          <View style={styles.proTag}>
            <Text style={styles.proTagText}>PRO</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'insights' && styles.tabActive]}
            onPress={() => setActiveTab('insights')}
          >
            <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>
              Insights
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your insights...</Text>
          </View>
        ) : (
          <>
        {/* Content based on active tab */}
        {activeTab === 'overview' ? (
          <View style={styles.content}>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="car-sport" size={20} color={Colors.primary.main} />
                </View>
                {stats.percentageChange.rides > 0 && (
                  <View style={styles.percentageTag}>
                    <Ionicons name="trending-up" size={12} color="#10B981" />
                    <Text style={styles.percentageText}>+{stats.percentageChange.rides}%</Text>
                  </View>
                )}
                <Text style={styles.statValue}>{stats.totalRides}</Text>
                <Text style={styles.statLabel}>Total Rides</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="navigate" size={20} color={Colors.primary.main} />
                </View>
                {stats.percentageChange.distance > 0 && (
                  <View style={styles.percentageTag}>
                    <Ionicons name="trending-up" size={12} color="#10B981" />
                    <Text style={styles.percentageText}>+{stats.percentageChange.distance}%</Text>
                  </View>
                )}
                <Text style={styles.statValue}>{stats.distance} km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="time" size={20} color={Colors.primary.main} />
                </View>
                {stats.percentageChange.time > 0 && (
                  <View style={styles.percentageTag}>
                    <Ionicons name="trending-up" size={12} color="#10B981" />
                    <Text style={styles.percentageText}>+{stats.percentageChange.time}%</Text>
                  </View>
                )}
                <Text style={styles.statValue}>{stats.timeSaved} hrs</Text>
                <Text style={styles.statLabel}>Time Saved</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="star" size={20} color={Colors.primary.main} />
                </View>
                <Text style={styles.statValue}>{stats.avgRating}</Text>
                <Text style={styles.statLabel}>Avg Rating</Text>
              </View>
            </View>

            {/* Smart Savings Breakdown */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="wallet" size={20} color={Colors.primary.main} />
                <Text style={styles.sectionTitle}>Smart Savings Breakdown</Text>
              </View>

              {savingsBreakdown.map((item) => (
                <View key={item.id} style={styles.savingsItem}>
                  <View style={[styles.savingsIcon, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <View style={styles.savingsInfo}>
                    <Text style={styles.savingsTitle}>{item.title}</Text>
                    <Text style={styles.savingsSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Text style={styles.savingsAmount}>₹{item.amount}</Text>
                </View>
              ))}
            </View>

            {/* Top Routes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="navigate-circle" size={20} color={Colors.primary.main} />
                <Text style={styles.sectionTitle}>Top Routes</Text>
              </View>

              {topRoutes.map((route) => (
                <View key={route.id} style={styles.routeItem}>
                  <View style={styles.routeNumber}>
                    <Text style={styles.routeNumberText}>{route.id}</Text>
                  </View>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeText}>
                      {route.from} → {route.to}
                    </Text>
                    <Text style={styles.routeRides}>{route.rides} rides</Text>
                  </View>
                  <Text style={styles.routeSaved}>saved ₹{route.saved}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Insights Content - Total Saved this Month */}
            <View style={styles.totalSavedCard}>
              <Text style={styles.totalSavedLabel}>Total Saved this month</Text>
              <View style={styles.totalSavedRow}>
                <Text style={styles.totalSavedAmount}>₹{stats.totalSaved}</Text>
                <View style={styles.totalSavedBadge}>
                  <Ionicons name="trending-up" size={14} color="#10B981" />
                  <Text style={styles.totalSavedPercentage}>+23%</Text>
                </View>
              </View>

              <View style={styles.savingsBreakdownList}>
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.breakdownLabel}>Surge avoided</Text>
                  <Text style={styles.breakdownAmount}>₹580</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.breakdownLabel}>Weather timing</Text>
                  <Text style={styles.breakdownAmount}>₹120</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownDot, { backgroundColor: '#8B5CF6' }]} />
                  <Text style={styles.breakdownLabel}>HailO Brain</Text>
                  <Text style={styles.breakdownAmount}>₹150</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        </>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="gift" size={20} color="#F59E0B" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Rewards & Offers</Text>
            </View>
            <View style={styles.menuBadge}>
              <Text style={styles.menuBadgeText}>2 new</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#E5E7EB' }]}>
              <Ionicons name="settings" size={20} color={Colors.text.secondary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#E5E7EB' }]}>
              <Ionicons name="help-circle" size={20} color={Colors.text.secondary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleLogout}>
            <View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out" size={20} color="#EF4444" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Logout</Text>
            </View>
          </TouchableOpacity>
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
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  settingsIcon: {
    padding: 8,
  },

  // PRO Badge
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  proIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  proInfo: {
    flex: 1,
  },
  proTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  proSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  proTag: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  proTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.inverse,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.text.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.text.inverse,
  },

  // Content
  content: {
    paddingHorizontal: 20,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    position: 'relative',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  percentageTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },

  // Section
  section: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },

  // Savings Items
  savingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  savingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  savingsInfo: {
    flex: 1,
  },
  savingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  savingsSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  savingsAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },

  // Route Items
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  routeNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.main,
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  routeRides: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  routeSaved: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },

  // Total Saved Card (Insights Tab)
  totalSavedCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  totalSavedLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  totalSavedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalSavedAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#10B981',
    marginRight: 12,
  },
  totalSavedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  totalSavedPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  savingsBreakdownList: {
    gap: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Menu Section
  menuSection: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  menuBadge: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.inverse,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
