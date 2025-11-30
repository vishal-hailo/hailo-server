import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = 'http://localhost:8002';

export default function InsightsScreen() {
  const router = useRouter();
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
    try {
      const token = await AsyncStorage.getItem('authToken');
      Alert.alert(
        'Export Data',
        `Export URL: ${API_URL}/api/v1/insights/export?period=${period}\n\nOpen this URL in a browser to download your commute data as CSV.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insights</Text>
        <TouchableOpacity onPress={handleExport}>
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
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
              {/* Stats Cards */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{insights.totalTrips}</Text>
                  <Text style={styles.statLabel}>Total Trips</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>₹{insights.totalSpend}</Text>
                  <Text style={styles.statLabel}>Total Spend</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>₹{insights.totalSavings}</Text>
                  <Text style={styles.statLabel}>Total Savings</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>₹{insights.avgPerTrip}</Text>
                  <Text style={styles.statLabel}>Avg Per Trip</Text>
                </View>
              </View>

              {/* Week Score */}
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>Week Score</Text>
                <Text style={styles.scoreValue}>⭐ {insights.weekScore}</Text>
                <Text style={styles.scoreDescription}>
                  Based on usage and smart booking decisions
                </Text>
              </View>

              {/* Searches */}
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Total Searches</Text>
                <Text style={styles.infoValue}>{insights.totalSearches}</Text>
                <Text style={styles.infoDescription}>
                  {insights.totalTrips} resulted in bookings
                </Text>
              </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#FF6B35',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  exportText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  scoreCard: {
    backgroundColor: '#6B46C1',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});
