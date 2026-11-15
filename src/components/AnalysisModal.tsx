import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme/colors';
import { AiInsightData } from '../types/health';

interface AnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  insight: AiInsightData;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  visible,
  onClose,
  insight,
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Top Bar with Handle & Close */}
          <View style={styles.dragHandle} />
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.aiBadge}>
                <MaterialCommunityIcons name="brain" size={20} color={COLORS.cyan} />
              </View>
              <View>
                <Text style={styles.modalTitle}>{t('modals.diagTitle')}</Text>
                <Text style={styles.modalSubtitle}>{t('modals.diagSub')}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Sample Badge Banner */}
            <View style={styles.sampleBanner}>
              <MaterialCommunityIcons name="shield-alert-outline" size={16} color={COLORS.statusWarning} />
              <Text style={styles.sampleBannerText}>
                {t('modals.diagDemoBanner')}
              </Text>
            </View>

            {/* Comprehensive Telemetry Diagnostic */}
            <Text style={styles.sectionHeader}>{t('modals.physioEval')}</Text>
            <View style={styles.detailedCard}>
              <Text style={styles.detailedText}>{insight.detailedAnalysis}</Text>
            </View>

            {/* Telemetry Breakdown Cards */}
            <Text style={styles.sectionHeader}>{t('modals.telemetryParams')}</Text>
            <View style={styles.parametersGrid}>
              {insight.keyPoints.map((item, idx) => (
                <View key={idx} style={styles.paramCard}>
                  <View style={styles.paramHeader}>
                    <Text style={styles.paramLabel}>{item.label}</Text>
                    <View style={styles.statusDot} />
                  </View>
                  <Text style={styles.paramValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* Mission Recommendations */}
            <Text style={styles.sectionHeader}>{t('modals.recommendedActions')}</Text>
            <View style={styles.recommendationsList}>
              {insight.recommendations.map((rec, index) => (
                <View key={index} style={styles.recItem}>
                  <View style={styles.recNumberBadge}>
                    <Text style={styles.recNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>

            {/* NASA Research & Evidence Citations */}
            {insight.nasaCitations && insight.nasaCitations.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>{t('modals.verifiedNasa')}</Text>
                <View style={styles.citationsContainer}>
                  {insight.nasaCitations.map((cite, i) => (
                    <View key={i} style={styles.citationCard}>
                      <View style={styles.citationHeader}>
                        <View style={styles.citationSourcePill}>
                          <Text style={styles.citationSourceText}>{cite.source}</Text>
                        </View>
                        {cite.accession && (
                          <View style={styles.citationAccessionPill}>
                            <Text style={styles.citationAccessionText}>{cite.accession}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.citationTitle}>{cite.title}</Text>
                      <Text style={styles.citationFinding}>{cite.finding}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Scientific Disclaimer */}
            <View style={styles.disclaimerContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.disclaimerText}>
                {insight.scientificDisclaimer ||
                  'NASA research references are provided for scientific informational context and do not constitute a clinical medical diagnosis or mission-critical flight certification.'}
              </Text>
            </View>

            {/* Bottom System Info */}
            <View style={styles.engineFooter}>
              <MaterialCommunityIcons name="chip" size={16} color={COLORS.lightCyan} />
              <Text style={styles.engineFooterText}>
                Edge AI Pipeline: Local Inference Simulated • Offline Privacy Guaranteed
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Action Button */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>{t('modals.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.82)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surfaceCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    maxHeight: '85%',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  dragHandle: {
    width: 44,
    height: 4,
    backgroundColor: COLORS.borderSubtle,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  aiBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textCyan,
    fontWeight: '600',
    marginTop: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceCardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    marginBottom: SPACING.lg,
  },
  scrollContent: {
    paddingBottom: SPACING.md,
  },
  sampleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  sampleBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.statusWarning,
    flex: 1,
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  detailedCard: {
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 14,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.cyan,
    marginBottom: SPACING.md,
  },
  detailedText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  parametersGrid: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  paramCard: {
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  paramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paramLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.statusNormal,
  },
  paramValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  recommendationsList: {
    gap: 10,
    marginBottom: SPACING.lg,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.surfaceCardSecondary,
    padding: SPACING.md,
    borderRadius: 12,
  },
  recNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.cyanSubtle,
    borderWidth: 1,
    borderColor: COLORS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  recNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  recText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textPrimary,
    flex: 1,
  },
  engineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.sm,
  },
  engineFooterText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  citationsContainer: {
    gap: 8,
    marginBottom: SPACING.lg,
  },
  citationCard: {
    backgroundColor: COLORS.surfaceCardSecondary,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  citationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  citationSourcePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  citationSourceText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  citationAccessionPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  citationAccessionText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.statusNormal,
  },
  citationTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  citationFinding: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: SPACING.md,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    marginBottom: SPACING.md,
  },
  disclaimerText: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    lineHeight: 14,
    flex: 1,
    fontStyle: 'italic',
  },
  doneButton: {
    backgroundColor: COLORS.cyan,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.background,
    letterSpacing: 0.5,
  },
});

