// ============================================================================
// ORBIT HEALTH — MISSION HEALTH MONITORING SYSTEM
// Protected Application Routing & Multi-Step Authentication Navigation
// ============================================================================

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from './src/theme/colors';
import { MainNavTab } from './src/types/astronaut';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { HealthScreen } from './src/screens/HealthScreen';
import { RadiationScreen } from './src/screens/RadiationScreen';
import { DigitalTwinScreen } from './src/screens/DigitalTwinScreen';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { FitnessScreen } from './src/screens/FitnessScreen';
import { EmergencyScreen } from './src/screens/EmergencyScreen';
import { AssistantScreen } from './src/screens/AssistantScreen';
import { NasaDataCenterScreen } from './src/screens/NasaDataCenterScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { BeyondSpaceScreen } from './src/screens/BeyondSpaceScreen';
import { AboutDataMethodsScreen } from './src/screens/AboutDataMethodsScreen';
import { MissionControlScreen } from './src/screens/MissionControlScreen';
import { SansVisionCheckScreen } from './src/screens/SansVisionCheckScreen';
import { BehavioralCheckinScreen } from './src/screens/BehavioralCheckinScreen';
import { VoiceConversationScreen } from './src/screens/VoiceConversationScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { BottomNavBar } from './src/components/BottomNavBar';
import { SpaceBackground } from './src/components/SpaceBackground';

// Authentication Screens
import { WelcomeScreen } from './src/screens/auth/WelcomeScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { EmailVerificationScreen } from './src/screens/auth/EmailVerificationScreen';
import { ProfileSetupScreen } from './src/screens/auth/ProfileSetupScreen';
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPasswordScreen';

// Core Services
import { useTranslation } from 'react-i18next';
import { authService, AuthenticatedUser } from './src/services/authService';
import { registerForPushNotificationsAsync } from './src/services/notificationService';
import { getDatabase } from './src/services/db';
import { initializeNasaTables } from './src/services/nasaDb';
import { initializeLanguage } from './src/i18n';

type AuthNavStep =
  | 'INITIALIZING'
  | 'WELCOME'
  | 'LOGIN'
  | 'REGISTER'
  | 'EMAIL_VERIFICATION'
  | 'PROFILE_SETUP'
  | 'FORGOT_PASSWORD'
  | 'AUTHENTICATED';

