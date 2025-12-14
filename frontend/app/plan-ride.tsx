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
    const params = useLocalSearchParams();

    // State
    const [originQuery, setOriginQuery] = useState('');
    const [destQuery, setDestQuery] = useState('');
    const [originResults, setOriginResults] = useState(POPULAR_LOCATIONS);
    const [destResults, setDestResults] = useState(POPULAR_LOCATIONS);
    const [focusedInput, setFocusedInput] = useState<'origin' | 'dest'>('dest');

    const [originLocation, setOriginLocation] = useState<any>(null);
    const [destLocation, setDestLocation] = useState<any>(null);

    const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);

    // Refs for inputs to manage focus
    const originInputRef = useRef<TextInput>(null);
    const destInputRef = useRef<TextInput>(null);

    // Initialize
    useEffect(() => {
        // If params has pre-filled locations (e.g. from saved locations)
        // For now we'll assume fresh start or handle specifically

        // Default origin to "Current Location" placeholder logic could go here
        // checking permissions etc.
        // For this prototype, we'll leave it empty or user types.

        // Auto-focus destination
        setTimeout(() => {
            destInputRef.current?.focus();
        }, 500);
    }, []);

    // Filtering
    useEffect(() => {
        if (originQuery) {
            setOriginResults(POPULAR_LOCATIONS.filter(l =>
                l.label.toLowerCase().includes(originQuery.toLowerCase()) ||
                l.address.toLowerCase().includes(originQuery.toLowerCase())
            ));
        } else {
            setOriginResults(POPULAR_LOCATIONS);
        }
    }, [originQuery]);

    useEffect(() => {
        if (destQuery) {
            setDestResults(POPULAR_LOCATIONS.filter(l =>
                l.label.toLowerCase().includes(destQuery.toLowerCase()) ||
                l.address.toLowerCase().includes(destQuery.toLowerCase())
            ));
        } else {
            setDestResults(POPULAR_LOCATIONS);
        }
    }, [destQuery]);

    const handleGetCurrentLocation = async () => {
        setLoadingCurrentLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Location permission denied');
                setLoadingCurrentLocation(false);
                return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            const geocode = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
            });
            const address = geocode[0];
            const locationData = {
                label: 'Current Location',
                address: `${address.street || ''}, ${address.city || ''}`,
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
            };

            setOriginLocation(locationData);
            setOriginQuery('Current Location');

            // Move focus to destination
            setFocusedInput('dest');
            destInputRef.current?.focus();

        } catch (error) {
            console.error(error);
            alert('Failed to get location');
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
        if (!origin || !dest) return; // Should allow current location if not explicitly set? 
        // If origin is null but query is empty, maybe force user to pick one.

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
});
