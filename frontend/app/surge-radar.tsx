import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// API_URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

export default function SurgeRadarScreen() {
  const router = useRouter();
  const { originLat, originLng, destLat, destLng, routeName } = useLocalSearchParams();
  const [surgeData, setSurgeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSurgeData();
  }, []);

  const loadSurgeData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.post(
        `${API_URL}/api/v1/commute/surge-radar`,
        {
          origin: {
            latitude: parseFloat(originLat as string),
            longitude: parseFloat(originLng as string),
          },
          destination: {
            latitude: parseFloat(destLat as string),
            longitude: parseFloat(destLng as string),
          },
          durationMinutes: 30,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSurgeData(response.data);
    } catch (error) {
      console.error('Load surge data error:', error);
      Alert.alert('Error', 'Failed to load surge radar data');
    } finally {
      setLoading(false);
    }
  };

  const handleBookOptimal = async () => {
    if (!surgeData?.bestBucket) return;

    const deepLink = `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${originLat}&pickup[longitude]=${originLng}&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}`;

    try {
      const supported = await Linking.canOpenURL(deepLink);
      if (supported) {
        await Linking.openURL(deepLink);
        router.replace('/success');
      } else {
        Alert.alert('Error', 'Cannot open Uber app');
      }
    } catch (error) {
      console.error('Book optimal error:', error);
    }
  };

  const getColorForBucket = (color: string) => {
    if (color === 'green') return '#10B981';
    if (color === 'yellow') return '#F59E0B';
    if (color === 'orange') return '#FB923C';
    return '#EF4444';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading surge data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Surge Radar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.routeName}>{routeName}</Text>
        <Text style={styles.subtitle}>30-minute pricing forecast</Text>

        {surgeData && (
          <>
            {/* Simple Bar Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>30-Minute Price Forecast</Text>
              <View style={styles.chart}>
                {surgeData.buckets.map((bucket: any, index: number) => {
                  const maxPrice = Math.max(...surgeData.buckets.map((b: any) => b.estimate));
                  const heightPercent = (bucket.estimate / maxPrice) * 100;
                  
                  return (
                    <View key={index} style={styles.barContainer}>
                      <Text style={styles.barPrice}>₹{bucket.estimate}</Text>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${heightPercent}%`,
                            backgroundColor: getColorForBucket(bucket.color),
                          },
                        ]}
                      />
                      <Text style={styles.barLabel}>{bucket.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Best Time */}
            <View style={styles.bestTimeCard}>
              <Text style={styles.bestTimeLabel}>Best Time to Book</Text>
              <Text style={styles.bestTimeValue}>
                {surgeData.bestBucket.label} - ₹{surgeData.bestBucket.estimate}
              </Text>
              <Text style={styles.savingsText}>
                Save ₹{surgeData.potentialSaving} vs peak
              </Text>
            </View>

            {/* Time Buckets */}
            <View style={styles.bucketsContainer}>
              {surgeData.buckets.map((bucket: any, index: number) => (
                <View key={index} style={styles.bucketRow}>
                  <View
                    style={[
                      styles.bucketIndicator,
                      { backgroundColor: getColorForBucket(bucket.color) },
                    ]}
                  />
                  <Text style={styles.bucketLabel}>{bucket.label}</Text>
                  <Text style={styles.bucketPrice}>₹{bucket.estimate}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleBookOptimal}>
              <Text style={styles.primaryButtonText}>🚀 Book Optimal</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: '#6B7280',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  routeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  chartContainer: {
    marginVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingHorizontal: 8,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
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
    marginTop: 4,
    textAlign: 'center',
  },
  barPrice: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  bestTimeCard: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  bestTimeLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  bestTimeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  bucketsContainer: {
    marginBottom: 24,
  },
  bucketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bucketIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  bucketLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  bucketPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
