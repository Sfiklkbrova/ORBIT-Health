import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';
import { AiInsightData } from '../types/health';

interface AiInsightsCardProps {
  insight: AiInsightData;
  onPressViewAnalysis: () => void;
}

export const AiInsightsCard: React.FC<AiInsightsCardProps> = ({
  insight,
  onPressViewAnalysis,
}) => {
  return (
    <View style={styles.container}>
      {/* Header with AI Badge & Sample Tag */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.aiBadge}>
            <MaterialCommunityIcons name="brain" size={18} color={COLORS.cyan} />
          </View>
          <View>
            <Text style={styles.cardTitle}>{insight.title}</Text>
            <Text style={styles.timestampText}>{insight.timestamp}</Text>
          </View>
        </View>

        <View style={styles.sampleTag}>
          <Text style={styles.sampleTagText}>{insight.sampleBadge}</Text>
        </View>
      </View>

      {/* Insight Summary Box */}
      <View style={styles.insightBox}>
        <View style={styles.glowBorderDecorator} />
        <Text style={styles.insightText}>{insight.summary}</Text>
      </View>

      {/* Key Diagnostic Pills */}
      <View style={styles.keyPointsContainer}>
        {insight.keyPoints.map((point, index) => (
          <View key={index} style={styles.pointPill}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={13}
              color={point.status === 'optimal' ? COLORS.statusNormal : COLORS.cyan}
            />
            <Text style={styles.pointLabel}>{point.label}:</Text>
            <Text style={styles.pointValue}>{point.value}</Text>
          </View>
        ))}
      </View>

      {/* Action Button: "View Analysis" */}
      <TouchableOpacity
        style={styles.analysisButton}
        activeOpacity={0.8}
        onPress={onPressViewAnalysis}
        accessibilityLabel="View Analysis"
      >
        <View style={styles.buttonInner}>
          <MaterialCommunityIcons name="chart-timeline-variant" size={18} color={COLORS.background} />
          <Text style={styles.analysisButtonText}>View Analysis</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.background} />
        </View>
      </TouchableOpacity>
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
    marginBottom: SPACING.xxl,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  aiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  timestampText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sampleTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  sampleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.statusWarning,
    letterSpacing: 0.8,
  },
  insightBox: {
    backgroundColor: 'rgba(11, 17, 32, 0.75)',
    borderRadius: 14,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.cyan,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  glowBorderDecorator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  insightText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  keyPointsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  pointPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surfaceCardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pointLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  pointValue: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  analysisButton: {
    backgroundColor: COLORS.cyan,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analysisButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.background,
    letterSpacing: 0.5,
  },
});

