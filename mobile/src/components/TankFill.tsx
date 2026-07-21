import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  useDerivedValue,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Path, Defs, ClipPath, Rect } from 'react-native-svg';
import { getFillColor } from '@/lib/tankData';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface TankFillProps {
  level: number;
  online: boolean;
  width?: number;
  height?: number;
  showLabel?: boolean;
}

export function TankFill({
  level,
  online,
  width = 48,
  height = 120,
  showLabel = true,
}: TankFillProps) {
  const fillPercent = useSharedValue(0);
  const waveAnim = useSharedValue(0);

  useEffect(() => {
    fillPercent.value = withTiming(online ? level / 100 : 0, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [level, online]);

  useEffect(() => {
    waveAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, []);

  const fillColor = useDerivedValue(() =>
    interpolateColor(
      fillPercent.value,
      [0, 0.15, 0.25, 1],
      ['#EF4444', '#EF4444', '#F59E0B', '#10B981']
    )
  );

  const animatedFillProps = useAnimatedProps(() => {
    const wave = waveAnim.value * 3;
    const fillH = fillPercent.value * height + wave;
    return {
      y: height - fillH,
      height: Math.max(0, fillH),
      fill: fillColor.value,
    };
  });

  // Bottle shape dimensions
  const CAP_H = Math.round(height * 0.12);
  const CAP_X = Math.round(width * 0.2);
  const CAP_W = Math.round(width * 0.6);
  const BODY_Y = CAP_H - 2;
  const BX = 1.5;
  const BW = width - 3;
  const RX = 7;

  // Single continuous path for the bottle shape
  const bottlePath = [
    `M ${CAP_X + 4} 0`,
    `L ${CAP_X + CAP_W - 4} 0`,
    `Q ${CAP_X + CAP_W} 0 ${CAP_X + CAP_W} 4`,
    `L ${CAP_X + CAP_W} ${CAP_H}`,
    `L ${BX + BW} ${BODY_Y}`,
    `L ${BX + BW} ${height - RX}`,
    `Q ${BX + BW} ${height} ${BX + BW - RX} ${height}`,
    `L ${BX + RX} ${height}`,
    `Q ${BX} ${height} ${BX} ${height - RX}`,
    `L ${BX} ${BODY_Y}`,
    `L ${CAP_X} ${CAP_H}`,
    `L ${CAP_X} 4`,
    `Q ${CAP_X} 0 ${CAP_X + 4} 0`,
    `Z`,
  ].join(' ');

  const clipId = `tc-${Math.round(width)}-${Math.round(height)}`;

  const effectiveLevel = online ? level : 0;
  const displayColor = online ? getFillColor(level) : '#4B5563';

  return (
    <View style={[styles.container, { width, height: height + 22 }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <ClipPath id={clipId}>
            <Path d={bottlePath} />
          </ClipPath>
        </Defs>

        {/* White background */}
        <Path d={bottlePath} fill="#FFFFFF" />

        {/* Animated fill clipped to bottle shape */}
        <AnimatedRect
          x={0}
          width={width}
          clipPath={`url(#${clipId})`}
          animatedProps={animatedFillProps}
        />

        {/* Tick marks at 25%, 50%, 75% */}
        {[25, 50, 75].map((tick) => (
          <Rect
            key={tick}
            x={BX + 4}
            y={height - (tick / 100) * height}
            width={BW - 8}
            height={0.8}
            fill="#000000"
            opacity={0.12}
          />
        ))}

        {/* Left-side shine reflection */}
        <Rect
          x={BX + 2}
          y={0}
          width={BW * 0.22}
          height={height}
          fill="rgba(0,0,0,0.03)"
          clipPath={`url(#${clipId})`}
        />

        {/* Bottle outline */}
        <Path
          d={bottlePath}
          fill="none"
          stroke="#9CA3AF"
          strokeWidth={1.5}
        />
      </Svg>

      {showLabel ? (
        <Text style={[styles.label, { color: displayColor }]}>
          {online ? `${effectiveLevel}%` : '--'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'IBMPlexMono_700Bold',
    letterSpacing: 0.5,
  },
});
