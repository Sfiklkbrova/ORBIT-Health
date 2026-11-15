import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';
import { HealthStatusData } from '../types/health';

interface HealthStatusCardProps {
  statusData: HealthStatusData;
}

export const HealthStatusCard: React.FC<HealthStatusCardProps> = ({ statusData }) => {
  const { vitalScore, statusText, activity } = statusData;
  const progressPercent = Math.min(100, Math.round((activity.steps / activity.goalSteps) * 100));

  return (
    <View style={styles.container}>
      {/* Space & Mission Header Tag */}
      <View style={styles.cardHeader}>
        <View style={styles.orbitTagContainer}>
          <MaterialCommunityIcons name="satellite-variant" size={16} color={COLORS.cyan} />
          <Text style={styles.orbitTagText}>ORBITAL HEALTH STATUS</Text>
        </View>
        <View style={styles.sampleBadge}>
          <Text style={styles.sampleBadgeText}>SAMPLE TELEMETRY</Text>
        </View>
      </View>

      {/* Main Visual Health Overview */}
      <View style={styles.overviewRow}>
        {/* Orbital Circular Telemetry Display */}
        <View style={styles.orbitalRadarWrapper}>
          <View style={styles.orbitalOuterRing}>
            <View style={styles.orbitalMidRing}>
              <View style={styles.orbitalCenterCore}>
                <Text style={styles.scoreNumber}>{vitalScore}</Text>
                <Text style={styles.scoreUnit}>/ 100</Text>
              </View>
            </View>
            {/* Orbital Satellite Marker */}
            <View style={styles.satelliteNode} />
            <View style={styles.satelliteNodeOpposite} />
          </View>
        </View>

        {/* Status Details */}
        <View style={styles.statusDetails}>
          <View style={styles.statusPill}>
            <View style={styles.pulsingDot} />
            <Text style={styles.statusPillText}>{statusText}</Text>
          </View>

          <Text style={styles.subStatusDescription}>
            Physiological balance is fully stabilized. All biological subsystems nominal.
          </Text>

          <View style={styles.quickMetricsRow}>
            <View style={styles.quickMetricBadge}>
              <MaterialCommunityIcons name="shield-check" size={13} color={COLORS.cyan} />
              <Text style={styles.quickMetricText}>Bio-Shield 100%</Text>
            </View>
            <View style={styles.quickMetricBadge}>
              <MaterialCommunityIcons name="wave" size={13} color={COLORS.statusNormal} />
              <Text style={styles.quickMetricText}>Sync Nominal</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Daily Activity Indicator */}
      <View style={styles.activitySection}>
        <View style={styles.activityHeader}>
          <View style={styles.activityTitleGroup}>
            <MaterialCommunityIcons name="run-fast" size={18} color={COLORS.lightCyan} />
            <Text style={styles.activityTitle}>Daily Orbital Activity</Text>
          </View>
          <Text style={styles.stepCount}>
            <Text style={styles.stepCurrent}>{activity.steps.toLocaleString()}</Text>
            <Text style={styles.stepGoal}> / {activity.goalSteps.toLocaleString()} steps</Text>
          </Text>
        </View>

        {/* Progress Bar Track */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        {/* Progress Metrics Row */}
        <View style={styles.activityMetricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{progressPercent}%</Text>
            <Text style={styles.metricLabel}>Daily Target</Text>
          </View>
          <View style={styles.metricSeparator} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{activity.calories} kcal</Text>
            <Text style={styles.metricLabel}>Metabolic Burn</Text>
          </View>
          <View style={styles.metricSeparator} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{activity.activeMinutes} min</Text>
            <Text style={styles.metricLabel}>Active Duration</Text>
          </View>
          <View style={styles.metricSeparator} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{activity.distanceKm} km</Text>
            <Text style={styles.metricLabel}>Distance</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    padding: SPACING.lg,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  orbitTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orbitTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 1.2,
  },
  sampleBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  sampleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.statusWarning,
    letterSpacing: 0.8,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  orbitalRadarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitalOuterRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(15, 26, 46, 0.7)',
  },
  orbitalMidRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceCardSecondary,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
  orbitalCenterCore: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  scoreUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.cyan,
    marginTop: -2,
  },
  satelliteNode: {
    position: 'absolute',
    top: 6,
    right: 14,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.cyan,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  satelliteNodeOpposite: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.brightBlue,
  },
  statusDetails: {
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.statusNormal,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.statusNormal,
    letterSpacing: 0.5,
  },
  subStatusDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickMetricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceHover,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quickMetricText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: SPACING.md,
  },
  activitySection: {
    gap: SPACING.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stepCount: {
    fontSize: 13,
  },
  stepCurrent: {
    fontWeight: '800',
    color: COLORS.cyan,
  },
  stepGoal: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: 4,
  },
  activityMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metricSeparator: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.borderSubtle,
  },
});

