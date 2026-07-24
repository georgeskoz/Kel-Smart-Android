import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: '#F8F9FA' },
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#F59E0B',
        headerTitleStyle: { color: '#111827' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="users"
        options={{
          title: 'Manage Users',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#F59E0B',
          headerTitleStyle: { color: '#111827', fontFamily: 'IBMPlexMono_700Bold' },
        }}
      />
      <Stack.Screen
        name="install-device"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
