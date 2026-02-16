import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SettingsProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding/index" />
            <Stack.Screen name="auth/phone" />
            <Stack.Screen name="auth/otp" />
            <Stack.Screen name="auth/register" />
            <Stack.Screen name="auth/email" />
            <Stack.Screen name="location-setup" />
            <Stack.Screen name="locations-manager" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="surge-radar" options={{ presentation: 'modal' }} />
            <Stack.Screen name="plan-ride" />
            <Stack.Screen name="search" />
            <Stack.Screen name="success" />
          </Stack>
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
