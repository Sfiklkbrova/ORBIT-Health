// ============================================================================
// ORBIT HEALTH — ASTRONAUT LOGIN SCREEN
// Secure Flight Terminal Authentication with Supabase & Sovereign Session Persistence
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SpaceBackground } from '../../components/SpaceBackground';
import { COLORS, SPACING } from '../../theme/colors';
import { authService } from '../../services/authService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onNavigateBack: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onNavigateBack,
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage(t('auth.validation.invalidEmail', 'Please enter a valid email address.'));
      return;
    }

    if (!password) {
      setErrorMessage(t('auth.validation.shortPassword', 'Please enter your flight password.'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.signIn(cleanEmail, password, rememberMe);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(res.error || t('auth.validation.loginFailed', 'Authentication failed. Check credentials.'));
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('auth.validation.loginFailed', 'Authentication failed. Check credentials.'));
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
              <Text style={styles.screenTitle}>{t('auth.loginTitle', 'ASTRONAUT LOGIN')}</Text>
              <Text style={styles.screenSub}>
                {t('auth.loginSub', 'Enter flight credentials to unlock bio-telemetry terminal.')}
              </Text>
            </View>
          </View>

          {/* Login Form Card */}
          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={COLORS.statusAlert} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email Field */}
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

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('auth.passwordLabel', 'Password')}</Text>
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

            {/* Options Row: Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <View style={styles.rememberRow}>
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  thumbColor={rememberMe ? COLORS.cyan : COLORS.textMuted}
                  trackColor={{ false: '#1E293B', true: 'rgba(0, 242, 254, 0.3)' }}
                />
                <Text style={styles.rememberText}>
                  {t('auth.rememberMe', 'Remember me')}
                </Text>
              </View>

              <TouchableOpacity onPress={onNavigateToForgotPassword}>
                <Text style={styles.forgotText}>
                  {t('auth.forgotPasswordLink', 'Forgot password?')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <>
                  <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.background} />
                  <Text style={styles.submitBtnText}>
                    {t('auth.submitLogin', 'Authenticate & Enter Dashboard')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Switch to Register Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              {t('auth.noAccountLink', "Don't have an account? Create one.")}
            </Text>
            <TouchableOpacity onPress={onNavigateToRegister} style={styles.footerLinkTouch}>
              <Text style={styles.footerLinkText}>{t('welcome.createAccountBtn', 'Create Account')}</Text>
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  forgotText: {
    fontSize: 11,
    color: COLORS.cyan,
    fontWeight: '700',
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
