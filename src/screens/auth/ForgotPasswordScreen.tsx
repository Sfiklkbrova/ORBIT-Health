// ============================================================================
// ORBIT HEALTH — ASTRONAUT PASSWORD RECOVERY SCREEN
// Complete Multi-Step Password Recovery with Supabase & Flight Security Verification
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
import { authService } from '../../services/authService';

interface ForgotPasswordScreenProps {
  onNavigateBack: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onNavigateBack,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [hasCodeMode, setHasCodeMode] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Request Reset Link
  const handleResetRequest = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage(t('auth.validation.invalidEmail', 'Please enter a valid email address.'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword(cleanEmail);
      if (res.success) {
        setSuccessMessage(res.message);
        setHasCodeMode(true);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to send recovery request. Check communications link.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Set New Password with code
  const handleUpdatePassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetCode.trim()) {
      setErrorMessage('Please enter the verification code or token received in your email.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(t('auth.validation.shortPassword', 'Password must be at least 8 characters long.'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t('auth.validation.passwordMismatch', 'Passwords do not match.'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.updatePassword(newPassword, resetCode.trim(), email.trim());
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onNavigateBack();
        }, 1500);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update password. Check your verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SpaceBackground>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={onNavigateBack} style={styles.backBtn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.cyan} />
            </TouchableOpacity>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.screenTitle}>
                {hasCodeMode
                  ? t('auth.passwordRecovery.step2Title', 'CREATE NEW PASSWORD')
                  : t('auth.passwordRecovery.step1Title', 'PASSWORD RECOVERY')}
              </Text>
              <Text style={styles.screenSub}>
                {hasCodeMode
                  ? 'Enter the verification token and choose your new flight password.'
                  : t('auth.forgotSub', 'Dispatches secure reset link to your flight comms address.')}
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {successMessage ? (
              <View style={styles.successBox}>
                <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.statusNormal} />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {errorMessage ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={COLORS.statusAlert} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email Field (Always needed) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('auth.emailLabel', 'Flight Email Address')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.cyan} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.emailPlaceholder', 'astronaut@nasa.gov')}
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* If in Code / Password Entry Mode */}
            {hasCodeMode && (
              <>
                {/* Reset Code / Token */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    {t('auth.passwordRecovery.codeLabel', 'Verification Code / Reset Token')}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="key-variant" size={20} color={COLORS.cyan} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('auth.passwordRecovery.codePlaceholder', 'Enter code from email')}
                      placeholderTextColor={COLORS.textMuted}
                      value={resetCode}
                      onChangeText={(val) => {
                        setResetCode(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* New Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    {t('auth.passwordRecovery.newPasswordLabel', 'New Flight Password')}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.cyan} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('auth.passwordRecovery.newPasswordPlaceholder', 'Minimum 8 characters')}
                      placeholderTextColor={COLORS.textMuted}
                      value={newPassword}
                      onChangeText={(val) => {
                        setNewPassword(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialCommunityIcons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm New Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    {t('auth.passwordRecovery.confirmNewPasswordLabel', 'Confirm New Password')}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="lock-check-outline" size={20} color={COLORS.cyan} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('auth.passwordRecovery.confirmNewPasswordPlaceholder', 'Repeat new password')}
                      placeholderTextColor={COLORS.textMuted}
                      value={confirmPassword}
                      onChangeText={(val) => {
                        setConfirmPassword(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Submit New Password */}
                <TouchableOpacity
                  style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                  onPress={handleUpdatePassword}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.background} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.background} />
                      <Text style={styles.submitBtnText}>
                        {t('auth.passwordRecovery.updateBtn', 'Set New Password & Confirm')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Toggle back to request mode */}
                <TouchableOpacity
                  style={styles.modeToggleBtn}
                  onPress={() => setHasCodeMode(false)}
                >
                  <Text style={styles.modeToggleText}>Need to request a new recovery link?</Text>
                </TouchableOpacity>
              </>
            )}

            {/* If in Request Mode */}
            {!hasCodeMode && (
              <>
                <TouchableOpacity
                  style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                  onPress={handleResetRequest}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.background} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="email-fast-outline" size={20} color={COLORS.background} />
                      <Text style={styles.submitBtnText}>
                        {t('auth.sendReset', 'Send Recovery Link')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Option to jump directly to code entry if user already has code */}
                <TouchableOpacity
                  style={styles.modeToggleBtn}
                  onPress={() => setHasCodeMode(true)}
                >
                  <Text style={styles.modeToggleText}>
                    {t('auth.passwordRecovery.hasCodeToggle', 'Already have a reset code? Enter it here.')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Return to Login */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={onNavigateBack} style={styles.footerLinkTouch}>
              <Text style={styles.footerLinkText}>
                {t('auth.backToLogin', 'Back to Login Screen')}
              </Text>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  headerTitleGroup: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  screenSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  configNoticeCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  configNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  configNoticeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  configNoticeBody: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  formCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 10,
    padding: SPACING.md,
  },
  successText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.statusNormal,
    fontWeight: '700',
    lineHeight: 15,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 10,
    padding: SPACING.md,
  },
  errorText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.statusAlert,
    fontWeight: '700',
    lineHeight: 15,
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
  submitBtn: {
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
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: COLORS.background,
    letterSpacing: 0.8,
  },
  modeToggleBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  modeToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.cyan,
    textDecorationLine: 'underline',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerLinkTouch: {
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.cyan,
    textDecorationLine: 'underline',
  },
});
