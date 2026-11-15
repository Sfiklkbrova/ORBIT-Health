// Reactive Audio Waveform Visualizer for Two-Way Spoken AI
// 16 Frequency bars responding to speech audio amplitude

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../theme/colors';
import { VoiceState } from '../services/voiceService';

interface AudioWaveformProps {
  state: VoiceState;
  audioLevel?: number;
  barCount?: number;
  height?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  state,
  audioLevel = 0,
  barCount = 16,
  height = 48,
}) => {
  const animatedHeights = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(4))
  ).current;

  useEffect(() => {
    const isLive = state === 'SPEAKING' || state === 'LISTENING';

    animatedHeights.forEach((anim, i) => {
      let targetHeight = 4;
      if (isLive) {
        // Compute pseudo-frequency spectrum with center emphasis
        const centerDistance = Math.abs(i - barCount / 2) / (barCount / 2);
        const centerWeight = 1 - centerDistance * 0.5;
        const jitter = Math.random() * 0.4 + 0.6;
        targetHeight = Math.max(
          6,
          Math.min(height, audioLevel * height * centerWeight * jitter)
        );
      }

      Animated.timing(anim, {
        toValue: targetHeight,
        duration: 90,
        useNativeDriver: false, // height layout animation
      }).start();
    });
  }, [audioLevel, state, animatedHeights, barCount, height]);

  const getBarColor = () => {
    switch (state) {
      case 'SPEAKING':
        return '#38BDF8';
      case 'LISTENING':
        return COLORS.cyan;
      case 'THINKING':
      case 'RESEARCHING':
      case 'UNDERSTANDING':
        return '#A855F7';
      case 'INTERRUPTED':
        return COLORS.statusWarning;
      case 'ERROR':
        return COLORS.statusAlert;
      case 'IDLE':
      default:
        return 'rgba(255, 255, 255, 0.2)';
    }
  };

  const barColor = getBarColor();

  return (
    <View style={[styles.container, { height }]}>
      {animatedHeights.map((animHeight, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height: animHeight,
              backgroundColor: barColor,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
    minHeight: 4,
  },
});
