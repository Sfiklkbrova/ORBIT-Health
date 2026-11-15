// ============================================================================
// ORBIT HEALTH — ASTRONAUT WELCOME SCREEN
// Clean, Simple & Professional Aerospace Medical Interface
// Deep navy space background with subtle stars, soft cyan glow & high-contrast UI
// Fully localized (AZ, TR, EN), responsive for Mobile & Web
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SpaceBackground } from '../../components/SpaceBackground';
import { COLORS, SPACING } from '../../theme/colors';
import { changeAppLanguage, getCurrentLanguage, AppLanguage } from '../../i18n';

interface WelcomeScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
}) => {
  const { t } = useTranslation();

  const [currentLang, setCurrentLang] = useState<AppLanguage>(getCurrentLanguage());
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Smooth entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideLogoAnim = useRef(new Animated.Value(-16)).current;
  const slideCardAnim = useRef(new Animated.Value(20)).current;
  const pulseGlow = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // 1. Entrance orchestration
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideLogoAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideCardAnim, {
        toValue: 0,
        duration: 850,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Subtle ambient pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseGlow, {
          toValue: 0.95,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseGlow, {
          toValue: 0.55,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [fadeAnim, slideLogoAnim, slideCardAnim, pulseGlow]);

  const handleLanguageSelect = async (lang: AppLanguage) => {
    await changeAppLanguage(lang);
    setCurrentLang(lang);
  };

  return (
    <SpaceBackground>
      <View style={styles.container}>
        {/* Top Bar: Mission Status (Left) & Language Selector (Right) */}
        <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
          <View style={styles.topBarContent}>
            {/* Status Pill */}
            <View style={[styles.statusPill, styles.statusPillOnline]}>
              <View style={[styles.statusDot, styles.statusDotOnline]} />
              <Text style={styles.statusPillText}>ORBIT BIO-LINK ACTIVE</Text>
            </View>

            {/* Language Switcher */}
            <View style={styles.langBar}>
              <TouchableOpacity
                style={[styles.langChip, currentLang === 'az' && styles.langChipActive]}
                onPress={() => handleLanguageSelect('az')}
                activeOpacity={0.8}
              >
                <Text style={styles.langFlag}>🇦🇿</Text>
                <Text style={[styles.langText, currentLang === 'az' && styles.langTextActive]}>
                  AZ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.langChip, currentLang === 'tr' && styles.langChipActive]}
                onPress={() => handleLanguageSelect('tr')}
                activeOpacity={0.8}
              >
                <Text style={styles.langFlag}>🇹🇷</Text>
                <Text style={[styles.langText, currentLang === 'tr' && styles.langTextActive]}>
                  TR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.langChip, currentLang === 'en' && styles.langChipActive]}
                onPress={() => handleLanguageSelect('en')}
                activeOpacity={0.8}
              >
                <Text style={styles.langFlag}>🇬🇧</Text>
                <Text style={[styles.langText, currentLang === 'en' && styles.langTextActive]}>
                  EN
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Center Stage: Professional Aerospace Console Card */}
        <View style={styles.centerStage}>
          <Animated.View
            style={[
              styles.consoleCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideCardAnim }],
              },
            ]}
          >
            {/* Orbit Emblem Ring */}
            <Animated.View
              style={[
                styles.emblemRing,
                {
                  transform: [{ translateY: slideLogoAnim }],
                },
              ]}
            >
              <MaterialCommunityIcons name="orbit" size={42} color={COLORS.cyan} />
            </Animated.View>

            {/* Flight Mission Badge */}
            <View style={styles.missionBadge}>
              <View style={styles.missionPulseDot} />
              <Text style={styles.missionBadgeText}>NASA ARTEMIS EVA FLIGHT // ORBIT-1</Text>
            </View>

            {/* Brand Title & Typography */}
            <Text style={styles.brandTitle}>ORBIT HEALTH</Text>
            <Text style={styles.brandTagline}>{t('welcome.tagline', 'Your Health. Our Mission.')}</Text>

            {/* NASA Hackathon Value Proposition */}
            <View style={styles.valuePropCard}>
              <MaterialCommunityIcons name="satellite-variant" size={16} color={COLORS.cyan} />
              <Text style={styles.valuePropText}>
                {`"${t('welcome.valueProposition', 'An offline-first AI health companion that lets astronauts on Mars-class missions monitor themselves and make medical decisions when Mission Control is 4-24 minutes away.')}"`}
              </Text>
            </View>

            <Text style={styles.brandSubtitle}>
              {t('welcome.subtitle', 'Welcome to the future of astronaut health monitoring.')}
            </Text>

            {/* Bio-Telemetry Badges */}
            <View style={styles.badgeRow}>
              <View style={styles.telemetryBadge}>
                <MaterialCommunityIcons name="heart-pulse" size={13} color={COLORS.cyan} />
                <Text style={styles.telemetryBadgeText}>DEEP SPACE BIO-TELEMETRY</Text>
              </View>
              <View style={styles.telemetryBadge}>
                <MaterialCommunityIcons name="shield-check" size={13} color="#10B981" />
                <Text style={styles.telemetryBadgeText}>SOVEREIGN RLS PRIVACY</Text>
              </View>
            </View>

            {/* Primary Action Buttons (Log In & Create Account) */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.loginPrimaryBtn}
                onPress={onNavigateToLogin}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="login" size={20} color={COLORS.background} />
                <Text style={styles.loginPrimaryText}>{t('welcome.loginBtn', 'Log In')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createAccountBtn}
                onPress={onNavigateToRegister}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="account-plus-outline" size={20} color={COLORS.cyan} />
                <Text style={styles.createAccountText}>
                  {t('welcome.createAccountBtn', 'Create Account')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Legal / Policy Links */}
            <View style={styles.legalRow}>
              <TouchableOpacity onPress={() => setIsPrivacyModalOpen(true)}>
                <Text style={styles.legalLink}>{t('welcome.privacyPolicy', 'Privacy Policy')}</Text>
              </TouchableOpacity>
              <Text style={styles.legalDot}>•</Text>
              <TouchableOpacity onPress={() => setIsTermsModalOpen(true)}>
                <Text style={styles.legalLink}>{t('welcome.termsOfService', 'Terms & Conditions')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* Privacy Policy Modal */}
        <Modal
          visible={isPrivacyModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsPrivacyModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <MaterialCommunityIcons name="shield-lock-outline" size={20} color={COLORS.cyan} />
                  <Text style={styles.modalTitle}>CREW MEDICAL PRIVACY POLICY</Text>
                </View>
                <TouchableOpacity onPress={() => setIsPrivacyModalOpen(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.policyHeading}>1. Sovereign Crew Health Privacy</Text>
                <Text style={styles.policyText}>
                  All physiological telemetry, electrocardiograms, sleep architecture, and multi-detector dosimetry recorded by ORBIT Health are strictly partitioned under encrypted storage. Supabase Row Level Security (RLS) guarantees that only you can access your private records.
                </Text>
                <Text style={styles.policyHeading}>2. NASA Open Science Data Repository (OSDR) Protocol</Text>
                <Text style={styles.policyText}>
                  No personal health records or biometric markers are shared or transmitted to NASA OSDR without explicit de-identification and cryptographic authorization by the astronaut and Flight Surgeon.
                </Text>
                <Text style={styles.policyHeading}>3. Offline-First Security & Zero Plaintext</Text>
                <Text style={styles.policyText}>
                  Terminal operations require no persistent connection to terrestrial backends. All authentication secrets and biometric data are encrypted in accordance with NASA flight medical directives.
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsPrivacyModalOpen(false)}
              >
                <Text style={styles.modalCloseBtnText}>Acknowledge & Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Terms of Service Modal */}
        <Modal
          visible={isTermsModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsTermsModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <MaterialCommunityIcons name="file-document-outline" size={20} color={COLORS.cyan} />
                  <Text style={styles.modalTitle}>SPACE MEDICAL TERMS OF SERVICE</Text>
                </View>
                <TouchableOpacity onPress={() => setIsTermsModalOpen(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.policyHeading}>1. Mission Operational Context</Text>
                <Text style={styles.policyText}>
                  ORBIT Health is engineered as an autonomous space medicine and flight telemetry companion for astronauts operating beyond Low Earth Orbit (LEO) during Artemis deep space exploration missions.
                </Text>
                <Text style={styles.policyHeading}>2. Non-Diagnostic Medical Scope</Text>
                <Text style={styles.policyText}>
                  AI assistant insights, Digital Twin trends, and predictive analytics provide probabilistic physiological estimations based on NASA Human Research Program literature. They support crew autonomy but do not substitute emergency flight medical intervention.
                </Text>
                <Text style={styles.policyHeading}>3. Emergency Flight Surgeon Communications</Text>
                <Text style={styles.policyText}>
                  Critical medical alerts are automatically prioritized for Ku/S-band Space-to-Ground carrier relay when acquisition of signal (AOS) is confirmed with Mission Control Center Houston.
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsTermsModalOpen(false)}
              >
                <Text style={styles.modalCloseBtnText}>Acknowledge & Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SpaceBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 48 : SPACING.md,
    paddingBottom: SPACING.lg,
    justifyContent: 'space-between',
  },
  topBar: {
    zIndex: 20,
    marginBottom: SPACING.xs,
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusPillOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotOnline: {
    backgroundColor: '#10B981',
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  langBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
  },
  langChipActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.22)',
  },
  langFlag: {
    fontSize: 13,
  },
  langText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  langTextActive: {
    color: COLORS.cyan,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  consoleCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(11, 17, 32, 0.88)',
    borderRadius: 26,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.28)',
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 8,
    alignItems: 'center',
  },
  emblemRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  missionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    marginBottom: SPACING.md,
  },
  missionPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cyan,
  },
  missionBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 1.1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 242, 254, 0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  brandTagline: {
    fontSize: 15.5,
    fontWeight: '800',
    color: COLORS.cyan,
    marginTop: 4,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  valuePropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 4,
  },
  valuePropText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#E0F2FE',
    lineHeight: 16,
    textAlign: 'left',
  },
  brandSubtitle: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 18,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  telemetryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  telemetryBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.textCyan,
    letterSpacing: 0.6,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  loginPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.cyan,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  loginPrimaryText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: COLORS.background,
    letterSpacing: 1,
  },
  createAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    paddingVertical: 13,
    borderRadius: 14,
  },
  createAccountText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.9,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.md,
  },
  legalLink: {
    fontSize: 11,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.88)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surfaceCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    maxHeight: '82%',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  modalScroll: {
    marginBottom: SPACING.md,
  },
  policyHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.cyan,
    marginTop: 10,
    marginBottom: 4,
  },
  policyText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16.5,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.cyan,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.background,
  },
});
