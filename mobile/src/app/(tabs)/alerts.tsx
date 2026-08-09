import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  WifiOff,
  TrendingDown,
  TrendingUp,
  CheckCircle,
} from 'lucide-react-native';
import { MOCK_ALERTS, MOCK_TANKS, TankAlert } from '@/lib/tankData';
import { isFirebaseConfigured, subscribeAlerts, subscribeUserTanks } from '@/lib/firebase';
import { useAuthStore } from '@/lib/state/authStore';
import { Copyright } from '@/components/Copyright';

function alertIcon(type: TankAlert['type']) {
  switch (type) {
    case 'critical':
      return <AlertTriangle size={18} color="#EF4444" />;
    case 'low':
      return <TrendingDown size={18} color="#26335F" />;
    case 'high':
      return <TrendingUp size={18} color="#26335F" />;
    case 'offline':
      return <WifiOff size={18} color="#6B7280" />;
    case 'restored':
      return <CheckCircle size={18} color="#10B981" />;
  }
}

function alertColor(type: TankAlert['type']): string {
  switch (type) {
    case 'critical':
      return '#EF4444';
    case 'low':
    case 'high':
      return '#26335F';
    case 'offline':
      return '#6B7280';
    case 'restored':
      return '#10B981';
  }
}

function alertLabel(type: TankAlert['type']): string {
  switch (type) {
    case 'critical':
      return 'CRITICAL';
    case 'low':
      return 'LOW LEVEL';
    case 'high':
      return 'HIGH LEVEL';
    case 'offline':
      return 'OFFLINE';
    case 'restored':
      return 'RESTORED';
  }
}

function formatAlertTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function AlertRow({ alert }: { alert: TankAlert }) {
  const color = alertColor(alert.type);
  const label = alertLabel(alert.type);

  return (
    <View style={[styles.alertCard, { borderLeftColor: color }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
        {alertIcon(alert.type)}
      </View>
      <View style={styles.alertBody}>
        <View style={styles.alertTopRow}>
          <Text style={styles.alertTankName}>{alert.tankName}</Text>
          <View style={[styles.alertBadge, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
            <Text style={[styles.alertBadgeText, { color }]}>{label}</Text>
          </View>
        </View>
        <Text style={styles.alertMessage}>{alert.message}</Text>
        <View style={styles.alertFooter}>
          {alert.level > 0 ? (
            <Text style={styles.alertLevel}>Level: {alert.level}%</Text>
          ) : null}
          <Text style={styles.alertTime}>{formatAlertTime(alert.timestamp)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function AlertsScreen() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [alerts, setAlerts] = useState<TankAlert[]>(MOCK_ALERTS);
  const [visibleTankIds, setVisibleTankIds] = useState<Set<string>>(
    new Set(MOCK_TANKS.map((t) => t.id))
  );

  useEffect(() => {
    if (!isFirebaseConfigured() || !user) return;
    const unsubAlerts = subscribeAlerts((liveAlerts) => setAlerts(liveAlerts));
    const unsubTanks = subscribeUserTanks(
      user.uid,
      isAdmin,
      (liveTanks) => setVisibleTankIds(new Set(liveTanks.map((t) => t.id))),
      () => {}
    );
    return () => {
      unsubAlerts();
      unsubTanks();
    };
  }, [user?.uid, isAdmin]);

  const visibleAlerts = alerts.filter((a) => visibleTankIds.has(a.tankId));
  const active = visibleAlerts.filter((a) => a.type !== 'restored');
  const resolved = visibleAlerts.filter((a) => a.type === 'restored');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#FFFFFF', '#F3F4F6']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Alerts</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{active.length} active</Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Active alerts */}
          <Text style={styles.sectionLabel}>ACTIVE</Text>
          {active.length === 0 ? (
            <View style={styles.emptyCard}>
              <CheckCircle size={32} color="#10B981" />
              <Text style={styles.emptyText}>All systems normal</Text>
            </View>
          ) : (
            active.map((a) => <AlertRow key={a.id} alert={a} />)
          )}

          {/* Resolved */}
          {resolved.length > 0 ? (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>RESOLVED</Text>
              {resolved.map((a) => <AlertRow key={a.id} alert={a} />)}
            </>
          ) : null}

          <View style={{ height: 40 }} />
          <Copyright />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
    letterSpacing: 1,
  },
  countBadge: {
    backgroundColor: '#EF444422',
    borderWidth: 1,
    borderColor: '#EF444444',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 12,
    fontFamily: 'IBMPlexMono_500Medium',
    color: '#EF4444',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
    letterSpacing: 2,
    marginBottom: 10,
    marginLeft: 2,
  },
  alertCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 8,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertBody: {
    flex: 1,
    gap: 4,
  },
  alertTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  alertTankName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    flex: 1,
  },
  alertBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  alertBadgeText: {
    fontSize: 9,
    fontFamily: 'IBMPlexMono_700Bold',
    letterSpacing: 0.8,
  },
  alertMessage: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    lineHeight: 18,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertLevel: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_500Medium',
    color: '#4B5563',
  },
  alertTime: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#9CA3AF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
  },
});
