// ============================================================================
// ORBIT HEALTH — ASTRONAUT REGISTRATION SCREEN
// Sovereign Crew Enrollment with Strict Validation, Terms Acceptance, & Supabase
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

interface RegisterScreenProps {
  onRegisterSuccess: (user: AuthenticatedUser, needsVerification: boolean) => void;
  onNavigateToLogin: () => void;
  onNavigateBack: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
  onNavigateBack,
}) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password strength evaluation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: COLORS.textMuted };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score, label: 'Weak', color: '#EF4444' };
    if (score <= 3) return { score, label: 'Good', color: '#F59E0B' };
    return { score, label: 'Strong (Flight Certified)', color: '#10B981' };
  };

  const strength = getPasswordStrength(password);

  const handleRegister = async () => {
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage(t('auth.validation.nameRequired', 'Full name is required.'));
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage(t('auth.validation.invalidEmail', 'Please enter a valid email address.'));
      return;
    }

    if (password.length < 8) {
      setErrorMessage(t('auth.validation.shortPassword', 'Password must be at least 8 characters long.'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('auth.validation.passwordMismatch', 'Passwords do not match.'));
      return;
    }

    if (!hasAgreedTerms) {
      setErrorMessage(t('auth.validation.termsRequired', 'You must accept the terms and privacy policy to continue.'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.signUp(cleanEmail, password, fullName.trim());
      if (res.success && res.user) {
        onRegisterSuccess(res.user, !!res.needsVerification);
      } else {
        setErrorMessage(res.error || t('auth.validation.registerFailed', 'Registration failed. Check details.'));
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('auth.validation.registerFailed', 'Registration failed. Check details.'));
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
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={onNavigateBack} style={styles.backBtn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.cyan} />
            </TouchableOpacity>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.screenTitle}>{t('auth.registerTitle', 'CREW REGISTRATION')}</Text>
              <Text style={styles.screenSub}>
                {t('auth.registerSub', 'Create your secure astronaut medical profile.')}
              </Text>
            </View>
          </View>

          {/* Registration Form Card */}
          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={COLORS.statusAlert} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('auth.fullNameLabel', 'Full Name & Rank')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="badge-account-outline" size={20} color={COLORS.cyan} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.fullNamePlaceholder', 'Dr. Alex Vance, Commander')}
                  placeholderTextColor={COLORS.textMuted}
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Email Address */}
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

            {/* Password */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>{t('auth.passwordLabel', 'Password')}</Text>
                {password.length > 0 && (
                  <Text style={[styles.strengthBadge, { color: strength.color }]}>
                    {strength.label}
                  </Text>
                )}
              </View>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.cyan} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.passwordPlaceholder', 'Minimum 8 characters')}
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
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

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('auth.confirmPasswordLabel', 'Confirm Password')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color={COLORS.cyan} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.passwordPlaceholder', 'Repeat password')}
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

            {/* Terms of Service & Privacy Policy Consent Checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setHasAgreedTerms(!hasAgreedTerms)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={hasAgreedTerms ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color={hasAgreedTerms ? COLORS.cyan : COLORS.textSecondary}
              />
              <Text style={styles.termsText}>
                {t('auth.acceptTerms', 'I agree to the Crew Medical Privacy Policy & Spaceflight Terms of Service.')}
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <>
                  <MaterialCommunityIcons name="account-plus" size={20} color={COLORS.background} />
                  <Text style={styles.submitBtnText}>
                    {t('auth.submitRegister', 'Register Astronaut Account')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Switch to Login Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              {t('auth.hasAccountLink', 'Already have an account? Log In.')}
            </Text>
            <TouchableOpacity onPress={onNavigateToLogin} style={styles.footerLinkTouch}>
              <Text style={styles.footerLinkText}>{t('welcome.loginBtn', 'Log In')}</Text>
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.6,
  },
  strengthBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
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