export default function App() {
  const { t } = useTranslation();
  const [authStep, setAuthStep] = useState<AuthNavStep>('INITIALIZING');
  const [pendingUser, setPendingUser] = useState<AuthenticatedUser | null>(null);
  const [currentTab, setCurrentTab] = useState<MainNavTab>('dashboard');

  useEffect(() => {
    async function bootSystem() {
      // 1. Initialize user language preference from persistent storage FIRST
      try {
        await initializeLanguage();
      } catch (err) {
        console.warn('i18n init error:', err);
      }

      // 2. Initialize SQLite tables & seed data
      try {
        await getDatabase();
      } catch (err) {
        console.warn('SQLite init error:', err);
      }

      // 3. Initialize NASA scientific tables
      try {
        await initializeNasaTables();
      } catch (err) {
        console.warn('NASA SQLite init error:', err);
      }

      // 4. Request push notification permissions
      registerForPushNotificationsAsync().catch((err) => console.log('Push notification init error:', err));

      // 5. Restore persistent astronaut session
      try {
        const user = await authService.initSession();
        if (user) {
          setAuthStep('AUTHENTICATED');
        } else {
          setAuthStep('WELCOME');
        }
      } catch (err) {
        console.warn('Auth session error:', err);
        setAuthStep('WELCOME');
      }
    }

    bootSystem();

    // 6. Listen for auth state changes (e.g. sign out)
    const unsubscribe = authService.subscribe((user) => {
      if (!user) {
        setAuthStep('WELCOME');
        setCurrentTab('dashboard');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Protected application screen switcher
  const renderProtectedScreen = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardScreen onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'health':
        return <HealthScreen onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'radiation':
        return <RadiationScreen onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'twin':
        return <DigitalTwinScreen onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'timeline':
        return <TimelineScreen onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'fitness':
        return <FitnessScreen onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'emergency':
        return <EmergencyScreen onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'assistant':
        return <AssistantScreen />;
      case 'nasa':
        return <NasaDataCenterScreen onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'profile':
        return (
          <ProfileScreen
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onLogout={() => setAuthStep('WELCOME')}
          />
        );
      case 'beyond_space':
        return <BeyondSpaceScreen onBack={() => setCurrentTab('dashboard')} />;
      case 'about':
        return <AboutDataMethodsScreen onBack={() => setCurrentTab('dashboard')} />;
      case 'control':
        return <MissionControlScreen onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'voice':
        return <VoiceConversationScreen onNavigateTab={(tab) => setCurrentTab(tab)} onClose={() => setCurrentTab('assistant')} />;
      case 'sans':
        return <SansVisionCheckScreen onNavigateTab={(tab) => setCurrentTab(tab)} onBack={() => setCurrentTab('health')} />;
      case 'behavioral':
        return <BehavioralCheckinScreen onNavigateTab={(tab) => setCurrentTab(tab)} onBack={() => setCurrentTab('health')} />;
      default:
        return <DashboardScreen onNavigateTab={(tab) => setCurrentTab(tab)} />;
    }
  };

  // Splash / Loading Screen while verifying session
  if (authStep === 'INITIALIZING') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar style="light" />
          <SpaceBackground>
            <View style={styles.splashContainer}>
              <View style={styles.splashEmblemRing}>
                <MaterialCommunityIcons name="orbit" size={44} color={COLORS.cyan} />
              </View>
              <Text style={styles.splashTitle}>ORBIT HEALTH</Text>
              <Text style={styles.splashSub}>{t('common.loading')}</Text>
              <ActivityIndicator size="small" color={COLORS.cyan} style={styles.splashLoader} />
            </View>
          </SpaceBackground>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Welcome Screen (First launch & unauthenticated default)
  if (authStep === 'WELCOME') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar style="light" />
          <WelcomeScreen
            onNavigateToLogin={() => setAuthStep('LOGIN')}
            onNavigateToRegister={() => setAuthStep('REGISTER')}
            onContinueAsGuest={() => setAuthStep('AUTHENTICATED')}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Existing Account Login
  if (authStep === 'LOGIN') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar style="light" />
          <LoginScreen
            onLoginSuccess={() => setAuthStep('AUTHENTICATED')}
            onNavigateToRegister={() => setAuthStep('REGISTER')}
            onNavigateToForgotPassword={() => setAuthStep('FORGOT_PASSWORD')}
            onNavigateBack={() => setAuthStep('WELCOME')}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Create Account (Registration)
  if (authStep === 'REGISTER') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar style="light" />
          <RegisterScreen
            onRegisterSuccess={(user, needsVerification) => {
              setPendingUser(user);
              if (needsVerification) {
                setAuthStep('EMAIL_VERIFICATION');
              } else {
                setAuthStep('PROFILE_SETUP');
              }
            }}
            onNavigateToLogin={() => setAuthStep('LOGIN')}
            onNavigateBack={() => setAuthStep('WELCOME')}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Email Verification Screen
  if (authStep === 'EMAIL_VERIFICATION') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar style="light" />
          <EmailVerificationScreen
            user={pendingUser || authService.getCurrentUser()!}
            onVerificationSuccess={() => setAuthStep('PROFILE_SETUP')}
            onNavigateToLogin={() => setAuthStep('LOGIN')}
            onNavigateBack={() => setAuthStep('WELCOME')}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Astronaut Profile Setup
  if (authStep === 'PROFILE_SETUP') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar style="light" />
          <ProfileSetupScreen
            user={pendingUser || authService.getCurrentUser()!}
            onSetupComplete={() => setAuthStep('AUTHENTICATED')}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Password Recovery
  if (authStep === 'FORGOT_PASSWORD') {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar style="light" />
          <ForgotPasswordScreen onNavigateBack={() => setAuthStep('LOGIN')} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Main Authenticated Application (Dashboard & Protected Tabs)
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.contentContainer}>
          <ErrorBoundary>
            {renderProtectedScreen()}
          </ErrorBoundary>
        </View>
        <BottomNavBar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  splashEmblemRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg, 
  },
  splashTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 3,
  },
  splashSub: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 1.5,
    marginTop: 6,
  },
  splashLoader: {
    marginTop: SPACING.xl,
  },
});
