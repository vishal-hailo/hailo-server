import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import Colors from '../../constants/Colors';

// Day Selector Component
const DaySelector = ({ days }: { days: boolean[] }) => {
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  return (
    <View style={styles.daySelector}>
      {dayLabels.map((label, index) => (
        <View
          key={index}
          style={[
            styles.dayButton,
            days[index] ? styles.dayButtonActive : styles.dayButtonInactive,
          ]}
        >
          <Text
            style={[
              styles.dayButtonText,
              days[index] ? styles.dayButtonTextActive : styles.dayButtonTextInactive,
            ]}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
};

// Route Indicator Component
const RouteIndicator = ({ from, to }: { from: string; to: string }) => {
  return (
    <View style={styles.routeContainer}>
      <View style={styles.routeItem}>
        <View style={[styles.routeDot, { backgroundColor: Colors.primary.main }]} />
        <Text style={styles.routeText}>{from}</Text>
      </View>
      <View style={styles.routeItem}>
        <View style={[styles.routeDot, { backgroundColor: Colors.secondary.teal }]} />
        <Text style={styles.routeText}>{to}</Text>
      </View>
    </View>
  );
};

export default function ScheduleScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recurring'>('recurring');
  const [upcomingRides, setUpcomingRides] = useState([]);
  const [recurringRides, setRecurringRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      
      // Fetch upcoming rides
      const upcomingResponse = await axios.get(`${API_URL}/api/v1/rides/upcoming`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Fetch all rides to filter recurring ones
      const allRidesResponse = await axios.get(`${API_URL}/api/v1/rides?type=RECURRING`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setUpcomingRides(upcomingResponse.data);
      setRecurringRides(allRidesResponse.data);
    } catch (error) {
      console.error('Load rides error:', error);
      // Set mock data on error for demo purposes
      setUpcomingRides([]);
      setRecurringRides([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Schedule</Text>
          <Text style={styles.headerSubtitle}>Plan your rides ahead</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle" size={32} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recurring' && styles.tabActive]}
          onPress={() => setActiveTab('recurring')}
        >
          <Text style={[styles.tabText, activeTab === 'recurring' && styles.tabTextActive]}>
            Recurring
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.main} />
            <Text style={styles.loadingText}>Loading your rides...</Text>
          </View>
        ) : activeTab === 'upcoming' ? (
          <View style={styles.content}>
            {upcomingRides.length > 0 ? (
              upcomingRides.map((ride) => (
                <View key={ride._id} style={styles.upcomingCard}>
                  <View style={styles.upcomingHeader}>
                    <View style={styles.upcomingTimeContainer}>
                      <Ionicons name="time-outline" size={18} color={Colors.text.secondary} />
                      <Text style={styles.upcomingTime}>
                        {new Date(ride.scheduledTime).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            ride.status === 'CONFIRMED' ? '#D1FAE5' : '#FED7AA',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: ride.status === 'CONFIRMED' ? '#10B981' : '#F97316',
                          },
                        ]}
                      >
                        {ride.status.toLowerCase()}
                      </Text>
                    </View>
                  </View>

                  <RouteIndicator 
                    from={ride.from.label || ride.from.address} 
                    to={ride.to.label || ride.to.address} 
                  />

                  <View style={styles.upcomingFooter}>
                    <Text style={styles.upcomingPrice}>₹{ride.estimatedPrice || ride.price || 0}</Text>
                    <TouchableOpacity style={styles.modifyButton}>
                      <Text style={styles.modifyText}>Modify</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color={Colors.neutral[300]} />
                <Text style={styles.emptyStateTitle}>No upcoming rides</Text>
                <Text style={styles.emptyStateSubtitle}>Schedule a ride to see it here</Text>
              </View>
            )}
            
            {/* Schedule a Ride CTA */}
            <TouchableOpacity style={styles.ctaCard}>
              <View style={styles.ctaIcon}>
                <Ionicons name="calendar" size={24} color={Colors.primary.main} />
              </View>
              <View style={styles.ctaInfo}>
                <Text style={styles.ctaTitle}>Schedule a ride</Text>
                <Text style={styles.ctaSubtitle}>Book in advance & save on surge</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {recurringRides.length > 0 ? (
              recurringRides.map((ride) => (
                <View key={ride._id} style={styles.recurringCard}>
                  <View style={styles.recurringHeader}>
                    <View style={styles.recurringIcon}>
                      <Ionicons
                        name="car-sport"
                        size={20}
                        color={Colors.primary.main}
                      />
                    </View>
                    <View style={styles.recurringInfo}>
                      <Text style={styles.recurringTitle}>
                        {ride.from.label || 'From'} → {ride.to.label || 'To'}
                      </Text>
                      <View style={styles.recurringTimeRow}>
                        <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
                        <Text style={styles.recurringTime}>
                          {new Date(ride.scheduledTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Text>
                        {ride.recurringPattern?.enabled && (
                          <View style={styles.recurringBadge}>
                            <Ionicons name="repeat" size={12} color={Colors.primary.main} />
                            <Text style={styles.recurringBadgeText}>Recurring</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity>
                      <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  <RouteIndicator 
                    from={ride.from.label || ride.from.address} 
                    to={ride.to.label || ride.to.address} 
                  />

                  <DaySelector days={ride.recurringPattern?.days || [false, false, false, false, false, false, false]} />

                  <View style={styles.recurringFooter}>
                    <Text style={styles.recurringPrice}>₹{ride.estimatedPrice || ride.price || 0}</Text>
                    <View style={styles.reminderContainer}>
                      <Ionicons name="notifications-outline" size={16} color={Colors.text.secondary} />
                      <Text style={styles.reminderText}>Remind</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="repeat-outline" size={64} color={Colors.neutral[300]} />
                <Text style={styles.emptyStateTitle}>No recurring rides</Text>
                <Text style={styles.emptyStateSubtitle}>Set up your daily commute pattern</Text>
              </View>
            )}
          </View>
        )}

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  addButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.background.card,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },

  // Upcoming Rides
  upcomingCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upcomingTime: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  upcomingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  upcomingPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modifyButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  modifyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.main,
  },

  // Recurring Rides
  recurringCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  recurringHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recurringIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurringInfo: {
    flex: 1,
  },
  recurringTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  recurringTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recurringTime: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  recurringBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary.main,
  },
  recurringFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  recurringPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  reminderText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },

  // Route Indicator
  routeContainer: {
    gap: 8,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeText: {
    fontSize: 14,
    color: Colors.text.primary,
  },

  // Day Selector
  daySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: Colors.primary.main,
  },
  dayButtonInactive: {
    backgroundColor: Colors.neutral[200],
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: Colors.text.inverse,
  },
  dayButtonTextInactive: {
    color: Colors.text.secondary,
  },

  // CTA Card
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ctaInfo: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  ctaSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
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
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
  },
});