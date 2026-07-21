import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: '#5A5A5A' },
        headerStyle: { backgroundColor: '#252525' },
        headerTintColor: '#F59E0B',
        headerTitleStyle: { color: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="users"
        options={{
          title: 'Manage Users',
          headerStyle: { backgroundColor: '#252525' },
          headerTintColor: '#F59E0B',
          headerTitleStyle: { color: '#FFFFFF', fontFamily: 'IBMPlexMono_700Bold' },
        }}
      />
      <Stack.Screen
        name="install-device"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
