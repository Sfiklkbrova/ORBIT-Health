import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme/colors';
import {
  AstronautProfile,
  HealthRecord,
  RadiationData,
  CabinEnvironmentData,
  MainNavTab,
} from '../types/astronaut';
import {
  DEFAULT_ASTRONAUT,
  getLatestHealthRecord,
  getLatestCabinEnvironment,
} from '../services/db';
import {
  getEmergencyEventHistory,
  evaluateEmergencyConditions,
  generateFlightSurgeonEmergencySummary,
  DEFAULT_EMERGENCY_THRESHOLDS,
  EmergencyEvent,
  EmergencyHealthSummary,
  EmergencyThresholdConfig,
} from '../services/emergencyService';

interface EmergencyScreenProps {
  onNavigateTab?: (tab: MainNavTab) => void;
}

export const EmergencyScreen: React.FC<EmergencyScreenProps> = ({ onNavigateTab }) => {
  const { t } = useTranslation();
  const [profile] = useState<AstronautProfile>(DEFAULT_ASTRONAUT);
  const [latestRecord, setLatestRecord] = useState<HealthRecord | null>(null);
  const [cabinEnv, setCabinEnv] = useState<CabinEnvironmentData>({
    cabinTempCelsius: 21.8,
    cabinO2Percent: 20.9,
    cabinCO2mmHg: 2.8,
    cabinPressureKPa: 101.3,
    ambientRadiationMicroSv: 18.5,
    overallStatus: 'Nominal',
    isSimulatedDemo: true,
    lastUpdated: new Date().toISOString(),
  });
  const [radiationData] = useState<RadiationData>({
    currentRateMicroSvPerHour: 18.5,
    dailyExposureMicroSv: 444,
    cumulativeMissionExposureMilliSv: 62.4,
    careerLimitMilliSv: 600,
    thresholdRiskLevel: 'NORMAL',
    solarParticleEventStatus: 'Quiet',
    recommendations: [],
    isSimulatedDemo: true,
    lastUpdated: new Date().toISOString(),
  });

  const [activeEvents, setActiveEvents] = useState<EmergencyEvent[]>([]);
  const [historyEvents, setHistoryEvents] = useState<EmergencyEvent[]>([]);
  const [thresholds] = useState<EmergencyThresholdConfig>(DEFAULT_EMERGENCY_THRESHOLDS);
  const [generatedSummary, setGeneratedSummary] = useState<EmergencyHealthSummary | null>(null);
  const [isSummaryModalVisible, setIsSummaryModalVisible] = useState(false);

  const loadData = async () => {
    try {
      const latest = await getLatestHealthRecord();
      const env = await getLatestCabinEnvironment();
      setLatestRecord(latest);
      setCabinEnv(env);

      const events = evaluateEmergencyConditions(latest, radiationData, env, thresholds);
      setActiveEvents(events);
      setHistoryEvents(getEmergencyEventHistory());
    } catch (err) {
      console.error('Error loading emergency screen data:', err);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateEmergencyBrief = () => {
    const summary = generateFlightSurgeonEmergencySummary(
      profile,
      latestRecord,
      radiationData,
      cabinEnv,
      activeEvents[0]
    );
    setGeneratedSummary(summary);
    setIsSummaryModalVisible(true);
  };

  const isEmergencyActive = activeEvents.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <View style={[styles.avatar, isEmergencyActive && { borderColor: COLORS.statusAlert }]}>
            <MaterialCommunityIcons
              name={isEmergencyActive ? 'alert-decagram' : 'shield-check'}
              size={24}
              color={isEmergencyActive ? COLORS.statusAlert : COLORS.statusNormal}
            />
          </View>
          <View>
            <Text style={styles.title}>{t('emergency.title')}</Text>
            <Text style={styles.subtitle}>{t('emergency.subtitle')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.summaryBtn}
          onPress={handleGenerateEmergencyBrief}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="file-document-edit-outline" size={16} color={COLORS.cyan} />
          <Text style={styles.summaryBtnText}>Generate Brief</Text>
        </TouchableOpacity>
      </View>

      {/* Safety Notice Banner */}
      <View style={styles.safeNoticeBanner}>
        <MaterialCommunityIcons name="satellite-variant" size={16} color={COLORS.cyan} />
        <Text style={styles.safeNoticeText}>{t('emergency.safeNotice')}</Text>
      </View>

      {/* Emergency Status Banner */}
      <View style={[styles.statusBanner, isEmergencyActive ? styles.statusAlertBanner : styles.statusNominalBanner]}>
        <MaterialCommunityIcons
          name={isEmergencyActive ? 'alarm-light' : 'check-circle-outline'}
          size={20}
          color={isEmergencyActive ? COLORS.statusAlert : COLORS.statusNormal}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusBannerTitle, { color: isEmergencyActive ? COLORS.statusAlert : COLORS.statusNormal }]}>
            {isEmergencyActive ? 'CRITICAL HEALTH ALERT ACTIVE' : 'NOMINAL FLIGHT MEDICAL STATE'}
          </Text>
          <Text style={styles.statusBannerSub}>
            {isEmergencyActive
              ? `${activeEvents.length} threshold violation(s) queued for Houston Flight Surgeon review.`
              : t('emergency.noCritical')}
          </Text>
        </View>
      </View>

      {/* Active Critical Alerts */}
      {isEmergencyActive && (
        <View style={styles.alertsContainer}>
          <Text style={styles.sectionHeader}>{t('emergency.activeAlerts')}</Text>
          {activeEvents.map((evt) => (
            <View key={evt.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={styles.alertIndicatorGroup}>
                  <MaterialCommunityIcons name="alert" size={16} color={COLORS.statusAlert} />
                  <Text style={styles.alertIndicator}>{evt.affectedIndicator}</Text>
                </View>
                <Text style={styles.alertValueText}>{evt.measuredValue}</Text>
              </View>

              <Text style={styles.alertViolation}>{evt.thresholdViolation}</Text>

              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>{t('emergency.triggerReason')}:</Text>
                <Text style={styles.reasonText}>{evt.triggerReason}</Text>
              </View>

              <View style={styles.actionBox}>
                <Text style={styles.actionLabel}>{t('emergency.recommendedAction')}:</Text>
                <Text style={styles.actionText}>{evt.recommendedAction}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Houston Flight Surgeon Contact Card */}
      <Text style={styles.sectionHeader}>{t('emergency.flightSurgeonCard')}</Text>
      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <View style={styles.surgeonAvatar}>
            <MaterialCommunityIcons name="doctor" size={24} color={COLORS.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.surgeonName}>{profile.emergencyContact.flightSurgeonName}</Text>
            <Text style={styles.surgeonLoc}>{profile.emergencyContact.location}</Text>
          </View>
          <View style={styles.carrierBadge}>
            <View style={styles.carrierDot} />
            <Text style={styles.carrierText}>KU-BAND</Text>
          </View>
        </View>

        <View style={styles.contactDetails}>
          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="radio-tower" size={14} color={COLORS.cyan} />
            <Text style={styles.contactText}>{t('emergency.commChannel')}</Text>
          </View>
          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="sine-wave" size={14} color={COLORS.cyan} />
            <Text style={styles.contactText}>{t('emergency.frequency')}</Text>
          </View>
        </View>
      </View>

      {/* Safety Thresholds Review */}
      <Text style={styles.sectionHeader}>{t('emergency.thresholdsTitle')}</Text>
      <View style={styles.thresholdsCard}>
        <View style={styles.threshRow}>
          <Text style={styles.threshLabel}>Heart Rate Range:</Text>
          <Text style={styles.threshVal}>{thresholds.heartRateMinBpm} - {thresholds.heartRateMaxBpm} BPM</Text>
        </View>
        <View style={styles.threshRow}>
          <Text style={styles.threshLabel}>Minimum Blood Oxygen (SpO2):</Text>
          <Text style={styles.threshVal}>&gt; {thresholds.spo2MinPercent}%</Text>
        </View>
        <View style={styles.threshRow}>
          <Text style={styles.threshLabel}>Blood Pressure (Systolic Max/Min):</Text>
          <Text style={styles.threshVal}>{thresholds.bpSystolicMin} - {thresholds.bpSystolicMax} mmHg</Text>
        </View>
        <View style={styles.threshRow}>
          <Text style={styles.threshLabel}>Body Temperature Safe Band:</Text>
          <Text style={styles.threshVal}>{thresholds.bodyTempMinCelsius}°C - {thresholds.bodyTempMaxCelsius}°C</Text>
        </View>
        <View style={styles.threshRow}>
          <Text style={styles.threshLabel}>Max Radiation Dosimeter Flux:</Text>
          <Text style={styles.threshVal}>&lt; {thresholds.radiationFluxMaxMicroSv} µSv/h</Text>
        </View>
        <View style={styles.threshRow}>
          <Text style={styles.threshLabel}>Cabin CO2 Upper Threshold:</Text>
          <Text style={styles.threshVal}>&lt; {thresholds.cabinCo2MaxMmHg} mmHg</Text>
        </View>
      </View>

      {/* Emergency Event History */}
      <Text style={styles.sectionHeader}>{t('emergency.eventHistory')}</Text>
      <View style={styles.historyList}>
        {historyEvents.map((evt) => (
          <View key={evt.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTime}>{new Date(evt.timestamp).toLocaleString()}</Text>
              <View style={styles.historyBadge}>
                <Text style={styles.historyBadgeText}>{evt.severity}</Text>
              </View>
            </View>
            <Text style={styles.historyIndicator}>{evt.affectedIndicator}: {evt.measuredValue}</Text>
            <Text style={styles.historyReason}>{evt.triggerReason}</Text>
          </View>
        ))}
      </View>

      {/* Flight Surgeon Emergency Summary Modal */}
      <Modal visible={isSummaryModalVisible} transparent animationType="fade" onRequestClose={() => setIsSummaryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBadge}>
                <MaterialCommunityIcons name="file-chart" size={14} color={COLORS.cyan} />
                <Text style={styles.modalBadgeText}>DOWNLINK EMERGENCY BRIEF</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSummaryModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubject}>Astronaut: {generatedSummary?.astronautName} (Day {generatedSummary?.missionDay})</Text>

            <View style={styles.vitalsBox}>
              <Text style={styles.vitalsTitle}>TELEMETRY SNAPSHOT:</Text>
              <Text style={styles.vitalLine}>• Heart Rate: {generatedSummary?.vitalsSnapshot.heartRate}</Text>
              <Text style={styles.vitalLine}>• Blood Oxygen: {generatedSummary?.vitalsSnapshot.bloodOxygen}</Text>
              <Text style={styles.vitalLine}>• Blood Pressure: {generatedSummary?.vitalsSnapshot.bloodPressure}</Text>
              <Text style={styles.vitalLine}>• Body Temperature: {generatedSummary?.vitalsSnapshot.temperature}</Text>
              <Text style={styles.vitalLine}>• Radiation Flux: {generatedSummary?.vitalsSnapshot.radiationRate}</Text>
              <Text style={styles.vitalLine}>• Cabin CO2: {generatedSummary?.vitalsSnapshot.cabinCo2}</Text>
            </View>

            <View style={styles.protocolBox}>
              <Text style={styles.protocolLabel}>RECOMMENDED PROTOCOL:</Text>
              <Text style={styles.protocolText}>{generatedSummary?.recommendedImmediateProtocol}</Text>
            </View>

            <Text style={styles.downlinkNotice}>{generatedSummary?.downlinkNotice}</Text>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsSummaryModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Close Brief</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    flex: 1,
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
  summaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  summaryBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  safeNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  safeNoticeText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  statusNominalBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusAlertBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statusBannerTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statusBannerSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  alertsContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  alertCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: SPACING.md,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertIndicatorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertIndicator: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.statusAlert,
  },
  alertValueText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
  },
  alertViolation: {
    fontSize: 10,
    color: COLORS.statusAlert,
    marginBottom: 6,
  },
  reasonBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  reasonLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  reasonText: {
    fontSize: 10,
    color: COLORS.textPrimary,
  },
  actionBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 6,
    borderRadius: 6,
  },
  actionLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.statusAlert,
  },
  actionText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '700',
  },
  contactCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  surgeonAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  surgeonName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  surgeonLoc: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  carrierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  carrierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.statusNormal,
  },
  carrierText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.statusNormal,
  },
  contactDetails: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  thresholdsCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
    gap: 6,
    marginBottom: SPACING.md,
  },
  threshRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  threshLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  threshVal: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  historyList: {
    gap: 6,
    marginBottom: SPACING.md,
  },
  historyCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  historyBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  historyBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.statusWarning,
  },
  historyIndicator: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
  },
  historyReason: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 24, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  modalSubject: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
  },
  vitalsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  vitalsTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.cyan,
    marginBottom: 4,
  },
  vitalLine: {
    fontSize: 10,
    color: COLORS.textPrimary,
    lineHeight: 15,
  },
  protocolBox: {
    backgroundColor: 'rgba(0, 242, 254, 0.06)',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.cyan,
    marginBottom: 8,
  },
  protocolLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.cyan,
    marginBottom: 2,
  },
  protocolText: {
    fontSize: 10,
    color: COLORS.textPrimary,
  },
  downlinkNotice: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    lineHeight: 13,
    marginBottom: 12,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
  },
});
