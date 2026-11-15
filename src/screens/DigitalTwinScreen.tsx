import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme/colors';
import {
  AstronautProfile,
  RadiationData,
  MainNavTab,
  HealthRecord,
} from '../types/astronaut';
import {
  DEFAULT_ASTRONAUT,
  getLatestHealthRecord,
  getAllHealthRecords,
  getLatestCabinEnvironment,
} from '../services/db';
import { buildAstronautDigitalTwin, DigitalTwinProfile } from '../services/digitalTwinService';
import { generatePredictiveAnalytics, PredictiveAnalyticsReport } from '../services/predictiveAnalyticsService';
import { AstronautAnatomyMap } from '../components/AstronautAnatomyMap';
import { HumanBody3D } from '../components/3d/HumanBody3D';

interface DigitalTwinScreenProps {
  onNavigateTab?: (tab: MainNavTab) => void;
}

export const DigitalTwinScreen: React.FC<DigitalTwinScreenProps> = ({ onNavigateTab }) => {
  const { t } = useTranslation();
  const [profile] = useState<AstronautProfile>(DEFAULT_ASTRONAUT);
  const [twin, setTwin] = useState<DigitalTwinProfile | null>(null);
  const [predictions, setPredictions] = useState<PredictiveAnalyticsReport | null>(null);
  const [activeTab, setActiveTab] = useState<'TWIN' | 'PREDICTIONS'>('TWIN');
  const [bodyViewMode, setBodyViewMode] = useState<'3D' | 'MAP'>('3D');
  const [latestHealthRecord, setLatestHealthRecord] = useState<HealthRecord | null>(null);

  const loadData = async () => {
    try {
      const latest = await getLatestHealthRecord();
      setLatestHealthRecord(latest);
      const all = await getAllHealthRecords(14);
      const cabinEnv = await getLatestCabinEnvironment();

      const radData: RadiationData = {
        currentRateMicroSvPerHour: 18.5,
        dailyExposureMicroSv: 444,
        cumulativeMissionExposureMilliSv: 62.4,
        careerLimitMilliSv: 600,
        thresholdRiskLevel: 'NORMAL',
        solarParticleEventStatus: 'Quiet',
        recommendations: [],
        isSimulatedDemo: true,
        lastUpdated: new Date().toISOString(),
      };

      const digitalTwin = buildAstronautDigitalTwin(profile, latest, all, radData, cabinEnv);
      const predReport = generatePredictiveAnalytics(all, radData, cabinEnv);

      setTwin(digitalTwin);
      setPredictions(predReport);
    } catch (err) {
      console.error('Error loading Digital Twin data:', err);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSystemIcon = (id: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (id) {
      case 'sys_cardio':
        return 'heart-pulse';
      case 'sys_pulmonary':
        return 'lungs';
      case 'sys_thermo':
        return 'thermometer';
      case 'sys_sleep':
        return 'bed-clock';
      case 'sys_neuro':
        return 'brain';
      case 'sys_musculo':
        return 'arm-flex';
      case 'sys_radiation':
        return 'radioactive';
      default:
        return 'account-box-outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPTIMAL':
      case 'IMPROVING':
      case 'STABLE':
        return COLORS.statusNormal;
      case 'COMPENSATING':
      case 'ELEVATED_RISK':
        return COLORS.statusWarning;
      case 'STRAINED':
      case 'WARNING':
      case 'DEGRADING':
        return COLORS.statusAlert;
      default:
        return COLORS.cyan;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="human" size={24} color={COLORS.cyan} />
          </View>
          <View>
            <Text style={styles.title}>{t('digitalTwin.title')}</Text>
            <Text style={styles.subtitle}>{t('digitalTwin.subtitle')}</Text>
          </View>
        </View>
        <View style={styles.missionPill}>
          <Text style={styles.missionPillText}>MET Day {profile.missionDay}</Text>
        </View>
      </View>

      {/* Mode Switcher Tabs */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.modeTab, activeTab === 'TWIN' && styles.modeTabActive]}
          onPress={() => setActiveTab('TWIN')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="account-network-outline"
            size={16}
            color={activeTab === 'TWIN' ? COLORS.cyan : COLORS.textMuted}
          />
          <Text style={[styles.modeTabText, activeTab === 'TWIN' && styles.modeTabTextActive]}>
            {t('nav.twin')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, activeTab === 'PREDICTIONS' && styles.modeTabActive]}
          onPress={() => setActiveTab('PREDICTIONS')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="chart-timeline-variant-shimmer"
            size={16}
            color={activeTab === 'PREDICTIONS' ? COLORS.cyan : COLORS.textMuted}
          />
          <Text style={[styles.modeTabText, activeTab === 'PREDICTIONS' && styles.modeTabTextActive]}>
            {t('predictions.title')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* DIGITAL TWIN VIEW */}
      {activeTab === 'TWIN' && (
        <View style={styles.sectionGap}>
          {/* Composite Adaptation Index Card */}
          <View style={styles.compositeCard}>
            <View style={styles.compositeHeader}>
              <View>
                <Text style={styles.compositeLabel}>ASTRONAUT PHYSIOLOGICAL ADAPTATION</Text>
                <Text style={styles.compositeSubject}>{profile.name} ({profile.callsign})</Text>
              </View>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreVal}>{twin?.overallAdaptationIndex || 91}%</Text>
                <Text style={styles.scoreUnit}>INDEX</Text>
              </View>
            </View>
            <View style={styles.compositeNoticeBox}>
              <MaterialCommunityIcons name="information-outline" size={14} color={COLORS.cyan} />
              <Text style={styles.compositeNoticeText}>{t('digitalTwin.measuredNotice')}</Text>
            </View>
          </View>

          {/* View Model Toggle: 3D Interactive vs 2D Blueprint Map */}
          <View style={styles.viewToggleBar}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, bodyViewMode === '3D' && styles.viewToggleBtnActive]}
              onPress={() => setBodyViewMode('3D')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="cube-scan"
                size={16}
                color={bodyViewMode === '3D' ? COLORS.background : COLORS.cyan}
              />
              <Text style={[styles.viewToggleText, bodyViewMode === '3D' && styles.viewToggleTextActive]}>
                3D Interactive Model
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewToggleBtn, bodyViewMode === 'MAP' && styles.viewToggleBtnActive]}
              onPress={() => setBodyViewMode('MAP')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="map-marker-path"
                size={16}
                color={bodyViewMode === 'MAP' ? COLORS.background : COLORS.cyan}
              />
              <Text style={[styles.viewToggleText, bodyViewMode === 'MAP' && styles.viewToggleTextActive]}>
                2D Anatomy Blueprint
              </Text>
            </TouchableOpacity>
          </View>

          {/* Interactive 3D Model or 2D Map */}
          {bodyViewMode === '3D' ? (
            <HumanBody3D healthRecord={latestHealthRecord} />
          ) : (
            <AstronautAnatomyMap />
          )}

          {/* Organ Systems List */}
          <Text style={styles.sectionHeader}>{t('digitalTwin.systemsTitle')}</Text>

          {twin?.systems.map((sys) => {
            const statusColor = getStatusColor(sys.status);
            return (
              <View key={sys.id} style={styles.systemCard}>
                <View style={styles.sysHeader}>
                  <View style={styles.sysTitleGroup}>
                    <View style={[styles.sysIconCircle, { borderColor: statusColor }]}>
                      <MaterialCommunityIcons name={getSystemIcon(sys.id)} size={18} color={statusColor} />
                    </View>
                    <View>
                      <Text style={styles.sysName}>{sys.systemName}</Text>
                      <Text style={styles.sysDelta}>Baseline: {sys.baselineValue}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>{sys.status}</Text>
                  </View>
                </View>

                <View style={styles.metricRow}>
                  <Text style={styles.measuredVal}>{sys.measuredValue}</Text>
                  <View style={styles.sourceTag}>
                    <Text style={styles.sourceTagText}>
                      {sys.isMeasured ? t('common.measured') : t('common.estimated')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.observationText}>{sys.keyObservation}</Text>

                {sys.estimationNote && (
                  <View style={styles.estimationCallout}>
                    <MaterialCommunityIcons name="calculator" size={12} color={COLORS.statusWarning} />
                    <Text style={styles.estimationCalloutText}>{sys.estimationNote}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Detected Patterns */}
          <Text style={styles.sectionHeader}>{t('digitalTwin.detectedPatterns')}</Text>
          <View style={styles.patternsCard}>
            {twin?.detectedPatterns.map((pat, idx) => (
              <View key={idx} style={styles.patternItem}>
                <MaterialCommunityIcons name="check-decagram" size={16} color={COLORS.cyan} />
                <Text style={styles.patternText}>{pat}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* PREDICTIVE HEALTH ANALYTICS VIEW */}
      {activeTab === 'PREDICTIONS' && (
        <View style={styles.sectionGap}>
          {/* Disclaimer Banner */}
          <View style={styles.disclaimerBanner}>
            <MaterialCommunityIcons name="shield-alert-outline" size={18} color={COLORS.statusWarning} />
            <Text style={styles.disclaimerText}>{t('predictions.disclaimer')}</Text>
          </View>

          {predictions?.predictions.map((pred, pIdx) => {
            const statusColor = getStatusColor(pred.predictedTrend);
            return (
              <View key={pIdx} style={styles.predictionCard}>
                <View style={styles.predHeader}>
                  <Text style={styles.predTitle}>{pred.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>{pred.predictedTrend}</Text>
                  </View>
                </View>

                <View style={styles.predValueRow}>
                  <Text style={styles.predValueText}>{pred.predictedValue}</Text>
                  <Text style={styles.predWindowBadge}>{pred.forecastWindow}</Text>
                </View>

                {/* Confidence & Uncertainty */}
                <View style={styles.statGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t('common.confidence')}</Text>
                    <Text style={styles.statVal}>{(pred.confidenceScore * 100).toFixed(0)}%</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t('predictions.uncertainty')}</Text>
                    <Text style={styles.statVal}>{pred.uncertaintyMargin}</Text>
                  </View>
                </View>

                <Text style={styles.supportingText}>{pred.supportingDataSummary}</Text>

                {/* Factors */}
                <View style={styles.factorsBox}>
                  <Text style={styles.factorsLabel}>{t('predictions.contributingFactors')}:</Text>
                  {pred.contributingFactors.map((fact, fIdx) => (
                    <Text key={fIdx} style={styles.factorItem}>• {fact}</Text>
                  ))}
                </View>

                {/* Countermeasures */}
                <View style={styles.countermeasuresBox}>
                  <Text style={styles.countermeasuresLabel}>{t('predictions.countermeasures')}:</Text>
                  {pred.preventiveRecommendations.map((rec, rIdx) => (
                    <Text key={rIdx} style={styles.countermeasureItem}>{rIdx + 1}. {rec}</Text>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  missionPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
  },
  missionPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    padding: 4,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  modeTabTextActive: {
    color: COLORS.cyan,
  },
  sectionGap: {
    gap: SPACING.md,
  },
  compositeCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    padding: SPACING.md,
  },
  compositeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compositeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  compositeSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  scoreCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreVal: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.white,
  },
  scoreUnit: {
    fontSize: 7,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  compositeNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.15)',
  },
  compositeNoticeText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
  viewToggleBar: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: SPACING.xs,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  viewToggleBtnActive: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  viewToggleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  viewToggleTextActive: {
    color: COLORS.background,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  systemCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
  },
  sysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sysTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sysIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sysName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  sysDelta: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  measuredVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.cyan,
  },
  sourceTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceTagText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  observationText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    lineHeight: 16,
    marginTop: 4,
  },
  estimationCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  estimationCalloutText: {
    fontSize: 9,
    color: COLORS.statusWarning,
    flex: 1,
    lineHeight: 13,
  },
  patternsCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
    gap: 8,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  patternText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    padding: SPACING.md,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.statusWarning,
    lineHeight: 15,
  },
  predictionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    padding: SPACING.md,
  },
  predHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  predTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
    marginRight: 8,
  },
  predValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  predValueText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.cyan,
  },
  predWindowBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  statGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
    padding: 6,
    marginVertical: 6,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  statVal: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 1,
  },
  supportingText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 15,
    marginVertical: 4,
  },
  factorsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 6,
    padding: 6,
    marginVertical: 4,
  },
  factorsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  factorItem: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
  countermeasuresBox: {
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
    borderRadius: 6,
    padding: 6,
    marginTop: 4,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.cyan,
  },
  countermeasuresLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
    marginBottom: 2,
  },
  countermeasureItem: {
    fontSize: 10,
    color: COLORS.textPrimary,
    lineHeight: 14,
  },
});
