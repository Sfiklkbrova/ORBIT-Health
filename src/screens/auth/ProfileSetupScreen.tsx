// ============================================================================
// ORBIT HEALTH — ASTRONAUT PROFILE SETUP SCREEN
// Flight Dossier Configuration (ID, Mission Assignment, Avatar, Language)
// Enforces non-collection of sensitive medical information at basic registration
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SpaceBackground } from '../../components/SpaceBackground';
import { COLORS, SPACING } from '../../theme/colors';
import { authService, AuthenticatedUser } from '../../services/authService';
import { changeAppLanguage, AppLanguage } from '../../i18n';

interface ProfileSetupScreenProps {
  user: AuthenticatedUser;
  onSetupComplete: () => void;
}

const AVATAR_OPTIONS = [
  { id: 'commander', icon: 'account-tie', label: 'Commander' },
  { id: 'surgeon', icon: 'doctor', label: 'Surgeon' },
  { id: 'eva', icon: 'space-station', label: 'EVA Lead' },
  { id: 'pilot', icon: 'rocket-launch', label: 'Pilot' },
];

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  user,
  onSetupComplete,
}) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState(user.fullName || '');
  const [astronautId, setAstronautId] = useState(user.astronautId || 'ASTRO-7704');
  const [missionName, setMissionName] = useState(user.missionName || 'Artemis Gateway Alpha');
  const [missionStartDate, setMissionStartDate] = useState(user.missionStartDate || '2026-06-25');
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarId || 'commander');
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(user.preferredLanguage || 'en');
  const [isLoading, setIsLoading] = useState(false);

  const handleLangChange = async (lang: AppLanguage) => {
    setSelectedLang(lang);
    await changeAppLanguage(lang);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await authService.updateProfile({
        fullName: fullName.trim() || user.fullName,
        astronautId: astronautId.trim() || undefined,
        missionName: missionName.trim() || undefined,
        missionStartDate: missionStartDate.trim() || undefined,
        avatarId: selectedAvatar,
        preferredLanguage: selectedLang,
      });
      onSetupComplete();
    } catch (err) {
      console.warn('Profile save notice:', err);
      onSetupComplete();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onSetupComplete();
  };

  return (
    <SpaceBackground>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>STEP 2 OF 2 • FLIGHT DOSSIER SETUP</Text>
            </View>
            <Text style={styles.title}>{t('auth.profileSetupTitle', 'ASTRONAUT PROFILE SETUP')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.profileSetupSub', 'Configure mission identity and telemetry parameters.')}
            </Text>
          </View>

          {/* Configuration Card */}
          <View style={styles.formCard}>
            {/* User Identity Pill */}
            <View style={styles.userBanner}>
              <MaterialCommunityIcons name="account-check" size={24} color={COLORS.cyan} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{fullName || user.fullName}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>

            {/* Avatar Selector (Optional) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {t('auth.profileSetup.avatarLabel', 'Select Astronaut Avatar (Optional)')}
              </Text>
              <View style={styles.avatarGrid}>
                {AVATAR_OPTIONS.map((item) => {
                  const isSelected = selectedAvatar === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.avatarChip, isSelected && styles.avatarChipSelected]}
                      onPress={() => setSelectedAvatar(item.id)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={24}
                        color={isSelected ? COLORS.cyan : COLORS.textSecondary}
                      />
                      <Text
                        style={[styles.avatarChipText, isSelected && styles.avatarChipTextSelected]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Preferred Language Selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {t('welcome.selectLanguage', 'Preferred Interface Language')}
              </Text>
              <View style={styles.langRow}>
                <TouchableOpacity
                  style={[styles.langChip, selectedLang === 'az' && styles.langChipActive]}
                  onPress={() => handleLangChange('az')}
                >
                  <Text style={styles.langFlag}>🇦🇿</Text>
                  <Text style={[styles.langText, selectedLang === 'az' && styles.langTextActive]}>
                    Azərbaycanca
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.langChip, selectedLang === 'tr' && styles.langChipActive]}
                  onPress={() => handleLangChange('tr')}
                >
                  <Text style={styles.langFlag}>🇹🇷</Text>
                  <Text style={[styles.langText, selectedLang === 'tr' && styles.langTextActive]}>
                    Türkçe
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.langChip, selectedLang === 'en' && styles.langChipActive]}
                  onPress={() => handleLangChange('en')}
                >
                  <Text style={styles.langFlag}>🇬🇧</Text>
                  <Text style={[styles.langText, selectedLang === 'en' && styles.langTextActive]}>
                    English
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Full Name Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('auth.fullNameLabel', 'Full Name & Rank')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-edit-outline" size={20} color={COLORS.cyan} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.fullNamePlaceholder', 'Dr. Alex Vance, Commander')}
                  placeholderTextColor={COLORS.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Astronaut ID (Optional) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {t('auth.astronautIdLabel', 'Astronaut ID (Optional)')}
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="card-account-details-outline" size={20} color={COLORS.cyan} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.astronautIdPlaceholder', 'ASTRO-7704')}
                  placeholderTextColor={COLORS.textMuted}
                  value={astronautId}
                  onChangeText={setAstronautId}
                />
              </View>
            </View>

            {/* Mission Assignment (Optional) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {t('auth.missionNameLabel', 'Mission Assignment (Optional)')}
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="rocket-outline" size={20} color={COLORS.cyan} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.missionNamePlaceholder', 'Artemis Gateway Alpha')}
                  placeholderTextColor={COLORS.textMuted}
                  value={missionName}
                  onChangeText={setMissionName}
                />
              </View>
            </View>

            {/* Mission Start Date (Optional) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {t('auth.missionStartDateLabel', 'Mission Launch Date (Optional)')}
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="calendar-clock-outline" size={20} color={COLORS.cyan} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD (e.g. 2026-06-25)"
                  placeholderTextColor={COLORS.textMuted}
                  value={missionStartDate}
                  onChangeText={setMissionStartDate}
                />
              </View>
            </View>

            {/* Medical Data Separation Notice */}
            <View style={styles.consentNotice}>
              <MaterialCommunityIcons name="shield-lock-outline" size={16} color={COLORS.cyan} />
              <Text style={styles.consentNoticeText}>
                {t(
                  'auth.profileSetup.medicalNotice',
                  'Medical Telemetry Consent: Detailed biometrics, electrocardiograms, and health logs are configured separately under crew medical protocols.'
                )}
              </Text>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
              onPress={handleSaveProfile}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <>
                  <MaterialCommunityIcons name="rocket-launch" size={20} color={COLORS.background} />
                  <Text style={styles.saveBtnText}>
                    {t('auth.completeSetup', 'Complete Profile & Launch Mission')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Secondary Action: Skip for Now */}
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.8}>
              <Text style={styles.skipBtnText}>{t('auth.skipSetup', 'Skip Setup for Now')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SpaceBackground>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  stepText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  userBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.6,
  },
  avatarGrid: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  avatarChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceCardSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 10,
    gap: 4,
  },
  avatarChipSelected: {
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  avatarChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  avatarChipTextSelected: {
    color: COLORS.cyan,
    fontWeight: '800',
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceCardSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  langChipActive: {
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  langFlag: {
    fontSize: 13,
  },
  langText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  langTextActive: {
    color: COLORS.cyan,
    fontWeight: '800',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceCardSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  consentNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0, 242, 254, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
    borderRadius: 10,
    padding: SPACING.md,
  },
  consentNoticeText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.cyan,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: COLORS.background,
    letterSpacing: 0.8,
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  skipBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
});
