import Constants from 'expo-constants';

// Get backend URL from environment variable
export const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default API_URL;
