import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SPACING } from '../theme/colors';
import {
  AstronautProfile,
  HealthAlert,
  MainNavTab,
  RadiationData,
} from '../types/astronaut';
import {
  getActiveAlerts,
  acknowledgeAlert,
  getDatabaseRecordCounts,
  getAllHealthRecords,
  getRadiationHistory,
  getLatestCabinEnvironment,
  getCurrentAstronautProfile,
} from '../services/db';
import { authService, AuthenticatedUser } from '../services/authService';
import { syncPendingHealthRecords, SyncResult } from '../services/supabase';
import {
  NASA_INTEGRATION_MODULES,
  generateMissionTelemetryJson,
  generateCsvReport,
} from '../services/nasaIntegration';
import {
  activateJudgeDemoMode,
  deactivateJudgeDemoMode,
  isDemoModeActive,
} from '../services/demoModeService';
import { changeAppLanguage, getCurrentLanguage, AppLanguage } from '../i18n';
import {
  getAuditLogs,
  isPinLockEnabled,
  setPinLockEnabled,
  getActiveUserRole,
  setActiveUserRole,
  UserRole,
  AuditLogEntry,
} from '../services/securityService';
import {
  generateProfessionalReport,
  ReportType,
  ReportExportFormat,
  GeneratedReport,
} from '../services/reportingService';
import {
  getAvailableSensors,
  MedicalSensorDevice,
} from '../services/sensorIntegrationService';

