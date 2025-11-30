import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/utils/api';

const { width } = Dimensions.get('window');

export default function InsightsScreen() {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, [period]);

  const loadInsights = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${API_URL}/api/v1/insights/summary?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInsights(response.data);
    } catch (error) {
      console.error('Load insights error:', error);
      Alert.alert('Error', 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    Alert.alert(
      'Export Data',
      `Your commute data for the last ${period === '7d' ? '7 days' : '30 days'} will be exported as CSV.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <TouchableOpacity onPress={handleExport}>
            <Ionicons name="download" size={24} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              period === '7d' && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod('7d')}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === '7d' && styles.periodButtonTextActive,
              ]}
            >
              7 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              period === '30d' && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod('30d')}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === '30d' && styles.periodButtonTextActive,
              ]}
            >
              30 Days
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading insights...</Text>
          </View>
        ) : (
          insights && (
            <>
              {/* Week Score Banner */}
              <View style={styles.scoreCard}>
                <View style={styles.scoreHeader}>
                  <Ionicons name="star" size={40} color="#FFD700" />
                  <View style={styles.scoreTextContainer}>
                    <Text style={styles.scoreLabel}>Week Score</Text>
                    <Text style={styles.scoreValue}>⭐ {insights.weekScore}/10</Text>
                  </View>
                </View>
                <Text style={styles.scoreSavings}>
                  Saved ₹{insights.totalSavings} vs average
                </Text>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="car" size={24} color="#FF6B35" />
                  <Text style={styles.statValue}>{insights.totalTrips}</Text>
                  <Text style={styles.statLabel}>Total Trips</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="cash" size={24} color="#10B981" />
                  <Text style={styles.statValue}>₹{insights.totalSpend}</Text>
                  <Text style={styles.statLabel}>Total Spend</Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="trending-down" size={24} color="#6B46C1" />
                  <Text style={styles.statValue}>₹{insights.totalSavings}</Text>
                  <Text style={styles.statLabel}>Total Savings</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="calculator" size={24} color="#EF4444" />
                  <Text style={styles.statValue}>₹{insights.avgPerTrip}</Text>
                  <Text style={styles.statLabel}>Avg Per Trip</Text>
                </View>
              </View>

              {/* Patterns */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Patterns</Text>
                <View style={styles.patternCard}>
                  <Text style={styles.patternText}>☔ Rain +₹80 avg</Text>
                </View>
                <View style={styles.patternCard}>
                  <Text style={styles.patternText}>📈 Friday 6PM 2x surge</Text>
                </View>
                <View style={styles.patternCard}>
                  <Text style={styles.patternText}>🌙 Night rides 30% cheaper</Text>
                </View>
              </View>

              {/* Simple Trend Visualization */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Spending Trend</Text>
                <View style={styles.chartContainer}>
                  <View style={styles.simpleBars}>
                    {[65, 85, 75, 95, 70, 80, 60].map((height, index) => (
                      <View key={index} style={styles.barWrapper}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${height}%`,
                              backgroundColor: height > 80 ? '#EF4444' : '#10B981',
                            },
                          ]}
                        />
                        <Text style={styles.barLabel}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Export Button */}
              <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                <Ionicons name="download" size={20} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>📊 Export CSV</Text>
              </TouchableOpacity>
            </>
          )
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  periodButtonActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35',
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scoreCard: {
    backgroundColor: '#6B46C1',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  scoreTextContainer: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreSavings: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  patternCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  patternText: {
    fontSize: 16,
    color: '#1F2937',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  simpleBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 20,
  },
  barLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 8,
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
