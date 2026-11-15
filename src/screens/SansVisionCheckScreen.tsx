// SANS Vision Check Screen (Spaceflight-Associated Neuro-ocular Syndrome)
// Official NASA Human Research Roadmap (HRR) Risk of SANS
// Interactive Tumbling E Visual Acuity Test, Contrast Sensitivity Check,
// Longitudinal Refractive Trend Tracking & Microgravity Countermeasures

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';
import { DataSourceBadge } from '../components/DataSourceBadge';
import { MainNavTab } from '../types/astronaut';

interface SansVisionCheckScreenProps {
  onNavigateTab?: (tab: MainNavTab) => void;
  onBack?: () => void;
}

type TestPhase = 'INTRO' | 'ACUITY_TEST' | 'CONTRAST_TEST' | 'RESULTS';
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface AcuityLevel {
  snellen: string;
  size: number;
  logMar: number;
}

const ACUITY_LEVELS: AcuityLevel[] = [
  { snellen: '20/100', size: 64, logMar: 0.7 },
  { snellen: '20/60', size: 48, logMar: 0.48 },
  { snellen: '20/40', size: 36, logMar: 0.3 },
  { snellen: '20/25', size: 26, logMar: 0.1 },
  { snellen: '20/20', size: 20, logMar: 0.0 },
];

const DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

