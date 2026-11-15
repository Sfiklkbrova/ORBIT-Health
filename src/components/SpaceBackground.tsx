// Futuristic Space Background with Layered Stars, Drifting Cosmic Particles & Holographic Horizon
// High performance vector rendering for Android, iOS & Web

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Path,
  Line,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Extended star data with multiple depth planes (distant, mid, near)
const STAR_DATA = [
  { cx: 25, cy: 45, r: 0.8, color: '#FFFFFF', depth: 0.4 },
  { cx: 80, cy: 110, r: 1.8, color: '#38BDF8', depth: 0.8 },
  { cx: 155, cy: 35, r: 1.0, color: '#FFFFFF', depth: 0.5 },
  { cx: 235, cy: 90, r: 2.2, color: '#FDBA74', depth: 1.0 },
  { cx: 305, cy: 55, r: 1.4, color: '#FFFFFF', depth: 0.6 },
  { cx: 375, cy: 130, r: 1.6, color: '#38BDF8', depth: 0.7 },
  { cx: 45, cy: 215, r: 1.1, color: '#FFFFFF', depth: 0.4 },
  { cx: 115, cy: 295, r: 2.0, color: '#FFFFFF', depth: 0.9 },
  { cx: 195, cy: 255, r: 1.3, color: '#BAE6FD', depth: 0.5 },
  { cx: 285, cy: 335, r: 1.7, color: '#FFFFFF', depth: 0.7 },
  { cx: 355, cy: 275, r: 1.0, color: '#FFFFFF', depth: 0.4 },
  { cx: 35, cy: 415, r: 2.3, color: '#FDE047', depth: 1.0 },
  { cx: 105, cy: 485, r: 1.2, color: '#FFFFFF', depth: 0.5 },
  { cx: 175, cy: 435, r: 1.5, color: '#38BDF8', depth: 0.6 },
  { cx: 255, cy: 515, r: 1.1, color: '#FFFFFF', depth: 0.4 },
  { cx: 325, cy: 455, r: 1.9, color: '#FFFFFF', depth: 0.8 },
  { cx: 65, cy: 595, r: 1.4, color: '#BAE6FD', depth: 0.6 },
  { cx: 145, cy: 645, r: 2.1, color: '#FFFFFF', depth: 0.9 },
  { cx: 225, cy: 615, r: 1.0, color: '#FFFFFF', depth: 0.4 },
  { cx: 315, cy: 665, r: 1.6, color: '#38BDF8', depth: 0.7 },
  { cx: 385, cy: 605, r: 1.2, color: '#FFFFFF', depth: 0.5 },
  { cx: 50, cy: 720, r: 1.5, color: '#FFFFFF', depth: 0.6 },
  { cx: 180, cy: 760, r: 1.8, color: '#FDBA74', depth: 0.8 },
  { cx: 290, cy: 740, r: 1.2, color: '#FFFFFF', depth: 0.5 },
];

