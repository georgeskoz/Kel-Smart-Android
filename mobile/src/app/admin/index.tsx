import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  Database,
  AlertTriangle,
  Wifi,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/state/authStore';
import { signOut, getAllUsers, getAllTanks, subscribeAlerts, isFirebaseConfigured } from '@/lib/firebase';
import { MOCK_TANKS, MOCK_ALERTS } from '@/lib/tankData';
import type { UserProfile } from '@/lib/state/authStore';
import { Copyright } from '@/components/Copyright';

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={[styles.statCard, { borderColor: `${color}33` }]}>
      <LinearGradient
        colors={[`${color}18`, `${color}08`]}
        style={styles.statCardGradient}
      >
        <View style={[styles.statIconWrap, { backgroundColor: `${color}22` }]}>
          {icon}
        </View>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </View>
  );
}

function QuickActionRow({
  icon,
  label,
  subtitle,
  onPress,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  onPress: () => void;
  accent: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: `${accent}22`, borderColor: `${accent}33` }]}>
        {icon}
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={16} color="#9CA3AF" />
    </Pressable>
  );
}

function UserAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#26335F', '#EF4444'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}33`, borderColor: `${color}66` }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36, color }]}>{initials}</Text>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTanks, setTotalTanks] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [onlineSensors, setOnlineSensors] = useState(0);
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      try {
        const [users, tanks] = await Promise.all([getAllUsers(), getAllTanks()]);
        const usersResult = users.length > 0 ? users : [];
        const tanksResult = tanks.length > 0 ? tanks : MOCK_TANKS;

        setTotalUsers(usersResult.length);
        setTotalTanks(tanksResult.length);
        setOnlineSensors(tanksResult.filter((t) => t.online).length);

        // Sort by createdAt desc, take last 5
        const sorted = [...usersResult].sort(
          (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
        );
        setRecentUsers(sorted.slice(0, 5));
      } catch (e) {
        setTotalTanks(MOCK_TANKS.length);
        setOnlineSensors(MOCK_TANKS.filter((t) => t.online).length);
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setActiveAlerts(MOCK_ALERTS.filter((a) => a.type !== 'restored').length);
      return;
    }
    const unsub = subscribeAlerts((alerts) => {
      setActiveAlerts(alerts.length);
    });
    return unsub;
  }, []);

  async function handleLogout() {
    await signOut();
    logout();
    router.replace('/login' as any);
  }

  const firstName = user?.displayName?.split(' ')[0] ?? 'Admin';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#FEF2F2', '#FEE2E2']}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <View style={styles.adminBadgeRow}>
              <Shield size={14} color="#DC2626" />
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
            <Text style={styles.headerTitle}>Control Panel</Text>
            <Text style={styles.headerGreeting}>Welcome, {firstName}</Text>
          </View>
          <Pressable
            testID="admin-logout-button"
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
          >
            <LogOut size={18} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Grid */}
          <Text style={styles.sectionTitle}>SYSTEM OVERVIEW</Text>
          {loadingStats ? (
            <ActivityIndicator color="#26335F" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.statsGrid}>
              <StatCard
                label="Total Users"
                value={totalUsers}
                color="#3B82F6"
                icon={<Users size={18} color="#3B82F6" />}
              />
              <StatCard
                label="Total Tanks"
                value={totalTanks}
                color="#26335F"
                icon={<Database size={18} color="#26335F" />}
              />
              <StatCard
                label="Active Alerts"
                value={activeAlerts}
                color="#DC2626"
                icon={<AlertTriangle size={18} color="#DC2626" />}
              />
              <StatCard
                label="Online Sensors"
                value={onlineSensors}
                color="#10B981"
                icon={<Wifi size={18} color="#10B981" />}
              />
            </View>
          )}

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.card}>
            <QuickActionRow
              icon={<Users size={18} color="#3B82F6" />}
              label="Manage Users"
              subtitle="View, edit and control user accounts"
              onPress={() => router.push('/admin/users' as any)}
              accent="#3B82F6"
            />
            <View style={styles.divider} />
            <QuickActionRow
              icon={<Database size={18} color="#26335F" />}
              label="View All Tanks"
              subtitle="Monitor all connected tank sensors"
              onPress={() => router.push('/(tabs)' as any)}
              accent="#26335F"
            />
            <View style={styles.divider} />
            <QuickActionRow
              icon={<AlertTriangle size={18} color="#DC2626" />}
              label="System Alerts"
              subtitle="Review active alerts and incidents"
              onPress={() => router.push('/(tabs)/alerts' as any)}
              accent="#DC2626"
            />
            <View style={styles.divider} />
            <QuickActionRow
              icon={<Shield size={18} color="#8B5CF6" />}
              label="Settings"
              subtitle="System configuration and preferences"
              onPress={() => router.push('/(tabs)/settings' as any)}
              accent="#8B5CF6"
            />
          </View>

          {/* Recent Users */}
          {recentUsers.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>RECENT USERS</Text>
                <Pressable onPress={() => router.push('/admin/users' as any)}>
                  <Text style={styles.seeAll}>See All</Text>
                </Pressable>
              </View>
              <View style={styles.card}>
                {recentUsers.map((u, idx) => (
                  <React.Fragment key={u.uid}>
                    {idx > 0 && <View style={styles.divider} />}
                    <View style={styles.userRow}>
                      <UserAvatar name={u.displayName || u.email} size={38} />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{u.displayName || 'Unknown'}</Text>
                        <Text style={styles.userEmail} numberOfLines={1}>{u.email}</Text>
                      </View>
                      <View style={[
                        styles.roleBadge,
                        u.role === 'admin'
                          ? { backgroundColor: '#DC262622', borderColor: '#DC262644' }
                          : { backgroundColor: '#10B98122', borderColor: '#10B98144' },
                      ]}>
                        <Text style={[
                          styles.roleBadgeText,
                          { color: u.role === 'admin' ? '#DC2626' : '#10B981' },
                        ]}>
                          {u.role.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
          <Copyright />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DC262633',
  },
  headerLeft: {
    gap: 2,
  },
  adminBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  adminBadgeText: {
    fontSize: 10,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#DC2626',
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
    letterSpacing: 0.5,
  },
  headerGreeting: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
    marginTop: 1,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
    letterSpacing: 2,
    marginBottom: 10,
    marginLeft: 2,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  seeAll: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#26335F',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: '47.5%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'IBMPlexMono_700Bold',
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  actionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  avatar: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'IBMPlexMono_700Bold',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  userEmail: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontFamily: 'IBMPlexMono_700Bold',
    letterSpacing: 0.8,
  },
});
