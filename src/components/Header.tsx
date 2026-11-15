import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';

interface HeaderProps {
  onPressProfile?: () => void;
  welcomeName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onPressProfile,
  welcomeName = 'Commander Alex',
}) => {
  return (
    <View style={styles.container}>
      {/* Top Bar with Brand and Profile */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          {/* Futuristic Orbit Icon Badge */}
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="orbit" size={24} color={COLORS.cyan} />
            <View style={styles.satelliteDot} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>ORBIT</Text>
              <Text style={styles.brandTitleAccent}>HEALTH</Text>
            </View>
            <Text style={styles.telemetryTag}>BIO-TELEMETRY SYSTEM</Text>
          </View>
        </View>

        {/* User Profile Avatar Button */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={onPressProfile}
          activeOpacity={0.8}
          accessibilityLabel="User Profile"
        >
          <View style={styles.avatarGlowRing}>
            <View style={styles.avatarInner}>
              <MaterialCommunityIcons name="account-tie" size={22} color={COLORS.cyan} />
            </View>
          </View>
          <View style={styles.statusOnlineBeacon} />
        </TouchableOpacity>
      </View>

      {/* Greeting Banner */}
      <View style={styles.greetingContainer}>
        <View style={styles.greetingTextGroup}>
          <Text style={styles.missionSubtext}>MISSION DAY 142 • ORBIT SECURE</Text>
          <Text style={styles.greetingTitle}>Welcome back, {welcomeName}</Text>
        </View>
        <View style={styles.signalBadge}>
          <MaterialCommunityIcons name="broadcast" size={14} color={COLORS.statusNormal} />
          <Text style={styles.signalText}>LIVE SYNC</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1.5,
    borderColor: COLORS.borderHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  satelliteDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.cyan,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  brandTitleAccent: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.cyan,
    letterSpacing: 1.5,
  },
  telemetryTag: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  profileButton: {
    position: 'relative',
  },
  avatarGlowRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.cyan,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  avatarInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceCardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOnlineBeacon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.statusNormal,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: SPACING.xs,
  },
  greetingTextGroup: {
    flex: 1,
  },
  missionSubtext: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textCyan,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  signalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  signalText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.statusNormal,
    letterSpacing: 0.8,
  },
});