interface ProfileScreenProps {
  onNavigateTab?: (tab: MainNavTab) => void;
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigateTab, onLogout }) => {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(authService.getCurrentUser());
  const [profile, setProfile] = useState<AstronautProfile>(getCurrentAstronautProfile(authService.getCurrentUser()));
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [dbCounts, setDbCounts] = useState({
    healthRecords: 0,
    radiationLogs: 0,
    unsyncedCount: 0,
    alertsCount: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // Multilingual State
  const [currentLang, setCurrentLang] = useState<AppLanguage>(getCurrentLanguage());

  // Security & Role State
  const [pinEnabled, setPinEnabled] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('COMMANDER');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isAuditModalVisible, setIsAuditModalVisible] = useState(false);

  // Sensors State
  const [sensors] = useState<MedicalSensorDevice[]>(getAvailableSensors());

  // Professional Reporting State
  const [reportType, setReportType] = useState<ReportType>('MISSION_DOSSIER');
  const [reportFormat, setReportFormat] = useState<ReportExportFormat>('FORMATTED_TEXT');
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  // Accessibility State
  const [highContrast, setHighContrast] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState<'NORMAL' | 'LARGE' | 'XL'>('NORMAL');

  // User Authorization Modal State for Data Export
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<'JSON' | 'CSV'>('JSON');
  const [anonymizeData, setAnonymizeData] = useState(true);
  const [isAuthorizedConfirmed, setIsAuthorizedConfirmed] = useState(false);

  const loadProfileData = async () => {
    try {
      const activeUser = authService.getCurrentUser();
      setCurrentUser(activeUser);
      setProfile(getCurrentAstronautProfile(activeUser));
      const allAlerts = await getActiveAlerts();
      const counts = await getDatabaseRecordCounts(activeUser?.id);
      const isPin = await isPinLockEnabled();
      const role = await getActiveUserRole();

      setAlerts(allAlerts);
      setDbCounts(counts);
      setPinEnabled(isPin);
      setUserRole(role);
      setAuditLogs(getAuditLogs());
    } catch (err) {
      console.error('Error loading profile data:', err);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('auth.logoutConfirmTitle', 'Lock Terminal & Sign Out'),
      t(
        'auth.logoutConfirmBody',
        'Are you sure you want to end your active session? Local health records remain securely saved on this device.'
      ),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('auth.logout', 'Log Out / Lock Terminal'),
          style: 'destructive',
          onPress: async () => {
            await authService.signOut();
            onLogout?.();
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleLanguageChange = async (lang: AppLanguage) => {
    await changeAppLanguage(lang);
    setCurrentLang(lang);
  };

  const [isDemoActive, setIsDemoActive] = useState<boolean>(isDemoModeActive());

  const handleToggleDemoMode = async (val: boolean) => {
    if (val) {
      const res = await activateJudgeDemoMode(currentUser?.id || profile.id);
      setIsDemoActive(true);
      Alert.alert(
        '🚀 60-Second Judge Demo Mode Activated!',
        `• 30-day Mars mission dataset populated in SQLite (${res.recordsLoaded} records).\n• Active M4.8 Solar Flare alert triggered via NASA DONKI.\n• Mars Comms Blackout engaged (Crew Autonomy Mode).\n• Urgent flight surgeon telemetry queued in Outbox.\n\nNow open Dashboard and Radiation screens to demonstrate complete mission autonomy!`
      );
    } else {
      deactivateJudgeDemoMode();
      setIsDemoActive(false);
      Alert.alert('Demo Mode Deactivated', 'Mars communications restored. Standard telemetry resumed.');
    }
  };

  const handleRoleChange = async (role: UserRole) => {
    await setActiveUserRole(role);
    setUserRole(role);
    setAuditLogs(getAuditLogs());
  };

  const handlePinToggle = async (val: boolean) => {
    await setPinLockEnabled(val);
    setPinEnabled(val);
    setAuditLogs(getAuditLogs());
  };

  const handleGenerateReport = async () => {
    try {
      const records = await getAllHealthRecords(50);
      const cabin = await getLatestCabinEnvironment();
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
      const rep = generateProfessionalReport(
        reportType,
        reportFormat,
        profile,
        records,
        radData,
        cabin,
        alerts,
        anonymizeData
      );
      setGeneratedReport(rep);
      setIsReportModalVisible(true);
    } catch (err) {
      console.error('Report error:', err);
      Alert.alert('Report Generation Error', 'Failed to compile mission report.');
    }
  };

  const handleAcknowledge = async (id: string) => {
    await acknowledgeAlert(id);
    await loadProfileData();
    Alert.alert('Alert Acknowledged', 'Status updated in local mission logs.');
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const result = await syncPendingHealthRecords();
      setLastSyncResult(result);
      await loadProfileData();
      Alert.alert(
        result.success ? 'Downlink Synchronization Complete' : 'Sync Notice',
        result.message
      );
    } catch {
      Alert.alert('Downlink Offline', 'Offline telemetry preserved safely in local SQLite.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenAuth = (format: 'JSON' | 'CSV') => {
    setExportFormat(format);
    setIsAuthorizedConfirmed(false);
    setIsAuthModalVisible(true);
  };

  const handleExecuteExport = async () => {
    if (!isAuthorizedConfirmed) {
      Alert.alert('Authorization Required', 'Please confirm the crew research authorization check before generating export.');
      return;
    }

    try {
      const records = await getAllHealthRecords(50);
      const radLogs = await getRadiationHistory(50);
      const cabinEnv = await getLatestCabinEnvironment();

      setIsAuthModalVisible(false);

      if (exportFormat === 'JSON') {
        const json = generateMissionTelemetryJson(profile, records, radLogs, cabinEnv, anonymizeData);
        Alert.alert(
          'NASA OSDR Research Dossier Exported',
          `Generated ${json.length} bytes conforming to NASA OSDR metadata schema.\n\n` +
          `• Subject ID: ${anonymizeData ? 'OSDR-SUBJ-DE-IDENTIFIED' : profile.name}\n` +
          `• Biometric Logs: ${records.length}\n` +
          `• Radiation Records: ${radLogs.length}\n` +
          `• Matched NASA Studies: OSD-53, OSD-37, OSD-120, HRR\n` +
          `• Mission Elapsed Time (MET) computed for all observations.`,
          [{ text: 'Dismiss', style: 'cancel' }]
        );
      } else {
        const csv = generateCsvReport(records, cabinEnv, anonymizeData);
        Alert.alert(
          'Scientific Research CSV Exported',
          `Generated scientific CSV with ${records.length} rows (${csv.length} bytes) ready for Flight Surgeon and NASA BPS analytical pipelines.\n\nIncludes matched NASA OSDR research reference mappings.`,
          [{ text: 'Dismiss', style: 'cancel' }]
        );
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Export Error', 'Failed to generate scientific export payload.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MISSION DOSSIER & PROFILE</Text>
          <Text style={styles.subtitle}>Astronaut identity, baselines, alerts & NASA integration</Text>
        </View>
        <View style={styles.authBadge}>
          <Text style={styles.authText}>FLIGHT LEVEL 1</Text>
        </View>
      </View>

      {/* Astronaut Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <MaterialCommunityIcons name="account-tie" size={36} color={COLORS.cyan} />
            </View>
          </View>
          <View style={styles.avatarDetails}>
            <Text style={styles.astroName}>{profile.name}</Text>
            <Text style={styles.astroCallsign}>CALLSIGN: {profile.callsign}</Text>
            <Text style={styles.astroRole}>{profile.role}</Text>
            <Text style={styles.astroStation}>Location: {profile.stationModule}</Text>
          </View>
        </View>

        {/* Mission Stats */}
        <View style={styles.missionStatsRow}>
          <View style={styles.mStat}>
            <Text style={styles.mStatVal}>Day {profile.missionDay}</Text>
            <Text style={styles.mStatLbl}>Of {profile.totalMissionDays} Days</Text>
          </View>
          <View style={styles.mDivider} />
          <View style={styles.mStat}>
            <Text style={styles.mStatVal}>{profile.missionName}</Text>
            <Text style={styles.mStatLbl}>Mission Assignment</Text>
          </View>
          <View style={styles.mDivider} />
          <View style={styles.mStat}>
            <Text style={styles.mStatVal}>{profile.age} yrs</Text>
            <Text style={styles.mStatLbl}>Astronaut Age</Text>
          </View>
        </View>
      </View>

      {/* SECTION 12: Personal Health Baselines & Emergency Contact */}
      <Text style={styles.sectionHeader}>PERSONAL HEALTH BASELINES (PRE-FLIGHT)</Text>
      <View style={styles.baselinesCard}>
        <View style={styles.baselineItem}>
          <Text style={styles.baselineLbl}>Resting Heart Rate:</Text>
          <Text style={styles.baselineVal}>{profile.baselines.restingHeartRate} BPM</Text>
        </View>
        <View style={styles.baselineItem}>
          <Text style={styles.baselineLbl}>Blood Oxygen Target:</Text>
          <Text style={styles.baselineVal}>&gt; {profile.baselines.bloodOxygen}%</Text>
        </View>
        <View style={styles.baselineItem}>
          <Text style={styles.baselineLbl}>Baseline Blood Pressure:</Text>
          <Text style={styles.baselineVal}>
            {profile.baselines.bloodPressureSys}/{profile.baselines.bloodPressureDia} mmHg
          </Text>
        </View>
        <View style={styles.baselineItem}>
          <Text style={styles.baselineLbl}>Body Temperature:</Text>
          <Text style={styles.baselineVal}>{profile.baselines.bodyTemperature}°C</Text>
        </View>
        <View style={styles.baselineItem}>
          <Text style={styles.baselineLbl}>Target Sleep Duration:</Text>
          <Text style={styles.baselineVal}>{profile.baselines.sleepHours} hrs/night</Text>
        </View>
        <View style={styles.baselineItem}>
          <Text style={styles.baselineLbl}>Physical Countermeasure:</Text>
          <Text style={styles.baselineVal}>{profile.baselines.dailyExerciseMinutes} min/day</Text>
        </View>
      </View>

      {/* Emergency Flight Surgeon Contact */}
      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <MaterialCommunityIcons name="doctor" size={18} color={COLORS.cyan} />
          <Text style={styles.contactTitle}>FLIGHT SURGEON & EMERGENCY BIO-LINK</Text>
        </View>
        <Text style={styles.surgeonName}>{profile.emergencyContact.flightSurgeonName}</Text>
        <Text style={styles.commChan}>{profile.emergencyContact.commChannel}</Text>
        <Text style={styles.commLoc}>{profile.emergencyContact.location} • Freq: {profile.emergencyContact.frequency}</Text>
      </View>

      {/* SECTION 11: Offline Mode & Supabase Synchronization */}
      <Text style={styles.sectionHeader}>OFFLINE STORAGE & CLOUD SYNCHRONIZATION</Text>
      <View style={styles.syncCard}>
        <View style={styles.syncStatsRow}>
          <View style={styles.syncStatBox}>
            <Text style={styles.syncStatVal}>{dbCounts.healthRecords}</Text>
            <Text style={styles.syncStatLbl}>SQLite Records</Text>
          </View>
          <View style={styles.mDivider} />
          <View style={styles.syncStatBox}>
            <Text style={styles.syncStatVal}>{dbCounts.radiationLogs}</Text>
            <Text style={styles.syncStatLbl}>Dosimeter Logs</Text>
          </View>
          <View style={styles.mDivider} />
          <View style={styles.syncStatBox}>
            <Text style={[styles.syncStatVal, dbCounts.unsyncedCount > 0 && { color: COLORS.statusWarning }]}>
              {dbCounts.unsyncedCount}
            </Text>
            <Text style={styles.syncStatLbl}>Pending Queue</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.syncNowBtn, isSyncing && styles.syncNowBtnActive]}
          onPress={handleSyncNow}
          disabled={isSyncing}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="cloud-sync" size={18} color={COLORS.background} />
          <Text style={styles.syncNowBtnText}>
            {isSyncing ? 'Packaging Telemetry for Downlink...' : 'Synchronize with Supabase Cloud'}
          </Text>
        </TouchableOpacity>

        {lastSyncResult && (
          <Text style={styles.lastSyncNote}>{lastSyncResult.message}</Text>
        )}
      </View>

      {/* SECTION 10: Active Alerts & Notifications Log */}
      <Text style={styles.sectionHeader}>MISSION HEALTH & ENVIRONMENTAL ALERTS</Text>
      <View style={styles.alertsList}>
        {alerts.length === 0 ? (
          <View style={styles.noAlertsBox}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color={COLORS.statusNormal} />
            <Text style={styles.noAlertsText}>All biological and environmental systems nominal. Zero active warnings.</Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <View
              key={alert.id}
              style={[
                styles.alertItemCard,
                alert.severity === 'CRITICAL'
                  ? styles.alertCardCritical
                  : alert.severity === 'WARNING'
                  ? styles.alertCardWarning
                  : styles.alertCardInfo,
              ]}
            >
              <View style={styles.alertHeaderRow}>
                <View style={styles.alertTitleBadgeRow}>
                  <Text style={styles.alertCategoryText}>[{alert.category}]</Text>
                  <Text style={styles.alertItemTitle}>{alert.title}</Text>
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    {
                      backgroundColor:
                        alert.severity === 'CRITICAL'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(245, 158, 11, 0.2)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityText,
                      {
                        color:
                          alert.severity === 'CRITICAL'
                            ? COLORS.statusAlert
                            : COLORS.statusWarning,
                      },
                    ]}
                  >
                    {alert.severity}
                  </Text>
                </View>
              </View>

              <Text style={styles.alertReason}>
                <Text style={styles.boldLabel}>Trigger Reason: </Text>
                {alert.triggerReason}
              </Text>
              <Text style={styles.alertMsg}>
                <Text style={styles.boldLabel}>Impact: </Text>
                {alert.message}
              </Text>
              <Text style={styles.alertAction}>
                <Text style={styles.boldLabel}>Action Required: </Text>
                {alert.recommendedAction}
              </Text>

              <View style={styles.alertFooter}>
                <Text style={styles.alertTime}>
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {!alert.acknowledged ? (
                  <TouchableOpacity
                    style={styles.ackBtn}
                    onPress={() => handleAcknowledge(alert.id)}
                  >
                    <Text style={styles.ackBtnText}>Acknowledge</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.ackedText}>Acknowledged</Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* SECTION 13: NASA Research Integration Architecture */}
      <Text style={styles.sectionHeader}>NASA RESEARCH INTEGRATION ARCHITECTURE</Text>
      <View style={styles.nasaHubCard}>
        <Text style={styles.nasaHubIntro}>
          ORBIT Health includes integration-ready schemas for official NASA Human Research Program repositories. Unconnected modules remain in sandbox readiness until mission keys are provisioned.
        </Text>

        {NASA_INTEGRATION_MODULES.map((mod) => (
          <View key={mod.id} style={styles.modItem}>
            <View style={styles.modTop}>
              <View style={styles.modTitleGroup}>
                <Text style={styles.modAcronym}>{mod.acronym}</Text>
                <Text style={styles.modName}>{mod.name}</Text>
              </View>
              <View style={styles.modStatusPill}>
                <Text style={styles.modStatusText}>INTEGRATION READY</Text>
              </View>
            </View>
            <Text style={styles.modDesc}>{mod.description}</Text>
            <View style={styles.modMetaRow}>
              <Text style={styles.modMeta}>Protocol: {mod.protocol}</Text>
              <Text style={styles.modMeta}>Schema: {mod.schemaVersion}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.openNasaCenterBtn}
          onPress={() => onNavigateTab?.('nasa')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="database-search" size={16} color={COLORS.cyan} />
          <Text style={styles.openNasaCenterBtnText}>Launch Dedicated NASA Data Center</Text>
        </TouchableOpacity>
      </View>

      {/* SECURE DATA EXPORT */}
      <Text style={styles.sectionHeader}>SECURE DATA EXPORT FOR SCIENTIFIC RESEARCH</Text>
      <View style={styles.exportCard}>
        <Text style={styles.exportSub}>
          Generate standardized NASA OSDR telemetry JSON files or scientific CSV reports with Mission Elapsed Time (MET) and matched research references.
        </Text>
        <View style={styles.exportBtnRow}>
          <TouchableOpacity style={styles.exportBtn} onPress={() => handleOpenAuth('JSON')} activeOpacity={0.8}>
            <MaterialCommunityIcons name="file-code-outline" size={18} color={COLORS.background} />
            <Text style={styles.exportBtnText}>Export JSON (OSDR)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportBtnSecondary} onPress={() => handleOpenAuth('CSV')} activeOpacity={0.8}>
            <MaterialCommunityIcons name="file-delimited-outline" size={18} color={COLORS.cyan} />
            <Text style={styles.exportBtnSecondaryText}>Export CSV (Scientific)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Explicit User Authorization Modal for Data Export */}
      <Modal
        visible={isAuthModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAuthModalVisible(false)}
      >
        <View style={styles.authModalOverlay}>
          <View style={styles.authModalContent}>
            <View style={styles.authModalHeader}>
              <View style={styles.authModalTitleGroup}>
                <MaterialCommunityIcons name="shield-lock-outline" size={22} color={COLORS.cyan} />
                <View>
                  <Text style={styles.authModalTitle}>NASA RESEARCH AUTHORIZATION</Text>
                  <Text style={styles.authModalSub}>Export Format: {exportFormat}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsAuthModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.authModalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.authNoticeCard}>
                <MaterialCommunityIcons name="information" size={18} color={COLORS.cyan} />
                <Text style={styles.authNoticeText}>
                  Federal regulations and NASA Human Research Program policies require explicit crew authorization prior to exporting spaceflight physiological telemetry.
                </Text>
              </View>

              <Text style={styles.authSectionHeader}>DATA SCOPE & METRICS INCLUDED</Text>
              <View style={styles.authChecklist}>
                <View style={styles.checkItem}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.statusNormal} />
                  <Text style={styles.checkText}>Biometric telemetry (Heart rate, SpO2, Blood pressure, Core temp)</Text>
                </View>
                <View style={styles.checkItem}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.statusNormal} />
                  <Text style={styles.checkText}>Multi-detector dosimetry (Absorbed dose in µGy and equivalent in µSv)</Text>
                </View>
                <View style={styles.checkItem}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.statusNormal} />
                  <Text style={styles.checkText}>Life support ECLSS snapshot (Cabin CO2, O2, Temp, Pressure)</Text>
                </View>
                <View style={styles.checkItem}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.statusNormal} />
                  <Text style={styles.checkText}>Mission Elapsed Time (MET) computed from flight day {profile.missionDay}</Text>
                </View>
                <View style={styles.checkItem}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.statusNormal} />
                  <Text style={styles.checkText}>Matched NASA Research Studies (OSD-53, OSD-37, OSD-120, HRR)</Text>
                </View>
              </View>

              <Text style={styles.authSectionHeader}>PRIVACY & DE-IDENTIFICATION</Text>
              <View style={styles.anonymizeRow}>
                <View style={styles.anonymizeInfo}>
                  <Text style={styles.anonymizeTitle}>De-identify Personal Identity</Text>
                  <Text style={styles.anonymizeSub}>
                    Strip astronaut name and callsign; assign NASA OSDR anonymous subject identifier.
                  </Text>
                </View>
                <Switch
                  value={anonymizeData}
                  onValueChange={setAnonymizeData}
                  thumbColor={anonymizeData ? COLORS.cyan : COLORS.textMuted}
                  trackColor={{ false: '#1E293B', true: 'rgba(0, 242, 254, 0.3)' }}
                />
              </View>

              <TouchableOpacity
                style={styles.consentAgreementRow}
                onPress={() => setIsAuthorizedConfirmed(!isAuthorizedConfirmed)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={isAuthorizedConfirmed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={20}
                  color={isAuthorizedConfirmed ? COLORS.cyan : COLORS.textSecondary}
                />
                <Text style={styles.consentAgreementText}>
                  I confirm my explicit authorization to export this spaceflight telemetry for NASA space biology and human research purposes.
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.authActionRow}>
              <TouchableOpacity
                style={styles.authCancelBtn}
                onPress={() => setIsAuthModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.authCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.authConfirmBtn,
                  !isAuthorizedConfirmed && styles.authConfirmBtnDisabled,
                ]}
                onPress={handleExecuteExport}
                disabled={!isAuthorizedConfirmed}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="export" size={18} color={COLORS.background} />
                <Text style={styles.authConfirmBtnText}>Authorize & Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* LANGUAGE SELECTION */}
      <Text style={styles.sectionHeader}>{t('settings.language', 'INTERFACE LANGUAGE / DİL SEÇİMİ')}</Text>
      <View style={styles.langSelectorCard}>
        <TouchableOpacity
          style={[styles.langChip, currentLang === 'az' && styles.langChipActive]}
          onPress={() => handleLanguageChange('az')}
          activeOpacity={0.8}
        >
          <Text style={styles.langFlag}>🇦🇿</Text>
          <View>
            <Text style={[styles.langText, currentLang === 'az' && styles.langTextActive]}>Azərbaycanca</Text>
            <Text style={styles.langSub}>az-AZ</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.langChip, currentLang === 'tr' && styles.langChipActive]}
          onPress={() => handleLanguageChange('tr')}
          activeOpacity={0.8}
        >
          <Text style={styles.langFlag}>🇹🇷</Text>
          <View>
            <Text style={[styles.langText, currentLang === 'tr' && styles.langTextActive]}>Türkçe</Text>
            <Text style={styles.langSub}>tr-TR</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.langChip, currentLang === 'en' && styles.langChipActive]}
          onPress={() => handleLanguageChange('en')}
          activeOpacity={0.8}
        >
          <Text style={styles.langFlag}>🇬🇧</Text>
          <View>
            <Text style={[styles.langText, currentLang === 'en' && styles.langTextActive]}>English</Text>
            <Text style={styles.langSub}>en-US</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* SPACE OPERATIONAL HUB NAVIGATION */}
      <Text style={styles.sectionHeader}>{t('dashboard.quickActions', 'MISSION OPERATIONAL HUB')}</Text>
      <View style={styles.hubGrid}>
        <TouchableOpacity
          style={styles.hubTile}
          onPress={() => onNavigateTab?.('control')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="view-dashboard-variant-outline" size={24} color={COLORS.cyan} />
          <Text style={styles.hubTileTitle}>Mission Control</Text>
          <Text style={styles.hubTileSub}>Telemetry & Weather</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.hubTile}
          onPress={() => onNavigateTab?.('voice')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="microphone-message" size={24} color="#A855F7" />
          <Text style={styles.hubTileTitle}>Voice AI Terminal</Text>
          <Text style={styles.hubTileSub}>Two-Way Spoken AI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.hubTile}
          onPress={() => onNavigateTab?.('twin')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="human" size={24} color={COLORS.cyan} />
          <Text style={styles.hubTileTitle}>Digital Twin</Text>
          <Text style={styles.hubTileSub}>Multi-System Model</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.hubTile}
          onPress={() => onNavigateTab?.('timeline')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="timeline-clock-outline" size={24} color={COLORS.cyan} />
          <Text style={styles.hubTileTitle}>Mission Timeline</Text>
          <Text style={styles.hubTileSub}>Chronological Log</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.hubTile}
          onPress={() => onNavigateTab?.('fitness')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="weight-lifter" size={24} color={COLORS.statusNormal} />
          <Text style={styles.hubTileTitle}>Space Fitness</Text>
          <Text style={styles.hubTileSub}>ARED / CEVIS / T2</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.hubTile}
          onPress={() => onNavigateTab?.('emergency')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="alert-octagon-outline" size={24} color={COLORS.statusAlert} />
          <Text style={styles.hubTileTitle}>Emergency System</Text>
          <Text style={styles.hubTileSub}>Alerts & Protocols</Text>
        </TouchableOpacity>
      </View>

      {/* SECURITY, ACCESS ROLES & AUDIT LOGS */}
      <Text style={styles.sectionHeader}>{t('security.title', 'SECURITY, ACCESS ROLES & AUDIT LOGS')}</Text>
      <View style={styles.securityCard}>
        <Text style={styles.securitySub}>
          {t('security.authRole', 'Active Credential Level')}:
        </Text>
        <View style={styles.roleSelectorRow}>
          {(['COMMANDER', 'FLIGHT_SURGEON', 'RESEARCHER'] as UserRole[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleChip, userRole === r && styles.roleChipActive]}
              onPress={() => handleRoleChange(r)}
              activeOpacity={0.8}
            >
              <Text style={[styles.roleChipText, userRole === r && styles.roleChipTextActive]}>
                {r === 'COMMANDER' ? 'Commander' : r === 'FLIGHT_SURGEON' ? 'Surgeon' : 'Science'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.pinToggleRow}>
          <View style={styles.pinInfo}>
            <Text style={styles.pinTitle}>{t('security.pinLock', 'Require Security PIN on App Launch')}</Text>
            <Text style={styles.pinSub}>Enforces SHA-256 encrypted terminal passkey.</Text>
          </View>
          <Switch
            value={pinEnabled}
            onValueChange={handlePinToggle}
            thumbColor={pinEnabled ? COLORS.cyan : COLORS.textMuted}
            trackColor={{ false: '#1E293B', true: 'rgba(0, 242, 254, 0.3)' }}
          />
        </View>

        <TouchableOpacity
          style={styles.viewAuditBtn}
          onPress={() => setIsAuditModalVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="shield-search" size={16} color={COLORS.cyan} />
          <Text style={styles.viewAuditBtnText}>
            View Access & Compliance Audit Logs ({auditLogs.length} events)
          </Text>
        </TouchableOpacity>
      </View>

      {/* SMART SENSOR INTEGRATION HUB */}
      <Text style={styles.sectionHeader}>{t('sensors.title', 'SMART SENSOR INTEGRATION HUB')}</Text>
      <View style={styles.sensorHubCard}>
        <Text style={styles.sensorHubNotice}>
          {t('sensors.noFakeNotice', 'ORBIT Health does not simulate false device connections. Real hardware states are reflected transparently.')}
        </Text>
        <View style={styles.sensorList}>
          {sensors.map((sensor) => (
            <View key={sensor.id} style={styles.sensorRow}>
              <View style={styles.sensorIconBox}>
                <MaterialCommunityIcons
                  name={
                    sensor.type === 'BLE_HEART_RATE'
                      ? 'heart-pulse'
                      : sensor.type === 'PULSE_OXIMETER'
                      ? 'water-percent'
                      : sensor.type === 'CREW_DOSIMETER'
                      ? 'radioactive'
                      : sensor.type === 'BLOOD_PRESSURE'
                      ? 'arm-flex'
                      : sensor.type === 'BODY_TEMP'
                      ? 'thermometer'
                      : 'cellphone-wireless'
                  }
                  size={20}
                  color={sensor.state === 'READY_FOR_PAIRING' ? COLORS.cyan : COLORS.textSecondary}
                />
              </View>
              <View style={styles.sensorDetails}>
                <Text style={styles.sensorName}>{sensor.name}</Text>
                <Text style={styles.sensorProtocol}>
                  {sensor.protocol} • {sensor.manufacturer}
                </Text>
              </View>
              <View style={styles.sensorStatusBadge}>
                <Text
                  style={[
                    styles.sensorStatusText,
                    sensor.state === 'READY_FOR_PAIRING' && { color: COLORS.cyan },
                    sensor.state === 'UNPAIRED' && { color: COLORS.textMuted },
                  ]}
                >
                  {sensor.state}
                </Text>
                <Text style={styles.sensorSourceTag}>[{sensor.assignedMetric}]</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* PROFESSIONAL SPACE MEDICAL REPORTS */}
      <Text style={styles.sectionHeader}>{t('reports.title', 'PROFESSIONAL MISSION HEALTH REPORTS')}</Text>
      <View style={styles.reportingCard}>
        <Text style={styles.reportingSub}>
          Select report type and standard export format for Flight Surgeon review and NASA OSDR research archives:
        </Text>

        <Text style={styles.pickerLabel}>Report Type:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reportTypeScroll}>
          {(
            [
              'MISSION_DOSSIER',
              'DAILY_BRIEF',
              'WEEKLY_SUMMARY',
              'MONTHLY_REVIEW',
              'RADIATION_DOSIMETRY',
              'ECLSS_CABIN_ENVIRONMENT',
              'AI_SPACE_MEDICINE',
            ] as ReportType[]
          ).map((rt) => (
            <TouchableOpacity
              key={rt}
              style={[styles.repTypeChip, reportType === rt && styles.repTypeChipActive]}
              onPress={() => setReportType(rt)}
            >
              <Text style={[styles.repTypeText, reportType === rt && styles.repTypeTextActive]}>
                {rt.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.pickerLabel}>Export Format:</Text>
        <View style={styles.formatRow}>
          {(['FORMATTED_TEXT', 'JSON', 'CSV'] as ReportExportFormat[]).map((fmt) => (
            <TouchableOpacity
              key={fmt}
              style={[styles.fmtChip, reportFormat === fmt && styles.fmtChipActive]}
              onPress={() => setReportFormat(fmt)}
            >
              <Text style={[styles.fmtText, reportFormat === fmt && styles.fmtTextActive]}>
                {fmt === 'FORMATTED_TEXT' ? 'Clinical TXT' : fmt === 'JSON' ? 'NASA JSON' : 'CSV'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.generateBtn}
          onPress={handleGenerateReport}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="file-document-edit" size={18} color={COLORS.background} />
          <Text style={styles.generateBtnText}>Compile & Generate Mission Report</Text>
        </TouchableOpacity>
      </View>

      {/* ACCESSIBILITY & ERGONOMICS */}
      <Text style={styles.sectionHeader}>{t('settings.accessibility', 'ACCESSIBILITY & DISPLAY')}</Text>
      <View style={styles.accessCard}>
        <View style={styles.accessRow}>
          <View style={styles.accessInfo}>
            <Text style={styles.accessTitle}>{t('settings.highContrast', 'High-Contrast Mission Mode')}</Text>
            <Text style={styles.accessSub}>Maximizes text luminosity for orbital lighting conditions.</Text>
          </View>
          <Switch
            value={highContrast}
            onValueChange={setHighContrast}
            thumbColor={highContrast ? COLORS.cyan : COLORS.textMuted}
            trackColor={{ false: '#1E293B', true: 'rgba(0, 242, 254, 0.3)' }}
          />
        </View>

        <View style={styles.fontSizeRow}>
          <Text style={styles.fontSizeLabel}>{t('settings.fontSize', 'Text Font Scaling')}:</Text>
          <View style={styles.fontScaleGroup}>
            {(['NORMAL', 'LARGE', 'XL'] as const).map((sc) => (
              <TouchableOpacity
                key={sc}
                style={[styles.fontChip, fontSizeScale === sc && styles.fontChipActive]}
                onPress={() => setFontSizeScale(sc)}
              >
                <Text style={[styles.fontChipText, fontSizeScale === sc && styles.fontChipTextActive]}>
                  {sc === 'NORMAL' ? '100%' : sc === 'LARGE' ? '115%' : '130%'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* NASA HACKATHON DEMO & METHODOLOGY SECTION */}
      <Text style={styles.sectionHeader}>NASA HACKATHON 2026 EVALUATION & DEMO</Text>
      <View style={styles.demoCard}>
        <View style={styles.demoToggleRow}>
          <View style={styles.demoInfo}>
            <View style={styles.demoPill}>
              <Text style={styles.demoPillText}>JUDGE DEMO</Text>
            </View>
            <Text style={styles.demoTitle}>60-Second Judge Demo Mode</Text>
            <Text style={styles.demoSub}>
              Loads 30-day Mars transit dataset, triggers M4.8 solar flare alert, and simulates comms blackout.
            </Text>
          </View>
          <Switch
            value={isDemoActive}
            onValueChange={handleToggleDemoMode}
            thumbColor={isDemoActive ? COLORS.cyan : COLORS.textMuted}
            trackColor={{ false: '#1E293B', true: 'rgba(0, 242, 254, 0.3)' }}
          />
        </View>

        <View style={styles.demoLinksRow}>
          <TouchableOpacity
            style={styles.demoActionBtn}
            onPress={() => onNavigateTab?.('about')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="certificate-outline" size={16} color={COLORS.cyan} />
            <Text style={styles.demoActionBtnText}>About, Data & Methods</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color={COLORS.cyan} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoActionBtn}
            onPress={() => onNavigateTab?.('beyond_space')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="earth" size={16} color={COLORS.cyan} />
            <Text style={styles.demoActionBtnText}>Beyond Space: Earth Impact</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color={COLORS.cyan} />
          </TouchableOpacity>
        </View>
      </View>

      {/* TERMINAL SESSION & AUTHENTICATION (LOGOUT) */}
      <Text style={styles.sectionHeader}>{t('auth.logoutConfirmTitle', 'TERMINAL SESSION & AUTHENTICATION')}</Text>
      <View style={styles.authSessionCard}>
        <View style={styles.sessionHeaderRow}>
          <View style={styles.sessionIconBox}>
            <MaterialCommunityIcons name="badge-account-horizontal" size={24} color={COLORS.cyan} />
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionUserTitle}>{currentUser?.fullName || profile.name}</Text>
            <Text style={styles.sessionUserSub}>
              {currentUser?.email || 'Authenticated Crew Session'} • {currentUser?.astronautId || profile.callsign}
            </Text>
          </View>
        </View>

        <View style={styles.sessionDetailsGrid}>
          <View style={styles.sessionDetailCol}>
            <Text style={styles.sessionDetailLbl}>Mission</Text>
            <Text style={styles.sessionDetailVal}>{currentUser?.missionName || profile.missionName}</Text>
          </View>
          <View style={styles.sessionDetailCol}>
            <Text style={styles.sessionDetailLbl}>Telemetry Sync Link</Text>
            <Text style={[styles.sessionDetailVal, { color: COLORS.statusNormal }]}>
              {authService.isConfigured() ? 'SUPABASE CLOUD' : 'LOCAL SECURE SQLITE'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="logout" size={18} color="#EF4444" />
          <Text style={styles.logoutBtnText}>{t('auth.logout', 'Log Out / Lock Terminal')}</Text>
        </TouchableOpacity>
      </View>

      {/* AUDIT LOGS MODAL */}
      <Modal
        visible={isAuditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAuditModalVisible(false)}
      >
        <View style={styles.authModalOverlay}>
          <View style={styles.authModalContent}>
            <View style={styles.authModalHeader}>
              <View style={styles.authModalTitleGroup}>
                <MaterialCommunityIcons name="shield-account" size={22} color={COLORS.cyan} />
                <View>
                  <Text style={styles.authModalTitle}>SECURITY AUDIT TRAIL</Text>
                  <Text style={styles.authModalSub}>Tamper-Evident SHA-256 Hashed Logs</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsAuditModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.authModalScroll} showsVerticalScrollIndicator={false}>
              {auditLogs.map((log) => (
                <View key={log.id} style={styles.auditLogItem}>
                  <View style={styles.auditLogTop}>
                    <Text style={styles.auditLogAction}>[{log.action}]</Text>
                    <Text style={styles.auditLogRole}>{log.actorRole}</Text>
                  </View>
                  <Text style={styles.auditLogDetails}>{log.details}</Text>
                  <Text style={styles.auditLogMeta}>
                    {new Date(log.timestamp).toLocaleString()} • {log.ipOrModule} • [{log.status}]
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsAuditModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseBtnText}>Close Audit Trail</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* GENERATED REPORT MODAL */}
      <Modal
        visible={isReportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsReportModalVisible(false)}
      >
        <View style={styles.authModalOverlay}>
          <View style={styles.authModalContent}>
            <View style={styles.authModalHeader}>
              <View style={styles.authModalTitleGroup}>
                <MaterialCommunityIcons name="file-check-outline" size={22} color={COLORS.cyan} />
                <View>
                  <Text style={styles.authModalTitle}>MISSION REPORT COMPILED</Text>
                  <Text style={styles.authModalSub}>
                    ID: {generatedReport?.id} • {generatedReport?.format}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsReportModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.authModalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.reportPreviewBox}>
                <Text style={styles.reportPreviewText}>{generatedReport?.content}</Text>
              </View>
            </ScrollView>

            <View style={styles.reportActionRow}>
              <TouchableOpacity
                style={styles.copyReportBtn}
                onPress={async () => {
                  if (generatedReport?.content) {
                    await Clipboard.setStringAsync(generatedReport.content);
                    Alert.alert('Copied to Clipboard', 'Full report content copied for flight transmission.');
                  }
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="content-copy" size={16} color={COLORS.cyan} />
                <Text style={styles.copyReportBtnText}>Copy Full Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneReportBtn}
                onPress={() => setIsReportModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.doneReportBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  authBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cyan,
  },
  authText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  profileCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    marginBottom: SPACING.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
  },
  avatarInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceCardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarDetails: {
    flex: 1,
  },
  astroName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  astroCallsign: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
    marginTop: 2,
  },
  astroRole: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  astroStation: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  missionStatsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 14,
    paddingVertical: SPACING.md,
  },
  mStat: {
    flex: 1,
    alignItems: 'center',
  },
  mStatVal: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  mStatLbl: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  mDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.borderSubtle,
    alignSelf: 'center',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  baselinesCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
    gap: 8,
  },
  baselineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  baselineLbl: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  baselineVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  contactCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  contactTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  surgeonName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  commChan: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  commLoc: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  syncCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  syncStatsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  syncStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  syncStatVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  syncStatLbl: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.cyan,
    paddingVertical: 12,
    borderRadius: 12,
  },
  syncNowBtnActive: {
    backgroundColor: COLORS.primaryBlue,
  },
  syncNowBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.background,
  },
  lastSyncNote: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  alertsList: {
    gap: 10,
    marginBottom: SPACING.lg,
  },
  noAlertsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  noAlertsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  alertItemCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
  },
  alertCardCritical: {
    borderColor: COLORS.statusAlert,
  },
  alertCardWarning: {
    borderColor: COLORS.statusWarning,
  },
  alertCardInfo: {
    borderColor: COLORS.borderHighlight,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  alertCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  alertItemTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  alertReason: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  alertMsg: {
    fontSize: 11,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  alertAction: {
    fontSize: 11,
    color: COLORS.textCyan,
    marginBottom: 6,
  },
  boldLabel: {
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 6,
  },
  alertTime: {
    fontSize: 9.5,
    color: COLORS.textMuted,
  },
  ackBtn: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ackBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  ackedText: {
    fontSize: 10,
    color: COLORS.statusNormal,
    fontWeight: '700',
  },
  nasaHubCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  nasaHubIntro: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  modItem: {
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: 8,
  },
  modTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  modAcronym: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.cyan,
  },
  modName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modStatusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modStatusText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.statusNormal,
  },
  modDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
    marginBottom: 4,
  },
  modMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 4,
  },
  modMeta: {
    fontSize: 8.5,
    color: COLORS.textMuted,
  },
  exportCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  exportSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 15,
  },
  exportBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.cyan,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exportBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.background,
  },
  exportBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceCardSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exportBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  openNasaCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.md,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
  },
  openNasaCenterBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  authModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    justifyContent: 'flex-end',
  },
  authModalContent: {
    backgroundColor: COLORS.surfaceCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    maxHeight: '85%',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  authModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  authModalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authModalTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  authModalSub: {
    fontSize: 10,
    color: COLORS.cyan,
    marginTop: 2,
    fontWeight: '700',
  },
  authModalScroll: {
    marginBottom: SPACING.md,
  },
  authNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: SPACING.md,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: SPACING.md,
  },
  authNoticeText: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    lineHeight: 15,
    flex: 1,
  },
  authSectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  authChecklist: {
    gap: 6,
    backgroundColor: COLORS.surfaceCardSecondary,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.md,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkText: {
    fontSize: 10.5,
    color: COLORS.textPrimary,
    flex: 1,
    lineHeight: 15,
  },
  anonymizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCardSecondary,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.md,
  },
  anonymizeInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  anonymizeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  anonymizeSub: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 13,
  },
  consentAgreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: SPACING.md,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    marginBottom: SPACING.md,
  },
  consentAgreementText: {
    fontSize: 10.5,
    color: COLORS.textPrimary,
    lineHeight: 15,
    flex: 1,
    fontWeight: '600',
  },
  authActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  authCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.surfaceCardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authCancelBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  authConfirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.cyan,
  },
  authConfirmBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  authConfirmBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.background,
  },
  // Language Selector
  langSelectorCard: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  langChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceCard,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  langChipActive: {
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
  },
  langFlag: {
    fontSize: 20,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  langTextActive: {
    color: COLORS.textPrimary,
  },
  langSub: {
    fontSize: 9,
    color: COLORS.cyan,
    fontWeight: '700',
  },
  // Hub Grid
  hubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  hubTile: {
    width: '48%',
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'flex-start',
    gap: 4,
  },
  hubTileTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  hubTileSub: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
  },
  // Security
  securityCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  securitySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  roleSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  roleChip: {
    flex: 1,
    backgroundColor: COLORS.surfaceCardSecondary,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
  },
  roleChipActive: {
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  roleChipTextActive: {
    color: COLORS.cyan,
  },
  pinToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCardSecondary,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  pinInfo: {
    flex: 1,
    marginRight: 8,
  },
  pinTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  pinSub: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  viewAuditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  demoCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  demoToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  demoInfo: {
    flex: 1,
    marginRight: 12,
  },
  demoPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  demoPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.6,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  demoSub: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    lineHeight: 14,
    marginTop: 2,
  },
  demoLinksRow: {
    gap: 8,
    marginTop: 4,
  },
  demoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  demoActionBtnText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.cyan,
    marginLeft: 8,
  },
  viewAuditBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  // Sensors
  sensorHubCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  sensorHubNotice: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    lineHeight: 15,
    marginBottom: SPACING.md,
  },
  sensorList: {
    gap: 8,
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCardSecondary,
    padding: SPACING.sm,
    borderRadius: 12,
    gap: 8,
  },
  sensorIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorDetails: {
    flex: 1,
  },
  sensorName: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sensorProtocol: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  sensorStatusBadge: {
    alignItems: 'flex-end',
  },
  sensorStatusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sensorSourceTag: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  // Reports
  reportingCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  reportingSub: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    lineHeight: 15,
    marginBottom: SPACING.sm,
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.cyan,
    marginBottom: 6,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  reportTypeScroll: {
    marginBottom: 8,
  },
  repTypeChip: {
    backgroundColor: COLORS.surfaceCardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginRight: 6,
  },
  repTypeChipActive: {
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  repTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  repTypeTextActive: {
    color: COLORS.cyan,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.md,
  },
  fmtChip: {
    flex: 1,
    backgroundColor: COLORS.surfaceCardSecondary,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
  },
  fmtChipActive: {
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  fmtText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  fmtTextActive: {
    color: COLORS.cyan,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.cyan,
    paddingVertical: 12,
    borderRadius: 12,
  },
  generateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.background,
  },
  // Accessibility
  accessCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  accessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  accessInfo: {
    flex: 1,
    marginRight: 8,
  },
  accessTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  accessSub: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  fontSizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fontSizeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  fontScaleGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  fontChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceCardSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  fontChipActive: {
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  fontChipText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  fontChipTextActive: {
    color: COLORS.cyan,
  },
  // Audit Modal
  auditLogItem: {
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 10,
    padding: SPACING.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  auditLogTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  auditLogAction: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  auditLogRole: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  auditLogDetails: {
    fontSize: 10.5,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  auditLogMeta: {
    fontSize: 8.5,
    color: COLORS.textMuted,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.surfaceCardSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  modalCloseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  // Report Modal
  reportPreviewBox: {
    backgroundColor: '#030712',
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  reportPreviewText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
    lineHeight: 15,
  },
  reportActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.md,
  },
  copyReportBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    paddingVertical: 12,
    borderRadius: 12,
  },
  copyReportBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  doneReportBtn: {
    flex: 1,
    backgroundColor: COLORS.cyan,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneReportBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.background,
  },
  // Terminal Session & Logout
  authSessionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionUserTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sessionUserSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sessionDetailsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: SPACING.md,
  },
  sessionDetailCol: {
    flex: 1,
  },
  sessionDetailLbl: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  sessionDetailVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.cyan,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.6,
  },
});
