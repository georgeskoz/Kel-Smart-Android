import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Edit3,
  Wifi,
  WifiOff,
  Thermometer,
  Activity,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ref, onValue, off } from 'firebase/database';
import { getFirebaseDB, isFirebaseConfigured, subscribeHistory } from '@/lib/firebase';
import {
  MOCK_TANKS,
  Tank,
  getTankStatus,
  getTankTypeColor,
  getStatusColor,
  formatVolume,
  getSignalBars,
  formatRelativeTime,
} from '@/lib/tankData';
import { Copyright } from '@/components/Copyright';
import { TankFill } from '@/components/TankFill';

function LevelHistoryChart({
  points,
  lowAlert,
  highAlert,
  criticalAlert,
}: {
  points: { level: number; timestamp: Date }[];
  lowAlert: number;
  highAlert: number;
  criticalAlert: number;
}) {
  const CHART_HEIGHT = 180;
  const { width: windowWidth } = useWindowDimensions();
  const [chartWidth, setChartWidth] = useState(windowWidth - 32 - 36 - 6); // fallback: screen - padding - yAxis - gap

  const onChartLayout = useCallback((e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  }, []);

  // Pulsing animation for the latest dot
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 900, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900, easing: Easing.out(Easing.ease) }),
        withTiming(0.6, { duration: 900, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  if (points.length === 0) {
    return (
      <View style={historyStyles.empty}>
        <View style={historyStyles.emptyIconRing}>
          <Activity size={26} color="#4B5563" />
        </View>
        <Text style={historyStyles.emptyTitle}>No History Yet</Text>
        <Text style={historyStyles.emptySubtitle}>
          Data will appear here once your ESP32 starts sending readings
        </Text>
      </View>
    );
  }

  const getZoneColor = (level: number): string => {
    if (level <= criticalAlert) return '#EF4444';
    if (level <= lowAlert) return '#F59E0B';
    if (level >= highAlert) return '#3B82F6';
    return '#10B981';
  };

  // 8-hour window
  const now = Date.now();
  const windowStart = now - 8 * 60 * 60 * 1000;

  // Map a level value to Y pixel (0% at bottom = CHART_HEIGHT, 100% at top = 0)
  const levelToY = (level: number) => ((100 - level) / 100) * CHART_HEIGHT;

  // Map a timestamp to X pixel
  const tsToX = (ts: Date) =>
    Math.max(0, Math.min(chartWidth, ((ts.getTime() - windowStart) / (8 * 60 * 60 * 1000)) * chartWidth));

  // Zone boundaries in Y pixels (top of zone = lower Y value)
  const criticalTopY = levelToY(criticalAlert);   // top of red zone
  const warningTopY = levelToY(lowAlert);            // top of orange zone
  const normalTopY = levelToY(highAlert);            // top of green zone
  // blue zone goes from normalTopY to 0 (top)

  // Stats
  const levels = points.map((p) => p.level);
  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  const avgLevel = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);

  let trend = '— Stable';
  if (points.length >= 3) {
    const last3 = points.slice(-3).map((p) => p.level);
    const delta = last3[2] - last3[0];
    if (delta >= 3) trend = '▲ Rising';
    else if (delta <= -3) trend = '▼ Falling';
  }

  const trendColor = trend.startsWith('▲') ? '#10B981' : trend.startsWith('▼') ? '#EF4444' : '#6B7280';

  // Build line segments between consecutive points
  interface Segment {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    length: number;
    angle: string;
    midX: number;
    midY: number;
    color: string;
  }

  const mappedPoints = points.map((p) => ({
    x: tsToX(p.timestamp),
    y: levelToY(p.level),
    level: p.level,
    color: getZoneColor(p.level),
  }));

  const segments: Segment[] = [];
  for (let i = 0; i < mappedPoints.length - 1; i++) {
    const p1 = mappedPoints[i];
    const p2 = mappedPoints[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 0.5) continue;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;
    segments.push({
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      length,
      angle: `${angleDeg}deg`,
      midX: (p1.x + p2.x) / 2,
      midY: (p1.y + p2.y) / 2,
      color: getZoneColor((p1.level + p2.level) / 2),
    });
  }

  const latestPoint = mappedPoints.length > 0 ? mappedPoints[mappedPoints.length - 1] : null;

  return (
    <View style={historyStyles.wrapper}>
      {/* Y-axis */}
      <View style={[historyStyles.yAxis, { height: CHART_HEIGHT + 20 }]}>
        {[100, 75, 50, 25, 0].map((v) => (
          <Text key={v} style={historyStyles.yLabel}>{v}%</Text>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {/* Chart canvas */}
        <View
          style={[historyStyles.chartArea, { height: CHART_HEIGHT }]}
          onLayout={onChartLayout}
        >
          {/* Colored zone backgrounds */}
          {/* Blue zone: highAlert–100% */}
          <View
            style={[
              historyStyles.zone,
              { top: 0, height: normalTopY, backgroundColor: '#3B82F620' },
            ]}
          />
          {/* Green zone: lowAlert–highAlert */}
          <View
            style={[
              historyStyles.zone,
              { top: normalTopY, height: warningTopY - normalTopY, backgroundColor: '#10B98120' },
            ]}
          />
          {/* Orange zone: lowAlert*0.6–lowAlert */}
          <View
            style={[
              historyStyles.zone,
              { top: warningTopY, height: criticalTopY - warningTopY, backgroundColor: '#F59E0B20' },
            ]}
          />
          {/* Red zone: 0–lowAlert*0.6 */}
          <View
            style={[
              historyStyles.zone,
              { top: criticalTopY, height: CHART_HEIGHT - criticalTopY, backgroundColor: '#EF444420' },
            ]}
          />

          {/* Grid lines at 25/50/75/100 */}
          {[25, 50, 75, 100].map((v) => (
            <View
              key={v}
              style={[historyStyles.gridLine, { top: levelToY(v) }]}
            />
          ))}

          {/* Zone threshold lines */}
          <View style={[historyStyles.zoneLine, { top: normalTopY, borderColor: '#3B82F640' }]} />
          <View style={[historyStyles.zoneLine, { top: warningTopY, borderColor: '#F59E0B50' }]} />
          <View style={[historyStyles.zoneLine, { top: criticalTopY, borderColor: '#EF444440' }]} />

          {/* Line segments */}
          {segments.map((seg, i) => (
            <View
              key={i}
              style={[
                historyStyles.lineSegment,
                {
                  left: seg.midX - seg.length / 2,
                  top: seg.midY - 1.5,
                  width: seg.length,
                  backgroundColor: seg.color,
                  transform: [{ rotate: seg.angle }],
                },
              ]}
            />
          ))}

          {/* Filled area under line — using thin stacked segments */}
          {segments.map((seg, i) => {
            const fillHeight = Math.max(seg.y1, seg.y2);
            return (
              <View
                key={`fill-${i}`}
                style={[
                  historyStyles.fillSegment,
                  {
                    left: Math.min(seg.x1, seg.x2),
                    top: Math.min(seg.y1, seg.y2),
                    width: Math.abs(seg.x2 - seg.x1) + 1,
                    height: CHART_HEIGHT - Math.min(seg.y1, seg.y2),
                    backgroundColor: seg.color,
                  },
                ]}
              />
            );
          })}

          {/* Data point dots */}
          {mappedPoints.map((pt, i) => {
            const isLatest = i === mappedPoints.length - 1;
            if (isLatest) return null; // rendered separately with animation
            return (
              <View
                key={i}
                style={[
                  historyStyles.dot,
                  {
                    left: pt.x - 3,
                    top: pt.y - 3,
                    backgroundColor: pt.color,
                    borderColor: '#0F1419',
                  },
                ]}
              />
            );
          })}

          {/* Latest dot with pulse */}
          {latestPoint !== null && (
            <View
              style={[
                historyStyles.latestDotWrapper,
                { left: latestPoint.x - 10, top: latestPoint.y - 10 },
              ]}
            >
              {/* Glow ring (animated) */}
              <Animated.View
                style={[
                  historyStyles.pulseRing,
                  { borderColor: latestPoint.color, backgroundColor: `${latestPoint.color}30` },
                  pulseStyle,
                ]}
              />
              {/* Core dot */}
              <View
                style={[
                  historyStyles.latestDot,
                  {
                    backgroundColor: latestPoint.color,
                    borderColor: '#0F1419',
                    shadowColor: latestPoint.color,
                  },
                ]}
              />
            </View>
          )}
        </View>

        {/* X-axis time labels */}
        <View style={historyStyles.xAxis}>
          {['8h ago', '6h ago', '4h ago', '2h ago', 'Now'].map((label) => (
            <Text key={label} style={historyStyles.xLabel}>{label}</Text>
          ))}
        </View>

        {/* Summary stats row */}
        <View style={historyStyles.statsRow}>
          <View style={historyStyles.statPill}>
            <Text style={historyStyles.statPillLabel}>MIN</Text>
            <Text style={[historyStyles.statPillValue, { color: getZoneColor(minLevel) }]}>{minLevel}%</Text>
          </View>
          <View style={historyStyles.statPill}>
            <Text style={historyStyles.statPillLabel}>MAX</Text>
            <Text style={[historyStyles.statPillValue, { color: getZoneColor(maxLevel) }]}>{maxLevel}%</Text>
          </View>
          <View style={historyStyles.statPill}>
            <Text style={historyStyles.statPillLabel}>AVG</Text>
            <Text style={[historyStyles.statPillValue, { color: getZoneColor(avgLevel) }]}>{avgLevel}%</Text>
          </View>
          <View style={historyStyles.statPill}>
            <Text style={historyStyles.statPillLabel}>TREND</Text>
            <Text style={[historyStyles.statPillValue, { color: trendColor }]}>{trend}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const historyStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 4,
    gap: 6,
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingTop: 0,
  },
  yLabel: {
    fontSize: 9,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#6B7280',
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  zone: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#30363D',
    opacity: 0.4,
  },
  zoneLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  lineSegment: {
    position: 'absolute',
    height: 3,
    borderRadius: 1.5,
    zIndex: 4,
  },
  fillSegment: {
    position: 'absolute',
    opacity: 0.06,
    zIndex: 2,
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    zIndex: 5,
  },
  latestDotWrapper: {
    position: 'absolute',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  pulseRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  latestDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingHorizontal: 2,
  },
  xLabel: {
    fontSize: 10,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 3,
  },
  statPillLabel: {
    fontSize: 8,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#6B7280',
    letterSpacing: 1,
  },
  statPillValue: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#FFFFFF',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});

function StatBox({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  color?: string;
}) {
  return (
    <View style={detailStyles.statBox}>
      <Text style={detailStyles.statBoxLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
        <Text style={[detailStyles.statBoxValue, color ? { color } : null]}>{value}</Text>
        {unit ? <Text style={detailStyles.statBoxUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

export default function TankDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [tank, setTank] = useState<Tank | null>(null);
  const [historyPoints, setHistoryPoints] = useState<{ level: number; timestamp: Date }[]>([]);

  useEffect(() => {
    if (!id || !isFirebaseConfigured()) return;
    const unsub = subscribeHistory(id, (points: { level: number; timestamp: Date }[]) => {
      setHistoryPoints(points);
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    if (!id) return;

    if (!isFirebaseConfigured()) {
      setTank(MOCK_TANKS.find((t) => t.id === id) ?? MOCK_TANKS[0]);
      return;
    }

    const db = getFirebaseDB();
    if (!db) {
      setTank(MOCK_TANKS.find((t) => t.id === id) ?? MOCK_TANKS[0]);
      return;
    }

    const sensorRef = ref(db, 'sensors/' + id);
    onValue(
      sensorRef,
      (snap) => {
        const raw = snap.val();
        if (raw) {
          const ts = raw.timestamp ? new Date(raw.timestamp) : new Date();
          const level = typeof raw.level === 'number' ? Math.round(raw.level) : 0;
          setTank({
            id,
            name: raw.name || id,
            type: raw.type || 'Other',
            level,
            capacity: raw.capacity || 1000,
            sensorId: id,
            lowAlert: raw.lowAlert ?? 20,
            highAlert: raw.highAlert ?? 90,
            criticalAlert: typeof raw.criticalAlert === 'number' ? raw.criticalAlert : Math.round((raw.lowAlert ?? 20) * 0.6),
            lastUpdated: ts,
            signalStrength: typeof raw.signal === 'number' ? raw.signal : 0,
            online: raw.status !== 'offline' && (Date.now() - ts.getTime()) < 60000,
          });
        } else {
          // id not found in Firebase, fall back to mock
          setTank(MOCK_TANKS.find((t) => t.id === id) ?? MOCK_TANKS[0]);
        }
      },
      (err) => {
        console.warn('[TankDetail] Firebase error:', err);
        setTank(MOCK_TANKS.find((t) => t.id === id) ?? MOCK_TANKS[0]);
      }
    );

    return () => {
      off(sensorRef);
    };
  }, [id]);

  if (!tank) {
    return (
      <SafeAreaView style={detailStyles.safeArea} edges={['top']}>
        <View style={detailStyles.header}>
          <Pressable
            testID="back-button"
            onPress={() => router.back()}
            style={({ pressed }) => [detailStyles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <ArrowLeft size={22} color="#F59E0B" />
          </Pressable>
          <View style={{ flex: 1 }} />
          <View style={detailStyles.editBtn} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} testID="loading-indicator">
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      </SafeAreaView>
    );
  }

  const status = getTankStatus(tank);
  const statusColor = getStatusColor(status);
  const typeColor = getTankTypeColor(tank.type);
  const signalBars = getSignalBars(tank.signalStrength);
  const volume = formatVolume(tank.level, tank.capacity);
  const relTime = formatRelativeTime(tank.lastUpdated);

  return (
    <SafeAreaView style={detailStyles.safeArea} edges={['top']}>
      {/* Custom header */}
      <View style={detailStyles.header}>
        <Pressable
          testID="back-button"
          onPress={() => router.back()}
          style={({ pressed }) => [detailStyles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <ArrowLeft size={22} color="#F59E0B" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={detailStyles.headerTitle} numberOfLines={1}>{tank.name}</Text>
          <View style={[detailStyles.typeBadge, { backgroundColor: `${typeColor}22`, borderColor: `${typeColor}44` }]}>
            <Text style={[detailStyles.typeBadgeText, { color: '#FFFFFF' }]}>{tank.type.toUpperCase()}</Text>
          </View>
        </View>
        <Pressable
          testID="edit-button"
          onPress={() => router.push({ pathname: '/edit-tank', params: { id: tank.id } })}
          style={({ pressed }) => [detailStyles.editBtn, pressed && { opacity: 0.6 }]}
        >
          <Edit3 size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        style={detailStyles.scroll}
        contentContainerStyle={detailStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main visualization */}
        <LinearGradient colors={['#252525', '#0F1419']} style={detailStyles.vizCard}>
          <TankFill level={tank.level} online={tank.online} width={100} height={220} showLabel />

          {/* Status + signal */}
          <View style={detailStyles.vizMeta}>
            <View style={[detailStyles.statusPill, { backgroundColor: `${statusColor}22`, borderColor: `${statusColor}44` }]}>
              <View style={[detailStyles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[detailStyles.statusText, { color: statusColor }]}>{status}</Text>
            </View>
            <View style={detailStyles.signalWrap}>
              {tank.online ? (
                <>
                  <View style={detailStyles.signalBars}>
                    {[1, 2, 3, 4].map((b) => (
                      <View key={b} style={[detailStyles.signalBar, { height: 3 + b * 2, backgroundColor: b <= signalBars ? '#10B981' : '#30363D' }]} />
                    ))}
                  </View>
                  <Text style={detailStyles.signalText}>{tank.signalStrength} dBm</Text>
                </>
              ) : (
                <>
                  <WifiOff size={14} color="#E0E0E0" />
                  <Text style={detailStyles.signalText}>Offline</Text>
                </>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Stats grid */}
        <View style={detailStyles.statsGrid}>
          <StatBox label="LEVEL" value={tank.online ? `${tank.level}` : '--'} unit="%" color={statusColor} />
          <StatBox label="VOLUME" value={tank.online ? volume : '--'} unit="L" />
          <StatBox label="CAPACITY" value={tank.capacity.toLocaleString()} unit="L" />
          <StatBox label="LAST UPDATE" value={relTime} />
        </View>

        {/* Alert thresholds */}
        <View style={detailStyles.sectionHeader}>
          <Activity size={14} color="#FFFFFF" />
          <Text style={detailStyles.sectionTitle}>ALERT THRESHOLDS</Text>
        </View>
        <View style={detailStyles.card}>
          <View style={detailStyles.thresholdRow}>
            <View style={[detailStyles.thresholdDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={detailStyles.thresholdLabel}>Low Alert</Text>
            <Text style={detailStyles.thresholdValue}>{tank.lowAlert}%</Text>
            <Text style={detailStyles.thresholdVolume}>
              ({formatVolume(tank.lowAlert, tank.capacity)} L)
            </Text>
          </View>
          <View style={detailStyles.divider} />
          <View style={detailStyles.thresholdRow}>
            <View style={[detailStyles.thresholdDot, { backgroundColor: '#EF4444' }]} />
            <Text style={detailStyles.thresholdLabel}>Critical</Text>
            <Text style={detailStyles.thresholdValue}>{tank.criticalAlert}%</Text>
            <Text style={detailStyles.thresholdVolume}>
              ({formatVolume(tank.criticalAlert, tank.capacity)} L)
            </Text>
          </View>
          <View style={detailStyles.divider} />
          <View style={detailStyles.thresholdRow}>
            <View style={[detailStyles.thresholdDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={detailStyles.thresholdLabel}>High Alert</Text>
            <Text style={detailStyles.thresholdValue}>{tank.highAlert}%</Text>
            <Text style={detailStyles.thresholdVolume}>
              ({formatVolume(tank.highAlert, tank.capacity)} L)
            </Text>
          </View>
        </View>

        {/* Sensor info */}
        <View style={detailStyles.sectionHeader}>
          <Thermometer size={14} color="#FFFFFF" />
          <Text style={detailStyles.sectionTitle}>SENSOR</Text>
        </View>
        <View style={detailStyles.card}>
          <View style={detailStyles.sensorRow}>
            <Text style={detailStyles.sensorLabel}>Sensor ID</Text>
            <Text style={detailStyles.sensorValue}>{tank.sensorId}</Text>
          </View>
          <View style={detailStyles.divider} />
          <View style={detailStyles.sensorRow}>
            <Text style={detailStyles.sensorLabel}>Protocol</Text>
            <Text style={detailStyles.sensorValue}>ESP32 / HC-SR04</Text>
          </View>
          <View style={detailStyles.divider} />
          <View style={detailStyles.sensorRow}>
            <Text style={detailStyles.sensorLabel}>Connection</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {tank.online ? (
                <Wifi size={12} color="#10B981" />
              ) : (
                <WifiOff size={12} color="#E0E0E0" />
              )}
              <Text style={[detailStyles.sensorValue, { color: tank.online ? '#10B981' : '#E0E0E0' }]}>
                {tank.online ? `${tank.signalStrength} dBm` : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* History chart */}
        <View style={detailStyles.sectionHeader}>
          <Activity size={14} color="#FFFFFF" />
          <Text style={detailStyles.sectionTitle}>LEVEL HISTORY</Text>
          <Text style={{ fontSize: 10, fontFamily: 'IBMPlexMono_400Regular', color: '#4B5563', marginLeft: 'auto' }}>
            last 8 hours
          </Text>
        </View>
        <View style={[detailStyles.card, { padding: 12 }]}>
          <LevelHistoryChart
            points={historyPoints}
            lowAlert={tank.lowAlert}
            highAlert={tank.highAlert}
            criticalAlert={tank.criticalAlert}
          />
        </View>

        <View style={{ height: 40 }} />
        <Copyright />
      </ScrollView>
    </SafeAreaView>
  );
}

const detailStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#5A5A5A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#5A5A5A',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 3,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: 'IBMPlexMono_700Bold',
    letterSpacing: 0.8,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  vizCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#5A5A5A',
    padding: 20,
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  vizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  signalWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  signalBar: {
    width: 4,
    borderRadius: 1,
  },
  signalText: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#E0E0E0',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: '#5A5A5A',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  statBoxLabel: {
    fontSize: 10,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  statBoxValue: {
    fontSize: 20,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#FFFFFF',
  },
  statBoxUnit: {
    fontSize: 12,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: '#252525',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5A5A5A',
    marginBottom: 12,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#5A5A5A',
    marginHorizontal: 14,
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  thresholdDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  thresholdLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  thresholdValue: {
    fontSize: 14,
    fontFamily: 'IBMPlexMono_700Bold',
    color: '#FFFFFF',
  },
  thresholdVolume: {
    fontSize: 12,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#E0E0E0',
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  sensorLabel: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  sensorValue: {
    fontSize: 13,
    fontFamily: 'IBMPlexMono_400Regular',
    color: '#FFFFFF',
  },
});
