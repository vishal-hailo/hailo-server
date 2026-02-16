import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView,
    Keyboard
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import { getCurrentLocation } from '../utils/LocationUtils';

// Simple predefined locations for Mumbai
const POPULAR_LOCATIONS = [
    { label: 'Bandra Station', address: 'Bandra West, Mumbai', latitude: 19.0544, longitude: 72.8406 },
    { label: 'Gateway of India', address: 'Apollo Bandar, Mumbai', latitude: 18.9220, longitude: 72.8347 },
    { label: 'Chhatrapati Shivaji Terminus', address: 'Fort, Mumbai', latitude: 18.9398, longitude: 72.8355 },
    { label: 'Andheri Station', address: 'Andheri West, Mumbai', latitude: 19.1197, longitude: 72.8464 },
    { label: 'Powai Lake', address: 'Powai, Mumbai', latitude: 19.1176, longitude: 72.9060 },
    { label: 'BKC', address: 'Bandra Kurla Complex, Mumbai', latitude: 19.0653, longitude: 72.8687 },
    { label: 'Dadar Station', address: 'Dadar, Mumbai', latitude: 19.0176, longitude: 72.8433 },
    { label: 'Worli Sea Face', address: 'Worli, Mumbai', latitude: 19.0110, longitude: 72.8160 },
    { label: 'Lower Parel', address: 'Lower Parel, Mumbai', latitude: 18.9984, longitude: 72.8301 },
    { label: 'Colaba', address: 'Colaba, Mumbai', latitude: 18.9067, longitude: 72.8147 },
    { label: 'Juhu Beach', address: 'Juhu, Mumbai', latitude: 19.0989, longitude: 72.8267 },
    { label: 'Marine Drive', address: 'Marine Lines, Mumbai', latitude: 18.9432, longitude: 72.8236 },
    { label: 'Churchgate Station', address: 'Churchgate, Mumbai', latitude: 18.9322, longitude: 72.8264 },
    { label: 'Santacruz Airport', address: 'Santacruz, Mumbai', latitude: 19.0896, longitude: 72.8656 },
    { label: 'Phoenix Mall', address: 'Lower Parel, Mumbai', latitude: 18.9952, longitude: 72.8289 },
];

