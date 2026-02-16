import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_URL } from '../constants/Config';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const Colors = {
  primary: {
    main: '#FF6B35',
    light: '#FFF7ED',
    subtle: '#FFF1EB',
  },
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    inverse: '#FFFFFF',
  },
  ondc: {
    bg: '#F3F4F6',
    border: '#E5E7EB',
  }
};
const { width } = Dimensions.get('window');

export default function SurgeRadarScreen() {
  const router = useRouter();
  const { originLat, originLng, destLat, destLng, routeName } = useLocalSearchParams();
  const [surgeData, setSurgeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ONDC State
  const [ondcQuotes, setOndcQuotes] = useState<any[]>([]);
  const [ondcLoading, setOndcLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

  // Select Flow State
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [selectLoading, setSelectLoading] = useState(false);

  // Init & Confirm State
  const [initLoading, setInitLoading] = useState(false);
  const [initOrder, setInitOrder] = useState<any>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [driverDetails, setDriverDetails] = useState<any>(null);

  useEffect(() => {
    loadSurgeData();
    initiateOndcSearch();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
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

  const initiateOndcSearch = async () => {
    setOndcLoading(true);
    try {
      // 1. Trigger Search
      const searchResponse = await axios.post(`${API_URL}/ondc/search`, {
        latitude: parseFloat(originLat as string),
        longitude: parseFloat(originLng as string),
        destination: {
          latitude: parseFloat(destLat as string),
          longitude: parseFloat(destLng as string),
        }
      });

      const { transactionId } = searchResponse.data;
      setTransactionId(transactionId);
      console.log('ONDC Search Initiated:', transactionId);

      // 2. Connect to Socket for updates
      socketRef.current = io(API_URL);

      socketRef.current.on('connect', () => {
        console.log('Connected to WebSocket for ONDC updates');
      });

      // Search Updates
      socketRef.current.on(`search_update_${transactionId}`, (newQuotes: any[]) => {
        console.log('Received ONDC quotes:', newQuotes.length);
        setOndcQuotes(prev => {
          // Merge logic could be more complex, but purely appending/replacing for now
          // Filtering out duplicates based on id if needed
          const existingIds = new Set(prev.map(q => q.id));
          const uniqueNew = newQuotes.filter(q => !existingIds.has(q.id));
          return [...prev, ...uniqueNew];
        });
        setOndcLoading(false);
      });

      // Select Updates (Detailed Quote)
      socketRef.current.on(`select_update_${transactionId}`, (quote: any) => {
        console.log('Received Select Quote:', quote);
        setSelectedQuote(quote);
        setSelectLoading(false);
        setQuoteModalVisible(true);
      });

      // Init Updates (Order Initialized)
      socketRef.current.on(`init_update_${transactionId}`, (order: any) => {
        console.log('Received Init Order:', order);
        setInitOrder(order);
        setInitLoading(false);
        // Auto-trigger confirm for demo flow, or show "Pay" button
        // For now, let's show "Confirm Booking" button in modal
      });

      // Confirm Updates (Booking Confirmed)
      socketRef.current.on(`confirm_update_${transactionId}`, (order: any) => {
        console.log('Received Confirmed Order:', order);
        setBookingConfirmed(true);
        setConfirmLoading(false);
        setDriverDetails(order.fulfillment?.driver);
        Alert.alert('Booking Confirmed!', `Driver: ${order.fulfillment?.driver?.name}\nVehicle: ${order.fulfillment?.driver?.vehicle}`);
      });

    } catch (error) {
      console.error('ONDC Search Error:', error);
      // Fail silently for now, just don't show ONDC results
      setOndcLoading(false);
    }
  };

  const handleBookRide = async () => {
    const deepLink = `uber://?action=setPickup&pickup[latitude]=${originLat}&pickup[longitude]=${originLng}&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}`;

    try {
      const supported = await Linking.canOpenURL(deepLink);
      if (supported) {
        await Linking.openURL(deepLink);
        // Track booking in background (mock)
        router.replace('/success');
      } else {
        // Fallback to web
        const webLink = `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${originLat}&pickup[longitude]=${originLng}`;

        Alert.alert(
          'App Not Found',
          "The Uber app isn't installed. Open in browser?",
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Browser', onPress: () => Linking.openURL(webLink) }
          ]
        );
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Booking Error', 'Could not open the Uber app.');
    }
  };

  const mapOndcItemToUberLink = (item: any) => {
    // For now, mapping everything to a generic Uber open, 
    // but in real world this would open specific provider app deep links
    return `https://beckn.org/`;
  };

  const handleBookOndc = async (item: any) => {
    if (!transactionId) return;
    setSelectLoading(true);
    // Reset previous states
    setInitOrder(null);
    setBookingConfirmed(false);
    setDriverDetails(null);

    try {
      await axios.post(`${API_URL}/ondc/select`, {
        transactionId,
        providerId: item.providerId,
        itemId: item.id
      });
    } catch (error) {
      console.error('Select error:', error);
      setSelectLoading(false);
      Alert.alert('Error', 'Failed to select ride');
    }
  };

  const handleProceedToPay = async () => {
    setInitLoading(true);
    try {
      await axios.post(`${API_URL}/ondc/init`, { transactionId });
    } catch (error) {
      console.error('Init error:', error);
      setInitLoading(false);
      Alert.alert('Error', 'Failed to initiate booking');
    }
  };

  const handleConfirmBooking = async () => {
    setConfirmLoading(true);
    try {
      await axios.post(`${API_URL}/ondc/confirm`, { transactionId });
    } catch (error) {
      console.error('Confirm error:', error);
      setConfirmLoading(false);
      Alert.alert('Error', 'Failed to confirm booking');
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
          <ActivityIndicator size="large" color={Colors.primary.main} />
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.routeHeader}>
          <Text style={styles.routeName}>{routeName || 'Current Trip'}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Real-time Insights</Text>
          </View>
        </View>

        {surgeData && (
          <>
            {/* Primary Action Card (Uber) */}
            <View style={styles.mainActionCard}>
              <View style={styles.bestTimeInfo}>
                <Text style={styles.bestTimeTitle}>Recommended time to book</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.bestTimeValue}>{surgeData.bestBucket.label}</Text>
                  <Text style={styles.bestPrice}>₹{surgeData.bestBucket.estimate}</Text>
                </View>
                <Text style={styles.savingsText}>
                  Save ₹{surgeData.potentialSaving} vs peak pricing
                </Text>
              </View>

              <TouchableOpacity
                style={styles.bookNowButton}
                onPress={handleBookRide}
                activeOpacity={0.8}
              >
                <Ionicons name="car" size={24} color="#FFFFFF" />
                <Text style={styles.bookNowText}>Book Uber Now</Text>
              </TouchableOpacity>
            </View>

            {/* ONDC Results Section */}
            {(ondcQuotes.length > 0 || ondcLoading) && (
              <View style={styles.ondcSection}>
                <Text style={styles.sectionTitle}>Other Providers (ONDC)</Text>
                {ondcLoading && ondcQuotes.length === 0 && (
                  <View style={styles.ondcLoading}>
                    <ActivityIndicator size="small" color="#6B7280" />
                    <Text style={styles.ondcLoadingText}>Searching network...</Text>
                  </View>
                )}

                {ondcQuotes.map((quote, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.ondcCard}
                    onPress={() => handleBookOndc(quote)}
                    disabled={selectLoading}
                  >
                    <View style={styles.ondcCardContent}>
                      <View style={styles.ondcHeader}>
                        <Text style={styles.ondcProvider}>{quote.providerName}</Text>
                        <Text style={styles.ondcPrice}>₹{quote.price}</Text>
                      </View>
                      <Text style={styles.ondcVehicle}>{quote.name}</Text>
                      <View style={styles.ondcMeta}>
                        <View style={styles.ondcEtaBadge}>
                          <Ionicons name="time-outline" size={14} color="#4B5563" />
                          <Text style={styles.ondcEtaText}>{quote.eta} mins</Text>
                        </View>
                        {/* Brain Tags */}
                        {quote.tags && quote.tags.map((tag: any, tIdx: number) => (
                          <View key={tIdx} style={[styles.brainTag, { backgroundColor: tag.color === 'green' ? '#DEF7EC' : '#E1EFFE' }]}>
                            <Text style={[styles.brainTagText, { color: tag.color === 'green' ? '#03543F' : '#1E429F' }]}>
                              {tag.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    {selectLoading ? (
                      <ActivityIndicator size="small" color="#9CA3AF" />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Visual Forecast Chart */}
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>30-Minute Price Forecast</Text>
                <View style={styles.legend}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Low</Text>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>High</Text>
                </View>
              </View>

              <View style={styles.chart}>
                {surgeData.buckets.map((bucket: any, index: number) => {
                  const maxPrice = Math.max(...surgeData.buckets.map((b: any) => b.estimate));
                  const heightPercent = Math.max(20, (bucket.estimate / maxPrice) * 100);

                  return (
                    <View key={index} style={styles.barContainer}>
                      <View style={styles.barWrapper}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${heightPercent}%`,
                              backgroundColor: getColorForBucket(bucket.color),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{bucket.label.replace('+', '')}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Secondary Breakdown */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailsTitle}>Timeline details</Text>
              <View style={styles.bucketsContainer}>
                {surgeData.buckets.map((bucket: any, index: number) => (
                  <View key={index} style={[
                    styles.bucketRow,
                    bucket.label === surgeData.bestBucket.label && styles.bestRow
                  ]}>
                    <View
                      style={[
                        styles.bucketIndicator,
                        { backgroundColor: getColorForBucket(bucket.color) },
                      ]}
                    />
                    <Text style={[
                      styles.bucketLabel,
                      bucket.label === surgeData.bestBucket.label && styles.bestText
                    ]}>{bucket.label}</Text>
                    <Text style={[
                      styles.bucketPrice,
                      bucket.label === surgeData.bestBucket.label && styles.bestPriceText
                    ]}>₹{bucket.estimate}</Text>

                    {bucket.label === surgeData.bestBucket.label && (
                      <View style={styles.bestBadge}>
                        <Text style={styles.bestBadgeText}>Best</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Quote Breakdown Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={quoteModalVisible}
        onRequestClose={() => setQuoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {bookingConfirmed ? 'Booking Confirmed' :
                  initOrder ? 'Review & Pay' :
                    'Fare Breakdown'}
              </Text>
              <TouchableOpacity onPress={() => setQuoteModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {bookingConfirmed && driverDetails ? (
              <View style={styles.quoteDetails}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                <Text style={[styles.quoteTotal, { marginTop: 10, fontSize: 18 }]}>Ride Scheduled!</Text>
                <Text style={styles.ondcProvider}>{driverDetails.name}</Text>
                <Text style={styles.ondcVehicle}>{driverDetails.vehicle}</Text>
                <Text style={styles.ondcEtaText}>OTP: 1234</Text>
              </View>
            ) : (
              selectedQuote && (
                <View style={styles.quoteDetails}>
                  <Text style={styles.quoteTotal}>₹{selectedQuote.price?.value}</Text>
                  <Text style={styles.quoteCurrency}>{selectedQuote.price?.currency}</Text>

                  <View style={styles.divider} />

                  {selectedQuote.breakup?.map((item: any, idx: number) => (
                    <View key={idx} style={styles.breakupRow}>
                      <Text style={styles.breakupTitle}>{item.title}</Text>
                      <Text style={styles.breakupPrice}>₹{item.price?.value}</Text>
                    </View>
                  ))}

                  {initOrder && (
                    <View style={{ marginTop: 16, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8, width: '100%' }}>
                      <Text style={{ fontWeight: 'bold' }}>Billing To:</Text>
                      <Text>{initOrder.billing?.name}</Text>
                      <Text>{initOrder.billing?.phone}</Text>
                    </View>
                  )}
                </View>
              )
            )}

            {!bookingConfirmed && (
              <TouchableOpacity
                style={[styles.proceedButton, (initLoading || confirmLoading) && { opacity: 0.7 }]}
                onPress={initOrder ? handleConfirmBooking : handleProceedToPay}
                disabled={initLoading || confirmLoading}
              >
                {initLoading || confirmLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.proceedButtonText}>
                    {initOrder ? 'Confirm Booking' : 'Proceed to Pay'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {bookingConfirmed && (
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={() => {
                  setQuoteModalVisible(false);
                  router.replace('/success');
                }}
              >
                <Text style={styles.proceedButtonText}>Done</Text>
              </TouchableOpacity>
            )}

          </View>
        </View>
      </Modal>

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
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  routeHeader: {
    marginVertical: 12,
  },
  routeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  mainActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  bestTimeInfo: {
    marginBottom: 20,
  },
  bestTimeTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  bestTimeValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },
  bestPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  savingsText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  bookNowButton: {
    backgroundColor: '#000000',
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  bookNowText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  chartContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 5,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  bar: {
    width: 12,
    borderRadius: 6,
    minHeight: 15,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  detailsSection: {
    marginBottom: 40,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    marginLeft: 4,
  },
  bucketsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 8,
  },
  bucketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bestRow: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderBottomWidth: 0,
    marginVertical: 2,
  },
  bucketIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 16,
  },
  bucketLabel: {
    flex: 1,
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  bestText: {
    color: '#065F46',
    fontWeight: '700',
  },
  bucketPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
  },
  bestPriceText: {
    color: '#059669',
  },
  bestBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 10,
  },
  bestBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  ondcSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  ondcLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
  },
  ondcLoadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  ondcCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ondcCardContent: {
    flex: 1,
    marginRight: 12,
  },
  ondcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ondcProvider: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  ondcPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  ondcVehicle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  ondcMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  ondcEtaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  ondcEtaText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  brainTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brainTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  quoteDetails: {
    alignItems: 'center',
    marginBottom: 32,
  },
  quoteTotal: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1F2937',
  },
  quoteCurrency: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginBottom: 24,
  },
  breakupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  breakupTitle: {
    fontSize: 16,
    color: '#4B5563',
  },
  breakupPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  proceedButton: {
    backgroundColor: '#000000',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
```
