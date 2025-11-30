import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/phone" />
        <Stack.Screen name="auth/otp" />
        <Stack.Screen name="home" />
        <Stack.Screen name="surge-radar" options={{ presentation: 'modal' }} />
        <Stack.Screen name="success" />
        <Stack.Screen name="insights" />
      </Stack>
    </>
  );
}
