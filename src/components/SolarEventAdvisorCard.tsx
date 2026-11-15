// Solar Storm Shelter Advisor Component for ORBIT Health
// Integrates NASA DONKI (CME / Solar Flare) events into real actionable shelter decisions
// Includes: Event classification, estimated arrival, plain-language risk rating,
// shelter protocols (Node 2 water-wall), EVA deferral, and "Simulate Solar Event" toggle.

import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';
import { DataSourceBadge } from './DataSourceBadge';
import { NasaDonkiEvent } from '../types/nasa';

interface SolarEventAdvisorCardProps {
  activeDonkiEvents?: NasaDonkiEvent[];
  isSimulatedActive?: boolean;
  onToggleSimulateEvent?: (active: boolean) => void;
  cumulativeDoseMsv?: number;
}

export const SolarEventAdvisorCard: React.FC<SolarEventAdvisorCardProps> = ({
  activeDonkiEvents = [],
  isSimulatedActive = false,
  onToggleSimulateEvent,
  cumulativeDoseMsv = 178.4,
}) => {
  const [internalSimulate, setInternalSimulate] = useState<boolean>(isSimulatedActive);

  const isSimulated = onToggleSimulateEvent ? isSimulatedActive : internalSimulate;

  const handleToggle = (val: boolean) => {
    setInternalSimulate(val);
    if (onToggleSimulateEvent) {
      onToggleSimulateEvent(val);
    }
  };

  // Determine if there is an active event (real or simulated)
  const realEvent = activeDonkiEvents.find(
    (e) => e.messageType === 'CME' || e.messageType === 'FLR' || e.messageType === 'SEP'
  );

  const hasActiveEvent = isSimulated || Boolean(realEvent);

  // Career limit math
  const careerLimitMsv = 600.0;
  const careerPct = Math.min(100, Math.round((cumulativeDoseMsv / careerLimitMsv) * 1000) / 10);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <MaterialCommunityIcons
            name={hasActiveEvent ? 'weather-sunny-alert' : 'shield-sun'}
            size={22}
            color={hasActiveEvent ? COLORS.statusWarning : COLORS.brightBlue}
          />
          <Text style={styles.title}>Solar Storm Shelter Advisor</Text>
        </View>
        <DataSourceBadge
          source={isSimulated ? 'SIMULATED' : realEvent ? 'NASA_CACHED' : 'NASA_LIVE'}
          customLabel={isSimulated ? 'Simulated' : realEvent ? 'NASA DONKI' : 'DONKI Nominal'}
        />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Autonomous space radiation shelter decision support for deep space transit.
      </Text>

      {/* Demo Simulation Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleTextGroup}>
          <Text style={styles.toggleLabel}>Simulate Solar Storm (CME / M4.8 Flare)</Text>
          <Text style={styles.toggleHint}>Test autonomous shelter protocols during comms delay</Text>
        </View>
        <Switch
          value={isSimulated}
          onValueChange={handleToggle}
          trackColor={{ false: COLORS.surfaceHover, true: COLORS.statusWarning }}
          thumbColor={isSimulated ? '#FFF' : COLORS.textMuted}
        />
      </View>

      {/* ACTIVE EVENT ADVISORY BOX */}
      {hasActiveEvent ? (
        <View style={styles.alertBox}>
          <View style={styles.alertHeader}>
            <MaterialCommunityIcons name="alert-octagon" size={20} color={COLORS.statusAlert} />
            <Text style={styles.alertHeading}>
              {isSimulated
                ? 'SIMULATED: M4.8 Solar Flare & Coronal Mass Ejection'
                : `DONKI ACTIVE: ${realEvent?.messageType} (${realEvent?.classification || 'Space Weather Event'})`}
            </Text>
          </View>

          {/* Key Parameters */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>DETECTION TIME</Text>
              <Text style={styles.metaValue}>
                {isSimulated ? 'T-01h 14m (Flare Peak)' : realEvent?.issueTime ? new Date(realEvent.issueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>EST. ARRIVAL WINDOW</Text>
              <Text style={[styles.metaValue, { color: COLORS.statusWarning }]}>
                {isSimulated ? '~14h 20m (DONKI Enlil Model)' : 'Under Analysis'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>RISK LEVEL</Text>
              <Text style={[styles.metaValue, { color: COLORS.statusAlert, fontWeight: '700' }]}>
                HIGH SHELTER ADVISORY
              </Text>
            </View>
          </View>

          {/* Actionable Shelter Protocols */}
          <Text style={styles.sectionHeader}>RECOMMENDED AUTONOMOUS ACTIONS:</Text>
          <View style={styles.actionItem}>
            <MaterialCommunityIcons name="checkbox-marked-circle" size={16} color={COLORS.statusWarning} />
            <Text style={styles.actionText}>
              <Text style={styles.actionBold}>Relocate to Storm Shelter: </Text>
              Move to Node 2 central compartment surrounded by water-wall and food provisions.
            </Text>
          </View>
          <View style={styles.actionItem}>
            <MaterialCommunityIcons name="checkbox-marked-circle" size={16} color={COLORS.statusWarning} />
            <Text style={styles.actionText}>
              <Text style={styles.actionBold}>Defer All EVAs: </Text>
              Cancel scheduled spacewalks / airlock egress until solar particle flux returns to baseline.
            </Text>
          </View>
          <View style={styles.actionItem}>
            <MaterialCommunityIcons name="checkbox-marked-circle" size={16} color={COLORS.statusWarning} />
            <Text style={styles.actionText}>
              <Text style={styles.actionBold}>Increase Dosimetry Cadence: </Text>
              Log personal active dosimeter readings every 15 minutes.
            </Text>
          </View>

          {/* Honesty Badges */}
          <View style={styles.honestyFooter}>
            <Text style={styles.disclaimerText}>
              Arrival estimate derived from NASA DONKI analysis. Shelter advice is general guidance, not an official NASA procedure for this mission.
            </Text>
          </View>
        </View>
      ) : (
        /* QUIET NOMINAL STATE */
        <View style={styles.nominalBox}>
          <View style={styles.nominalHeader}>
            <MaterialCommunityIcons name="check-decagram" size={18} color={COLORS.statusNormal} />
            <Text style={styles.nominalHeading}>No High-Flux Solar Particle Events Active</Text>
          </View>
          <Text style={styles.nominalText}>
            Space weather conditions nominal across the Artemis Mars transit corridor. Standard galactic cosmic ray (GCR) background flux (~18.5 µSv/h). No storm shelter requirement currently in effect.
          </Text>
        </View>
      )}

      {/* Cumulative Career Limit Card */}
      <View style={styles.careerCard}>
        <View style={styles.careerRow}>
          <Text style={styles.careerLabel}>Astronaut Career Radiation Dose</Text>
          <Text style={styles.careerNumbers}>
            <Text style={styles.careerHighlight}>{cumulativeDoseMsv} mSv</Text> / {careerLimitMsv} mSv ({careerPct}%)
          </Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${careerPct}%` }]} />
        </View>
        <Text style={styles.careerSourceNote}>
          Source: NASA-STD-3001, Vol 1 • 600 mSv Career Astronaut Limit (1-year LEO / Mars Mission Cap)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: SPACING.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.sm,
  },
  toggleTextGroup: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  toggleLabel: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  toggleHint: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  alertBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 10,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  alertHeading: {
    color: COLORS.statusAlert,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.xs,
    borderRadius: 6,
    marginVertical: SPACING.xs,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaValue: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeader: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: SPACING.xs,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  actionText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  actionBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  honestyFooter: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  disclaimerText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  nominalBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  nominalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  nominalHeading: {
    color: COLORS.statusNormal,
    fontSize: 12,
    fontWeight: '600',
  },
  nominalText: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  careerCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  careerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  careerLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  careerNumbers: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  careerHighlight: {
    color: COLORS.cyan,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceHover,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: 3,
  },
  careerSourceNote: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
