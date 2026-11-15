// ============================================================================
// ORBIT HEALTH — ASTRONAUT EMAIL VERIFICATION SCREEN
// Verification Step for Confirming Flight Comms & Activating Telemetry Profile
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

interface EmailVerificationScreenProps {
  user: AuthenticatedUser;
  onVerificationSuccess: () => void;
  onNavigateToLogin: () => void;
  onNavigateBack: () => void;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  user,
  onVerificationSuccess,
  onNavigateToLogin,
  onNavigateBack,
}) => {
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerifyOtp = async () => {
    if (!token.trim()) {
      setErrorMessage('Please enter the verification code sent to your email.');
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const res = await authService.verifyEmailOtp(user.email, token.trim());
      if (res.success) {
        setStatusMessage(res.message);
        setTimeout(() => {
          onVerificationSuccess();
        }, 1200);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      // In Supabase, re-signing up or reset can dispatch verification
      const res = await authService.resetPassword(user.email);
      if (res.success) {
        setStatusMessage(t('auth.emailVerification.resendSuccess', 'New verification link has been dispatched to your email.'));
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend confirmation email.');
    } finally {
      setIsResending(false);
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
              <Text style={styles.screenTitle}>
                {t('auth.emailVerification.title', 'ASTRONAUT EMAIL VERIFICATION')}
              </Text>
              <Text style={styles.screenSub}>
                {t('auth.emailVerification.sub', 'A verification link has been dispatched to your flight communications address.')}
              </Text>
            </View>
          </View>

          {/* Verification Card */}
          <View style={styles.formCard}>
            {/* Center Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconRing}>
                <MaterialCommunityIcons name="email-check-outline" size={36} color={COLORS.cyan} />
              </View>
            </View>

            {/* Email Address Confirmation */}
            <View style={styles.emailPill}>
              <Text style={styles.emailPillLabel}>
                {t('auth.emailVerification.sentTo', 'Confirmation dispatched to:')}
              </Text>
              <Text style={styles.emailPillValue}>{user.email}</Text>
            </View>

            <Text style={styles.instructionsText}>
              {t(
                'auth.emailVerification.instructions',
                'Please click the link in your email to verify your astronaut account, or enter the 6-digit confirmation code below.'
              )}
            </Text>

            {/* Feedback Messages */}
            {statusMessage && (
              <View style={styles.successBox}>
                <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.statusNormal} />
                <Text style={styles.successText}>{statusMessage}</Text>
              </View>
            )}

            {errorMessage && (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle" size={18} color={COLORS.statusAlert} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* OTP Code Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {t('auth.emailVerification.codeLabel', 'Confirmation Code (Optional)')}
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="numeric" size={22} color={COLORS.cyan} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.emailVerification.codePlaceholder', 'e.g. 123456')}
                  placeholderTextColor={COLORS.textMuted}
                  value={token}
                  onChangeText={(val) => {
                    setToken(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Action 1: Verify Code */}
            {token.trim().length > 0 && (
              <TouchableOpacity
                style={[styles.verifyBtn, isLoading && styles.btnDisabled]}
                onPress={handleVerifyOtp}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.background} />
                    <Text style={styles.verifyBtnText}>
                      {t('auth.emailVerification.verifyCodeBtn', 'Verify Code & Proceed')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Action 2: Continue to Profile Setup */}
            <TouchableOpacity
              style={styles.alreadyVerifiedBtn}
              onPress={onVerificationSuccess}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="arrow-right-circle" size={20} color={COLORS.cyan} />
              <Text style={styles.alreadyVerifiedText}>
                {t('auth.emailVerification.alreadyVerifiedBtn', 'I Have Verified / Continue to Setup')}
              </Text>
            </TouchableOpacity>

            {/* Action 3: Resend Email */}
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleResend}
              disabled={isResending}
              activeOpacity={0.8}
            >
              {isResending ? (
                <ActivityIndicator size="small" color={COLORS.textSecondary} />
              ) : (
                <Text style={styles.resendText}>
                  {t('auth.emailVerification.resendBtn', 'Resend Verification Email')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Switch to Login Link */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={onNavigateToLogin} style={styles.footerLinkTouch}>
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
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1.2,
  },
  screenSub: {
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
    gap: SPACING.md,
    alignItems: 'center',
  },
  iconContainer: {
    paddingVertical: SPACING.sm,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailPill: {
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    width: '100%',
  },
  emailPillLabel: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  emailPillValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.cyan,
    marginTop: 2,
  },
  instructionsText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: SPACING.xs,
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
    width: '100%',
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
    width: '100%',
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
    width: '100%',
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
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.cyan,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  verifyBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: COLORS.background,
    letterSpacing: 0.8,
  },
  alreadyVerifiedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    paddingVertical: 13,
    borderRadius: 12,
    width: '100%',
  },
  alreadyVerifiedText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.6,
  },
  resendBtn: {
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
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
