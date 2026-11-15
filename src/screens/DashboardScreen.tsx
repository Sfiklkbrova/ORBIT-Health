import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme/colors';
import {
  HealthRecord,
  AstronautProfile,
  CabinEnvironmentData,
  HealthAlert,
  AiHealthAssessment,
  HealthCondition,
  MainNavTab,
} from '../types/astronaut';
import {
  getLatestHealthRecord,
  getAllHealthRecords,
  getLatestCabinEnvironment,
  getActiveAlerts,
  getDatabaseRecordCounts,
  getCurrentAstronautProfile,
} from '../services/db';
import { authService } from '../services/authService';
import { evaluateAstronautHealthOffline } from '../services/aiEngine';
import { HealthDataModal } from '../components/HealthDataModal';
import { AnalysisModal } from '../components/AnalysisModal';
import { changeAppLanguage, getCurrentLanguage, AppLanguage } from '../i18n';
import { DataSourceBadge } from '../components/DataSourceBadge';
import { CommsDelayTimeline } from '../components/CommsDelayTimeline';
import {
  getCommsDelayState,
  setSimulateCommsBlackout,
  isCommsBlackoutActive,
  CommsDelayState,
} from '../services/commsDelayService';

interface DashboardScreenProps {
  onNavigateTab: (tab: MainNavTab) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateTab }) => {
  const { t, i18n } = useTranslation();
  const [activeLang, setActiveLang] = useState<AppLanguage>(getCurrentLanguage());

  const [profile, setProfile] = useState<AstronautProfile>(
    getCurrentAstronautProfile(authService.getCurrentUser())
  );
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
  const [activeAlerts, setActiveAlerts] = useState<HealthAlert[]>([]);
  const [assessment, setAssessment] = useState<AiHealthAssessment | null>(null);

  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [commsState, setCommsState] = useState<CommsDelayState>(getCommsDelayState());

  const handleToggleBlackout = () => {
    const nextState = setSimulateCommsBlackout(!isCommsBlackoutActive());
    setCommsState(nextState);
  };

  useEffect(() => {
    setActiveLang(getCurrentLanguage());
  }, [i18n.language]);

  const handleLanguageChange = async (lang: AppLanguage) => {
    setActiveLang(lang);
    await changeAppLanguage(lang);
  };

  const refreshDashboard = async () => {
    try {
      const activeUser = authService.getCurrentUser();
      const currentAstro = getCurrentAstronautProfile(activeUser);
      setProfile(currentAstro);

      const latest = await getLatestHealthRecord(activeUser?.id);
      const all = await getAllHealthRecords(7, activeUser?.id);
      const env = await getLatestCabinEnvironment();
      const alerts = await getActiveAlerts();
      const counts = await getDatabaseRecordCounts(activeUser?.id);

      setLatestRecord(latest);
      setCabinEnv(env);
      setActiveAlerts(alerts.filter((a) => !a.acknowledged));
      setPendingSyncCount(counts.unsyncedCount);

      const aiAssmt = evaluateAstronautHealthOffline(latest, all, env, currentAstro);
      setAssessment(aiAssmt);
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
    }
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  const handleRecordSaved = async (_newRec: HealthRecord) => {
    await refreshDashboard();
  };

  const condition: HealthCondition = assessment?.overallCondition || 'NORMAL';
  const vitalityScore = assessment?.vitalityScore || 96;

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="orbit" size={24} color={COLORS.cyan} />
              <View style={styles.satelliteDot} />
            </View>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.brandTitle}>ORBIT</Text>
                <Text style={styles.brandTitleAccent}>HEALTH</Text>
              </View>
              <Text style={styles.missionTag}>
                {profile.name.toUpperCase()} • {profile.missionName.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Quick Language Selector */}
            <View style={styles.langSelectorRow}>
              {(['az', 'tr', 'en'] as AppLanguage[]).map((lang) => {
                const isActive = activeLang === lang;
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.langChip, isActive && styles.langChipActive]}
                    onPress={() => handleLanguageChange(lang)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.langChipText, isActive && styles.langChipTextActive]}>
                      {lang.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.profileAvatarBtn} onPress={() => onNavigateTab('profile')} activeOpacity={0.8}>
              <View style={styles.avatarInner}>
                <MaterialCommunityIcons name="account-tie" size={22} color={COLORS.cyan} />
              </View>
              <View style={styles.beaconDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sync & Connectivity Ribbon */}
        <View style={styles.syncRibbon}>
          <View style={styles.syncLeft}>
            <MaterialCommunityIcons
              name={pendingSyncCount > 0 ? 'cloud-upload-outline' : 'cloud-check'}
              size={14}
              color={pendingSyncCount > 0 ? COLORS.statusWarning : COLORS.statusNormal}
            />
            <Text style={styles.syncText}>
              {pendingSyncCount > 0
                ? t('dashboard.recordsQueued', { count: pendingSyncCount })
                : t('dashboard.allSynced')}
            </Text>
          </View>
          <View style={styles.offlinePill}>
            <Text style={styles.offlinePillText}>{t('dashboard.offlineReady')}</Text>
          </View>
        </View>

        {/* NASA 2026 Space Apps One-Sentence Value Proposition */}
        <View style={styles.valuePropBanner}>
          <MaterialCommunityIcons name="satellite-variant" size={16} color={COLORS.cyan} />
          <Text style={styles.valuePropBannerText}>
            {`"${t('dashboard.valueProposition', 'An offline-first AI health companion that lets astronauts on Mars-class missions monitor themselves and make medical decisions when Mission Control is 4-24 minutes away.')}"`}
          </Text>
        </View>

        {/* Mars Comms Propagation Delay & Crew Autonomy Status */}
        <CommsDelayTimeline
          commsState={commsState}
          onToggleBlackout={handleToggleBlackout}
          onOpenOutbox={() => onNavigateTab('control')}
        />

        {/* Active Alerts Banner */}
        {activeAlerts.length > 0 && (
          <TouchableOpacity
            style={styles.alertsBanner}
            onPress={() => onNavigateTab('profile')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="alert-octagon" size={20} color={COLORS.statusAlert} />
            <View style={styles.alertTextWrap}>
              <Text style={styles.alertBannerTitle}>
                {t(activeAlerts.length > 1 ? 'dashboard.activeAlertsBannerPlural' : 'dashboard.activeAlertsBanner', {
                  count: activeAlerts.length,
                })}
              </Text>
              <Text style={styles.alertBannerSub} numberOfLines={1}>
                {activeAlerts[0].title}: {activeAlerts[0].message}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.statusAlert} />
          </TouchableOpacity>
        )}

        {/* 1. VISUAL HEALTH SUMMARY CARD (Normal / Needs Attention / Critical) */}
        <View
          style={[
            styles.healthSummaryCard,
            condition === 'NORMAL'
              ? styles.summaryBorderNormal
              : condition === 'NEEDS_ATTENTION'
              ? styles.summaryBorderAttention
              : styles.summaryBorderCritical,
          ]}
        >
          <View style={styles.summaryTopRow}>
            <View style={styles.conditionPillGroup}>
              <View
                style={[
                  styles.conditionDot,
                  {
                    backgroundColor:
                      condition === 'NORMAL'
                        ? COLORS.statusNormal
                        : condition === 'NEEDS_ATTENTION'
                        ? COLORS.statusWarning
                        : COLORS.statusAlert,
                  },
                ]}
              />
              <Text
                style={[
                  styles.conditionText,
                  {
                    color:
                      condition === 'NORMAL'
                        ? COLORS.statusNormal
                        : condition === 'NEEDS_ATTENTION'
                        ? COLORS.statusWarning
                        : COLORS.statusAlert,
                  },
                ]}
              >
                {t('dashboard.astronautCondition')}:{' '}
                {condition === 'NORMAL'
                  ? t('dashboard.conditionOptimal')
                  : condition === 'NEEDS_ATTENTION'
                  ? t('dashboard.conditionNeedsAttention')
                  : t('dashboard.conditionCritical')}
              </Text>
            </View>

            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>{t('dashboard.demoTelemetry')}</Text>
            </View>
          </View>

          {/* Center Visual Vitality Gauge */}
          <View style={styles.vitalityScoreRow}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreVal}>{vitalityScore}</Text>
              <Text style={styles.scoreMax}>/ 100</Text>
            </View>
            <View style={styles.summaryDetails}>
              <View style={styles.vitalityTitleRow}>
                <Text style={styles.astronautTitle}>{profile.name} ({profile.callsign})</Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      t('dashboard.vitalityInfoTitle', 'Estimated Indicator Formula'),
                      t(
                        'dashboard.vitalityInfoBody',
                        'Estimated indicator - not an official NASA metric. Calculated from resting HRV variance, SpO2 perfusion, and sleep architecture.'
                      )
                    )
                  }
                  style={styles.infoIconBtn}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="information" size={16} color={COLORS.cyan} />
                </TouchableOpacity>
              </View>
              <Text style={styles.indicatorSubNote}>
                Estimated indicator - not an official NASA metric
              </Text>
              <Text style={styles.summaryDescription}>
                {assessment?.summary || t('dashboard.allSynced')}
              </Text>
              <Text style={styles.lastUpdateText}>
                {t('dashboard.lastTelemetryUpdate')}:{' '}
                {latestRecord
                  ? new Date(latestRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : t('dashboard.justNow')}{' '}
                {latestRecord?.isManual ? `(${t('dashboard.manualLog')})` : `(${t('dashboard.simulatedFeed')})`}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button: Manual Log, 3D Twin & AI Diagnostic */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.logTelemetryBtn}
            onPress={() => setIsDataModalOpen(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="clipboard-plus-outline" size={18} color={COLORS.background} />
            <Text style={styles.logTelemetryBtnText}>{t('dashboard.logVitals')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.diagQuickBtn}
            onPress={() => onNavigateTab('twin')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cube-scan" size={18} color={COLORS.cyan} />
            <Text style={styles.diagQuickBtnText}>3D Twin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.diagQuickBtn}
            onPress={() => setIsAnalysisModalOpen(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="brain" size={18} color={COLORS.cyan} />
            <Text style={styles.diagQuickBtnText}>{t('dashboard.aiDeepDiag')}</Text>
          </TouchableOpacity>
        </View>

        {/* 2. HEALTH OVERVIEW CARDS (Astronaut Specific Vitals) */}
        <Text style={styles.sectionHeader}>{t('dashboard.vitalTelemetryTitle')}</Text>
        <View style={styles.vitalsGrid}>
          {/* Heart Rate */}
          <View style={styles.vitalCard}>
            <View style={styles.vitalTop}>
              <View style={[styles.vitalIconWrap, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
                <MaterialCommunityIcons name="heart-pulse" size={18} color={COLORS.heartRate} />
              </View>
              <DataSourceBadge source="SENSOR" compact />
            </View>
            <Text style={styles.vitalName}>{t('dashboard.heartRate')}</Text>
            <View style={styles.vitalValueRow}>
              <Text style={styles.vitalValue}>{latestRecord?.heartRate || 72}</Text>
              <Text style={styles.vitalUnit}>BPM</Text>
            </View>
            <Text style={styles.vitalSub}>{t('dashboard.baseline')}: {profile.baselines.restingHeartRate} BPM</Text>
          </View>

          {/* Blood Oxygen */}
          <View style={styles.vitalCard}>
            <View style={styles.vitalTop}>
              <View style={[styles.vitalIconWrap, { backgroundColor: 'rgba(0, 242, 254, 0.12)' }]}>
                <MaterialCommunityIcons name="water-percent" size={18} color={COLORS.bloodOxygen} />
              </View>
              <DataSourceBadge source="SENSOR" compact />
            </View>
            <Text style={styles.vitalName}>{t('dashboard.bloodOxygen')}</Text>
            <View style={styles.vitalValueRow}>
              <Text style={styles.vitalValue}>{latestRecord?.bloodOxygen || 98}</Text>
              <Text style={styles.vitalUnit}>% SpO2</Text>
            </View>
            <Text style={styles.vitalSub}>{t('dashboard.nominalOxygen')}</Text>
          </View>

          {/* Blood Pressure */}
          <View style={styles.vitalCard}>
            <View style={styles.vitalTop}>
              <View style={[styles.vitalIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={18} color={COLORS.bloodPressure} />
              </View>
              <DataSourceBadge source="MANUAL" compact />
            </View>
            <Text style={styles.vitalName}>{t('dashboard.bloodPressure')}</Text>
            <View style={styles.vitalValueRow}>
              <Text style={styles.vitalValue}>
                {latestRecord ? `${latestRecord.bloodPressureSys}/${latestRecord.bloodPressureDia}` : '120/80'}
              </Text>
              <Text style={styles.vitalUnit}>mmHg</Text>
            </View>
            <Text style={styles.vitalSub}>{t('dashboard.cephaladAdapted')}</Text>
          </View>

          {/* Body Temperature */}
          <View style={styles.vitalCard}>
            <View style={styles.vitalTop}>
              <View style={[styles.vitalIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <MaterialCommunityIcons name="thermometer" size={18} color={COLORS.temperature} />
              </View>
              <DataSourceBadge source="SENSOR" compact />
            </View>
            <Text style={styles.vitalName}>{t('dashboard.temperature')}</Text>
            <View style={styles.vitalValueRow}>
              <Text style={styles.vitalValue}>{latestRecord?.bodyTemperature.toFixed(1) || '36.6'}</Text>
              <Text style={styles.vitalUnit}>°C</Text>
            </View>
            <Text style={styles.vitalSub}>{t('dashboard.normothermic')}</Text>
          </View>

          {/* Sleep Duration & Quality */}
          <View style={styles.vitalCard}>
            <View style={styles.vitalTop}>
              <View style={[styles.vitalIconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                <MaterialCommunityIcons name="moon-waning-crescent" size={18} color={COLORS.sleep} />
              </View>
              <DataSourceBadge source="SENSOR" compact />
            </View>
            <Text style={styles.vitalName}>{t('dashboard.sleep')}</Text>
            <View style={styles.vitalValueRow}>
              <Text style={styles.vitalValue}>{latestRecord?.sleepDurationHours.toFixed(1) || '8.0'}</Text>
              <Text style={styles.vitalUnit}>{t('dashboard.hoursUnit')}</Text>
            </View>
            <Text style={styles.vitalSub}>
              {t('dashboard.wakeInterruptions', { count: latestRecord?.sleepInterruptions || 1 })}
            </Text>
          </View>

          {/* Fatigue Level */}
          <View style={styles.vitalCard}>
            <View style={styles.vitalTop}>
              <View style={[styles.vitalIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <MaterialCommunityIcons name="battery-alert" size={18} color={COLORS.statusWarning} />
              </View>
              <DataSourceBadge source="MANUAL" compact />
            </View>
            <Text style={styles.vitalName}>{t('dashboard.fatigue')}</Text>
            <View style={styles.vitalValueRow}>
              <Text style={styles.vitalValue}>{latestRecord?.fatigueLevel || 3}</Text>
              <Text style={styles.vitalUnit}>/ 10</Text>
            </View>
            <Text style={styles.vitalSub}>{t('dashboard.evaReadiness')}</Text>
          </View>
        </View>

        {/* Space Countermeasure Physical Activity (NOT a step counter) */}
        <View style={styles.countermeasureCard}>
          <View style={styles.cmHeader}>
            <View style={styles.cmTitleGroup}>
              <MaterialCommunityIcons name="weight-lifter" size={20} color={COLORS.cyan} />
              <View>
                <Text style={styles.cmTitle}>{t('dashboard.exerciseTitle')}</Text>
                <Text style={styles.cmSubtitle}>{t('dashboard.exerciseSub')}</Text>
              </View>
            </View>
            <View style={styles.cmDurationBadge}>
              <Text style={styles.cmDurationText}>
                {latestRecord?.exercise.durationMinutes || 90} {t('dashboard.minutesUnit')}
              </Text>
            </View>
          </View>

          <View style={styles.cmProtocolBox}>
            <Text style={styles.cmProtocolLabel}>{t('dashboard.activeProtocol')}:</Text>
            <Text style={styles.cmProtocolName}>
              {latestRecord?.exercise.type || t('dashboard.aredDefault')} ({latestRecord?.exercise.intensity ? (latestRecord.exercise.intensity === 'High' ? t('dashboard.intensityHigh') : latestRecord.exercise.intensity) : t('dashboard.intensityHigh')})
            </Text>
          </View>

          {/* Progress Bar towards 90 min requirement */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, (((latestRecord?.exercise.durationMinutes || 90) / 90) * 100))}%` },
              ]}
            />
          </View>
          <Text style={styles.cmGoalNote}>
            {t('dashboard.exerciseTarget')}
          </Text>
        </View>

        {/* Space Radiation & Environment Quick Glance */}
        <View style={styles.spaceGlanceCard}>
          <View style={styles.glanceHeader}>
            <Text style={styles.glanceTitle}>{t('dashboard.orbitalEnvGlance')}</Text>
            <TouchableOpacity onPress={() => onNavigateTab('radiation')}>
              <Text style={styles.viewRadLink}>{t('dashboard.viewDosimeter')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.glanceRow}>
            <View style={styles.glanceItem}>
              <Text style={styles.glanceVal}>{cabinEnv.ambientRadiationMicroSv.toFixed(1)} µSv/h</Text>
              <Text style={styles.glanceLbl}>{t('dashboard.radiationRate')}</Text>
            </View>
            <View style={styles.glanceDivider} />
            <View style={styles.glanceItem}>
              <Text style={styles.glanceVal}>{cabinEnv.cabinO2Percent.toFixed(1)}%</Text>
              <Text style={styles.glanceLbl}>{t('dashboard.cabinO2')}</Text>
            </View>
            <View style={styles.glanceDivider} />
            <View style={styles.glanceItem}>
              <Text style={styles.glanceVal}>{cabinEnv.cabinCO2mmHg.toFixed(1)} mmHg</Text>
              <Text style={styles.glanceLbl}>{t('dashboard.cabinCO2')}</Text>
            </View>
          </View>
        </View>

        {/* NASA Scientific Intelligence Card */}
        <View style={styles.nasaDashboardCard}>
          <View style={styles.nasaDashHeader}>
            <View style={styles.nasaDashTitleGroup}>
              <MaterialCommunityIcons name="database-sync" size={20} color={COLORS.cyan} />
              <View>
                <Text style={styles.nasaDashTitle}>{t('dashboard.nasaSystemTitle')}</Text>
                <Text style={styles.nasaDashSub}>{t('dashboard.nasaSystemSub')}</Text>
              </View>
            </View>
            <View style={styles.nasaPill}>
              <Text style={styles.nasaPillText}>{t('dashboard.feedsActive')}</Text>
            </View>
          </View>

          <View style={styles.nasaBadgesRow}>
            <View style={styles.nasaResourceBadge}>
              <Text style={styles.resourceName}>OSDR</Text>
              <Text style={styles.resourceDesc}>{t('dashboard.biologyDesc')}</Text>
            </View>
            <View style={styles.nasaResourceBadge}>
              <Text style={styles.resourceName}>RadLab</Text>
              <Text style={styles.resourceDesc}>{t('dashboard.dosimetryDesc')}</Text>
            </View>
            <View style={styles.nasaResourceBadge}>
              <Text style={styles.resourceName}>EDA</Text>
              <Text style={styles.resourceDesc}>{t('dashboard.eclssDesc')}</Text>
            </View>
            <View style={styles.nasaResourceBadge}>
              <Text style={styles.resourceName}>HRR</Text>
              <Text style={styles.resourceDesc}>{t('dashboard.evidenceDesc')}</Text>
            </View>
            <View style={styles.nasaResourceBadge}>
              <Text style={styles.resourceName}>DONKI</Text>
              <Text style={styles.resourceDesc}>{t('dashboard.solarCmeDesc')}</Text>
            </View>
          </View>

          <Text style={styles.nasaDashSummary}>
            {t('dashboard.nasaCorrelationText')}
          </Text>

          <TouchableOpacity
            style={styles.openNasaCenterBtn}
            onPress={() => onNavigateTab('nasa')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="database-search" size={16} color={COLORS.cyan} />
            <Text style={styles.openNasaCenterBtnText}>{t('dashboard.launchNasaCenter')}</Text>
          </TouchableOpacity>
        </View>

        {/* NASA Deep Space Health Diagnostics Grid */}
        <View style={{ flexDirection: 'row', gap: 10, marginVertical: SPACING.sm }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.surfaceCard,
              borderRadius: 10,
              padding: SPACING.sm,
              borderWidth: 1,
              borderColor: COLORS.borderSubtle,
              alignItems: 'center',
            }}
            onPress={() => onNavigateTab('sans')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="eye-check" size={20} color={COLORS.cyan} />
            <Text style={{ color: COLORS.textPrimary, fontSize: 11, fontWeight: '700', marginTop: 4 }}>SANS Vision</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 9, textAlign: 'center' }}>Acuity Check</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.surfaceCard,
              borderRadius: 10,
              padding: SPACING.sm,
              borderWidth: 1,
              borderColor: COLORS.borderSubtle,
              alignItems: 'center',
            }}
            onPress={() => onNavigateTab('behavioral')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="heart-pulse" size={20} color={COLORS.cyan} />
            <Text style={{ color: COLORS.textPrimary, fontSize: 11, fontWeight: '700', marginTop: 4 }}>Behavioral</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 9, textAlign: 'center' }}>30s Check-in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.surfaceCard,
              borderRadius: 10,
              padding: SPACING.sm,
              borderWidth: 1,
              borderColor: COLORS.borderSubtle,
              alignItems: 'center',
            }}
            onPress={() => onNavigateTab('radiation')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="weather-sunny-alert" size={20} color={COLORS.statusWarning} />
            <Text style={{ color: COLORS.textPrimary, fontSize: 11, fontWeight: '700', marginTop: 4 }}>Radiation</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 9, textAlign: 'center' }}>Shelter Advisor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: COLORS.surfaceCard,
              borderRadius: 10,
              padding: SPACING.sm,
              borderWidth: 1,
              borderColor: COLORS.borderSubtle,
              alignItems: 'center',
            }}
            onPress={() => onNavigateTab('control')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="satellite-uplink" size={20} color={COLORS.cyan} />
            <Text style={{ color: COLORS.textPrimary, fontSize: 11, fontWeight: '700', marginTop: 4 }}>Comms Link</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 9, textAlign: 'center' }}>Flight Surgeon</Text>
          </TouchableOpacity>
        </View>

        {/* Earth Impact / Beyond Space Navigation Card */}
        <TouchableOpacity
          style={styles.beyondSpaceCard}
          onPress={() => onNavigateTab('beyond_space')}
          activeOpacity={0.8}
        >
          <View style={styles.beyondSpaceLeft}>
            <MaterialCommunityIcons name="earth" size={26} color={COLORS.cyan} />
          </View>
          <View style={styles.beyondSpaceContent}>
            <View style={styles.beyondSpaceBadge}>
              <Text style={styles.beyondSpaceBadgeText}>DUAL-USE EARTH BENEFIT</Text>
            </View>
            <Text style={styles.beyondSpaceTitle}>
              {t('beyondSpace.title', 'Beyond Space: Earth Impact')}
            </Text>
            <Text style={styles.beyondSpaceSub}>
              {t('beyondSpace.subtitle', 'Extending deep-space offline medical autonomy to extreme environments and underserved populations on Earth.')}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.cyan} />
        </TouchableOpacity>
      </ScrollView>

      {/* Manual Data Entry Modal */}
      <HealthDataModal
        visible={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onRecordSaved={handleRecordSaved}
      />

      {/* AI Deep Analysis Modal */}
      {assessment && (
        <AnalysisModal
          visible={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          insight={{
            title: 'Onboard Spaceflight AI Diagnostic',
            timestamp: new Date().toLocaleTimeString(),
            sampleBadge: 'OFFLINE ONNX / RULE ENGINE',
            summary: assessment.summary,
            keyPoints: assessment.keyObservations.map((obs) => ({
              label: obs.metric,
              value: obs.finding,
              status: obs.status === 'Optimal' ? 'optimal' : 'notice',
            })),
            detailedAnalysis: `${assessment.fatigueAndSleepAnalysis}\n\n${assessment.environmentalRiskAnalysis}`,
            recommendations: assessment.preventiveRecommendations,
            nasaCitations: assessment.nasaCitations,
            scientificDisclaimer: assessment.scientificDisclaimer,
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  satelliteDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.cyan,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  brandTitleAccent: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.cyan,
    letterSpacing: 1.5,
  },
  missionTag: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  langChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  langChipActive: {
    backgroundColor: COLORS.cyan,
  },
  langChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  langChipTextActive: {
    color: COLORS.background,
  },
  profileAvatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceCardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beaconDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.statusNormal,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  syncRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  syncText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  offlinePill: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offlinePillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  alertsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.statusAlert,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertBannerTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.statusAlert,
    letterSpacing: 0.8,
  },
  alertBannerSub: {
    fontSize: 10,
    color: COLORS.white,
    marginTop: 1,
  },
  healthSummaryCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
  },
  summaryBorderNormal: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  summaryBorderAttention: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  summaryBorderCritical: {
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  conditionPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  demoBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  demoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.statusWarning,
  },
  vitalityScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  scoreCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    backgroundColor: COLORS.surfaceCardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreVal: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  scoreMax: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  summaryDetails: {
    flex: 1,
  },
  astronautTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  summaryDescription: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 4,
  },
  lastUpdateText: {
    fontSize: 9.5,
    color: COLORS.textCyan,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  logTelemetryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.cyan,
    paddingVertical: 12,
    borderRadius: 14,
  },
  logTelemetryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.background,
  },
  diagQuickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    paddingVertical: 12,
    borderRadius: 14,
  },
  diagQuickBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  vitalCard: {
    width: '48%',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  vitalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  vitalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitalStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  vitalName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  vitalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 2,
  },
  vitalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  vitalUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  vitalSub: {
    fontSize: 9.5,
    color: COLORS.textMuted,
  },
  countermeasureCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 18,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.md,
  },
  cmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cmTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cmTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cmSubtitle: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
  },
  cmDurationBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.cyan,
  },
  cmDurationText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.cyan,
  },
  cmProtocolBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  cmProtocolLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  cmProtocolName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: 3,
  },
  cmGoalNote: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  spaceGlanceCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  glanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  glanceTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  viewRadLink: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  glanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  glanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  glanceVal: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  glanceLbl: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  glanceDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.borderSubtle,
    alignSelf: 'center',
  },
  nasaDashboardCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginTop: SPACING.lg,
  },
  nasaDashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  nasaDashTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nasaDashTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  nasaDashSub: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  nasaPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  nasaPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  nasaBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.sm,
    gap: 4,
  },
  nasaResourceBadge: {
    flex: 1,
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  resourceName: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.cyan,
  },
  resourceDesc: {
    fontSize: 8,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  nasaDashSummary: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    lineHeight: 15,
    marginBottom: SPACING.md,
  },
  openNasaCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
  },
  openNasaCenterBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  valuePropBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  valuePropBannerText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#E0F2FE',
    lineHeight: 16,
  },
  vitalityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoIconBtn: {
    padding: 2,
  },
  indicatorSubNote: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 2,
  },
  beyondSpaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    gap: 10,
  },
  beyondSpaceLeft: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  beyondSpaceContent: {
    flex: 1,
  },
  beyondSpaceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
  },
  beyondSpaceBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.5,
  },
  beyondSpaceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  beyondSpaceSub: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    lineHeight: 14,
    marginTop: 2,
  },
});
