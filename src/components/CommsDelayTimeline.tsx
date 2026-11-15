import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme/colors';
import { CommsDelayState } from '../services/commsDelayService';

interface CommsDelayTimelineProps {
  commsState: CommsDelayState;
  onToggleBlackout: () => void;
  onOpenOutbox?: () => void;
}

export const CommsDelayTimeline: React.FC<CommsDelayTimelineProps> = ({
  commsState,
  onToggleBlackout,
  onOpenOutbox,
}) => {
  const { t } = useTranslation();
  const isBlackout = commsState.status === 'BLACKOUT';

  return (
    <View style={[styles.container, isBlackout && styles.containerBlackout]}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.titleWithIcon}>
          <MaterialCommunityIcons
            name={isBlackout ? 'satellite-uplink' : 'satellite-variant'}
            size={18}
            color={isBlackout ? COLORS.statusAlert : COLORS.cyan}
          />
          <Text style={styles.headerTitle}>{t('comms.linkStatus', 'Mission Control Link')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.toggleBtn, isBlackout && styles.toggleBtnActive]}
          onPress={onToggleBlackout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isBlackout ? 'lan-disconnect' : 'lan-connect'}
            size={13}
            color={isBlackout ? '#FFFFFF' : COLORS.textCyan}
          />
          <Text style={[styles.toggleBtnText, isBlackout && styles.toggleBtnTextActive]}>
            {isBlackout ? 'EXIT BLACKOUT' : 'SIMULATE BLACKOUT'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Pill & Mode Banner */}
      <View style={[styles.statusBanner, isBlackout ? styles.bannerBlackout : styles.bannerDelayed]}>
        <View style={styles.statusBannerLeft}>
          <View style={[styles.pulseDot, isBlackout ? styles.pulseDotRed : styles.pulseDotAmber]} />
          <Text style={[styles.statusBannerText, isBlackout ? styles.textRed : styles.textAmber]}>
            {isBlackout
              ? t('comms.crewAutonomyMode', 'CREW AUTONOMY MODE ACTIVE (BLACKOUT)')
              : `DELAYED: ${commsState.oneWayMinutes}m ${commsState.oneWaySeconds}s ONE-WAY PROPAGATION`}
          </Text>
        </View>
        <Text style={styles.dsnTag}>
          {isBlackout ? 'LOS (SUN)' : 'NASA DSN ACTIVE'}
        </Text>
      </View>

      {/* Visual Mars <---> Earth Light Cone Diagram */}
      <View style={styles.diagramBox}>
        {/* Mars Node */}
        <View style={styles.node}>
          <View style={[styles.planetCircle, styles.marsCircle]}>
            <MaterialCommunityIcons name="rocket-launch" size={14} color="#EF4444" />
          </View>
          <Text style={styles.nodeTitle}>MARS CREW</Text>
          <Text style={styles.nodeSub}>Hab-1 Orbit</Text>
        </View>

        {/* Propagation Line / Wave */}
        <View style={styles.propagationTrack}>
          <View style={[styles.propagationLine, isBlackout && styles.propagationLineSevered]} />
          <View style={styles.delayBadge}>
            <MaterialCommunityIcons
              name={isBlackout ? 'close-circle' : 'timer-sand'}
              size={12}
              color={isBlackout ? COLORS.statusAlert : COLORS.cyan}
            />
            <Text style={[styles.delayBadgeText, isBlackout && styles.delayBadgeTextSevered]}>
              {isBlackout ? 'SIGNAL SEVERED' : 'Δt = 18m 42s'}
            </Text>
          </View>
          <Text style={styles.propagationSpeed}>c = 300,000 km/s</Text>
        </View>

        {/* Earth Node */}
        <View style={styles.node}>
          <View style={[styles.planetCircle, styles.earthCircle]}>
            <MaterialCommunityIcons name="earth" size={14} color="#38BDF8" />
          </View>
          <Text style={styles.nodeTitle}>HOUSTON MCC</Text>
          <Text style={styles.nodeSub}>Flight Surgeon</Text>
        </View>
      </View>

      {/* Explanatory Technical Note */}
      <Text style={styles.footnote}>
        {isBlackout
          ? t(
              'comms.crewAutonomyDesc',
              'Solar conjunction or terrain occultation has cut radio telemetry. Local offline AI clinical decision support & emergency checklists are active.'
            )
          : t(
              'comms.lightDelayDetail',
              'Current Mars-Earth Distance: 2.24 AU (336,000,000 km). Radio packets travel at light speed. Real-time voice consultation is physically impossible.'
            )}
      </Text>

      {/* Flight Surgeon Outbox Action Bar */}
      {onOpenOutbox && (
        <TouchableOpacity style={styles.outboxBar} onPress={onOpenOutbox} activeOpacity={0.8}>
          <MaterialCommunityIcons name="email-fast-outline" size={16} color={COLORS.cyan} />
          <Text style={styles.outboxBarText}>
            {t('comms.outboxTitle', 'Flight Surgeon Uplink Outbox')}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 14,
    marginVertical: 10,
  },
  containerBlackout: {
    borderColor: 'rgba(239, 68, 68, 0.45)',
    backgroundColor: 'rgba(25, 10, 15, 0.88)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.6,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  toggleBtnText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textCyan,
    letterSpacing: 0.5,
  },
  toggleBtnTextActive: {
    color: '#FCA5A5',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  bannerDelayed: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  bannerBlackout: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  pulseDotAmber: {
    backgroundColor: '#F59E0B',
  },
  pulseDotRed: {
    backgroundColor: '#EF4444',
  },
  statusBannerText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textAmber: {
    color: '#FBBF24',
  },
  textRed: {
    color: '#F87171',
  },
  dsnTag: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  diagramBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(3, 7, 18, 0.65)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  node: {
    alignItems: 'center',
    width: 80,
  },
  planetCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  marsCircle: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  earthCircle: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  nodeTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },
  nodeSub: {
    fontSize: 8.5,
    color: COLORS.textSecondary,
  },
  propagationTrack: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  propagationLine: {
    height: 2,
    width: '100%',
    backgroundColor: COLORS.cyan,
    marginBottom: 4,
  },
  propagationLineSevered: {
    backgroundColor: '#EF4444',
    borderStyle: 'dashed',
  },
  delayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  delayBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  delayBadgeTextSevered: {
    color: '#F87171',
    borderColor: '#EF4444',
  },
  propagationSpeed: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  footnote: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
    marginBottom: 8,
  },
  outboxBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  outboxBarText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.cyan,
    marginLeft: 8,
  },
});
