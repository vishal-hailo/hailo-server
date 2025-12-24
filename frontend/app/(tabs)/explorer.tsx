import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const Colors = {
  primary: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB', subtle: '#DBEAFE' },
  secondary: { teal: '#10B981', orange: '#F97316', purple: '#8B5CF6' },
  neutral: { 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB', 400: '#9CA3AF' },
  text: { primary: '#111827', secondary: '#6B7280', tertiary: '#9CA3AF', inverse: '#FFFFFF' },
  background: { card: '#FFFFFF', secondary: '#F9FAFB' },
};

// Day Selector Component
const DaySelector = ({ days, disabled = false }) => {
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  return (
    <View style={styles.daySelector}>
      {dayLabels.map((label, index) => (
        <View
          key={index}
          style={[
            styles.dayButton,
            days[index] ? styles.dayButtonActive : styles.dayButtonInactive,
            disabled && styles.dayButtonDisabled,
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
const RouteIndicator = ({ from, to, fromColor = Colors.primary.main, toColor = Colors.secondary.teal }) => {
  return (
    <View style={styles.routeContainer}>
      <View style={styles.routeItem}>
        <View style={[styles.routeDot, { backgroundColor: fromColor }]} />
        <Text style={styles.routeText}>{from}</Text>
      </View>
      <View style={styles.routeItem}>
        <View style={[styles.routeDot, { backgroundColor: toColor }]} />
        <Text style={styles.routeText}>{to}</Text>
      </View>
    </View>
  );
};

export default function ScheduleScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recurring'>('upcoming');

  const upcomingRides = [
    {
      id: 1,
      title: 'Office Meeting',
      from: 'Home',
      to: 'Office',
      date: 'Today',
      time: '9:00 AM',
      price: '₹95',
      status: 'confirmed',
    },
    {
      id: 2,
      title: 'Airport Drop',
      from: 'Home',
      to: 'BLR Airport',
      date: 'Tomorrow',
      time: '6:30 AM',
      price: '₹450',
      status: 'pending',
    },
  ];

  const recurringRides = [
    {
      id: 1,
      title: 'Office Commute',
      from: 'Home',
      to: 'Office',
      time: '9:00 AM',
      days: [true, true, true, true, true, false, false], // M-F
      price: '~₹95',
      reminder: true,
    },
    {
      id: 2,
      title: 'Home Return',
      from: 'Office',
      to: 'Home',
      time: '6:30 PM',
      days: [true, true, true, true, true, false, false], // M-F
      price: '~₹120',
      reminder: true,
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
            {upcomingRides.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={80} color={Colors.neutral[400]} />
                <Text style={styles.emptyTitle}>No Upcoming Rides</Text>
                <Text style={styles.emptyText}>Schedule your rides in advance</Text>
                <TouchableOpacity style={styles.emptyButton}>
                  <Text style={styles.emptyButtonText}>Schedule Ride</Text>
                </TouchableOpacity>
              </View>
            ) : (
              upcomingRides.map((ride) => (
                <View key={ride.id} style={styles.upcomingCard}>
                  <View style={styles.upcomingHeader}>
                    <View style={styles.upcomingInfo}>
                      <Text style={styles.upcomingTitle}>{ride.title}</Text>
                      <Text style={styles.upcomingDateTime}>
                        {ride.date} • {ride.time}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: ride.status === 'confirmed' ? Colors.secondary.teal : Colors.secondary.orange }
                    ]}>
                      <Text style={styles.statusText}>
                        {ride.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <RouteIndicator from={ride.from} to={ride.to} />

                  <View style={styles.upcomingFooter}>
                    <Text style={styles.upcomingPrice}>{ride.price}</Text>
                    <View style={styles.upcomingActions}>
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="create-outline" size={20} color={Colors.primary.main} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="trash-outline" size={20} color={Colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.content}>
            {recurringRides.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="repeat-outline" size={80} color={Colors.neutral[400]} />
                <Text style={styles.emptyTitle}>No Recurring Rides</Text>
                <Text style={styles.emptyText}>Set up your daily commute patterns</Text>
                <TouchableOpacity style={styles.emptyButton}>
                  <Text style={styles.emptyButtonText}>Add Recurring Ride</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recurringRides.map((ride) => (
                <View key={ride.id} style={styles.recurringCard}>
                  <View style={styles.recurringHeader}>
                    <Text style={styles.recurringTitle}>{ride.title}</Text>
                    <TouchableOpacity>
                      <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  <RouteIndicator from={ride.from} to={ride.to} />

                  <View style={styles.recurringDetails}>
                    <View style={styles.recurringTime}>
                      <Ionicons name="time-outline" size={18} color={Colors.text.secondary} />
                      <Text style={styles.recurringTimeText}>{ride.time}</Text>
                    </View>
                    <Text style={styles.recurringPrice}>{ride.price}</Text>
                  </View>

                  <DaySelector days={ride.days} disabled />

                  <View style={styles.recurringFooter}>
                    <View style={styles.reminderContainer}>
                      <Ionicons name="notifications" size={18} color={Colors.secondary.teal} />
                      <Text style={styles.reminderText}>Remind 15 min before</Text>
                    </View>
                    <TouchableOpacity>
                      <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton}>
        <Ionicons name="add" size={28} color={Colors.text.inverse} />
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
    borderRadius: 12,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary.main,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.text.inverse,
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
    alignItems: 'flex-start',
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  upcomingDateTime: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  upcomingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  upcomingPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  upcomingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurringTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  recurringDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurringTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recurringTimeText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  recurringPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  recurringFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.main,
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
    width: 10,
    height: 10,
    borderRadius: 5,
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
  dayButtonDisabled: {
    opacity: 0.7,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: Colors.text.inverse,
  },
  dayButtonTextInactive: {
    color: Colors.text.secondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },

  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
