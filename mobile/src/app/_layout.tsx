import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_700Bold,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { subscribeToAuthState, isFirebaseConfigured } from '@/lib/firebase';
import { useAuthStore } from '@/lib/state/authStore';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const DARK_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#5A5A5A',
    card: '#252525',
    text: '#FFFFFF',
    border: '#30363D',
    primary: '#F59E0B',
  },
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      // No Firebase — skip auth guard, show app directly
      setLoading(false);
      return;
    }

    const unsub = subscribeToAuthState((profile) => {
      setUser(profile);
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'admin';
    const inLoginGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (!user && inAuthGroup) {
      router.replace('/login' as any);
    } else if (user && inLoginGroup) {
      if (user.role === 'admin') {
        router.replace('/admin' as any);
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#5A5A5A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#F59E0B" size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <ThemeProvider value={DARK_THEME}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: '#5A5A5A' },
          headerStyle: { backgroundColor: '#252525' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { color: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="tank-detail"
          options={{
            title: 'Tank Detail',
            headerStyle: { backgroundColor: '#252525' },
            headerTintColor: '#F59E0B',
            headerTitleStyle: { color: '#FFFFFF' },
          }}
        />
        <Stack.Screen
          name="add-tank"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="edit-tank"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="support"
          options={{ headerShown: false }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_700Bold,
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
    return <View style={{ flex: 1, backgroundColor: '#5A5A5A' }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#5A5A5A' }}>
        <StatusBar style="light" />
        <AuthGate>
          <RootLayoutNav />
        </AuthGate>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
