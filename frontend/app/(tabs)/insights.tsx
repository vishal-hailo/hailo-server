import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Colors = {
  primary: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB', subtle: '#DBEAFE' },
  secondary: { teal: '#10B981', orange: '#F97316', purple: '#8B5CF6', yellow: '#F59E0B' },
  neutral: { 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB', 400: '#9CA3AF', 500: '#6B7280' },
  text: { primary: '#111827', secondary: '#6B7280', tertiary: '#9CA3AF', inverse: '#FFFFFF' },
  background: { card: '#FFFFFF', secondary: '#F9FAFB' },
};

const { width } = Dimensions.get('window');

export default function InsightsScreen() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const stats = {
    totalRides: 47,
    totalSpent: 4250,
    totalSaved: 850,
    avgPerRide: 90,
    bestTime: '9:30 AM',
    worstTime: '6:00 PM',
  };

  const breakdown = [
    { category: 'Office Commute', amount: 2100, percentage: 49, color: Colors.primary.main },
    { category: 'Weekend Trips', amount: 980, percentage: 23, color: Colors.secondary.teal },
    { category: 'Airport Rides', amount: 650, percentage: 15, color: Colors.secondary.orange },
    { category: 'Others', amount: 520, percentage: 13, color: Colors.secondary.purple },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with User Info */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'V'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name || 'Vishal'}</Text>
            <Text style={styles.userPhone}>+91 98765 43210</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' ? (
          <View style={styles.content}>
            {/* Monthly Savings Banner */}
            <View style={styles.savingsBanner}>
              <View style={styles.savingsIcon}>
                <Ionicons name="trending-down" size={32} color={Colors.text.inverse} />
              </View>
              <View style={styles.savingsInfo}>
                <Text style={styles.savingsLabel}>This Month</Text>
                <Text style={styles.savingsAmount}>₹{stats.totalSaved}</Text>
                <Text style={styles.savingsSubtext}>You saved with HailO</Text>
              </View>
              <View style={styles.savingsBadge}>
                <Ionicons name="trophy" size={24} color={Colors.secondary.yellow} />
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.primary.subtle }]}>
                  <Ionicons name="car" size={24} color={Colors.primary.main} />
                </View>
                <Text style={styles.statValue}>{stats.totalRides}</Text>
                <Text style={styles.statLabel}>Total Rides</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="cash" size={24} color={Colors.secondary.orange} />
                </View>
                <Text style={styles.statValue}>₹{stats.totalSpent}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="arrow-down" size={24} color={Colors.secondary.teal} />
                </View>
                <Text style={styles.statValue}>₹{stats.avgPerRide}</Text>
                <Text style={styles.statLabel}>Avg Per Ride</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="time" size={24} color={Colors.secondary.yellow} />
                </View>
                <Text style={styles.statValue}>{stats.bestTime}</Text>
                <Text style={styles.statLabel}>Best Time</Text>
              </View>
            </View>

            {/* Spending Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Spending Breakdown</Text>
              
              {breakdown.map((item, index) => (
                <View key={index} style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
                    <Text style={styles.breakdownCategory}>{item.category}</Text>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownAmount}>₹{item.amount}</Text>
                    <Text style={styles.breakdownPercentage}>{item.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Visual Bar Chart */}
            <View style={styles.chartSection}>
              <View style={styles.chartBars}>
                {breakdown.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.chartBar,
                      { 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Rewards Section */}
            <View style={styles.rewardsCard}>
              <View style={styles.rewardsHeader}>
                <View style={styles.rewardsIcon}>
                  <Ionicons name="gift" size={24} color={Colors.secondary.purple} />
                </View>
                <View style={styles.rewardsInfo}>
                  <Text style={styles.rewardsTitle}>Rewards</Text>
                  <Text style={styles.rewardsSubtext}>320 points available</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.rewardsButton}>
                <Text style={styles.rewardsButtonText}>View Rewards</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.primary.main} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Insights Tab Content */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="bulb" size={24} color={Colors.secondary.yellow} />
                <Text style={styles.insightTitle}>Money-Saving Tips</Text>
              </View>
              <Text style={styles.insightText}>
                Book rides after 7 PM to save an average of 15%. Your peak hour rides cost 18% more.
              </Text>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="time" size={24} color={Colors.primary.main} />
                <Text style={styles.insightTitle}>Best Booking Time</Text>
              </View>
              <Text style={styles.insightText}>
                Your cheapest rides are usually between 9:30 AM - 10:30 AM. Consider adjusting your schedule.
              </Text>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="trending-up" size={24} color={Colors.secondary.teal} />
                <Text style={styles.insightTitle}>Usage Pattern</Text>
              </View>
              <Text style={styles.insightText}>
                You book 67% of rides during weekdays. Weekend rides average ₹120 vs weekday ₹95.
              </Text>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="flash" size={24} color={Colors.secondary.orange} />
                <Text style={styles.insightTitle}>Surge Avoidance</Text>
              </View>
              <Text style={styles.insightText}>
                You avoided surge pricing 23 times this month, saving ₹340. Keep up the smart booking!
              </Text>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  userPhone: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
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
  content: {
    paddingHorizontal: 20,
  },
  
  // Savings Banner
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary.purple,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  savingsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingsInfo: {
    flex: 1,
  },
  savingsLabel: {
    fontSize: 14,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  savingsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text.inverse,
    marginVertical: 4,
  },
  savingsSubtext: {
    fontSize: 14,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  savingsBadge: {
    padding: 8,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // Spending Breakdown
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  breakdownCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  breakdownPercentage: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },

  // Chart
  chartSection: {
    marginBottom: 24,
  },
  chartBars: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
  },

  // Rewards Card
  rewardsCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rewardsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardsInfo: {
    flex: 1,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  rewardsSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  rewardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.subtle,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  rewardsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.main,
  },

  // Insights Cards
  insightCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  insightText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