export const SpaceBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const twinkleAnim = useRef(new Animated.Value(0.4)).current;
  const horizonAnim = useRef(new Animated.Value(0.7)).current;
  const particleFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const twinkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkleAnim, {
          toValue: 0.98,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(twinkleAnim, {
          toValue: 0.35,
          duration: 2600,
          useNativeDriver: true,
        }),
      ])
    );

    const horizonLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(horizonAnim, {
          toValue: 1,
          duration: 4200,
          useNativeDriver: true,
        }),
        Animated.timing(horizonAnim, {
          toValue: 0.6,
          duration: 4200,
          useNativeDriver: true,
        }),
      ])
    );

    const particleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(particleFloat, {
          toValue: 1,
          duration: 6500,
          useNativeDriver: true,
        }),
        Animated.timing(particleFloat, {
          toValue: 0,
          duration: 6500,
          useNativeDriver: true,
        }),
      ])
    );

    twinkleLoop.start();
    horizonLoop.start();
    particleLoop.start();

    return () => {
      twinkleLoop.stop();
      horizonLoop.stop();
      particleLoop.stop();
    };
  }, [twinkleAnim, horizonAnim, particleFloat]);

  const svgWidth = Math.max(width, 400);
  const svgHeight = Math.max(height, 800);

  const translateYNear = particleFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  const translateYMid = particleFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  return (
    <View style={styles.container}>
      {/* Background SVG Canvas */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={svgWidth} height={svgHeight}>
          <Defs>
            <LinearGradient id="spaceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#030712" />
              <Stop offset="45%" stopColor="#070E24" />
              <Stop offset="100%" stopColor="#0B132B" />
            </LinearGradient>

            <RadialGradient id="nebulaGlow" cx="65%" cy="30%" rx="65%" ry="45%">
              <Stop offset="0%" stopColor="#00F2FE" stopOpacity="0.09" />
              <Stop offset="45%" stopColor="#1E3A8A" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#030712" stopOpacity="0" />
            </RadialGradient>

            <RadialGradient id="marsWarmthGlow" cx="20%" cy="60%" rx="50%" ry="40%">
              <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.06" />
              <Stop offset="60%" stopColor="#B91C1C" stopOpacity="0.02" />
              <Stop offset="100%" stopColor="#030712" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Deep Space Void */}
          <Rect x="0" y="0" width={svgWidth} height={svgHeight} fill="url(#spaceGradient)" />
          <Rect x="0" y="0" width={svgWidth} height={svgHeight} fill="url(#nebulaGlow)" />
          <Rect x="0" y="0" width={svgWidth} height={svgHeight} fill="url(#marsWarmthGlow)" />

          {/* Subtle Holographic Grid Scanlines */}
          <Line x1="0" y1={svgHeight * 0.25} x2={svgWidth} y2={svgHeight * 0.25} stroke="rgba(56, 189, 248, 0.04)" strokeWidth="1" strokeDasharray="4, 8" />
          <Line x1="0" y1={svgHeight * 0.5} x2={svgWidth} y2={svgHeight * 0.5} stroke="rgba(56, 189, 248, 0.04)" strokeWidth="1" strokeDasharray="4, 8" />
          <Line x1="0" y1={svgHeight * 0.75} x2={svgWidth} y2={svgHeight * 0.75} stroke="rgba(56, 189, 248, 0.04)" strokeWidth="1" strokeDasharray="4, 8" />

          {/* Base Starfield */}
          {STAR_DATA.map((star, idx) => (
            <Circle
              key={idx}
              cx={(star.cx / 400) * svgWidth}
              cy={(star.cy / 800) * svgHeight}
              r={star.r}
              fill={star.color}
              opacity={0.65}
            />
          ))}
        </Svg>
      </View>

      {/* Floating 3D Depth Particle Layer 1 (Drifting upward) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateY: translateYNear }],
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={svgWidth} height={svgHeight}>
          <Circle cx={svgWidth * 0.15} cy={svgHeight * 0.3} r={1.6} fill="#38BDF8" opacity={0.6} />
          <Circle cx={svgWidth * 0.75} cy={svgHeight * 0.2} r={2.0} fill="#FFFFFF" opacity={0.5} />
          <Circle cx={svgWidth * 0.85} cy={svgHeight * 0.65} r={1.5} fill="#00E5FF" opacity={0.7} />
          <Circle cx={svgWidth * 0.3} cy={svgHeight * 0.8} r={1.8} fill="#FDBA74" opacity={0.5} />
        </Svg>
      </Animated.View>

      {/* Floating 3D Depth Particle Layer 2 (Drifting opposite) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateY: translateYMid }],
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={svgWidth} height={svgHeight}>
          <Circle cx={svgWidth * 0.45} cy={svgHeight * 0.15} r={1.2} fill="#FFFFFF" opacity={0.4} />
          <Circle cx={svgWidth * 0.6} cy={svgHeight * 0.45} r={1.8} fill="#38BDF8" opacity={0.6} />
          <Circle cx={svgWidth * 0.2} cy={svgHeight * 0.55} r={1.4} fill="#FDE047" opacity={0.5} />
        </Svg>
      </Animated.View>

      {/* Earth Horizon Curvature Arc at Bottom */}
      <Animated.View
        style={[
          styles.horizonArcWrapper,
          {
            opacity: horizonAnim,
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={svgWidth} height={180}>
          <Defs>
            <LinearGradient id="arcGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#00F2FE" stopOpacity="0.38" />
              <Stop offset="40%" stopColor="#0284C7" stopOpacity="0.16" />
              <Stop offset="100%" stopColor="#030712" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {/* Earth horizon curved contour */}
          <Path
            d={`M -50 180 Q ${svgWidth / 2} 40 ${svgWidth + 50} 180 Z`}
            fill="url(#arcGlow)"
          />
          <Path
            d={`M -50 180 Q ${svgWidth / 2} 40 ${svgWidth + 50} 180`}
            stroke="#00F2FE"
            strokeWidth="1.5"
            fill="none"
            opacity={0.65}
          />
        </Svg>
      </Animated.View>

      {/* Foreground Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  horizonArcWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
