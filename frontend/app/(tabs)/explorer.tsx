import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

  const upcomingRides = [
    {
      id: 1,
      time: 'Tomorrow, 9:00 AM',
      from: 'HSR Layout',
      to: 'Koramangala',
      price: '$8.50',
      status: 'confirmed',
    },
    {
      id: 2,
      time: 'Tomorrow, 6:30 PM',
      from: 'Koramangala',
      to: 'HSR Layout',
      price: '$9.20',
      status: 'pending',
    },
  ];

  const recurringRides = [
    {
      id: 1,
      title: 'Office Commute',
      from: 'HSR Layout',
      to: 'Koramangala',
      time: '9:00 AM',
      days: [true, true, true, true, true, false, false],
      price: '$8.50',
      recurring: true,
    },
    {
      id: 2,
      title: 'Home Return',
      from: 'Koramangala',
      to: 'HSR Layout',
      time: '6:30 PM',
      days: [true, true, true, true, true, false, false],
      price: '$9.20',
      recurring: true,
    },
    {
      id: 3,
      title: 'Airport Pickup',
      from: 'HSR Layout',
      to: 'Kempegowda Airport',
      time: '5:00 AM',
      days: [false, false, false, false, false, false, false],
    },
  ];

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
        {activeTab === 'upcoming' ? (
          <View style={styles.content}>
            {upcomingRides.map((ride) => (
              <View key={ride.id} style={styles.upcomingCard}>
                <View style={styles.upcomingHeader}>
                  <View style={styles.upcomingTimeContainer}>
                    <Ionicons name="time-outline" size={18} color={Colors.text.secondary} />
                    <Text style={styles.upcomingTime}>{ride.time}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          ride.status === 'confirmed' ? '#D1FAE5' : '#FED7AA',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: ride.status === 'confirmed' ? '#10B981' : '#F97316',
                        },
                      ]}
                    >
                      {ride.status}
                    </Text>
                  </View>
                </View>

                <RouteIndicator from={ride.from} to={ride.to} />

                <View style={styles.upcomingFooter}>
                  <Text style={styles.upcomingPrice}>{ride.price}</Text>
                  <TouchableOpacity style={styles.modifyButton}>
                    <Text style={styles.modifyText}>Modify</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
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
            {recurringRides.map((ride) => (
              <View key={ride.id} style={styles.recurringCard}>
                <View style={styles.recurringHeader}>
                  <View style={styles.recurringIcon}>
                    <Ionicons
                      name={ride.id === 1 ? 'briefcase' : ride.id === 2 ? 'home' : 'airplane'}
                      size={20}
                      color={Colors.primary.main}
                    />
                  </View>
                  <View style={styles.recurringInfo}>
                    <Text style={styles.recurringTitle}>{ride.title}</Text>
                    <View style={styles.recurringTimeRow}>
                      <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
                      <Text style={styles.recurringTime}>{ride.time}</Text>
                      {ride.recurring && (
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

                <RouteIndicator from={ride.from} to={ride.to} />

                <DaySelector days={ride.days} />

                <View style={styles.recurringFooter}>
                  <Text style={styles.recurringPrice}>{ride.price}</Text>
                  <View style={styles.reminderContainer}>
                    <Ionicons name="notifications-outline" size={16} color={Colors.text.secondary} />
                    <Text style={styles.reminderText}>Remind</Text>
                  </View>
                </View>
              </View>
            ))}
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
});