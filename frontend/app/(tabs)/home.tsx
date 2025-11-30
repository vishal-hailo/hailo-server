import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = Platform.OS === 'web' ? '' : 'http://localhost:8001';

const TEST_LOCATIONS = {
  home: { id: 'home', label: 'Andheri East', latitude: 19.1188, longitude: 72.8913 },
  office: { id: 'office', label: 'BKC Tech Park', latitude: 19.0661, longitude: 72.8354 },
};

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [goToWorkEstimate, setGoToWorkEstimate] = useState<any>(null);
  const [goHomeEstimate, setGoHomeEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadUserAndEstimates();
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadUserAndEstimates = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }

      await loadEstimate('toWork');
      await loadEstimate('toHome');
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEstimate = async (type: 'toWork' | 'toHome') => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const origin = type === 'toWork' ? TEST_LOCATIONS.home : TEST_LOCATIONS.office;
      const dest = type === 'toWork' ? TEST_LOCATIONS.office : TEST_LOCATIONS.home;

      const response = await axios.post(
        `${API_URL}/api/v1/commute/search`,
        {
          mode: 'EXPLORER',
          origin: { latitude: origin.latitude, longitude: origin.longitude },
          destination: { latitude: dest.latitude, longitude: dest.longitude },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (type === 'toWork') {
        setGoToWorkEstimate(response.data);
      } else {
        setGoHomeEstimate(response.data);
      }
    } catch (error) {
      console.error('Load estimate error:', error);
    }
  };

  const handleSmartBook = async (estimate: any) => {
    if (!estimate) return;

    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.post(
        `${API_URL}/api/v1/commute/handoff`,
        { commuteLogId: estimate.commuteLogId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const supported = await Linking.canOpenURL(estimate.deepLinkUrl);
      if (supported) {
        await Linking.openURL(estimate.deepLinkUrl);
        router.push('/success');
      } else {
        Alert.alert('Error', 'Cannot open Uber app. Please install Uber.');
      }
    } catch (error) {
      console.error('Smart book error:', error);
      Alert.alert('Error', 'Failed to open Uber. Please try again.');
    }
  };

  const handleViewSurgeRadar = (type: 'toWork' | 'toHome') => {
    const origin = type === 'toWork' ? TEST_LOCATIONS.home : TEST_LOCATIONS.office;
    const dest = type === 'toWork' ? TEST_LOCATIONS.office : TEST_LOCATIONS.home;
    router.push({
      pathname: '/surge-radar',
      params: {
        originLat: origin.latitude,
        originLng: origin.longitude,
        destLat: dest.latitude,
        destLng: dest.longitude,
        routeName: type === 'toWork' ? 'Andheri → BKC' : 'BKC → Andheri',
      },
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getSurgeEmoji = (surgePercent?: number) => {
    if (!surgePercent || surgePercent < 5) return '🟢';
    if (surgePercent < 15) return '🟡';
    return '🔴';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name || 'Priya'}! ☀️
            </Text>
            <Text style={styles.time}>
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Go to Work Card */}
        <Animated.View style={[styles.cardWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.card, styles.pulsingCard]}>
            <View style={styles.liveDot} />
            <Text style={styles.cardTitle}>Go to Work 🔴</Text>
            <Text style={styles.route}>Andheri East → BKC Tech Park</Text>
            {goToWorkEstimate ? (
              <>
                <View style={styles.estimateRow}>
                  <Text style={styles.eta}>{goToWorkEstimate.etaMinutes} min</Text>
                  <Text style={styles.price}>
                    ₹{goToWorkEstimate.estimateMin} {getSurgeEmoji(goToWorkEstimate.surgePercent)}
                  </Text>
                </View>
                <Text style={styles.insight}>Leave NOW to save ₹45 ✨</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleSmartBook(goToWorkEstimate)}
                  >
                    <Text style={styles.primaryButtonText}>🚀 Smart Book</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleViewSurgeRadar('toWork')}
                  >
                    <Text style={styles.secondaryButtonText}>Surge Radar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.loadingText}>Loading...</Text>
            )}
          </View>
        </Animated.View>

        {/* Go Home Card */}
        <Animated.View style={[styles.cardWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.card, styles.pulsingCard]}>
            <View style={styles.liveDot} />
            <Text style={styles.cardTitle}>Go Home 🔴</Text>
            <Text style={styles.route}>BKC → Andheri East</Text>
            {goHomeEstimate ? (
              <>
                <View style={styles.estimateRow}>
                  <Text style={styles.eta}>{goHomeEstimate.etaMinutes} min</Text>
                  <Text style={styles.price}>
                    ₹{goHomeEstimate.estimateMin} {getSurgeEmoji(goHomeEstimate.surgePercent)}
                  </Text>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleSmartBook(goHomeEstimate)}
                  >
                    <Text style={styles.primaryButtonText}>🚀 Smart Book</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleViewSurgeRadar('toHome')}
                  >
                    <Text style={styles.secondaryButtonText}>Surge Radar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.loadingText}>Loading...</Text>
            )}
          </View>
        </Animated.View>

        {/* Week Score */}
        <View style={styles.weekScoreBadge}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <View style={styles.weekScoreText}>
            <Text style={styles.weekScoreValue}>8.7/10</Text>
            <Text style={styles.weekScoreSavings}>Saved ₹320 this week!</Text>
          </View>
        </View>
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
    padding: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  time: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  cardWrapper: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  pulsingCard: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  liveDot: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  route: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eta: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  insight: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  weekScoreBadge: {
    flexDirection: 'row',
    backgroundColor: '#6B46C1',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  weekScoreText: {
    flex: 1,
  },
  weekScoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  weekScoreSavings: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
