import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';
import { VitalMetric } from '../types/health';

interface VitalCardProps {
  metric: VitalMetric;
  onPress?: (metric: VitalMetric) => void;
}

export const VitalCard: React.FC<VitalCardProps> = ({ metric, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => onPress?.(metric)}
    >
      {/* Top row with icon & sample indicator badge */}
      <View style={styles.topRow}>
        <View style={[styles.iconWrapper, { backgroundColor: `${metric.accentColor}18` }]}>
          <MaterialCommunityIcons
            name={metric.iconName as any}
            size={20}
            color={metric.accentColor}
          />
        </View>
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, { color: metric.accentColor }]}>
            {metric.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Metric Name */}
      <Text style={styles.metricName} numberOfLines={1}>
        {metric.name}
      </Text>

      {/* Metric Value and Unit */}
      <View style={styles.valueRow}>
        <Text style={styles.valueText}>{metric.value}</Text>
        <Text style={[styles.unitText, { color: metric.accentColor }]}>{metric.unit}</Text>
      </View>

      {/* Subtext info */}
      <Text style={styles.subtext} numberOfLines={1}>
        {metric.subtext}
      </Text>

      {/* Bottom Sample Label */}
      <View style={styles.sampleTagRow}>
        <MaterialCommunityIcons name="information-outline" size={10} color={COLORS.textMuted} />
        <Text style={styles.sampleTag}>SAMPLE VALUE</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
    width: '48%',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  sampleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 6,
  },
  sampleTag: {
    fontSize: 8.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
});

