import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme/colors';
import { RadiationData, RadiationLogEntry, RadiationRiskLevel, MainNavTab } from '../types/astronaut';
import { NasaRadlabMeasurement, NasaDonkiEvent } from '../types/nasa';
import { getRadiationHistory, insertRadiationEntry } from '../services/db';
import { getCachedRadlabMeasurements, getCachedDonkiEvents } from '../services/nasaDb';
import { triggerHealthAlert } from '../services/notificationService';
import { CosmicRadiation3D } from '../components/3d/CosmicRadiation3D';
import { DataSourceBadge } from '../components/DataSourceBadge';
import { fetchNasaDonkiSpaceWeather } from '../services/nasa/donkiService';
import { SolarEventAdvisorCard } from '../components/SolarEventAdvisorCard';

interface RadiationScreenProps {
  onNavigateTab?: (tab: MainNavTab) => void;
}

export const RadiationScreen: React.FC<RadiationScreenProps> = ({ onNavigateTab }) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<RadiationLogEntry[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<RadiationLogEntry | null>(null);
  const [threshold, setThreshold] = useState<number>(25.0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [radlabBenchmarks, setRadlabBenchmarks] = useState<NasaRadlabMeasurement[]>([]);
  const [donkiEvents, setDonkiEvents] = useState<NasaDonkiEvent[]>([]);
  const [isSyncingDonki, setIsSyncingDonki] = useState<boolean>(false);
  const [donkiSourceType, setDonkiSourceType] = useState<'NASA_LIVE' | 'NASA_CACHED'>('NASA_CACHED');
  const [lastDonkiSyncTime, setLastDonkiSyncTime] = useState<string | null>(null);
  const [isSimulatedSolarEvent, setIsSimulatedSolarEvent] = useState<boolean>(false);

  // Current Radiation telemetry data state (DEMO DATA)
  const [radData, setRadData] = useState<RadiationData>({
    currentRateMicroSvPerHour: 18.5,
    dailyExposureMicroSv: 444,
    cumulativeMissionExposureMilliSv: 62.4,
    careerLimitMilliSv: 600,
    thresholdRiskLevel: 'NORMAL',
    solarParticleEventStatus: 'Quiet',
    recommendations: [
      'Current galactic cosmic ray (GCR) flux is within nominal deep-space bounds.',
      'Continue standard flight duty. No immediate shelter requirement.',
      'Next South Atlantic Anomaly (SAA) orbital transit expected in 3 hours 40 minutes.',
    ],
    isSimulatedDemo: true,
    lastUpdated: new Date().toISOString(),
  });

  const updateRadStateFromReading = (rate: number) => {
    let risk: RadiationRiskLevel = 'NORMAL';
    const recs: string[] = [];

    if (rate >= 35.0) {
      risk = 'HIGH';
      recs.push('CRITICAL: Relocate immediately to central radiation storm shelter (Node 2 / Water Wall).');
      recs.push('Abort scheduled EVA / spacewalk operations.');
      recs.push('Power down non-critical exterior cameras and optical sensors.');
    } else if (rate >= threshold) {
      risk = 'ELEVATED';
      recs.push('Elevated radiation flux detected. Traversal of South Atlantic Anomaly (SAA) or solar storm tail.');
      recs.push('Limit time in unshielded Cupola observation module and Quest Airlock.');
      recs.push('Monitor real-time dosimeter every 15 minutes.');
    } else {
      risk = 'NORMAL';
      recs.push('Nominal space environment: Baseline GCR flux stable.');
      recs.push('Standard crew quarters shielding sufficient.');
      recs.push('Pre-EVA dosimeter calibration complete.');
    }

    setRadData((prev) => ({
      ...prev,
      currentRateMicroSvPerHour: rate,
      thresholdRiskLevel: risk,
      recommendations: recs,
      solarParticleEventStatus: rate >= 35 ? 'Active SPE Warning' : rate >= 25 ? 'Advisory' : 'Quiet',
      lastUpdated: new Date().toISOString(),
    }));
  };

  const loadRadiationHistory = async () => {
    try {
      const logs = await getRadiationHistory(12);
      setHistory(logs);
      if (logs.length > 0) {
        const latest = logs[logs.length - 1];
        setSelectedPoint(latest);
        updateRadStateFromReading(latest.rateMicroSvPerHour);
      }
      const [radlab, donki] = await Promise.all([
        getCachedRadlabMeasurements(4),
        getCachedDonkiEvents(3),
      ]);
      setRadlabBenchmarks(radlab);
      setDonkiEvents(donki);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncDonkiLive = async () => {
    setIsSyncingDonki(true);
    try {
      const res = await fetchNasaDonkiSpaceWeather();
      if (res.events && res.events.length > 0) {
        setDonkiEvents(res.events);
      }
      setDonkiSourceType(res.source === 'LIVE_API' ? 'NASA_LIVE' : 'NASA_CACHED');
      setLastDonkiSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      Alert.alert(
        res.source === 'LIVE_API' ? 'NASA DONKI Live Synced' : 'NASA DONKI Offline Cached',
        res.source === 'LIVE_API'
          ? `Successfully synchronized ${res.events.length} active space weather events directly from api.nasa.gov.`
          : 'Network unavailable. Using cached NASA space weather alerts stored in local SQLite.'
      );
    } catch {
      setDonkiSourceType('NASA_CACHED');
      Alert.alert('NASA DONKI Cached', 'Retaining offline space weather records from local SQLite.');
    } finally {
      setIsSyncingDonki(false);
    }
  };

  useEffect(() => {
    loadRadiationHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSimulateFluxSpike = async () => {
    setIsSimulating(true);
    const spikeRate = 28.4; // Exceeds 25.0 threshold
    const newEntry: RadiationLogEntry = {
      id: `rad_${Date.now()}`,
      timestamp: new Date().toISOString(),
      rateMicroSvPerHour: spikeRate,
      location: 'Quest Airlock Hull',
      isSimulatedDemo: true,
    };

    await insertRadiationEntry(newEntry);
    await triggerHealthAlert(
      'Radiation Threshold Exceeded (Simulated)',
      'RADIATION',
      'WARNING',
      `Dosimeter recorded ${spikeRate} µSv/h near Quest Airlock. Exceeds configured limit of ${threshold} µSv/h.`,
      `Flux rate (${spikeRate} µSv/h) > Threshold (${threshold} µSv/h).`,
      'Move to interior core module (Node 2) and verify personal dosimeter badge.'
    );

    await loadRadiationHistory();
    setIsSimulating(false);
    Alert.alert(
      'Radiation Spike Simulated',
      `Injected test reading: ${spikeRate} µSv/h.\nAlert dispatched and logged to in-app notification center.`
    );
  };

  // SVG Chart Dimensions
  const chartWidth = 320;
  const chartHeight = 160;
  const padding = 28;

  // Build SVG path coordinates
  const points = history.map((entry, index) => {
    const x = padding + (index / Math.max(1, history.length - 1)) * (chartWidth - padding * 2);
    // Min rate 10, Max rate 35
    const normalizedY = (entry.rateMicroSvPerHour - 10) / (35 - 10);
    const y = chartHeight - padding - normalizedY * (chartHeight - padding * 2);
    return { x, y, entry };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const thresholdY = chartHeight - padding - ((threshold - 10) / (35 - 10)) * (chartHeight - padding * 2);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Title */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('radiation.title')}</Text>
          <Text style={styles.subtitle}>{t('radiation.subtitle')}</Text>
        </View>
        <View style={styles.liveTag}>
          <Text style={styles.liveTagText}>{t('radiation.activeFeed')}</Text>
        </View>
      </View>

      {/* Mandatory Demo Notice */}
      <View style={styles.demoWarningBanner}>
        <MaterialCommunityIcons name="alert-decagram" size={18} color={COLORS.statusWarning} />
        <Text style={styles.demoWarningText}>
          {t('radiation.demoNotice')}
        </Text>
      </View>

      {/* Primary Radiation Gauge Card */}
      <View style={styles.gaugeCard}>
        <View style={styles.gaugeTopRow}>
          <View style={styles.rateGroup}>
            <Text style={styles.rateLabel}>{t('radiation.currentAmbientDose')}</Text>
            <View style={styles.rateValueRow}>
              <Text style={styles.rateValue}>{radData.currentRateMicroSvPerHour.toFixed(1)}</Text>
              <Text style={styles.rateUnit}>µSv / h</Text>
            </View>
          </View>

          <View
            style={[
              styles.riskBadge,
              radData.thresholdRiskLevel === 'NORMAL'
                ? styles.riskBadgeNormal
                : radData.thresholdRiskLevel === 'ELEVATED'
                ? styles.riskBadgeElevated
                : styles.riskBadgeHigh,
            ]}
          >
            <MaterialCommunityIcons
              name={
                radData.thresholdRiskLevel === 'NORMAL'
                  ? 'shield-check'
                  : radData.thresholdRiskLevel === 'ELEVATED'
                  ? 'alert-outline'
                  : 'radioactive'
              }
              size={14}
              color={
                radData.thresholdRiskLevel === 'NORMAL'
                  ? COLORS.statusNormal
                  : radData.thresholdRiskLevel === 'ELEVATED'
                  ? COLORS.statusWarning
                  : COLORS.statusAlert
              }
            />
            <Text
              style={[
                styles.riskBadgeText,
                {
                  color:
                    radData.thresholdRiskLevel === 'NORMAL'
                      ? COLORS.statusNormal
                      : radData.thresholdRiskLevel === 'ELEVATED'
                      ? COLORS.statusWarning
                      : COLORS.statusAlert,
                },
              ]}
            >
              {radData.thresholdRiskLevel === 'NORMAL'
                ? t('radiation.riskNormal')
                : radData.thresholdRiskLevel === 'ELEVATED'
                ? t('radiation.riskElevated')
                : t('radiation.riskHigh')}
            </Text>
          </View>
        </View>

        {/* Secondary Metrics */}
        <View style={styles.subMetricsGrid}>
          <View style={styles.subMetricBox}>
            <Text style={styles.subMetricVal}>{radData.dailyExposureMicroSv.toFixed(0)} µSv</Text>
            <Text style={styles.subMetricLbl}>{t('radiation.dailyDose')}</Text>
          </View>
          <View style={styles.subDivider} />
          <View style={styles.subMetricBox}>
            <Text style={styles.subMetricVal}>{radData.cumulativeMissionExposureMilliSv.toFixed(1)} mSv</Text>
            <Text style={styles.subMetricLbl}>{t('radiation.cumulativeMission')}</Text>
          </View>
          <View style={styles.subDivider} />
          <View style={styles.subMetricBox}>
            <Text style={styles.subMetricVal}>{radData.careerLimitMilliSv} mSv</Text>
            <Text style={styles.subMetricLbl}>{t('radiation.careerLimit')}</Text>
          </View>
        </View>

        {/* Career Exposure Progress Bar */}
        <View style={styles.careerTrack}>
          <View
            style={[
              styles.careerFill,
              {
                width: `${(radData.cumulativeMissionExposureMilliSv / radData.careerLimitMilliSv) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.careerCaption}>
          {t('radiation.careerConsumed', {
            percent: ((radData.cumulativeMissionExposureMilliSv / radData.careerLimitMilliSv) * 100).toFixed(1),
          })}
        </Text>
      </View>

      {/* 3D Cosmic Radiation Interactive Dosimetry Chamber */}
      <CosmicRadiation3D
        currentFluxRate={radData.currentRateMicroSvPerHour}
        isSimulatedSpike={radData.thresholdRiskLevel !== 'NORMAL'}
        onSimulateSpikeToggle={handleSimulateFluxSpike}
      />

      {/* Interactive Radiation Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>{t('radiation.chronicTimeline')}</Text>
            <Text style={styles.chartSubtitle}>{t('radiation.chartSub')}</Text>
          </View>
          <View style={styles.thresholdIndicator}>
            <View style={styles.thresholdDot} />
            <Text style={styles.thresholdText}>{t('radiation.limitLabel', { val: threshold })}</Text>
          </View>
        </View>

        {/* SVG Interactive Chart */}
        <View style={styles.svgWrapper}>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <LinearGradient id="radGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={COLORS.cyan} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={COLORS.cyan} stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Threshold Line */}
            <Line
              x1={padding}
              y1={thresholdY}
              x2={chartWidth - padding}
              y2={thresholdY}
              stroke={COLORS.statusAlert}
              strokeDasharray="4,4"
              strokeWidth="1.5"
            />
            <SvgText
              x={chartWidth - padding - 45}
              y={thresholdY - 5}
              fill={COLORS.statusAlert}
              fontSize="9"
              fontWeight="bold"
            >
              LIMIT
            </SvgText>

            {/* Data Line */}
            {points.length > 1 && (
              <Path
                d={pathD}
                fill="none"
                stroke={COLORS.cyan}
                strokeWidth="2.5"
              />
            )}

            {/* Interactive Points */}
            {points.map((p, idx) => {
              const isSelected = selectedPoint?.id === p.entry.id;
              const isExceeded = p.entry.rateMicroSvPerHour >= threshold;
              return (
                <Circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 6 : 4}
                  fill={isExceeded ? COLORS.statusAlert : isSelected ? COLORS.cyan : COLORS.brightBlue}
                  stroke={COLORS.background}
                  strokeWidth="2"
                  onPress={() => setSelectedPoint(p.entry)}
                />
              );
            })}
          </Svg>
        </View>

        {/* Selected Point Inspection Tooltip */}
        {selectedPoint && (
          <View style={styles.tooltipBox}>
            <View style={styles.tooltipRow}>
              <MaterialCommunityIcons name="crosshairs-gps" size={16} color={COLORS.cyan} />
              <Text style={styles.tooltipLoc}>{selectedPoint.location}</Text>
            </View>
            <View style={styles.tooltipValRow}>
              <Text style={styles.tooltipVal}>{selectedPoint.rateMicroSvPerHour.toFixed(1)} µSv/h</Text>
              <Text style={styles.tooltipTime}>
                {new Date(selectedPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Safety Countermeasure Recommendations */}
      <View style={styles.recsCard}>
        <View style={styles.recsHeader}>
          <MaterialCommunityIcons name="shield-sword-outline" size={18} color={COLORS.cyan} />
          <Text style={styles.recsTitle}>{t('radiation.safetyProtocols')}</Text>
        </View>
        {radData.recommendations.map((rec, i) => (
          <View key={i} style={styles.recRow}>
            <View style={styles.recNumber}>
              <Text style={styles.recNumberText}>{i + 1}</Text>
            </View>
            <Text style={styles.recText}>{rec}</Text>
          </View>
        ))}
      </View>

      {/* Solar Storm Shelter Advisor Card */}
      <SolarEventAdvisorCard
        activeDonkiEvents={donkiEvents}
        isSimulatedActive={isSimulatedSolarEvent}
        onToggleSimulateEvent={(active) => setIsSimulatedSolarEvent(active)}
        cumulativeDoseMsv={radData.cumulativeMissionExposureMilliSv}
      />

      {/* SECTION 5: NASA DONKI SPACE WEATHER ALERT SYSTEM */}
      <View style={styles.nasaSectionHeader}>
        <View style={styles.nasaTitleBadge}>
          <MaterialCommunityIcons name="weather-sunny-alert" size={18} color={COLORS.cyan} />
          <Text style={styles.nasaSectionTitle}>{t('radiation.spaceWeatherDonki')}</Text>
        </View>
        <TouchableOpacity onPress={() => onNavigateTab?.('nasa')} activeOpacity={0.7}>
          <Text style={styles.viewHubLink}>{t('radiation.openHub')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.donkiCard}>
        <View style={styles.donkiTopRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.donkiHeadline}>{t('radiation.donkiHeadline')}</Text>
            <Text style={styles.donkiSub}>{t('radiation.donkiSub')}</Text>
            <View style={{ marginTop: 6 }}>
              <DataSourceBadge source={donkiSourceType} lastSynced={lastDonkiSyncTime || undefined} />
            </View>
          </View>
          <TouchableOpacity
            style={styles.donkiSyncBtn}
            onPress={handleSyncDonkiLive}
            disabled={isSyncingDonki}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isSyncingDonki ? 'loading' : 'sync'}
              size={14}
              color={COLORS.cyan}
            />
            <Text style={styles.donkiSyncBtnText}>
              {isSyncingDonki ? 'SYNCING...' : 'SYNC LIVE'}
            </Text>
          </TouchableOpacity>
        </View>

        {donkiEvents.length === 0 ? (
          <Text style={styles.emptyDonkiText}>{t('radiation.noWeatherAlerts')}</Text>
        ) : (
          donkiEvents.map((event) => (
            <View key={event.messageId} style={styles.donkiEventItem}>
              <View style={styles.donkiEventHeader}>
                <View style={styles.donkiTypePill}>
                  <Text style={styles.donkiTypeText}>{event.messageType}</Text>
                </View>
                <Text style={styles.donkiEventId}>{event.messageId}</Text>
                <Text style={styles.donkiTime}>
                  {new Date(event.issueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.donkiSummaryText}>{event.summary}</Text>
              <View style={styles.operationalRecBox}>
                <MaterialCommunityIcons name="shield-alert-outline" size={14} color={COLORS.statusWarning} />
                <Text style={styles.operationalRecText}>
                  {t('radiation.actionLabel', { val: event.operationalGuidance || 'Continue monitoring flight dosimetry.' })}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Scientific Constraint Disclaimer */}
        <View style={styles.donkiDisclaimerBox}>
          <MaterialCommunityIcons name="information-outline" size={15} color={COLORS.textCyan} />
          <Text style={styles.donkiDisclaimerText}>
            {t('radiation.donkiDisclaimer')}
          </Text>
        </View>
      </View>

      {/* SECTION 2: NASA RADLAB REAL DETECTOR HISTORICAL BENCHMARKS */}
      <View style={styles.nasaSectionHeader}>
        <View style={styles.nasaTitleBadge}>
          <MaterialCommunityIcons name="database-eye" size={18} color={COLORS.cyan} />
          <Text style={styles.nasaSectionTitle}>{t('radiation.realDetectorTelemetry')}</Text>
        </View>
        <TouchableOpacity onPress={() => onNavigateTab?.('nasa')} activeOpacity={0.7}>
          <Text style={styles.viewHubLink}>{t('radiation.allDetectors')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.radlabCard}>
        <Text style={styles.radlabIntro}>
          {t('radiation.radlabIntro')}
        </Text>

        <View style={styles.radlabList}>
          {radlabBenchmarks.map((bench) => (
            <View key={bench.id} style={styles.radlabItem}>
              <View style={styles.radlabItemTop}>
                <View>
                  <Text style={styles.detectorName}>{bench.instrument} ({bench.instrumentId})</Text>
                  <Text style={styles.detectorSpacecraft}>
                    {bench.spacecraft} • {bench.sourceAttribution}
                  </Text>
                </View>
                <View style={styles.detectorBadge}>
                  <Text style={styles.detectorBadgeText}>{t('radiation.realTelemetry')}</Text>
                </View>
              </View>

              <View style={styles.radlabMetricsRow}>
                {bench.absorbedDoseRateMicroGyPerHour !== null && (
                  <View style={styles.radlabMetricBox}>
                    <Text style={styles.radlabMetricVal}>
                      {bench.absorbedDoseRateMicroGyPerHour.toFixed(1)}
                    </Text>
                    <Text style={styles.radlabMetricUnit}>µGy/h (Absorbed)</Text>
                  </View>
                )}
                {bench.doseEquivalentRateMicroSvPerHour !== null && (
                  <View style={styles.radlabMetricBox}>
                    <Text style={[styles.radlabMetricVal, { color: COLORS.cyan }]}>
                      {bench.doseEquivalentRateMicroSvPerHour.toFixed(1)}
                    </Text>
                    <Text style={styles.radlabMetricUnit}>µSv/h (Biological)</Text>
                  </View>
                )}
                {bench.fluxParticlesPerCm2Sec !== null && (
                  <View style={styles.radlabMetricBox}>
                    <Text style={styles.radlabMetricVal}>
                      {bench.fluxParticlesPerCm2Sec.toFixed(2)}
                    </Text>
                    <Text style={styles.radlabMetricUnit}>part/cm²·s (Flux)</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Current Onboard vs NASA Historical Benchmark Comparison */}
        <View style={styles.comparisonBox}>
          <Text style={styles.comparisonTitle}>{t('radiation.benchmarkComparison')}</Text>
          <View style={styles.comparisonRow}>
            <View style={styles.compCol}>
              <Text style={styles.compLabel}>{t('radiation.currentTelemetryDemo')}</Text>
              <Text style={styles.compVal}>{radData.currentRateMicroSvPerHour.toFixed(1)} µSv/h</Text>
            </View>
            <View style={styles.compDivider} />
            <View style={styles.compCol}>
              <Text style={styles.compLabel}>{t('radiation.nasaBaselineLabel')}</Text>
              <Text style={styles.compVal}>21.6 - 24.8 µSv/h</Text>
            </View>
          </View>
          <Text style={styles.compResultText}>
            {t('radiation.benchmarkConsistent')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.openHubBtn}
          onPress={() => onNavigateTab?.('nasa')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="database-arrow-right" size={16} color={COLORS.cyan} />
          <Text style={styles.openHubBtnText}>{t('radiation.inspectRadlab')}</Text>
        </TouchableOpacity>
      </View>

      {/* Simulation & Threshold Controls */}
      <View style={styles.controlsCard}>
        <Text style={styles.controlTitle}>{t('radiation.thresholdControls')}</Text>
        <Text style={styles.controlSub}>
          {t('radiation.adjustSub')}
        </Text>

        <View style={styles.thresholdAdjustRow}>
          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => setThreshold((prev) => Math.max(15, prev - 2.5))}
          >
            <Text style={styles.adjustBtnText}>- 2.5</Text>
          </TouchableOpacity>
          <View style={styles.threshValueBox}>
            <Text style={styles.threshVal}>{threshold.toFixed(1)} µSv/h</Text>
            <Text style={styles.threshLbl}>{t('radiation.alertLimit')}</Text>
          </View>
          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => setThreshold((prev) => Math.min(50, prev + 2.5))}
          >
            <Text style={styles.adjustBtnText}>+ 2.5</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.simulateBtn, isSimulating && styles.simulateBtnActive]}
          onPress={handleSimulateFluxSpike}
          disabled={isSimulating}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="test-tube" size={18} color={COLORS.background} />
          <Text style={styles.simulateBtnText}>
            {isSimulating ? t('radiation.injecting') : t('radiation.simulateSpike')}
          </Text>
        </TouchableOpacity>
      </View>
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
  liveTag: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cyan,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 1,
  },
  demoWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: SPACING.lg,
  },
  demoWarningText: {
    fontSize: 10,
    color: COLORS.statusWarning,
    fontWeight: '700',
    lineHeight: 15,
    flex: 1,
  },
  gaugeCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    marginBottom: SPACING.lg,
  },
  gaugeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  rateGroup: {
    flex: 1,
  },
  rateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  rateValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  rateValue: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  rateUnit: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  riskBadgeNormal: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: COLORS.statusNormal,
  },
  riskBadgeElevated: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: COLORS.statusWarning,
  },
  riskBadgeHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: COLORS.statusAlert,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  subMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  subMetricBox: {
    flex: 1,
    alignItems: 'center',
  },
  subMetricVal: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  subMetricLbl: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  subDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.borderSubtle,
    alignSelf: 'center',
  },
  careerTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  careerFill: {
    height: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: 3,
  },
  careerCaption: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1.1,
  },
  chartSubtitle: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  thresholdIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  thresholdDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.statusAlert,
  },
  thresholdText: {
    fontSize: 9,
    color: COLORS.statusAlert,
    fontWeight: '700',
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xs,
  },
  tooltipBox: {
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 10,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    marginTop: SPACING.xs,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  tooltipLoc: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tooltipValRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tooltipVal: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.cyan,
  },
  tooltipTime: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  recsCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  recsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  recsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 1,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  recNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  recNumberText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  recText: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  controlsCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  controlTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  controlSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginVertical: 4,
    lineHeight: 14,
  },
  thresholdAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: SPACING.sm,
  },
  adjustBtn: {
    backgroundColor: COLORS.surfaceCardSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adjustBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  threshValueBox: {
    alignItems: 'center',
  },
  threshVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  threshLbl: {
    fontSize: 9,
    color: COLORS.textSecondary,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.cyan,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    marginTop: 4,
  },
  simulateBtnActive: {
    backgroundColor: COLORS.primaryBlue,
  },
  simulateBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.background,
  },
  nasaSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  nasaTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nasaSectionTitle: {
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
  donkiCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: SPACING.md,
  },
  donkiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  donkiHeadline: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  donkiSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  donkiSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  donkiSyncBtnText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.5,
  },
  donkiTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  donkiTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.statusAlert,
    letterSpacing: 0.8,
  },
  emptyDonkiText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    paddingVertical: SPACING.sm,
  },
  donkiEventItem: {
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  donkiEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  donkiTypePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  donkiTypeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  donkiEventId: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  donkiTime: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  donkiSummaryText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  operationalRecBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  operationalRecText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.statusWarning,
    flex: 1,
  },
  donkiDisclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: SPACING.xs,
    padding: SPACING.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  donkiDisclaimerText: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    lineHeight: 14,
    flex: 1,
  },
  radlabCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  radlabIntro: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    lineHeight: 15,
    marginBottom: SPACING.md,
  },
  radlabList: {
    gap: SPACING.sm,
  },
  radlabItem: {
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  radlabItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  detectorName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  detectorSpacecraft: {
    fontSize: 10,
    color: COLORS.cyan,
    marginTop: 1,
  },
  detectorBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  detectorBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.statusNormal,
  },
  radlabMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  radlabMetricBox: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  radlabMetricVal: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  radlabMetricUnit: {
    fontSize: 8.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  comparisonBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  comparisonTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.cyan,
    letterSpacing: 1,
    marginBottom: 6,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  compCol: {
    flex: 1,
  },
  compLabel: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
  },
  compVal: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  compDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.borderSubtle,
    marginHorizontal: 8,
  },
  compResultText: {
    fontSize: 10,
    color: COLORS.statusNormal,
    fontWeight: '600',
    lineHeight: 14,
  },
  openHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.md,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  openHubBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
  },
});
