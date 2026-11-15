// ============================================================================
// ORBIT HEALTH — OFFICIAL DATA SOURCE BADGE
// Explicit, transparent attribution for every single number and metric.
// Sources: "NASA live data" | "NASA cached" | "Simulated" | "Entered by user" | "Device sensor"
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export type DataSourceType =
  | 'NASA_LIVE'
  | 'NASA_CACHED'
  | 'SIMULATED'
  | 'MANUAL'
  | 'SENSOR';

export interface DataSourceBadgeProps {
  source: DataSourceType | string;
  lastSynced?: string | null;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  customLabel?: string;
}

interface BadgeConfig {
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  description: string;
}

const BADGE_CONFIGS: Record<DataSourceType, BadgeConfig> = {
  NASA_LIVE: {
    label: 'NASA live data',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    icon: 'satellite-variant',
    description:
      'Verified live telemetry retrieved directly from authoritative NASA APIs (DONKI / OSDR / RadLab).',
  },
  NASA_CACHED: {
    label: 'NASA cached',
    color: '#00F2FE',
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderColor: 'rgba(0, 242, 254, 0.35)',
    icon: 'database-clock-outline',
    description:
      'Official NASA data synchronized previously and safely cached in offline SQLite storage for deep space autonomy.',
  },
  SIMULATED: {
    label: 'Simulated',
    color: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    icon: 'calculator-variant-outline',
    description:
      'Simulated physiological model or historical analog dataset. Transparently labeled to prevent clinical misinterpretation.',
  },
  MANUAL: {
    label: 'Entered by user',
    color: '#C084FC',
    backgroundColor: 'rgba(192, 132, 252, 0.12)',
    borderColor: 'rgba(192, 132, 252, 0.4)',
    icon: 'account-edit-outline',
    description:
      'Manually logged by the crew member during flight operations and stored securely in local SQLite.',
  },
  SENSOR: {
    label: 'Device sensor',
    color: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    icon: 'watch-vibrate',
    description:
      'Read in real time from physical biometric sensors (smartwatch / chest strap / Android Health Connect).',
  },
};

export function normalizeSourceType(source: string | DataSourceType): DataSourceType {
  const s = String(source).toUpperCase();
  if (s.includes('LIVE') || s === 'NASA LIVE DATA') return 'NASA_LIVE';
  if (s.includes('CACHE') || s === 'NASA CACHED') return 'NASA_CACHED';
  if (s.includes('SENSOR') || s === 'DEVICE SENSOR') return 'SENSOR';
  if (s.includes('MANUAL') || s.includes('USER') || s === 'ENTERED BY USER') return 'MANUAL';
  return 'SIMULATED';
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  source,
  lastSynced,
  compact = false,
  style,
  customLabel,
}) => {
  const normType = normalizeSourceType(source);
  const cfg = BADGE_CONFIGS[normType] || BADGE_CONFIGS.SIMULATED;

  const displayLabel = customLabel || cfg.label;

  const handlePress = () => {
    let msg = cfg.description;
    if (lastSynced) {
      msg += `\n\nLast Synced: ${new Date(lastSynced).toLocaleString()}`;
    }
    Alert.alert(`Data Source: ${displayLabel}`, msg);
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.badgeCompact,
          { backgroundColor: cfg.backgroundColor, borderColor: cfg.borderColor },
          style,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name={cfg.icon} size={11} color={cfg.color} />
        <Text style={[styles.textCompact, { color: cfg.color }]}>{displayLabel}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.badgeNormal,
        { backgroundColor: cfg.backgroundColor, borderColor: cfg.borderColor },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.badgeContent}>
        <MaterialCommunityIcons name={cfg.icon} size={13} color={cfg.color} />
        <Text style={[styles.textNormal, { color: cfg.color }]}>{displayLabel}</Text>
        {lastSynced && (
          <Text style={styles.textTime}>
            • {new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badgeNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  textNormal: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textTime: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  badgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  textCompact: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
