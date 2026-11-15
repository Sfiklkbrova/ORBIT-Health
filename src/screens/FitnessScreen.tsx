import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme/colors';
import { MainNavTab, SpaceExerciseType } from '../types/astronaut';
import {
  getExerciseSessions,
  logNewExerciseSession,
  calculateFitnessAndRecovery,
  ExerciseSessionLog,
} from '../services/fitnessService';

interface FitnessScreenProps {
  onNavigateTab?: (tab: MainNavTab) => void;
}

export const FitnessScreen: React.FC<FitnessScreenProps> = ({ onNavigateTab }) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ExerciseSessionLog[]>(getExerciseSessions());
  const [analysis, setAnalysis] = useState(calculateFitnessAndRecovery());
  const [isLogModalVisible, setIsLogModalVisible] = useState(false);

  // New Session Form State
  const [selectedType, setSelectedType] = useState<SpaceExerciseType>('ARED Resistive Exercise');
  const [durationStr, setDurationStr] = useState('60');
  const [intensity, setIntensity] = useState<'Low' | 'Moderate' | 'High'>('High');
  const [preFatigue, setPreFatigue] = useState('3');
  const [postFatigue, setPostFatigue] = useState('5');
  const [sessionNotes, setSessionNotes] = useState('');

  const exerciseTypes: SpaceExerciseType[] = [
    'ARED Resistive Exercise',
    'CEVIS Cycle Ergometer',
    'T2 Space Treadmill',
    'EVA Spacewalk Activity',
  ];

  const handleSaveSession = () => {
    const duration = parseInt(durationStr, 10) || 60;
    const pre = parseInt(preFatigue, 10) || 3;
    const post = parseInt(postFatigue, 10) || 5;

    logNewExerciseSession({
      timestamp: new Date().toISOString(),
      type: selectedType,
      durationMinutes: duration,
      intensity,
      preWorkoutFatigue: pre,
      postWorkoutFatigue: post,
      recoveryDurationHours: 1.5,
      notes: sessionNotes || 'Nominal microgravity conditioning session completed.',
    });

    setSessions(getExerciseSessions());
    setAnalysis(calculateFitnessAndRecovery());
    setIsLogModalVisible(false);
    setSessionNotes('');
    Alert.alert(t('common.success'), t('fitness.sessionLogged'));
  };

  const getDeviceIcon = (type: SpaceExerciseType): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (type) {
      case 'ARED Resistive Exercise':
        return 'arm-flex';
      case 'CEVIS Cycle Ergometer':
        return 'bike';
      case 'T2 Space Treadmill':
        return 'run-fast';
      case 'EVA Spacewalk Activity':
        return 'space-station';
      default:
        return 'dumbbell';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="weight-lifter" size={24} color={COLORS.cyan} />
          </View>
          <View>
            <Text style={styles.title}>{t('fitness.title')}</Text>
            <Text style={styles.subtitle}>{t('fitness.subtitle')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logButton}
          onPress={() => setIsLogModalVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={16} color={COLORS.background} />
          <Text style={styles.logButtonText}>Log Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Compliance & Recovery Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <View>
            <Text style={styles.overviewLabel}>WEEKLY COUNTERMEASURE TARGET</Text>
            <Text style={styles.overviewMinutes}>
              {analysis.weeklyExerciseMinutes} / {analysis.prescribedWeeklyTargetMinutes} min
            </Text>
          </View>
          <View style={styles.adherenceBadge}>
            <Text style={styles.adherencePercent}>{analysis.adherencePercentage}%</Text>
            <Text style={styles.adherenceSub}>COMPLIANCE</Text>
          </View>
        </View>

        {/* Progress track */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.min(100, analysis.adherencePercentage)}%` },
            ]}
          />
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Ratio</Text>
            <Text style={styles.metaVal}>{analysis.cardioToResistanceRatio}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Fatigue Delta</Text>
            <Text style={styles.metaVal}>+{analysis.averageFatigueDelta} pts</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Recovery Rate</Text>
            <Text style={[styles.metaVal, { color: COLORS.statusNormal }]}>{analysis.recoveryRateStatus}</Text>
          </View>
        </View>
      </View>

      {/* AI Exercise Correlation Card */}
      <View style={styles.aiInsightCard}>
        <View style={styles.aiInsightHeader}>
          <MaterialCommunityIcons name="brain" size={16} color={COLORS.cyan} />
          <Text style={styles.aiInsightTitle}>AI PHYSIOLOGICAL CORRELATION</Text>
        </View>
        <Text style={styles.aiInsightText}>{analysis.aiCorrelationSummary}</Text>
        <Text style={styles.aiInsightSub}>
          *High ARED compliance counters bone demineralization and preserves axial skeletal strength during Lunar Orbit.
        </Text>
      </View>

      {/* Session History */}
      <Text style={styles.sectionHeader}>LOGGED COUNTERMEASURE SESSIONS (LAST 7 DAYS)</Text>

      <View style={styles.sessionsList}>
        {sessions.map((s) => (
          <View key={s.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionTitleGroup}>
                <View style={styles.deviceIconCircle}>
                  <MaterialCommunityIcons name={getDeviceIcon(s.type)} size={18} color={COLORS.cyan} />
                </View>
                <View>
                  <Text style={styles.sessionType}>{s.type}</Text>
                  <Text style={styles.sessionTime}>
                    {new Date(s.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {s.durationMinutes} min
                  </Text>
                </View>
              </View>
              <View style={styles.intensityBadge}>
                <Text style={styles.intensityText}>{s.intensity}</Text>
              </View>
            </View>

            <View style={styles.fatigueRow}>
              <Text style={styles.fatigueLabel}>Fatigue Shift:</Text>
              <Text style={styles.fatigueVal}>Pre {s.preWorkoutFatigue}/10  ➔  Post {s.postWorkoutFatigue}/10</Text>
              <Text style={styles.recoveryTimeText}>Recovery: ~{s.recoveryDurationHours} hrs</Text>
            </View>

            {s.notes ? <Text style={styles.notesText}>{`"${s.notes}"`}</Text> : null}
          </View>
        ))}
      </View>

      {/* Log Exercise Modal */}
      <Modal visible={isLogModalVisible} transparent animationType="fade" onRequestClose={() => setIsLogModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('fitness.exerciseTracker')}</Text>
              <TouchableOpacity onPress={() => setIsLogModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Device selector */}
            <Text style={styles.inputLabel}>{t('fitness.exerciseType')}:</Text>
            <View style={styles.typeOptions}>
              {exerciseTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, selectedType === type && styles.typeOptionActive]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={[styles.typeOptionText, selectedType === type && styles.typeOptionTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Duration Input */}
            <Text style={styles.inputLabel}>{t('fitness.duration')}:</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              value={durationStr}
              onChangeText={setDurationStr}
              placeholder="60"
              placeholderTextColor={COLORS.textMuted}
            />

            {/* Intensity */}
            <Text style={styles.inputLabel}>{t('fitness.intensity')}:</Text>
            <View style={styles.intensityOptions}>
              {(['Low', 'Moderate', 'High'] as const).map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.intBtn, intensity === lvl && styles.intBtnActive]}
                  onPress={() => setIntensity(lvl)}
                >
                  <Text style={[styles.intBtnText, intensity === lvl && styles.intBtnTextActive]}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pre & Post Fatigue */}
            <View style={styles.fatigueInputRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>{t('fitness.preFatigue')}:</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="number-pad"
                  value={preFatigue}
                  onChangeText={setPreFatigue}
                  placeholder="3"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>{t('fitness.postFatigue')}:</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="number-pad"
                  value={postFatigue}
                  onChangeText={setPostFatigue}
                  placeholder="5"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            {/* Notes */}
            <Text style={styles.inputLabel}>Session Observations & Biomechanics:</Text>
            <TextInput
              style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
              value={sessionNotes}
              onChangeText={setSessionNotes}
              placeholder="e.g. Squat loading 180 kg, heart rate recovery normal..."
              placeholderTextColor={COLORS.textMuted}
              multiline
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSession}>
              <Text style={styles.saveBtnText}>{t('fitness.logSession')}</Text>
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
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cyan,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  logButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.background,
  },
  overviewCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  overviewMinutes: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 2,
  },
  adherenceBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  adherencePercent: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.statusNormal,
  },
  adherenceSub: {
    fontSize: 7,
    fontWeight: '800',
    color: COLORS.statusNormal,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.statusNormal,
    borderRadius: 2,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  aiInsightCard: {
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiInsightTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  aiInsightText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  aiInsightSub: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  sessionsList: {
    gap: SPACING.sm,
  },
  sessionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sessionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deviceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionType: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  sessionTime: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  intensityBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  intensityText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.statusWarning,
  },
  fatigueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 6,
    borderRadius: 6,
    marginVertical: 4,
  },
  fatigueLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  fatigueVal: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  recoveryTimeText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginLeft: 'auto',
  },
  notesText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.cyan,
    marginBottom: 4,
    marginTop: 6,
  },
  typeOptions: {
    gap: 4,
  },
  typeOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeOptionActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderColor: COLORS.cyan,
  },
  typeOptionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  typeOptionTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 8,
    padding: 8,
    color: COLORS.white,
    fontSize: 12,
  },
  intensityOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  intBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  intBtnActive: {
    backgroundColor: COLORS.primaryBlue,
  },
  intBtnText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  intBtnTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  fatigueInputRow: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: COLORS.cyan,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.background,
  },
});
