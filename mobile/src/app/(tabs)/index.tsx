import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Plus, Wifi, WifiOff, Archive, Eye, MoreVertical, Edit3 } from 'lucide-react-native';
import {
  MOCK_TANKS,
  MOCK_ALERTS,
  Tank,
  TankAlert,
  getTankStatus,
  getTankTypeColor,
  getStatusColor,
  formatVolume,
  getSignalBars,
  formatRelativeTime,
} from '@/lib/tankData';
import { TankFill } from '@/components/TankFill';
import { Copyright } from '@/components/Copyright';
import Svg, {
  Polyline,
  Path as SvgPath,
  Defs as SvgDefs,
  LinearGradient as SvgLinearGradient,
  Stop as SvgStop,
} from 'react-native-svg';
import {
  isFirebaseConfigured,
  subscribeUserTanks,
  subscribeSensors,
  subscribeAlerts,
  getFirebaseDB,
  subscribeHistory,
} from '@/lib/firebase';
import { useAuthStore } from '@/lib/state/authStore';
import { ref, update as fbUpdate } from 'firebase/database';

function MiniSparkline({
  points,
  color,
  width = 110,
  height = 24,
  id,
}: {
  points: { level: number }[];
  color: string;
  width?: number;
  height?: number;
  id: string;
}) {
  if (points.length < 2) return null;

  const levels = points.map((p) => p.level);
  const minL = Math.min(...levels);
  const maxL = Math.max(...levels);
  const range = maxL - minL || 10;
  const pad = 2;

  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (p.level - minL) / range) * (height - pad * 2);
    return { x, y };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaD = [
    `M ${coords[0].x} ${height}`,
    ...coords.map((c) => `L ${c.x} ${c.y}`),
    `L ${coords[coords.length - 1].x} ${height}`,
    'Z',
  ].join(' ');

  const gradId = `sg-${id}`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <SvgDefs>
        <SvgLinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <SvgStop offset="0" stopColor={color} stopOpacity="0.35" />
          <SvgStop offset="1" stopColor={color} stopOpacity="0" />
        </SvgLinearGradient>
      </SvgDefs>
      <SvgPath d={areaD} fill={`url(#${gradId})`} />
      <Polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SignalIcon({ bars, online }: { bars: number; online: boolean }) {
  if (!online) {
    return <WifiOff size={12} color="#9CA3AF" />;
  }
  return (
    <View style={styles.signalBars}>
      {[1, 2, 3, 4].map((b) => (
        <View
          key={b}
          style={[
            styles.signalBar,
            {
              height: 3 + b * 2,
              backgroundColor: b <= bars ? '#10B981' : '#E5E7EB',
            },
          ]}
        />
      ))}
    </View>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TankActionModal({
  tank,
  visible,
  onClose,
  onViewDetails,
  onEdit,
  onDelete,
}: {
  tank: Tank | null;
  visible: boolean;
  onClose: () => void;
  onViewDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!tank) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.actionSheet}>
          <View style={styles.actionSheetHandle} />
          <Text style={styles.actionSheetTitle} numberOfLines={1}>{tank.name}</Text>
          <Text style={styles.actionSheetSubtitle}>{tank.type} · {tank.level}%</Text>
          <View style={styles.actionSheetDivider} />
          <Pressable
            style={({ pressed }) => [styles.actionSheetBtn, pressed && { opacity: 0.7 }]}
            onPress={onViewDetails}
          >
            <View style={styles.actionSheetBtnIcon}>
              <Eye size={18} color="#26335F" />
            </View>
            <Text style={styles.actionSheetBtnText}>View Details</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionSheetBtn, pressed && { opacity: 0.7 }]}
            onPress={onEdit}
          >
            <View style={[styles.actionSheetBtnIcon, { backgroundColor: '#3B82F618' }]}>
              <Edit3 size={18} color="#3B82F6" />
            </View>
            <Text style={[styles.actionSheetBtnText, { color: '#3B82F6' }]}>Edit Tank</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionSheetBtn, pressed && { opacity: 0.7 }]}
            onPress={onDelete}
          >
            <View style={[styles.actionSheetBtnIcon, { backgroundColor: '#26335F18' }]}>
              <Archive size={18} color="#26335F" />
            </View>
            <Text style={[styles.actionSheetBtnText, { color: '#26335F' }]}>Archive Tank</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionSheetCancelBtn, pressed && { opacity: 0.7 }]}
            onPress={onClose}
          >
            <Text style={styles.actionSheetCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function DeleteConfirmModal({
  tank,
  visible,
  onConfirm,
  onCancel,
}: {
  tank: Tank | null;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!tank) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <View style={styles.confirmCard}>
          <View style={styles.confirmIconWrap}>
            <Archive size={24} color="#26335F" />
          </View>
          <Text style={styles.confirmTitle}>Archive Tank</Text>
          <Text style={styles.confirmMessage}>
            Are you sure you want to archive{' '}
            <Text style={{ color: '#111827', fontFamily: 'Inter_600SemiBold' }}>{tank.name}</Text>
            {'? It will be hidden from your dashboard but can be reactivated later.'}
          </Text>
          <View style={styles.confirmBtnRow}>
            <Pressable style={styles.confirmCancelBtn} onPress={onCancel}>
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmDeleteBtn} onPress={onConfirm}>
              <Text style={styles.confirmDeleteText}>Archive</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

function TankCard({
  tank,
  onLongPress,
}: {
  tank: Tank;
  onLongPress: (tank: Tank) => void;
}) {
  const router = useRouter();
  const status = getTankStatus(tank);
  const statusColor = getStatusColor(status);
  const typeColor = getTankTypeColor(tank.type);
  const signalBars = getSignalBars(tank.signalStrength);
  const volume = formatVolume(tank.level, tank.capacity);
  const relTime = formatRelativeTime(tank.lastUpdated);

  const [histPoints, setHistPoints] = useState<{ level: number; timestamp: Date }[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const unsub = subscribeHistory(tank.id, (pts) => {
      const sampled = pts.length > 24
        ? pts.filter((_, i) => i % Math.ceil(pts.length / 24) === 0).slice(-24)
        : pts;
      setHistPoints(sampled);
    });
    return unsub;
  }, [tank.id]);

  return (
    <Pressable
      testID={`tank-card-${tank.id}`}
      onPress={() =>
        router.push({ pathname: '/tank-detail', params: { id: tank.id } })
      }
      onLongPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress(tank);
      }}
      delayLongPress={400}
      style={({ pressed }) => [styles.tankCard, pressed && { opacity: 0.85 }]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F3F4F6']}
        style={styles.tankCardGradient}
      >
        {/* Left: fill bar */}
        <TankFill
          level={tank.level}
          online={tank.online}
          width={44}
          height={100}
          showLabel
        />

        {/* Main info */}
        <View style={styles.tankInfo}>
          {/* Name row */}
          <View style={styles.tankNameRow}>
            <Text style={styles.tankName} numberOfLines={1}>
              {tank.name}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: `${typeColor}22`, borderColor: `${typeColor}44` }]}>
              <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                {tank.type.toUpperCase()}
              </Text>
            </View>
            <MoreVertical size={14} color="#9CA3AF" />
          </View>

          {/* Level + volume */}
          <View style={styles.levelRow}>
            <Text style={styles.levelValue}>{tank.online ? `${tank.level}` : '--'}</Text>
            <Text style={styles.levelUnit}>%</Text>
            <Text style={styles.volumeText}>
              {tank.online ? `${volume} L` : 'Offline'}
            </Text>
          </View>

          {/* Capacity bar */}
          <View style={styles.capacityBarBg}>
            <View
              style={[
                styles.capacityBarFill,
                {
                  width: `${tank.online ? tank.level : 0}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
            {/* Low alert marker */}
            <View
              style={[
                styles.alertMarker,
                { left: `${tank.lowAlert}%` as unknown as number },
              ]}
            />
          </View>

          {/* Footer */}
          <View style={styles.tankFooter}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status}
            </Text>
            <Text style={styles.separator}>·</Text>
            <Text style={styles.updateTime}>{relTime}</Text>
            <View style={{ flex: 1 }} />
            <SignalIcon bars={signalBars} online={tank.online} />
          </View>

          {histPoints.length >= 2 ? (
            <View style={styles.sparklineRow}>
              <Text style={styles.sparklineLabel}>8h TREND</Text>
              <MiniSparkline
                points={histPoints}
                color={statusColor}
                width={110}
                height={22}
                id={tank.id}
              />
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const firstName = user?.displayName?.split(' ')[0] ?? null;

  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [firebaseLoaded, setFirebaseLoaded] = useState(false);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [alerts, setAlerts] = useState<TankAlert[]>([]);
  const [actionTank, setActionTank] = useState<Tank | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setTanks(MOCK_TANKS);
      setAlerts(MOCK_ALERTS);
      return;
    }

    let unsubSensors: (() => void) | undefined;
    let unsubAlerts: (() => void) | undefined;

    if (user) {
      unsubSensors = subscribeUserTanks(
        user.uid,
        isAdmin,
        (liveTanks) => {
          setTanks(liveTanks);
          setFirebaseLoaded(true);
        },
        (connected) => setFirebaseConnected(connected)
      );
      unsubAlerts = subscribeAlerts((liveAlerts) => setAlerts(liveAlerts));
    } else {
      unsubSensors = subscribeSensors(
        (liveTanks) => {
          setTanks(liveTanks);
          setFirebaseLoaded(true);
        },
        (connected) => setFirebaseConnected(connected)
      );
      unsubAlerts = subscribeAlerts((liveAlerts) => setAlerts(liveAlerts));
    }

    return () => {
      unsubSensors?.();
      unsubAlerts?.();
    };
  }, [user?.uid, isAdmin]);

  const onlineCount = tanks.filter((t) => t.online).length;
  const visibleTankIds = new Set(tanks.map((t) => t.id));
  const visibleAlerts = alerts.filter((a) => visibleTankIds.has(a.tankId));
  const alertCount = visibleAlerts.filter(
    (a) => a.type === 'critical' || a.type === 'low' || a.type === 'offline'
  ).length;

  function handleLongPress(tank: Tank) {
    setActionTank(tank);
    setActionModalVisible(true);
  }

  function handleViewDetails() {
    setActionModalVisible(false);
    if (actionTank) {
      router.push({ pathname: '/tank-detail', params: { id: actionTank.id } });
    }
  }

  function handleEditPress() {
    setActionModalVisible(false);
    if (actionTank) {
      router.push({ pathname: '/edit-tank', params: { id: actionTank.id } });
    }
  }

  function handleDeletePress() {
    setActionModalVisible(false);
    setDeleteModalVisible(true);
  }

  async function handleConfirmDelete() {
    if (!actionTank) return;
    setDeleteModalVisible(false);
    const database = getFirebaseDB();
    if (database) {
      try {
        await fbUpdate(ref(database, `sensors/${actionTank.id}`), { hidden: true });
        setTanks((prev) => prev.filter((t) => t.id !== actionTank.id));
      } catch (e) {
        console.warn('[Dashboard] Archive failed:', e);
      }
    } else {
      setTanks((prev) => prev.filter((t) => t.id !== actionTank.id));
    }
    setActionTank(null);
  }

  const handleAddTank = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/add-tank' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}><Text style={styles.headerTitleAccent}>KEL</Text> Smart</Text>
            {firstName ? (
              <Text style={styles.headerSubtitle}>
                {isAdmin ? `Welcome, ${firstName}` : `Hi, ${firstName}`}
              </Text>
            ) : (
              <Text style={styles.headerSubtitle}>Industrial Monitor</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: firebaseConnected ? '#10B981' : '#26335F' },
              ]}
            />
            <Text style={styles.connectionText}>
              {firebaseConnected ? 'Live' : isFirebaseConfigured() ? 'Connecting' : 'Demo'}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.statsRow}
        >
          <StatCard label="Total Tanks" value={tanks.length} color="#111827" />
          <StatCard label="Online" value={onlineCount} color="#10B981" />
          <StatCard label="Active Alerts" value={alertCount} color="#EF4444" />
          <StatCard
            label="Avg Level"
            value={onlineCount > 0 ? `${Math.round(tanks.filter((t) => t.online).reduce((s, t) => s + t.level, 0) / onlineCount)}%` : '--'}
            color="#26335F"
          />
        </ScrollView>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isAdmin ? 'ALL TANKS' : 'MY TANKS'}
          </Text>
          <Text style={styles.sectionCount}>{tanks.length} units</Text>
        </View>

        {/* Tank list */}
        <ScrollView
          style={styles.tankList}
          contentContainerStyle={styles.tankListContent}
          showsVerticalScrollIndicator={false}
        >
          {tanks.map((tank) => (
            <TankCard key={tank.id} tank={tank} onLongPress={handleLongPress} />
          ))}
          <Copyright />
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* FAB */}
        <Pressable
          testID="add-tank-fab"
          onPress={handleAddTank}
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
        >
          <LinearGradient
            colors={['#26335F', '#1E294C']}
            style={styles.fabGradient}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
          </LinearGradient>
        </Pressable>
      </View>

      <TankActionModal
        tank={actionTank}
        visible={actionModalVisible}
        onClose={() => setActionModalVisible(false)}
        onViewDetails={handleViewDetails}
        onEdit={handleEditPress}
        onDelete={handleDeletePress}
      />

      <DeleteConfirmModal
        tank={actionTank}
        visible={deleteModalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteModalVisible(false); setActionTank(null); }}
      />
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
  headerTitleAccent: {
    color: '#26335F',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 12,
    fontFamily: 'IBMPlexMono_500Medium',
    color: '#111827',
  },
  statsRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 90,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'IBMPlexMono_700Bold',
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
    letterSpacing: 2,
  },
  sectionCount: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#9CA3AF',
  },
  tankList: {
    flex: 1,
  },
  tankListContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tankCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tankCardGradient: {
    flexDirection: 'row',
    padding: 14,
    gap: 14,
    alignItems: 'center',
  },
  tankInfo: {
    flex: 1,
    gap: 6,
  },
  tankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tankName: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: 'IBMPlexMono_700Bold',
    letterSpacing: 0.8,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  levelValue: {
    fontSize: 28,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#111827',
    lineHeight: 32,
  },
  levelUnit: {
    fontSize: 14,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#111827',
    marginBottom: 2,
  },
  volumeText: {
    fontSize: 13,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#111827',
    marginLeft: 8,
    marginBottom: 2,
  },
  capacityBarBg: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'visible',
    position: 'relative',
  },
  capacityBarFill: {
    height: 4,
    borderRadius: 2,
    maxWidth: '100%',
  },
  alertMarker: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 10,
    backgroundColor: '#26335F',
    borderRadius: 1,
    marginLeft: -1,
  },
  tankFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  separator: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  updateTime: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#9CA3AF',
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  signalBar: {
    width: 3,
    borderRadius: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 28,
    shadowColor: '#26335F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
  },
  actionSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    width: '100%',
    gap: 4,
  },
  actionSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    textAlign: 'center',
  },
  actionSheetSubtitle: {
    fontSize: 12,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  actionSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  actionSheetBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#26335F18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  actionSheetCancelBtn: {
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  actionSheetCancelText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 12,
  },
  confirmIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#26335F22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#111827',
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  confirmCancelBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  confirmDeleteBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#26335F',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  sparklineLabel: {
    fontSize: 8,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#9CA3AF',
    letterSpacing: 0.8,
  },
});
