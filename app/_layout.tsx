import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/context/AuthContext';
import { ModeProvider } from '@/context/ModeContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <ModeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="property/[id]"
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
            <Stack.Screen name="subscription" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="my-listings" />
            <Stack.Screen name="my-requests" />
            <Stack.Screen name="property-interests" />
            <Stack.Screen
              name="admin/index"
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="conversation/[id]"
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ModeProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
