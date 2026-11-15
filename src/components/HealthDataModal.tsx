import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme/colors';
import {
  HealthRecord,
  SleepQuality,
  StressLevel,
  MoodWellbeing,
  SpaceExerciseType,
} from '../types/astronaut';
import { insertHealthRecord } from '../services/db';
import { triggerHealthAlert } from '../services/notificationService';

interface HealthDataModalProps {
  visible: boolean;
  onClose: () => void;
  onRecordSaved: (record: HealthRecord) => void;
}

const SLEEP_QUALITIES: SleepQuality[] = ['Optimal', 'Restless', 'Disrupted', 'Poor'];
const STRESS_LEVELS: StressLevel[] = ['Low', 'Moderate', 'Elevated', 'High'];
const MOOD_OPTIONS: MoodWellbeing[] = ['Focused', 'Stable', 'Motivated', 'Fatigued', 'Strained'];
const EXERCISE_TYPES: SpaceExerciseType[] = [
  'ARED Resistive Exercise',
  'CEVIS Cycle Ergometer',
  'T2 Space Treadmill',
  'EVA Spacewalk Activity',
  'None / Rest Day',
];

export const HealthDataModal: React.FC<HealthDataModalProps> = ({
  visible,
  onClose,
  onRecordSaved,
}) => {
  const { t } = useTranslation();
  // Form State with sensible astronaut defaults
  const [heartRate, setHeartRate] = useState('72');
  const [bloodOxygen, setBloodOxygen] = useState('98');
  const [bpSys, setBpSys] = useState('120');
  const [bpDia, setBpDia] = useState('80');
  const [bodyTemp, setBodyTemp] = useState('36.6');
  const [sleepHours, setSleepHours] = useState('7.5');
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>('Optimal');
  const [sleepInterruptions, setSleepInterruptions] = useState('1');
  const [fatigueLevel, setFatigueLevel] = useState<number>(3);
  const [stressLevel, setStressLevel] = useState<StressLevel>('Low');
  const [mood, setMood] = useState<MoodWellbeing>('Focused');
  const [exerciseType, setExerciseType] = useState<SpaceExerciseType>('ARED Resistive Exercise');
  const [exerciseMinutes, setExerciseMinutes] = useState('90');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // 1. Validation
    const hr = parseFloat(heartRate);
    const spo2 = parseFloat(bloodOxygen);
    const sys = parseFloat(bpSys);
    const dia = parseFloat(bpDia);
    const temp = parseFloat(bodyTemp);
    const sleep = parseFloat(sleepHours);
    const interruptions = parseInt(sleepInterruptions, 10);
    const exerciseDur = parseInt(exerciseMinutes, 10);

    if (isNaN(hr) || hr < 40 || hr > 220) {
      Alert.alert('Validation Error', 'Please enter a valid Heart Rate between 40 and 220 BPM.');
      return;
    }
    if (isNaN(spo2) || spo2 < 70 || spo2 > 100) {
      Alert.alert('Validation Error', 'Please enter Blood Oxygen (SpO2) between 70% and 100%.');
      return;
    }
    if (isNaN(sys) || isNaN(dia) || sys < 70 || sys > 240 || dia < 40 || dia > 150) {
      Alert.alert('Validation Error', 'Please enter valid Systolic and Diastolic Blood Pressure values.');
      return;
    }
    if (isNaN(temp) || temp < 34.0 || temp > 43.0) {
      Alert.alert('Validation Error', 'Please enter a valid Body Temperature between 34.0°C and 43.0°C.');
      return;
    }
    if (isNaN(sleep) || sleep < 0 || sleep > 24) {
      Alert.alert('Validation Error', 'Please enter valid Sleep Duration between 0 and 24 hours.');
      return;
    }

    setIsSubmitting(true);

    const record: HealthRecord = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      heartRate: hr,
      bloodOxygen: spo2,
      bloodPressureSys: sys,
      bloodPressureDia: dia,
      bodyTemperature: temp,
      sleepDurationHours: sleep,
      sleepQuality,
      sleepInterruptions: isNaN(interruptions) ? 0 : interruptions,
      fatigueLevel,
      stressLevel,
      moodWellbeing: mood,
      exercise: {
        type: exerciseType,
        durationMinutes: isNaN(exerciseDur) ? 0 : exerciseDur,
        intensity: exerciseDur >= 50 ? 'High' : 'Moderate',
      },
      isManual: true, // Clearly marked as manual log, not live automated sensor stream
      syncStatus: 'pending', // Queued for Supabase synchronization
      notes: notes.trim(),
    };

    try {
      // Save directly to SQLite
      await insertHealthRecord(record);

      // Check for automatic space alerts
      if (spo2 < 95) {
        await triggerHealthAlert(
          'Low Blood Oxygen Recorded',
          'VITAL',
          'WARNING',
          `Manual log reported SpO2 at ${spo2}%. This is below the nominal spaceflight threshold (>95%).`,
          'SpO2 < 95% threshold reached.',
          'Verify cabin oxygen partial pressure and re-test with pulse oximeter.'
        );
      }
      if (hr > 100) {
        await triggerHealthAlert(
          'Elevated Resting Heart Rate',
          'VITAL',
          'WARNING',
          `Heart rate entered at ${hr} BPM exceeds resting threshold.`,
          'HR > 100 BPM logged.',
          'Rest in crew berth and ensure adequate fluid replenishment.'
        );
      }
      if (fatigueLevel >= 8) {
        await triggerHealthAlert(
          'High Crew Fatigue Warning',
          'FATIGUE',
          'WARNING',
          `Astronaut fatigue level rated at ${fatigueLevel}/10. High risk for cognitive fatigue in orbital operations.`,
          'Fatigue score >= 8/10.',
          'Postpone non-critical operations and request schedule sleep extension.'
        );
      }

      onRecordSaved(record);
      Alert.alert('Log Stored', 'Astronaut biometric record saved to local SQLite and queued for downlink sync.');
      onClose();
    } catch (err) {
      Alert.alert('Storage Error', 'Could not save record to SQLite database.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Top Bar */}
          <View style={styles.dragHandle} />
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <View style={styles.badgeIcon}>
                <MaterialCommunityIcons name="clipboard-pulse-outline" size={20} color={COLORS.cyan} />
              </View>
              <View>
                <Text style={styles.titleText}>{t('modals.logTitle')}</Text>
                <Text style={styles.subtitleText}>{t('modals.logSub')}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Manual Tag Notice */}
            <View style={styles.manualNoticeBox}>
              <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.cyan} />
              <Text style={styles.manualNoticeText}>
                {t('modals.manualNotice')}
              </Text>
            </View>

            {/* Vital Signs Grid */}
            <Text style={styles.sectionHeader}>{t('modals.primaryVitals')}</Text>
            <View style={styles.inputGrid}>
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>{t('modals.heartRateLabel')}</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={heartRate}
                  onChangeText={setHeartRate}
                  placeholder="e.g. 72"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>{t('modals.bloodOxygenLabel')}</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={bloodOxygen}
                  onChangeText={setBloodOxygen}
                  placeholder="e.g. 98"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGrid}>
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>{t('modals.bpSysLabel')}</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={bpSys}
                  onChangeText={setBpSys}
                  placeholder="120"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>{t('modals.bpDiaLabel')}</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={bpDia}
                  onChangeText={setBpDia}
                  placeholder="80"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGrid}>
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>{t('modals.bodyTempLabel')}</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={bodyTemp}
                  onChangeText={setBodyTemp}
                  placeholder="36.6"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>{t('modals.sleepHoursLabel')}</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={sleepHours}
                  onChangeText={setSleepHours}
                  placeholder="8.0"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            {/* Sleep Quality Selector */}
            <Text style={styles.sectionHeader}>{t('modals.sleepQualityLabel')}</Text>
            <View style={styles.pillRow}>
              {SLEEP_QUALITIES.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.pill, sleepQuality === q && styles.pillActive]}
                  onPress={() => setSleepQuality(q)}
                >
                  <Text style={[styles.pillText, sleepQuality === q && styles.pillTextActive]}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sleep Interruptions */}
            <View style={styles.singleRowInput}>
              <Text style={styles.inputLabel}>Night Interruptions (Awakenings count):</Text>
              <TextInput
                style={[styles.textInput, { width: 80, textAlign: 'center' }]}
                keyboardType="numeric"
                value={sleepInterruptions}
                onChangeText={setSleepInterruptions}
                placeholder="1"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Fatigue Level (1-10) */}
            <Text style={styles.sectionHeader}>{t('modals.fatigueScoreLabel')}</Text>
            <View style={styles.fatigueRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = fatigueLevel === num;
                const isHigh = num >= 7;
                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.fatigueBox,
                      isSelected && (isHigh ? styles.fatigueBoxWarning : styles.fatigueBoxSelected),
                    ]}
                    onPress={() => setFatigueLevel(num)}
                  >
                    <Text
                      style={[
                        styles.fatigueText,
                        isSelected && styles.fatigueTextSelected,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Stress Level */}
            <Text style={styles.sectionHeader}>{t('modals.stressLevelLabel')}</Text>
            <View style={styles.pillRow}>
              {STRESS_LEVELS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pill, stressLevel === s && styles.pillActive]}
                  onPress={() => setStressLevel(s)}
                >
                  <Text style={[styles.pillText, stressLevel === s && styles.pillTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mood / Wellbeing */}
            <Text style={styles.sectionHeader}>{t('modals.moodLabel')}</Text>
            <View style={styles.pillRow}>
              {MOOD_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.pill, mood === m && styles.pillActive]}
                  onPress={() => setMood(m)}
                >
                  <Text style={[styles.pillText, mood === m && styles.pillTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Space Exercise Physical Countermeasure */}
            <Text style={styles.sectionHeader}>{t('modals.exerciseSection')}</Text>
            <View style={styles.exerciseList}>
              {EXERCISE_TYPES.map((ex) => (
                <TouchableOpacity
                  key={ex}
                  style={[styles.exerciseOption, exerciseType === ex && styles.exerciseOptionSelected]}
                  onPress={() => setExerciseType(ex)}
                >
                  <MaterialCommunityIcons
                    name={
                      ex.includes('ARED')
                        ? 'weight-lifter'
                        : ex.includes('CEVIS')
                        ? 'bike'
                        : ex.includes('Treadmill')
                        ? 'run'
                        : ex.includes('EVA')
                        ? 'bag-personal'
                        : 'sleep'
                    }
                    size={18}
                    color={exerciseType === ex ? COLORS.cyan : COLORS.textMuted}
                  />
                  <Text style={[styles.exerciseText, exerciseType === ex && styles.exerciseTextSelected]}>
                    {ex}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.singleRowInput}>
              <Text style={styles.inputLabel}>{t('modals.exerciseDurationLabel')}</Text>
              <TextInput
                style={[styles.textInput, { width: 80, textAlign: 'center' }]}
                keyboardType="numeric"
                value={exerciseMinutes}
                onChangeText={setExerciseMinutes}
                placeholder="90"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Notes */}
            <Text style={styles.sectionHeader}>{t('modals.clinicalNotes')}</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('modals.notesPlaceholder')}
              placeholderTextColor={COLORS.textMuted}
            />
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? t('common.loading', 'Archiving to SQLite...') : t('modals.saveTelemetry')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surfaceCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    maxHeight: '92%',
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
    marginBottom: SPACING.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cyan,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitleText: {
    fontSize: 11,
    color: COLORS.textCyan,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceCardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    marginBottom: SPACING.md,
  },
  manualNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  manualNoticeText: {
    fontSize: 10,
    color: COLORS.textCyan,
    lineHeight: 15,
    flex: 1,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1.1,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.sm,
  },
  inputBox: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.surfaceCardSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceCardSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  pillActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.18)',
    borderColor: COLORS.cyan,
  },
  pillText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  pillTextActive: {
    color: COLORS.cyan,
    fontWeight: '800',
  },
  singleRowInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  fatigueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  fatigueBox: {
    width: 30,
    height: 34,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceCardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  fatigueBoxSelected: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  fatigueBoxWarning: {
    backgroundColor: COLORS.statusAlert,
    borderColor: COLORS.statusAlert,
  },
  fatigueText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  fatigueTextSelected: {
    color: COLORS.background,
  },
  exerciseList: {
    gap: 6,
    marginBottom: SPACING.xs,
  },
  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceCardSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  exerciseOptionSelected: {
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
  },
  exerciseText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  exerciseTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  notesInput: {
    backgroundColor: COLORS.surfaceCardSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 10,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.cyan,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.background,
    letterSpacing: 0.5,
  },
});

