// Animated AI Voice Orb with 8 Synchronized Visual States
// Smooth 60fps animations via React Native Animated and SVG

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle,
  G,
} from 'react-native-svg';
import { VoiceState } from '../services/voiceService';

interface AiVoiceOrbProps {
  state: VoiceState;
  audioLevel?: number; // 0.0 - 1.0
  size?: number;
}

export const AiVoiceOrb: React.FC<AiVoiceOrbProps> = ({
  state,
  audioLevel = 0,
  size = 200,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  // Continuous rotational and ambient loops
  useEffect(() => {
    const rotationLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: state === 'UNDERSTANDING' || state === 'RESEARCHING' ? 3000 : 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: state === 'LISTENING' ? 800 : state === 'THINKING' ? 1200 : 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: state === 'LISTENING' ? 800 : state === 'THINKING' ? 1200 : 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    rotationLoop.start();
    pulseLoop.start();

    return () => {
      rotationLoop.stop();
      pulseLoop.stop();
    };
  }, [state, pulseAnim, rotateAnim]);

  // Audio reactivity during SPEAKING or LISTENING
  useEffect(() => {
    if (state === 'SPEAKING' || state === 'LISTENING') {
      const targetScale = 1 + Math.min(audioLevel * 0.35, 0.4);
      Animated.spring(waveAnim, {
        toValue: targetScale,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();

      Animated.timing(glowAnim, {
        toValue: 0.7 + audioLevel * 0.3,
        duration: 120,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(waveAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
      glowAnim.setValue(0.6);
    }
  }, [audioLevel, state, waveAnim, glowAnim]);

  // State Color Palette
  const getStateColors = () => {
    switch (state) {
      case 'LISTENING':
        return {
          core: '#00F2FE',
          mid: '#4FACFE',
          outer: '#1E3A8A',
          glow: 'rgba(0, 242, 254, 0.4)',
        };
      case 'UNDERSTANDING':
      case 'RESEARCHING':
        return {
          core: '#38BDF8',
          mid: '#818CF8',
          outer: '#312E81',
          glow: 'rgba(129, 140, 248, 0.4)',
        };
      case 'THINKING':
        return {
          core: '#C084FC',
          mid: '#A855F7',
          outer: '#581C87',
          glow: 'rgba(168, 85, 247, 0.45)',
        };
      case 'SPEAKING':
        return {
          core: '#22D3EE',
          mid: '#6366F1',
          outer: '#06B6D4',
          glow: 'rgba(34, 211, 238, 0.5)',
        };
      case 'INTERRUPTED':
        return {
          core: '#F59E0B',
          mid: '#D97706',
          outer: '#78350F',
          glow: 'rgba(245, 158, 11, 0.4)',
        };
      case 'ERROR':
        return {
          core: '#EF4444',
          mid: '#DC2626',
          outer: '#7F1D1D',
          glow: 'rgba(239, 68, 68, 0.45)',
        };
      case 'IDLE':
      default:
        return {
          core: '#00F2FE',
          mid: '#0284C7',
          outer: '#0F172A',
          glow: 'rgba(0, 242, 254, 0.25)',
        };
    }
  };

  const colors = getStateColors();

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const reverseSpin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const center = size / 2;
  const radius = size * 0.35;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer Ambient Glow Aura */}
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            width: size * 1.25,
            height: size * 1.25,
            borderRadius: (size * 1.25) / 2,
            backgroundColor: colors.glow,
            transform: [{ scale: pulseAnim }],
            opacity: glowAnim,
          },
        ]}
      />

      {/* Rotating Orbital SVG Rings */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius * 1.25}
            stroke={colors.core}
            strokeWidth="1.5"
            strokeDasharray="6, 12"
            fill="none"
            opacity={0.4}
          />
          <Circle
            cx={center}
            cy={center}
            r={radius * 1.45}
            stroke={colors.mid}
            strokeWidth="1"
            strokeDasharray="4, 18"
            fill="none"
            opacity={0.3}
          />
        </Svg>
      </Animated.View>

      {/* Reverse Rotating Secondary Particle Ring */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ rotate: reverseSpin }],
          },
        ]}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius * 1.15}
            stroke={colors.mid}
            strokeWidth="1.2"
            strokeDasharray="20, 30"
            fill="none"
            opacity={0.5}
          />
        </Svg>
      </Animated.View>

      {/* Central Pulsing Energy Core */}
      <Animated.View
        style={[
          styles.coreWrapper,
          {
            transform: [{ scale: waveAnim }],
          },
        ]}
      >
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="orbGradient" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={colors.core} stopOpacity="1" />
              <Stop offset="60%" stopColor={colors.mid} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={colors.outer} stopOpacity="0.2" />
            </RadialGradient>
          </Defs>
          <G>
            <Circle cx={center} cy={center} r={radius} fill="url(#orbGradient)" />
            <Circle
              cx={center}
              cy={center}
              r={radius * 0.95}
              stroke={colors.core}
              strokeWidth="1"
              fill="none"
              opacity={0.7}
            />
            {/* Center High-Energy Specular Node */}
            <Circle
              cx={center - radius * 0.25}
              cy={center - radius * 0.25}
              r={radius * 0.18}
              fill="#FFFFFF"
              opacity={0.45}
            />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
  },
  coreWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
