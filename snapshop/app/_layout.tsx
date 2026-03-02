import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { ThemeProvider } from '../contexts/ThemeContext';

SplashScreen.preventAutoHideAsync();

const smoothTransition = {
  animation: 'slide_from_right' as const,
  config: {
    duration: 350,
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            ...(Platform.OS === 'web' ? { animation: 'fade' } : {}),
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="login" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="signup" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="verify-phone" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="new-password" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="success" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="product/[id]" options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="checkout" options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="add-address" options={{ animation: 'slide_from_bottom', presentation: 'card' }} />
          <Stack.Screen name="order-success" options={{ animation: 'fade', presentation: 'transparentModal' }} />
          <Stack.Screen name="orders" options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="order-details" options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="track-order" options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="payment-methods" options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="notifications" options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="language" options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="help-center" options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="about-us" options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="reviews" options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right', presentation: 'card' }} />
          <Stack.Screen name="addresses" options={{ animation: 'slide_from_right', presentation: 'card' }} />
        </Stack>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