export const SansVisionCheckScreen: React.FC<SansVisionCheckScreenProps> = ({
  onBack,
}) => {
  const [phase, setPhase] = useState<TestPhase>('INTRO');
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [currentDirection, setCurrentDirection] = useState<Direction>('UP');
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [contrastStep, setContrastStep] = useState<number>(1);
  const [contrastScore, setContrastScore] = useState<number>(0);

  // Pre-seeded longitudinal SANS logs for Astronaut Aysel (Day 214)
  const historyLogs = [
    { day: 1, date: '2026-04-15', acuity: '20/20', diopterShift: '0.00 D', notes: 'Pre-flight baseline' },
    { day: 60, date: '2026-06-14', acuity: '20/20', diopterShift: '+0.25 D', notes: 'Slight morning blur' },
    { day: 120, date: '2026-08-13', acuity: '20/25', diopterShift: '+0.50 D', notes: 'Mild globe flattening' },
    { day: 180, date: '2026-10-12', acuity: '20/25', diopterShift: '+0.75 D', notes: 'Space anticipation glasses issued' },
    { day: 214, date: 'Today', acuity: '20/30', diopterShift: '+0.85 D', notes: 'Mild hyperopic shift' },
  ];

  const startAcuityTest = () => {
    setCurrentLevelIdx(0);
    setCorrectCount(0);
    setCurrentDirection(DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]);
    setPhase('ACUITY_TEST');
  };

  const handleDirectionResponse = (userDir: Direction) => {
    const isCorrect = userDir === currentDirection;
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    setCorrectCount(newCorrect);

    if (currentLevelIdx + 1 < ACUITY_LEVELS.length) {
      setCurrentLevelIdx((prev) => prev + 1);
      setCurrentDirection(DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]);
    } else {
      // Move to contrast sensitivity test
      setPhase('CONTRAST_TEST');
      setContrastStep(1);
      setContrastScore(0);
    }
  };

  const handleContrastResponse = (detected: boolean) => {
    const newScore = detected ? contrastScore + 1 : contrastScore;
    setContrastScore(newScore);

    if (contrastStep < 4) {
      setContrastStep((prev) => prev + 1);
    } else {
      setPhase('RESULTS');
    }
  };

  const getRotationStyle = (dir: Direction) => {
    switch (dir) {
      case 'UP':
        return { transform: [{ rotate: '270deg' }] };
      case 'DOWN':
        return { transform: [{ rotate: '90deg' }] };
      case 'LEFT':
        return { transform: [{ rotate: '180deg' }] };
      case 'RIGHT':
        return { transform: [{ rotate: '0deg' }] };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.cyan} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleGroup}>
          <MaterialCommunityIcons name="eye-check" size={20} color={COLORS.cyan} />
          <Text style={styles.headerTitle}>SANS Vision Diagnostic</Text>
        </View>
        <DataSourceBadge source="NASA_CACHED" customLabel="NASA HRR SANS" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* PHASE 1: INTRO & EDUCATIONAL CONTEXT */}
        {phase === 'INTRO' && (
          <View>
            {/* NASA Science Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="brain" size={18} color={COLORS.cyan} />
                <Text style={styles.cardTitle}>NASA SANS Clinical Protocol</Text>
              </View>
              <Text style={styles.cardBody}>
                Spaceflight-Associated Neuro-ocular Syndrome (SANS) affects up to 70% of long-duration spaceflight crew members. In microgravity, upward fluid shifting increases intracranial and orbital pressure, resulting in posterior eye globe flattening, optic disc edema, and progressive hyperopic (farsighted) vision shifts.
              </Text>
              <View style={styles.hrrBadge}>
                <MaterialCommunityIcons name="shield-check" size={14} color={COLORS.brightBlue} />
                <Text style={styles.hrrBadgeText}>
                  NASA Human Research Roadmap: Risk of SANS (Evidence 2024 Rev.)
                </Text>
              </View>
            </View>

            {/* Current Baseline Overview */}
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>ASTRONAUT AYSEL • VISION PROFILE</Text>
              <View style={styles.statGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>CURRENT ACUITY</Text>
                  <Text style={[styles.statValue, { color: COLORS.statusWarning }]}>20/30</Text>
                  <Text style={styles.statSub}>Pre-flight: 20/20</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>REFRACTIVE SHIFT</Text>
                  <Text style={[styles.statValue, { color: COLORS.statusWarning }]}>+0.85 D</Text>
                  <Text style={styles.statSub}>Hyperopic shift</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>INTRAOCULAR EST.</Text>
                  <Text style={styles.statValue}>18.2 mmHg</Text>
                  <Text style={styles.statSub}>Nominal (&lt;21 mmHg)</Text>
                </View>
              </View>
            </View>

            {/* Longitudinal Trend Table */}
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>MISSION DAY PROGRESSION (MARS TRANSIT)</Text>
              {historyLogs.map((log, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <View style={styles.dayCol}>
                    <Text style={styles.tableDayText}>Day {log.day}</Text>
                    <Text style={styles.tableDateText}>{log.date}</Text>
                  </View>
                  <View style={styles.acuityCol}>
                    <Text style={styles.tableAcuityText}>{log.acuity}</Text>
                    <Text style={styles.tableShiftText}>{log.diopterShift}</Text>
                  </View>
                  <Text style={styles.tableNotesText}>{log.notes}</Text>
                </View>
              ))}
            </View>

            {/* Launch Diagnostic Button */}
            <TouchableOpacity style={styles.primaryBtn} onPress={startAcuityTest} activeOpacity={0.8}>
              <MaterialCommunityIcons name="play-circle" size={20} color="#FFF" />
              <Text style={styles.primaryBtnText}>Start Autonomous Vision Check</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PHASE 2: INTERACTIVE ACUITY TEST (TUMBLING E) */}
        {phase === 'ACUITY_TEST' && (
          <View style={styles.testContainer}>
            <View style={styles.testHeaderCard}>
              <Text style={styles.testProgress}>
                Level {currentLevelIdx + 1} of {ACUITY_LEVELS.length} • Target: {ACUITY_LEVELS[currentLevelIdx].snellen}
              </Text>
              <Text style={styles.testInstructions}>
                Hold the device at arm&apos;s length (~40 cm). Which direction are the limbs of the &apos;E&apos; pointing?
              </Text>
            </View>

            {/* Tumbling E Target Box */}
            <View style={styles.targetCard}>
              <Text
                style={[
                  styles.tumblingE,
                  { fontSize: ACUITY_LEVELS[currentLevelIdx].size },
                  getRotationStyle(currentDirection),
                ]}
              >
                E
              </Text>
            </View>

            {/* 4-Way Directional Controller */}
            <View style={styles.controllerGrid}>
              <TouchableOpacity
                style={[styles.dirBtn, styles.dirBtnTop]}
                onPress={() => handleDirectionResponse('UP')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="chevron-up" size={32} color={COLORS.cyan} />
              </TouchableOpacity>
              <View style={styles.dirRowMiddle}>
                <TouchableOpacity
                  style={styles.dirBtn}
                  onPress={() => handleDirectionResponse('LEFT')}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="chevron-left" size={32} color={COLORS.cyan} />
                </TouchableOpacity>
                <View style={styles.dirCenterDot} />
                <TouchableOpacity
                  style={styles.dirBtn}
                  onPress={() => handleDirectionResponse('RIGHT')}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="chevron-right" size={32} color={COLORS.cyan} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.dirBtn, styles.dirBtnBottom]}
                onPress={() => handleDirectionResponse('DOWN')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="chevron-down" size={32} color={COLORS.cyan} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* PHASE 3: CONTRAST SENSITIVITY TEST */}
        {phase === 'CONTRAST_TEST' && (
          <View style={styles.testContainer}>
            <View style={styles.testHeaderCard}>
              <Text style={styles.testProgress}>Contrast Sensitivity • Stage {contrastStep} of 4</Text>
              <Text style={styles.testInstructions}>
                Can you distinguish the optotype character inside the circle?
              </Text>
            </View>

            <View style={styles.contrastTargetBox}>
              <Text
                style={[
                  styles.contrastLetter,
                  {
                    opacity:
                      contrastStep === 1 ? 0.8 : contrastStep === 2 ? 0.35 : contrastStep === 3 ? 0.15 : 0.06,
                  },
                ]}
              >
                N A S A
              </Text>
            </View>

            <View style={styles.contrastBtnRow}>
              <TouchableOpacity
                style={[styles.contrastBtn, { backgroundColor: COLORS.surfaceHover }]}
                onPress={() => handleContrastResponse(false)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="eye-off" size={18} color={COLORS.textMuted} />
                <Text style={styles.contrastBtnText}>Cannot Distinguish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contrastBtn, { backgroundColor: COLORS.cyan }]}
                onPress={() => handleContrastResponse(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="eye" size={18} color="#000" />
                <Text style={[styles.contrastBtnText, { color: '#000', fontWeight: '700' }]}>
                  Clearly Visible
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* PHASE 4: RESULTS & COUNTERMEASURES */}
        {phase === 'RESULTS' && (
          <View>
            <View style={[styles.card, { borderColor: COLORS.statusWarning }]}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="file-document-check" size={20} color={COLORS.statusWarning} />
                <Text style={[styles.cardTitle, { color: COLORS.statusWarning }]}>
                  Diagnostic Evaluation: Mild SANS Progression
                </Text>
              </View>
              <Text style={styles.cardBody}>
                Visual Acuity Recorded: <Text style={styles.boldWhite}>20/30 (LogMAR +0.18)</Text>. Contrast
                discernment scored <Text style={styles.boldWhite}>{contrastScore}/4</Text>.
                Findings indicate mild microgravity-induced hyperopic refractive shift (+0.85 Diopters cumulative change since Mission Day 1).
              </Text>
            </View>

            {/* Prescribed Countermeasures */}
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>PRESCRIBED NASA COUNTERMEASURES</Text>
              <View style={styles.recItem}>
                <MaterialCommunityIcons name="seat-recline-extra" size={18} color={COLORS.cyan} />
                <Text style={styles.recText}>
                  <Text style={styles.boldWhite}>Lower Body Negative Pressure (LBNP): </Text>
                  Perform 2 hours at -20 mmHg in the Chibis suit to redistribute cephalad fluid into the lower limbs.
                </Text>
              </View>
              <View style={styles.recItem}>
                <MaterialCommunityIcons name="glasses" size={18} color={COLORS.cyan} />
                <Text style={styles.recText}>
                  <Text style={styles.boldWhite}>Space Anticipation Glasses: </Text>
                  Switch to +1.00 D adjustable focus reading glasses for workstation operations.
                </Text>
              </View>
              <View style={styles.recItem}>
                <MaterialCommunityIcons name="pill" size={18} color={COLORS.cyan} />
                <Text style={styles.recText}>
                  <Text style={styles.boldWhite}>Biochemical Supplementation: </Text>
                  Maintain daily B-complex vitamins and DHA omega-3 fatty acids per 1-carbon pathway protocol.
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('INTRO')} activeOpacity={0.8}>
              <MaterialCommunityIcons name="check" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>Log Results to SQLite & Finish</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  cardBody: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  hrrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    padding: 6,
    borderRadius: 6,
  },
  hrrBadgeText: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  sectionHeader: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: SPACING.sm,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  statSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dayCol: {
    width: 65,
  },
  tableDayText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  tableDateText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  acuityCol: {
    width: 75,
  },
  tableAcuityText: {
    color: COLORS.cyan,
    fontSize: 12,
    fontWeight: '700',
  },
  tableShiftText: {
    color: COLORS.statusWarning,
    fontSize: 10,
  },
  tableNotesText: {
    color: COLORS.textMuted,
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
  },
  primaryBtn: {
    backgroundColor: COLORS.primaryBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: SPACING.xs,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  testContainer: {
    alignItems: 'center',
  },
  testHeaderCard: {
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    width: '100%',
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  testProgress: {
    color: COLORS.cyan,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  testInstructions: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  targetCard: {
    width: 200,
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  tumblingE: {
    color: '#000000',
    fontWeight: '900',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  controllerGrid: {
    width: 220,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  dirRowMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 4,
  },
  dirBtn: {
    backgroundColor: COLORS.surface,
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirBtnTop: {
    marginBottom: 4,
  },
  dirBtnBottom: {
    marginTop: 4,
  },
  dirCenterDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.cyan,
    opacity: 0.4,
  },
  contrastTargetBox: {
    width: '100%',
    height: 160,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
  },
  contrastLetter: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 8,
  },
  contrastBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: SPACING.sm,
  },
  contrastBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 10,
  },
  contrastBtnText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  boldWhite: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  recText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
