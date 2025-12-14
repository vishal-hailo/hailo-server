import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface LocationResult {
    label: string;
    address: string;
    latitude: number;
    longitude: number;
}

interface LocationSearchProps {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (location: LocationResult) => void;
    title?: string;
    placeholder?: string;
}

// Simple predefined locations for Mumbai (can be replaced with API autocomplete)
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

export default function LocationSearch({
    visible,
    onClose,
    onSelectLocation,
    title = 'Search Location',
    placeholder = 'Search for a place...',
}: LocationSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);

    const filteredLocations = POPULAR_LOCATIONS.filter(
        (loc) =>
            loc.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCurrentLocation = async () => {
        setLoadingCurrentLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Location permission denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const geocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            const address = geocode[0];
            onSelectLocation({
                label: 'Current Location',
                address: `${address.street || ''}, ${address.city || ''}`,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            onClose();
        } catch (error) {
            console.error('Current location error:', error);
            alert('Failed to get current location');
        } finally {
            setLoadingCurrentLocation(false);
        }
    };

    const handleSelectLocation = (location: LocationResult) => {
        onSelectLocation(location);
        setSearchQuery('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{title}</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Search Input */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={placeholder}
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Current Location Option */}
                <TouchableOpacity
                    style={styles.currentLocationButton}
                    onPress={handleCurrentLocation}
                    disabled={loadingCurrentLocation}
                >
                    <View style={styles.currentLocationIcon}>
                        {loadingCurrentLocation ? (
                            <ActivityIndicator size="small" color="#FF6B35" />
                        ) : (
                            <Ionicons name="locate" size={20} color="#FF6B35" />
                        )}
                    </View>
                    <View style={styles.currentLocationText}>
                        <Text style={styles.currentLocationLabel}>
                            {loadingCurrentLocation ? 'Getting location...' : 'Use Current Location'}
                        </Text>
                        <Text style={styles.currentLocationSubtext}>GPS location</Text>
                    </View>
                </TouchableOpacity>

                {/* Location Results */}
                <FlatList
                    data={filteredLocations}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.locationItem}
                            onPress={() => handleSelectLocation(item)}
                        >
                            <View style={styles.locationIcon}>
                                <Ionicons name="location" size={20} color="#6B7280" />
                            </View>
                            <View style={styles.locationInfo}>
                                <Text style={styles.locationLabel}>{item.label}</Text>
                                <Text style={styles.locationAddress}>{item.address}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No locations found</Text>
                            <Text style={styles.emptySubtext}>Try a different search term</Text>
                        </View>
                    }
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 60,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    placeholder: {
        width: 40,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginVertical: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    currentLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FED7AA',
        backgroundColor: '#FFF7ED',
    },
    currentLocationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    currentLocationText: {
        flex: 1,
    },
    currentLocationLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    currentLocationSubtext: {
        fontSize: 14,
        color: '#6B7280',
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 8,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
    },
    locationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationInfo: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    locationAddress: {
        fontSize: 14,
        color: '#6B7280',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
    },
});
