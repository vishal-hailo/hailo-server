import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

export interface LocationData {
    label: string;
    address: string;
    latitude: number;
    longitude: number;
}

/**
 * Checks if a coordinate is the default San Francisco location used by the iOS simulator.
 */
export const isSimulatorLocation = (latitude: number, longitude: number): boolean => {
    // Known iOS Simulator defaults:
    // 1. Apple HQ (Cupertino): ~37.33, -122.03
    // 2. Union Square (San Francisco): ~37.78, -122.40

    const isAppleHQ = Math.abs(latitude - 37.33) < 0.01 && Math.abs(longitude - (-122.03)) < 0.01;
    const isUnionSquare = Math.abs(latitude - 37.78) < 0.1 && Math.abs(longitude - (-122.40)) < 0.1;

    return isAppleHQ || isUnionSquare;
};

/**
 * Fetches the current location with high accuracy.
 * Includes a check for simulator defaults and warns the user.
 */
export const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Location permission is required to find your current position.');
            return null;
        }

        // Use highest accuracy
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
        });

        const { latitude, longitude } = location.coords;

        // Detect simulator
        if (Platform.OS === 'ios' && isSimulatorLocation(latitude, longitude)) {
            Alert.alert(
                'Simulator Detected',
                'It looks like you are using a simulator which defaults to San Francisco. Please set a custom location in the simulator features (Features -> Location -> Custom Location) to test with an India address.',
                [{ text: 'OK' }]
            );
        }

        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });

        let address = 'Current Location';
        let label = 'Current Location';

        if (geocode.length > 0) {
            const addr = geocode[0];
            address = [addr.name, addr.street, addr.city, addr.region]
                .filter(Boolean)
                .join(', ');
            label = addr.name || addr.street || 'Current Location';
        }

        return {
            label,
            address,
            latitude,
            longitude,
        };
    } catch (error) {
        console.error('Error fetching location:', error);
        Alert.alert('Error', 'Failed to get your current location. Please try entering it manually.');
        return null;
    }
};
