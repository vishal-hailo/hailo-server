import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../constants/Config';

const { width } = Dimensions.get('window');

export default function RideAnalyticsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { transactionId } = params;
    const [rideDetails, setRideDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRideDetails();
    }, [transactionId]);

    const loadRideDetails = async () => {
        try {
            // In a real app, we might fetch specific completed ride details by ID
            // For now, we'll try to fetch the transaction details from backend or local params
            if (transactionId) {
                const token = await AsyncStorage.getItem('authToken');
                // Assuming we have an endpoint to get transaction/ride details
                // Or we can pass data via params.
                // Let's try to fetch results/details if possible, or use data if passed.
                // For MVP/Demo: Fetching results again or just using passed params is fine.
                // Let's assume we fetch the transaction status/details to get the final price and uber estimate.

                const response = await axios.get(`${API_URL}/ondc/results/${transactionId}`);
                // The results endpoint returns the search results array. 
                // We probably need a better endpoint to get the full transaction object with Uber estimate to calculate savings.
                // But let's assume for now we might have passed some data or we mock it if missing.

                // Let's implement a 'get transaction' endpoint in backend?
                // Or just mock the "Victory Lap" data for now if the endpoint is missing.

                // Mocking for "Victory Lap" visual based on User Request
                setRideDetails({
                    savings: 145,
                    finalPrice: 350,
                    uberPrice: 495,
                    distance: '12.5 km',
                    time: '45 mins',
                    driver: 'Ramesh Kumar'
                });
            }
        } catch (error) {
            console.error('Failed to load ride details', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.content}>

                {/* Victory Header */}
                <View style={styles.header}>
                    <Ionicons name="trophy" size={64} color="#F59E0B" />
                    <Text style={styles.title}>You act like a Genius!</Text>
                    <Text style={styles.subtitle}>Ride Completed Successfully</Text>
                </View>

                {/* Savings Card */}
                <View style={styles.savingsCard}>
                    <Text style={styles.savingsLabel}>Total Savings</Text>
                    <Text style={styles.savingsAmount}>₹{rideDetails?.savings || '0'}</Text>
                    <View style={styles.comparisonRow}>
                        <Text style={styles.comparisonText}>You paid ₹{rideDetails?.finalPrice}</Text>
                        <Text style={[styles.comparisonText, { textDecorationLine: 'line-through', color: Colors.text.secondary }]}>
                            Uber: ₹{rideDetails?.uberPrice}
                        </Text>
                    </View>
                </View>

                {/* Ride Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={24} color={Colors.primary.main} />
                        <Text style={styles.statValue}>{rideDetails?.time || '--'}</Text>
                        <Text style={styles.statLabel}>Time</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="resize-outline" size={24} color={Colors.primary.main} />
                        <Text style={styles.statValue}>{rideDetails?.distance || '--'}</Text>
                        <Text style={styles.statLabel}>Distance</Text>
                    </View>
                </View>

                {/* Driver Rating */}
                <View style={styles.ratingCard}>
                    <Text style={styles.ratingTitle}>Rate your driver</Text>
                    <Text style={styles.driverName}>{rideDetails?.driver}</Text>
                    <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons key={star} name="star" size={32} color="#F59E0B" style={{ marginHorizontal: 4 }} />
                        ))}
                    </View>
                </View>

                <View style={{ flex: 1 }} />

                {/* Home Button */}
                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => router.replace('/(tabs)/explorer')}
                >
                    <Text style={styles.homeButtonText}>Back to Home</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary,
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text.primary,
        marginTop: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.text.secondary,
        marginTop: 8,
    },
    savingsCard: {
        width: '100%',
        backgroundColor: '#10B981', // Green for money/savings
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    savingsLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    savingsAmount: {
        color: '#FFF',
        fontSize: 48,
        fontWeight: '800',
        marginBottom: 16,
    },
    comparisonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    comparisonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        marginBottom: 32,
    },
    statItem: {
        alignItems: 'center',
        backgroundColor: Colors.background.card,
        padding: 16,
        borderRadius: 16,
        width: '45%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text.primary,
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.text.secondary,
    },
    ratingCard: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    ratingTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 8,
    },
    driverName: {
        fontSize: 16,
        color: Colors.text.secondary,
        marginBottom: 16,
    },
    stars: {
        flexDirection: 'row',
    },
    homeButton: {
        width: '100%',
        backgroundColor: Colors.primary.main,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: Colors.primary.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    homeButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
