// Dedicated Space Mission Control Center Screen for ORBIT Health
// Multi-System Telemetry: Astronaut Vitals, Space Weather (DONKI), Radiation, ECLSS & Uplink

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

interface MissionControlScreenProps {
  onNavigateTab?: (tab: MainNavTab) => void;
}

export const MissionControlScreen: React.FC<MissionControlScreenProps> = ({
  onNavigateTab,
}) => {
  const [profile] = useState<AstronautProfile>(DEFAULT_ASTRONAUT);
  const [vitals, setVitals] = useState<HealthRecord | null>(null);
  const [cabin, setCabin] = useState<CabinEnvironmentData | null>(null);
  const [metTime, setMetTime] = useState({
    days: 142,
    hours: 14,
    minutes: 32,
    seconds: 18,
  });

  useEffect(() => {
    const loadTelemetry = async () => {
      const v = await getLatestHealthRecord();
      const c = await getLatestCabinEnvironment();
      if (v) setVitals(v);
      if (c) setCabin(c);
    };
    loadTelemetry();

    // MET Telemetry Clock ticking
    const interval = setInterval(() => {
      setMetTime((prev) => {
        let sec = prev.seconds + 1;
        let min = prev.minutes;
        let hr = prev.hours;
        let d = prev.days;
        if (sec >= 60) {
          sec = 0;
          min += 1;
        }
        if (min >= 60) {
          min = 0;
          hr += 1;
        }
        if (hr >= 24) {
          hr = 0;
          d += 1;
        }
        return { days: d, hours: hr, minutes: min, seconds: sec };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const formatMet = (val: number) => (val < 10 ? `0${val}` : `${val}`);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MISSION CONTROL CENTER</Text>
          <Text style={styles.subtitle}>Artemis Gateway Alpha • Flight Telemetry & Annunciator Deck</Text>
        </View>
        <View style={styles.uplinkBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.uplinkText}>CARRIER AOS (Ku-Band)</Text>
        </View>
      </View>

      {/* Mission Elapsed Time (MET) Telemetry Clock */}
      <View style={styles.metCard}>
        <View style={styles.metTop}>
          <MaterialCommunityIcons name="clock-digital" size={18} color={COLORS.cyan} />
          <Text style={styles.metLabel}>MISSION ELAPSED TIME (MET)</Text>
          <Text style={styles.metGmt}>GMT 2026-11-14</Text>
        </View>
        <View style={styles.metDigitsRow}>
          <View style={styles.metSegment}>
            <Text style={styles.metValue}>{formatMet(metTime.days)}</Text>
            <Text style={styles.metUnit}>DAYS</Text>
          </View>
          <Text style={styles.metColon}>:</Text>
          <View style={styles.metSegment}>
            <Text style={styles.metValue}>{formatMet(metTime.hours)}</Text>
            <Text style={styles.metUnit}>HOURS</Text>
          </View>
          <Text style={styles.metColon}>:</Text>
          <View style={styles.metSegment}>
            <Text style={styles.metValue}>{formatMet(metTime.minutes)}</Text>
            <Text style={styles.metUnit}>MINUTES</Text>
          </View>
          <Text style={styles.metColon}>:</Text>
          <View style={styles.metSegment}>
            <Text style={styles.metValue}>{formatMet(metTime.seconds)}</Text>
            <Text style={styles.metUnit}>SECONDS</Text>
          </View>
        </View>
      </View>

      {/* Section 1: Astronaut Bio-Telemetry Matrix */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>CREW BIOMEDICAL MATRIX</Text>
        <TouchableOpacity onPress={() => onNavigateTab?.('health')}>
          <Text style={styles.sectionLink}>Inspect Vitals ➔</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid2x2}>
        <View style={styles.metricTile}>
          <View style={styles.metricTop}>
            <MaterialCommunityIcons name="heart-pulse" size={18} color={COLORS.cyan} />
            <Text style={styles.metricName}>Heart Rate</Text>
          </View>
          <Text style={styles.metricVal}>
            {vitals?.heartRate || profile.baselines.restingHeartRate} <Text style={styles.metricUnitSmall}>BPM</Text>
          </Text>
          <Text style={styles.metricStatus}>ECG Lead I: Nominal</Text>
        </View>

        <View style={styles.metricTile}>
          <View style={styles.metricTop}>
            <MaterialCommunityIcons name="water-percent" size={18} color={COLORS.cyan} />
            <Text style={styles.metricName}>SpO2 Saturation</Text>
          </View>
          <Text style={styles.metricVal}>
            {vitals?.bloodOxygen || profile.baselines.bloodOxygen} <Text style={styles.metricUnitSmall}>%</Text>
          </Text>
          <Text style={styles.metricStatus}>Pleth: 99% Perfusion</Text>
        </View>

        <View style={styles.metricTile}>
          <View style={styles.metricTop}>
            <MaterialCommunityIcons name="arm-flex" size={18} color={COLORS.cyan} />
            <Text style={styles.metricName}>Blood Pressure</Text>
          </View>
          <Text style={styles.metricVal}>
            {vitals?.bloodPressureSys || profile.baselines.bloodPressureSys}/{vitals?.bloodPressureDia || profile.baselines.bloodPressureDia}
          </Text>
          <Text style={styles.metricStatus}>MAP: 91 mmHg</Text>
        </View>

        <View style={styles.metricTile}>
          <View style={styles.metricTop}>
            <MaterialCommunityIcons name="thermometer" size={18} color={COLORS.cyan} />
            <Text style={styles.metricName}>Core Temp</Text>
          </View>
          <Text style={styles.metricVal}>
            {vitals?.bodyTemperature || profile.baselines.bodyTemperature} <Text style={styles.metricUnitSmall}>°C</Text>
          </Text>
          <Text style={styles.metricStatus}>Thermoreg: Balanced</Text>
        </View>
      </View>

      {/* Section 2: Space Weather & DONKI Feeds */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>SPACE WEATHER RADAR (NASA DONKI)</Text>
        <TouchableOpacity onPress={() => onNavigateTab?.('radiation')}>
          <Text style={styles.sectionLink}>RadLab Dossier ➔</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weatherCard}>
        <View style={styles.weatherRow}>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherVal}>C1.2</Text>
            <Text style={styles.weatherLbl}>Solar Flare Class</Text>
            <Text style={styles.weatherStatus}>Quiet (GOES-18)</Text>
          </View>
          <View style={styles.weatherDivider} />
          <View style={styles.weatherItem}>
            <Text style={styles.weatherVal}>Kp 2.3</Text>
            <Text style={styles.weatherLbl}>Geomagnetic Index</Text>
            <Text style={styles.weatherStatus}>Low Disturbance</Text>
          </View>
          <View style={styles.weatherDivider} />
          <View style={styles.weatherItem}>
            <Text style={styles.weatherVal}>0 CME</Text>
            <Text style={styles.weatherLbl}>Coronal Mass Eject.</Text>
            <Text style={styles.weatherStatus}>Zero Earth-Directed</Text>
          </View>
        </View>
      </View>

      {/* Section 3: Radiation Flux & Dosimetry */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>MULTI-DETECTOR DOSIMETRY (LIULIN-5)</Text>
      </View>

      <View style={styles.radCard}>
        <View style={styles.radRow}>
          <View style={styles.radBox}>
            <Text style={styles.radVal}>{radData.currentRateMicroSvPerHour}</Text>
            <Text style={styles.radLbl}>µSv / Hour Flux</Text>
          </View>
          <View style={styles.weatherDivider} />
          <View style={styles.radBox}>
            <Text style={styles.radVal}>{radData.dailyExposureMicroSv}</Text>
            <Text style={styles.radLbl}>µSv Daily Total</Text>
          </View>
          <View style={styles.weatherDivider} />
          <View style={styles.radBox}>
            <Text style={styles.radVal}>{radData.cumulativeMissionExposureMilliSv}</Text>
            <Text style={styles.radLbl}>mSv Mission Total</Text>
          </View>
        </View>
        <View style={styles.radFooter}>
          <MaterialCommunityIcons name="shield-check" size={14} color={COLORS.statusNormal} />
          <Text style={styles.radFooterText}>
            Career limit consumed: 10.4% of 600 mSv NASA astronaut threshold.
          </Text>
        </View>
      </View>

      {/* Section 4: Environmental ECLSS Life Support */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>CABIN LIFE SUPPORT (ECLSS EDA)</Text>
      </View>

      <View style={styles.eclssCard}>
        <View style={styles.eclssGrid}>
          <View style={styles.eclssCol}>
            <Text style={styles.eclssVal}>{cabin?.cabinCO2mmHg || 2.8} mmHg</Text>
            <Text style={styles.eclssLbl}>Cabin PPCO2 (Target &lt; 3.5)</Text>
          </View>
          <View style={styles.eclssCol}>
            <Text style={styles.eclssVal}>{cabin?.cabinO2Percent || 21.0} %</Text>
            <Text style={styles.eclssLbl}>Atmospheric PPO2</Text>
          </View>
          <View style={styles.eclssCol}>
            <Text style={styles.eclssVal}>{cabin?.cabinPressureKPa || 101.3} kPa</Text>
            <Text style={styles.eclssLbl}>Cabin Pressure (1.0 ATM)</Text>
          </View>
          <View style={styles.eclssCol}>
            <Text style={styles.eclssVal}>{cabin?.cabinTempCelsius || 22.1} °C</Text>
            <Text style={styles.eclssLbl}>Cabin Temperature</Text>
          </View>
        </View>
      </View>

      {/* Flight Surgeon Status Brief */}
      <View style={styles.surgeonCard}>
        <View style={styles.surgeonTop}>
          <MaterialCommunityIcons name="doctor" size={18} color={COLORS.cyan} />
          <Text style={styles.surgeonTitle}>FLIGHT SURGEON MISSION STATUS BRIEF</Text>
        </View>
        <Text style={styles.surgeonText}>
          Commander Alex Vance physiological baselines are optimal. Autonomic baroreflex adaptation to cephalad fluid shift nominal. ARED resistive countermeasures compliant at 100% weekly volume. Deep space radiation dose rate remains beneath EVA threshold limits.
        </Text>
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
    fontSize: 10.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  uplinkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.statusNormal,
  },
  uplinkText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.statusNormal,
    letterSpacing: 0.8,
  },
  metCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    marginBottom: SPACING.lg,
  },
  metTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 1,
    flex: 1,
    marginLeft: 6,
  },
  metGmt: {
    fontSize: 9.5,
    color: COLORS.textMuted,
  },
  metDigitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  metSegment: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCardSecondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  metValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
  },
  metUnit: {
    fontSize: 8,
    color: COLORS.cyan,
    fontWeight: '800',
    marginTop: 2,
  },
  metColon: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.cyan,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
  },
  sectionLink: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  metricTile: {
    width: '48%',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metricName: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  metricUnitSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  metricStatus: {
    fontSize: 9,
    color: COLORS.statusNormal,
    fontWeight: '700',
    marginTop: 2,
  },
  weatherCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  weatherRow: {
    flexDirection: 'row',
  },
  weatherItem: {
    flex: 1,
    alignItems: 'center',
  },
  weatherVal: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  weatherLbl: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  weatherStatus: {
    fontSize: 8.5,
    color: COLORS.statusNormal,
    fontWeight: '700',
    marginTop: 2,
  },
  weatherDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.borderSubtle,
    alignSelf: 'center',
  },
  radCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  radRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  radBox: {
    flex: 1,
    alignItems: 'center',
  },
  radVal: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  radLbl: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  radFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 6,
  },
  radFooterText: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    flex: 1,
  },
  eclssCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.lg,
  },
  eclssGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eclssCol: {
    width: '46%',
  },
  eclssVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  eclssLbl: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  surgeonCard: {
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  surgeonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  surgeonTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  surgeonText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
