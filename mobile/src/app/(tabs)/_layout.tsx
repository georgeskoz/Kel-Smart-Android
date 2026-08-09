import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Database, Bell, Settings, Shield } from 'lucide-react-native';
import { useAuthStore } from '@/lib/state/authStore';

export default function TabLayout() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#26335F',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Database size={size} color={color} />
          ),
          headerShown: role === 'admin',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#26335F',
          headerTitle: 'All Tanks',
          headerTitleStyle: { color: '#111827', fontFamily: 'IBMPlexMono_700Bold' },
          headerRight: () =>
            role === 'admin' ? (
              <Pressable
                onPress={() => router.push('/admin' as any)}
                style={({ pressed }) => [styles.adminBtn, pressed && { opacity: 0.7 }]}
              >
                <Shield size={14} color="#DC2626" />
                <Text style={styles.adminBtnText}>Admin</Text>
              </Pressable>
            ) : null,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Bell size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DC262618',
    borderWidth: 1,
    borderColor: '#DC262633',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 16,
  },
  adminBtnText: {
    fontSize: 12,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
});
