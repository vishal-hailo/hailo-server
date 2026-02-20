import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};
export const API_URL = extra.EXPO_PUBLIC_BACKEND_URL || 'https://api.hailone.in';

console.log('API_URL configured as:', API_URL);