export default function PlanRideScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        destLat?: string;
        destLng?: string;
        destLabel?: string;
        destAddress?: string;
    }>();

    // State
    const [originQuery, setOriginQuery] = useState('');
    const [destQuery, setDestQuery] = useState('');
    const [originResults, setOriginResults] = useState(POPULAR_LOCATIONS);
    const [destResults, setDestResults] = useState(POPULAR_LOCATIONS);
    const [focusedInput, setFocusedInput] = useState<'origin' | 'dest'>('dest');

    const [originLocation, setOriginLocation] = useState<any>(null);
    const [destLocation, setDestLocation] = useState<any>(null);

    const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
    const [savedLocations, setSavedLocations] = useState<any[]>([]);

    // Refs for inputs to manage focus
    const originInputRef = useRef<TextInput>(null);
    const destInputRef = useRef<TextInput>(null);
    const hasInitialized = useRef(false);

    // Initialize screen from params
    useEffect(() => {
        loadSavedLocations();

        if (hasInitialized.current) return;

        const { destLat, destLng, destLabel, destAddress } = params;

        if (destLat && destLng) {
            const prefilledDest = {
                label: destLabel || 'Destination',
                address: destAddress || '',
                latitude: parseFloat(destLat),
                longitude: parseFloat(destLng),
            };
            setDestLocation(prefilledDest);
            setDestQuery(prefilledDest.label);

            // If we have destination, focus origin to get the starting point
            setFocusedInput('origin');
            setTimeout(() => {
                originInputRef.current?.focus();
            }, 300);
            hasInitialized.current = true;
        } else {
            // Auto-focus destination if starting fresh
            setTimeout(() => {
                destInputRef.current?.focus();
            }, 500);
            hasInitialized.current = true;
        }
    }, [params.destLat, params.destLng, params.destLabel, params.destAddress]);

    const loadSavedLocations = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;

            const response = await axios.get(`${API_URL}/api/v1/locations`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSavedLocations(response.data);
        } catch (error) {
            console.error('Load saved locations error:', error);
        }
    };

    // Combined locations for search
    const allLocations = [...savedLocations, ...POPULAR_LOCATIONS];
    const uniqueLocations = allLocations.filter((v, i, a) =>
        a.findIndex(t => t.address === v.address) === i
    );

    // Filtering
    useEffect(() => {
        if (originQuery) {
            setOriginResults(uniqueLocations.filter(l =>
                l.label?.toLowerCase().includes(originQuery.toLowerCase()) ||
                l.address?.toLowerCase().includes(originQuery.toLowerCase())
            ));
        } else {
            setOriginResults(uniqueLocations);
        }
    }, [originQuery, savedLocations]);

    useEffect(() => {
        if (destQuery) {
            setDestResults(uniqueLocations.filter(l =>
                l.label?.toLowerCase().includes(destQuery.toLowerCase()) ||
                l.address?.toLowerCase().includes(destQuery.toLowerCase())
            ));
        } else {
            setDestResults(uniqueLocations);
        }
    }, [destQuery, savedLocations]);

    const handleGetCurrentLocation = async () => {
        setLoadingCurrentLocation(true);
        try {
            const locationData = await getCurrentLocation();
            if (locationData) {
                setOriginLocation(locationData);
                setOriginQuery('Current Location');

                // Move focus to destination
                setFocusedInput('dest');
                destInputRef.current?.focus();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingCurrentLocation(false);
        }
    };

    const handleSelectLocation = (location: any, type: 'origin' | 'dest') => {
        if (type === 'origin') {
            setOriginLocation(location);
            setOriginQuery(location.label);
            setFocusedInput('dest');
            destInputRef.current?.focus();
        } else {
            setDestLocation(location);
            setDestQuery(location.label);

            // If we have both, navigate!
            if (originLocation || (type === 'dest' && originLocation)) {
                navigateToSurgeRadar(originLocation, location);
            } else {
                // If origin is missing, focus it
                setFocusedInput('origin');
                originInputRef.current?.focus();
            }
        }
    };

    const navigateToSurgeRadar = (origin: any, dest: any) => {
        if (!origin || !dest) {
            // If they just typed something, try to match from uniqueLocations
            const matchedOrigin = origin || uniqueLocations.find(l => l.label === originQuery);
            const matchedDest = dest || uniqueLocations.find(l => l.label === destQuery);

            if (!matchedOrigin || !matchedDest) {
                Alert.alert('Incomplete Trip', 'Please select both locations from the list to see surge data.');
                return;
            }

            origin = matchedOrigin;
            dest = matchedDest;
        }

        router.push({
            pathname: '/surge-radar',
            params: {
                originLat: origin.latitude,
                originLng: origin.longitude,
                destLat: dest.latitude,
                destLng: dest.longitude,
                routeName: `${origin.label} → ${dest.label}`,
            },
        });
    };

    const renderLocationItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.resultItem}
            onPress={() => handleSelectLocation(item, focusedInput)}
        >
            <View style={styles.resultIconContainer}>
                <Ionicons name="location" size={20} color="#6B7280" />
            </View>
            <View style={styles.resultTextContainer}>
                <Text style={styles.resultLabel}>{item.label}</Text>
                <Text style={styles.resultAddress}>{item.address}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Plan your ride</Text>
            </View>

            <View style={styles.inputContainer}>
                <View style={styles.timelineContainer}>
                    <View style={styles.dot} />
                    <View style={styles.line} />
                    <View style={styles.square} />
                </View>

                <View style={styles.inputs}>
                    <TextInput
                        ref={originInputRef}
                        style={[
                            styles.input,
                            focusedInput === 'origin' && styles.focusedInput
                        ]}
                        placeholder="Current Location"
                        value={originQuery}
                        onChangeText={(text) => {
                            setOriginQuery(text);
                            if (originLocation && text !== originLocation.label) {
                                setOriginLocation(null);
                            }
                        }}
                        onFocus={() => setFocusedInput('origin')}
                        autoCapitalize="words"
                    />
                    <View style={styles.divider} />
                    <TextInput
                        ref={destInputRef}
                        style={[
                            styles.input,
                            focusedInput === 'dest' && styles.focusedInput
                        ]}
                        placeholder="Where to?"
                        value={destQuery}
                        onChangeText={(text) => {
                            setDestQuery(text);
                            if (destLocation && text !== destLocation.label) {
                                setDestLocation(null);
                            }
                        }}
                        onFocus={() => setFocusedInput('dest')}
                        autoCapitalize="words"
                    />
                </View>

                {/* Swap button could go here */}
            </View>

            {/* Special Options Row (Current Location) only for Origin */}
            {focusedInput === 'origin' && !originQuery && (
                <TouchableOpacity style={styles.currentLocationRow} onPress={handleGetCurrentLocation}>
                    {loadingCurrentLocation ? (
                        <ActivityIndicator size="small" color="#FF6B35" />
                    ) : (
                        <View style={styles.specialIconBg}>
                            <Ionicons name="navigate" size={18} color="#FF6B35" />
                        </View>
                    )}
                    <Text style={styles.currentLocationText}>Use Current Location</Text>
                </TouchableOpacity>
            )}

            <FlatList
                data={focusedInput === 'origin' ? originResults : destResults}
                keyExtractor={(item) => item.label + item.address}
                renderItem={renderLocationItem}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
            />

            {(originQuery && destQuery) && (
                <TouchableOpacity
                    style={styles.proceedButton}
                    onPress={() => navigateToSurgeRadar(originLocation, destLocation)}
                >
                    <Text style={styles.proceedButtonText}>See Surge Prices</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            )}

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
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 4,
        borderBottomColor: '#F3F4F6',
    },
    timelineContainer: {
        alignItems: 'center',
        paddingTop: 12,
        marginRight: 12,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#9CA3AF',
    },
    line: {
        width: 1,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
    },
    square: {
        width: 8,
        height: 8,
        backgroundColor: '#1F2937', // Destination color
    },
    inputs: {
        flex: 1,
    },
    input: {
        height: 40,
        fontSize: 16,
        paddingHorizontal: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
    },
    focusedInput: {
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FF6B35',
    },
    divider: {
        height: 12, // Spacer
    },
    currentLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    specialIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF7ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    currentLocationText: {
        fontSize: 16,
        color: '#FF6B35',
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 24,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    resultIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    resultTextContainer: {
        flex: 1,
    },
    resultLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 2,
    },
    resultAddress: {
        fontSize: 14,
        color: '#6B7280',
    },
    proceedButton: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: '#FF6B35',
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        gap: 8,
    },
    proceedButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
