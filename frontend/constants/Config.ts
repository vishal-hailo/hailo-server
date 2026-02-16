import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};
export const API_URL = extra.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.29.58:3001';

console.log('API_URL configured as:', API_URL);
