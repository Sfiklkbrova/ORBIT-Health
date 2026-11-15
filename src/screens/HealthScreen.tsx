import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme/colors';
import {
  HealthRecord,
  CabinEnvironmentData,
  MainNavTab,
} from '../types/astronaut';
import { NasaEdaMission } from '../types/nasa';
import {
  getAllHealthRecords,
  getLatestHealthRecord,
  getLatestCabinEnvironment,
} from '../services/db';
import { getCachedEdaMissions } from '../services/nasaDb';
import { HealthDataModal } from '../components/HealthDataModal';

type MetricTab = 'heartRate' | 'bloodOxygen' | 'bloodPressure' | 'bodyTemp' | 'sleep' | 'fatigue';
type PeriodTab = 'day' | 'week' | 'month';

interface HealthScreenProps {
  onNavigateTab?: (tab: MainNavTab) => void;
}

export const HealthScreen: React.FC<HealthScreenProps> = ({ onNavigateTab }) => {
  const { t } = useTranslation();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [latest, setLatest] = useState<HealthRecord | null>(null);
  const [edaMissions, setEdaMissions] = useState<NasaEdaMission[]>([]);
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

  const [activeMetric, setActiveMetric] = useState<MetricTab>('heartRate');
  const [activePeriod, setActivePeriod] = useState<PeriodTab>('week');
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  const loadHealthData = async () => {
    try {
      const all = await getAllHealthRecords(14);
      const l = await getLatestHealthRecord();
      const env = await getLatestCabinEnvironment();
      const eda = await getCachedEdaMissions();
      setRecords(all);
      setLatest(l);
      setCabinEnv(env);
      setEdaMissions(eda);
      if (l) setSelectedRecord(l);
    } catch (err) {
      console.error('Error loading health screen data:', err);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  const handleRecordSaved = async (_newRec: HealthRecord) => {
    await loadHealthData();
  };

  // Metric configurations for chart rendering
  const metricConfigs = {
    heartRate: {
      label: t('health.heartRateLabel'),
      unit: 'BPM',
      color: COLORS.heartRate,
      icon: 'heart-pulse',
      getValue: (r: HealthRecord) => r.heartRate,
      min: 50,
      max: 120,
      nominal: '60 - 100 BPM',
    },
    bloodOxygen: {
      label: t('health.bloodOxygenLabel'),
      unit: '%',
      color: COLORS.bloodOxygen,
      icon: 'water-percent',
      getValue: (r: HealthRecord) => r.bloodOxygen,
      min: 90,
      max: 100,
      nominal: '> 95%',
    },
    bloodPressure: {
      label: t('health.bloodPressureLabel'),
      unit: 'mmHg',
      color: COLORS.bloodPressure,
      icon: 'chart-bell-curve-cumulative',
      getValue: (r: HealthRecord) => r.bloodPressureSys,
      min: 90,
      max: 150,
      nominal: '< 130 mmHg',
    },
    bodyTemp: {
      label: t('health.bodyTempLabel'),
      unit: '°C',
      color: COLORS.temperature,
      icon: 'thermometer',
      getValue: (r: HealthRecord) => r.bodyTemperature,
      min: 35.5,
      max: 39.0,
      nominal: '36.5 - 37.5°C',
    },
    sleep: {
      label: t('health.sleepLabel'),
      unit: 'hrs',
      color: COLORS.sleep,
      icon: 'moon-waning-crescent',
      getValue: (r: HealthRecord) => r.sleepDurationHours,
      min: 4,
      max: 10,
      nominal: '7.5 - 8.5 hrs',
    },
    fatigue: {
      label: t('health.fatigueLabel'),
      unit: '/10',
      color: COLORS.statusWarning,
      icon: 'battery-alert',
      getValue: (r: HealthRecord) => r.fatigueLevel,
      min: 1,
      max: 10,
      nominal: '< 5/10',
    },
  };

  const currentCfg = metricConfigs[activeMetric];

  // SVG Chart Calculation
  const chartWidth = 320;
  const chartHeight = 150;
  const padding = 26;

  const chartData = [...records].reverse();
  const points = chartData.map((rec, idx) => {
    const x = padding + (idx / Math.max(1, chartData.length - 1)) * (chartWidth - padding * 2);
    const val = currentCfg.getValue(rec);
    const normalizedY = (val - currentCfg.min) / (currentCfg.max - currentCfg.min);
    const clampedNorm = Math.max(0, Math.min(1, normalizedY));
    const y = chartHeight - padding - clampedNorm * (chartHeight - padding * 2);
    return { x, y, rec, val };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('health.title')}</Text>
          <Text style={styles.subtitle}>{t('health.subtitle')}</Text>
        </View>
        <TouchableOpacity
          style={styles.addLogBtn}
          onPress={() => setIsDataModalOpen(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={16} color={COLORS.background} />
          <Text style={styles.addLogBtnText}>{t('health.logEntry')}</Text>
        </TouchableOpacity>
      </View>

      {/* Time Period Filter */}
      <View style={styles.periodRow}>
        {(['day', 'week', 'month'] as PeriodTab[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.periodPill, activePeriod === period && styles.periodPillActive]}
            onPress={() => setActivePeriod(period)}
          >
            <Text style={[styles.periodText, activePeriod === period && styles.periodTextActive]}>
              {period === 'day' ? t('health.periodDay') : period === 'week' ? t('health.periodWeek') : t('health.periodMonth')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Metric Selector Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricChipsScroll} contentContainerStyle={styles.metricChipsContent}>
        {(Object.keys(metricConfigs) as MetricTab[]).map((tab) => {
          const cfg = metricConfigs[tab];
          const isActive = activeMetric === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.metricChip, isActive && { borderColor: cfg.color, backgroundColor: `${cfg.color}15` }]}
              onPress={() => setActiveMetric(tab)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={cfg.icon as any} size={15} color={isActive ? cfg.color : COLORS.textMuted} />
              <Text style={[styles.metricChipText, isActive && { color: cfg.color, fontWeight: '800' }]}>
                {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Interactive Telemetry Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartTitleRow}>
          <View>
            <Text style={styles.chartHeaderTitle}>{currentCfg.label.toUpperCase()} {t('health.trend')}</Text>
            <Text style={styles.chartHeaderNominal}>{t('health.nominalBaseline')}: {currentCfg.nominal}</Text>
          </View>
          {latest && (
            <View style={styles.latestValueBox}>
              <Text style={[styles.latestValText, { color: currentCfg.color }]}>
                {currentCfg.getValue(latest)}
              </Text>
              <Text style={styles.latestUnitText}>{currentCfg.unit}</Text>
            </View>
          )}
        </View>

        <View style={styles.svgWrapper}>
          <Svg width={chartWidth} height={chartHeight}>
            {/* Safe Nominal Area / Reference Line */}
            <Line
              x1={padding}
              y1={chartHeight / 2}
              x2={chartWidth - padding}
              y2={chartHeight / 2}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeDasharray="4,4"
              strokeWidth="1"
            />

            {/* Path */}
            {points.length > 1 && (
              <Path
                d={pathD}
                fill="none"
                stroke={currentCfg.color}
                strokeWidth="2.5"
              />
            )}

            {/* Data nodes */}
            {points.map((p, idx) => {
              const isSelected = selectedRecord?.id === p.rec.id;
              return (
                <Circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? COLORS.white : currentCfg.color}
                  stroke={COLORS.background}
                  strokeWidth="2"
                  onPress={() => setSelectedRecord(p.rec)}
                />
              );
            })}
          </Svg>
        </View>

        {selectedRecord && (
          <View style={styles.selectedPointBox}>
            <Text style={styles.selectedPointDate}>
              {new Date(selectedRecord.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
              {new Date(selectedRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={[styles.selectedPointVal, { color: currentCfg.color }]}>
              {currentCfg.getValue(selectedRecord)} {currentCfg.unit}
              {selectedRecord.isManual ? ` (${t('health.manualLog')})` : ` (${t('health.sensorTelemetry')})`}
            </Text>
          </View>
        )}
      </View>

      {/* SECTION 7: Astronaut Daily Wellbeing, Sleep & Physical Countermeasure Activity */}
      <Text style={styles.sectionTitle}>{t('health.crewWellbeing')}</Text>
      <View style={styles.wellbeingCard}>
        {/* Sleep & Fatigue Row */}
        <View style={styles.wbRow}>
          <View style={styles.wbBox}>
            <View style={styles.wbBoxHeader}>
              <MaterialCommunityIcons name="moon-waning-crescent" size={16} color={COLORS.sleep} />
              <Text style={styles.wbLabel}>{t('health.sleepQuality')}</Text>
            </View>
            <Text style={styles.wbValue}>{latest?.sleepDurationHours.toFixed(1) || 8} hrs</Text>
            <Text style={styles.wbSub}>{latest?.sleepQuality || 'Optimal'} • {t('health.wakeEvents', { count: latest?.sleepInterruptions || 1 })}</Text>
          </View>

          <View style={styles.wbDivider} />

          <View style={styles.wbBox}>
            <View style={styles.wbBoxHeader}>
              <MaterialCommunityIcons name="battery-alert" size={16} color={COLORS.statusWarning} />
              <Text style={styles.wbLabel}>{t('health.fatigueScore')}</Text>
            </View>
            <Text style={styles.wbValue}>{latest?.fatigueLevel || 3} / 10</Text>
            <Text style={styles.wbSub}>
              {(latest?.fatigueLevel || 3) <= 4 ? t('health.energizedReady') : t('health.mildFatigue')}
            </Text>
          </View>
        </View>

        <View style={styles.horizontalDivider} />

        {/* Psychological Stress & Mood */}
        <View style={styles.wbRow}>
          <View style={styles.wbBox}>
            <View style={styles.wbBoxHeader}>
              <MaterialCommunityIcons name="head-snowflake" size={16} color={COLORS.cyan} />
              <Text style={styles.wbLabel}>{t('health.stressLabel')}</Text>
            </View>
            <Text style={styles.wbValue}>{latest?.stressLevel || 'Low'}</Text>
            <Text style={styles.wbSub}>{t('health.stressSub')}</Text>
          </View>

          <View style={styles.wbDivider} />

          <View style={styles.wbBox}>
            <View style={styles.wbBoxHeader}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={16} color={COLORS.statusNormal} />
              <Text style={styles.wbLabel}>{t('health.moodLabel')}</Text>
            </View>
            <Text style={styles.wbValue}>{latest?.moodWellbeing || 'Focused'}</Text>
            <Text style={styles.wbSub}>{t('health.moodSub')}</Text>
          </View>
        </View>

        <View style={styles.horizontalDivider} />

        {/* Space Physical Countermeasure Exercise (90 mins goal) */}
        <View style={styles.exerciseSection}>
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseTitleGroup}>
              <MaterialCommunityIcons name="weight-lifter" size={18} color={COLORS.cyan} />
              <Text style={styles.exerciseTitle}>{t('health.exerciseProtocol')}</Text>
            </View>
            <View style={styles.exerciseBadge}>
              <Text style={styles.exerciseBadgeText}>{t('health.antiAtrophy')}</Text>
            </View>
          </View>
          <Text style={styles.exerciseName}>
            {latest?.exercise.type || 'ARED Resistive Exercise'}
          </Text>
          <View style={styles.exerciseProgressRow}>
            <Text style={styles.exerciseDurationText}>
              {t('health.exerciseDuration', { current: latest?.exercise.durationMinutes || 90, goal: 90 })}
            </Text>
            <Text style={styles.exerciseIntensityText}>
              {t('health.exerciseIntensity', { val: latest?.exercise.intensity || 'High' })}
            </Text>
          </View>
          <Text style={styles.exerciseNote}>
            {t('health.exerciseCrucial')}
          </Text>
        </View>
      </View>

      {/* SECTION 4: Space Cabin Environmental Monitoring */}
      <Text style={styles.sectionTitle}>{t('health.eclssTitle')}</Text>
      <View style={styles.envCard}>
        <View style={styles.envHeader}>
          <View style={styles.envTitleGroup}>
            <MaterialCommunityIcons name="air-filter" size={18} color={COLORS.cyan} />
            <Text style={styles.envTitle}>{t('health.eclssSub')}</Text>
          </View>
          <View style={styles.envDemoBadge}>
            <Text style={styles.envDemoText}>{t('health.demoData')}</Text>
          </View>
        </View>

        <View style={styles.envGrid}>
          {/* Cabin Temp */}
          <View style={styles.envBox}>
            <MaterialCommunityIcons name="thermometer" size={16} color={COLORS.temperature} />
            <Text style={styles.envVal}>{cabinEnv.cabinTempCelsius.toFixed(1)} °C</Text>
            <Text style={styles.envLbl}>{t('health.cabinTemp')}</Text>
            <Text style={styles.envRange}>Nominal: 21-24°C</Text>
          </View>

          {/* Cabin O2 */}
          <View style={styles.envBox}>
            <MaterialCommunityIcons name="molecule" size={16} color={COLORS.cyan} />
            <Text style={styles.envVal}>{cabinEnv.cabinO2Percent.toFixed(1)} %</Text>
            <Text style={styles.envLbl}>{t('health.atmosphericO2')}</Text>
            <Text style={styles.envRange}>Nominal: 20.9%</Text>
          </View>

          {/* Cabin CO2 */}
          <View style={styles.envBox}>
            <MaterialCommunityIcons name="cloud-alert" size={16} color={COLORS.statusAlert} />
            <Text style={styles.envVal}>{cabinEnv.cabinCO2mmHg.toFixed(1)} mmHg</Text>
            <Text style={styles.envLbl}>{t('health.cabinCO2')}</Text>
            <Text style={styles.envRange}>Limit &lt; 3.0 mmHg</Text>
          </View>

          {/* Ambient Radiation */}
          <View style={styles.envBox}>
            <MaterialCommunityIcons name="radioactive" size={16} color={COLORS.brightBlue} />
            <Text style={styles.envVal}>{cabinEnv.ambientRadiationMicroSv.toFixed(1)} µSv/h</Text>
            <Text style={styles.envLbl}>{t('health.radiationFlux')}</Text>
            <Text style={styles.envRange}>Nominal &lt; 25 µSv</Text>
          </View>
        </View>
      </View>

      {/* SECTION 3: NASA EDA SPACECRAFT ENVIRONMENT COMPARISON */}
      <View style={styles.edaSectionHeader}>
        <View style={styles.edaTitleBadge}>
          <MaterialCommunityIcons name="satellite-uplink" size={18} color={COLORS.cyan} />
          <Text style={styles.edaSectionTitle}>{t('health.edaHabitatComparison')}</Text>
        </View>
        <TouchableOpacity onPress={() => onNavigateTab?.('nasa')} activeOpacity={0.7}>
          <Text style={styles.viewHubLink}>{t('health.edaArchive')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.edaCard}>
        <View style={styles.edaHeaderRow}>
          <View>
            <Text style={styles.edaMissionTitle}>
              {edaMissions.length > 0 ? edaMissions[0].missionTitle : 'ISS Expedition 41 / Rodent Research-1 (RR-1)'}
            </Text>
            <Text style={styles.edaMissionSub}>
              {t('health.edaSub')}
            </Text>
          </View>
          <View style={styles.edaBadge}>
            <Text style={styles.edaBadgeText}>{t('health.edaDataBadge')}</Text>
          </View>
        </View>

        <View style={styles.edaComparisonGrid}>
          {/* Temperature Comparison */}
          <View style={styles.edaCompItem}>
            <Text style={styles.edaCompMetric}>{t('health.cabinTempComp')}</Text>
            <View style={styles.edaValuesRow}>
              <View>
                <Text style={styles.edaCurrentVal}>{cabinEnv.cabinTempCelsius.toFixed(1)} °C</Text>
                <Text style={styles.edaValLabel}>{t('health.currentCabin')}</Text>
              </View>
              <Text style={styles.edaVsText}>vs</Text>
              <View>
                <Text style={styles.edaNasaVal}>
                  {edaMissions.length > 0 && edaMissions[0].temperatureIss
                    ? `${edaMissions[0].temperatureIss.mean.toFixed(1)} °C`
                    : '22.1 °C'}
                </Text>
                <Text style={styles.edaValLabel}>{t('health.nasaRr1Avg')}</Text>
              </View>
            </View>
          </View>

          {/* CO2 Comparison */}
          <View style={styles.edaCompItem}>
            <Text style={styles.edaCompMetric}>{t('health.co2Comp')}</Text>
            <View style={styles.edaValuesRow}>
              <View>
                <Text style={styles.edaCurrentVal}>{cabinEnv.cabinCO2mmHg.toFixed(1)} mmHg</Text>
                <Text style={styles.edaValLabel}>{t('health.currentCabin')}</Text>
              </View>
              <Text style={styles.edaVsText}>vs</Text>
              <View>
                <Text style={styles.edaNasaVal}>
                  {edaMissions.length > 0 && edaMissions[0].co2IssPpm
                    ? `${(edaMissions[0].co2IssPpm.mean * 0.00076).toFixed(1)} mmHg`
                    : '2.8 mmHg'}
                </Text>
                <Text style={styles.edaValLabel}>{t('health.nasaRr1Avg')}</Text>
              </View>
            </View>
          </View>

          {/* Relative Humidity Comparison */}
          <View style={styles.edaCompItem}>
            <Text style={styles.edaCompMetric}>{t('health.humidityComp')}</Text>
            <View style={styles.edaValuesRow}>
              <View>
                <Text style={styles.edaCurrentVal}>46.0 %</Text>
                <Text style={styles.edaValLabel}>{t('health.currentCabin')}</Text>
              </View>
              <Text style={styles.edaVsText}>vs</Text>
              <View>
                <Text style={styles.edaNasaVal}>
                  {edaMissions.length > 0 && edaMissions[0].rhIssPercent
                    ? `${edaMissions[0].rhIssPercent.mean.toFixed(1)} %`
                    : '44.2 %'}
                </Text>
                <Text style={styles.edaValLabel}>{t('health.nasaRr1Avg')}</Text>
              </View>
            </View>
          </View>

          {/* Radiation Dose Comparison */}
          <View style={styles.edaCompItem}>
            <Text style={styles.edaCompMetric}>{t('health.radiationComp')}</Text>
            <View style={styles.edaValuesRow}>
              <View>
                <Text style={styles.edaCurrentVal}>444 µSv</Text>
                <Text style={styles.edaValLabel}>{t('health.currentCabin')}</Text>
              </View>
              <Text style={styles.edaVsText}>vs</Text>
              <View>
                <Text style={styles.edaNasaVal}>
                  {edaMissions.length > 0 && edaMissions[0].totalDoseMgyPerDay
                    ? `${Math.round(edaMissions[0].totalDoseMgyPerDay.mean * 1000)} µGy`
                    : '396 µGy'}
                </Text>
                <Text style={styles.edaValLabel}>{t('health.nasaRr1Avg')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.edaFindingBox}>
          <MaterialCommunityIcons name="check-decagram" size={16} color={COLORS.statusNormal} />
          <Text style={styles.edaFindingText}>
            {t('health.eclssStatusGood')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.openEdaBtn}
          onPress={() => onNavigateTab?.('nasa')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="database-search" size={16} color={COLORS.cyan} />
          <Text style={styles.openEdaBtnText}>{t('health.exploreEda')}</Text>
        </TouchableOpacity>
      </View>

      {/* SECTION 4: NASA HUMAN RISK CLINICAL DIAGNOSTICS */}
      <Text style={styles.sectionTitle}>NASA HUMAN RISK CLINICAL DIAGNOSTICS</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: SPACING.lg }}>
        {/* SANS Vision Check Card */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: COLORS.surfaceCard,
            borderWidth: 1,
            borderColor: COLORS.borderSubtle,
            borderRadius: 12,
            padding: SPACING.md,
          }}
          onPress={() => onNavigateTab?.('sans')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <MaterialCommunityIcons name="eye-check" size={18} color={COLORS.cyan} />
            <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' }}>SANS Vision Check</Text>
          </View>
          <Text style={{ color: COLORS.textMuted, fontSize: 11, lineHeight: 15, marginBottom: 8 }}>
            Tumbling E visual acuity, contrast test & microgravity globe flattening trend.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: COLORS.cyan, fontSize: 11, fontWeight: '700' }}>START TEST</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color={COLORS.cyan} />
          </View>
        </TouchableOpacity>

        {/* Behavioral Check-in Card */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: COLORS.surfaceCard,
            borderWidth: 1,
            borderColor: COLORS.borderSubtle,
            borderRadius: 12,
            padding: SPACING.md,
          }}
          onPress={() => onNavigateTab?.('behavioral')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <MaterialCommunityIcons name="heart-pulse" size={18} color={COLORS.cyan} />
            <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' }}>Behavioral Health</Text>
          </View>
          <Text style={{ color: COLORS.textMuted, fontSize: 11, lineHeight: 15, marginBottom: 8 }}>
            30-sec isolation check-in, strain rule engine & 4-7-8 breathing pacer.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: COLORS.cyan, fontSize: 11, fontWeight: '700' }}>CHECK IN</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color={COLORS.cyan} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Data Input Modal */}
      <HealthDataModal
        visible={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onRecordSaved={handleRecordSaved}
      />
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
  addLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cyan,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addLogBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.background,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  periodPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
  },
  periodPillActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.14)',
    borderColor: COLORS.cyan,
  },
  periodText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  periodTextActive: {
    color: COLORS.cyan,
    fontWeight: '800',
  },
  metricChipsScroll: {
    marginBottom: SPACING.md,
  },
  metricChipsContent: {
    gap: 8,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  metricChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  chartCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  chartTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  chartHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  chartHeaderNominal: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  latestValueBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  latestValText: {
    fontSize: 22,
    fontWeight: '900',
  },
  latestUnitText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPointBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCardSecondary,
    padding: SPACING.sm,
    borderRadius: 10,
    marginTop: SPACING.sm,
  },
  selectedPointDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  selectedPointVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  wellbeingCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    marginBottom: SPACING.lg,
  },
  wbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wbBox: {
    flex: 1,
  },
  wbBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  wbLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  wbValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  wbSub: {
    fontSize: 10,
    color: COLORS.textCyan,
  },
  wbDivider: {
    width: 1,
    height: 48,
    backgroundColor: COLORS.borderSubtle,
    marginHorizontal: SPACING.md,
    alignSelf: 'center',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: COLORS.borderSubtle,
    marginVertical: SPACING.md,
  },
  exerciseSection: {
    gap: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  exerciseBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  exerciseBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.brightBlue,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  exerciseProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  exerciseDurationText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  exerciseIntensityText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  boldCyan: {
    color: COLORS.cyan,
    fontWeight: '800',
  },
  boldWhite: {
    color: COLORS.white,
    fontWeight: '800',
  },
  exerciseNote: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  envCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  envHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  envTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  envTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  envDemoBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  envDemoText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.statusWarning,
  },
  envGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  envBox: {
    width: '48%',
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 12,
    padding: SPACING.md,
  },
  envVal: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  envLbl: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  envRange: {
    fontSize: 9,
    color: COLORS.cyan,
    marginTop: 3,
    fontWeight: '600',
  },
  edaSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  edaTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  edaSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 1.1,
  },
  viewHubLink: {
    fontSize: 11,
    color: COLORS.cyan,
    fontWeight: '700',
  },
  edaCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: SPACING.lg,
  },
  edaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  edaMissionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  edaMissionSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  edaBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  edaBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  edaComparisonGrid: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  edaCompItem: {
    backgroundColor: COLORS.surfaceCardSecondary,
    padding: SPACING.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  edaCompMetric: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  edaValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  edaCurrentVal: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.cyan,
  },
  edaNasaVal: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  edaValLabel: {
    fontSize: 8.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  edaVsText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  edaFindingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: SPACING.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    marginBottom: SPACING.sm,
  },
  edaFindingText: {
    fontSize: 10,
    color: COLORS.textPrimary,
    lineHeight: 15,
    flex: 1,
  },
  openEdaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  openEdaBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
  },
});
