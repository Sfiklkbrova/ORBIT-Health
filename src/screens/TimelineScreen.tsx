import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme/colors';
import { MainNavTab } from '../types/astronaut';
import {
  MISSION_METADATA,
  CHRONOLOGICAL_MISSION_EVENTS,
  MissionTimelineEvent,
} from '../services/missionTimelineService';

interface TimelineScreenProps {
  onNavigateTab?: (tab: MainNavTab) => void;
}

export const TimelineScreen: React.FC<TimelineScreenProps> = ({ onNavigateTab }) => {
  const { t } = useTranslation();
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MissionTimelineEvent | null>(null);

  const filterOptions = [null, 142, 140, 136, 128, 115, 90, 45, 1];

  const filteredEvents = selectedDayFilter
    ? CHRONOLOGICAL_MISSION_EVENTS.filter((e) => e.missionDay === selectedDayFilter)
    : CHRONOLOGICAL_MISSION_EVENTS;

  const getEventIcon = (type: MissionTimelineEvent['eventType']): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (type) {
      case 'HEALTH_SUMMARY':
        return 'heart-pulse';
      case 'RADIATION_EVENT':
        return 'radioactive';
      case 'ECLSS_CHANGE':
        return 'air-filter';
      case 'OPERATIONAL_MILESTONE':
        return 'rocket-launch';
      case 'AI_ALERT':
        return 'brain';
      default:
        return 'calendar-clock';
    }
  };

  const getSignificanceColor = (sig: MissionTimelineEvent['significance']) => {
    switch (sig) {
      case 'CRITICAL':
        return COLORS.statusAlert;
      case 'ELEVATED':
        return COLORS.statusWarning;
      default:
        return COLORS.cyan;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="timeline-clock-outline" size={24} color={COLORS.cyan} />
          </View>
          <View>
            <Text style={styles.title}>{t('timeline.title')}</Text>
            <Text style={styles.subtitle}>{t('timeline.subtitle')}</Text>
          </View>
        </View>
      </View>

      {/* Mission Progress Card */}
      <View style={styles.metaCard}>
        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>MISSION ASSIGNMENT</Text>
            <Text style={styles.metaVal}>{MISSION_METADATA.missionName}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>Day {MISSION_METADATA.currentMissionDay} / {MISSION_METADATA.totalMissionDays}</Text>
          </View>
        </View>
        <Text style={styles.metaSub}>HABITAT: {MISSION_METADATA.spacecraft} • {MISSION_METADATA.trajectory}</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              { width: `${(MISSION_METADATA.currentMissionDay / MISSION_METADATA.totalMissionDays) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Day Filter Chips */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>{t('timeline.filterDay')}:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterOptions.map((day, idx) => {
            const isSelected = selectedDayFilter === day;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedDayFilter(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {day === null ? t('timeline.allDays') : `Day ${day}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Timeline Events List */}
      <View style={styles.timelineList}>
        {filteredEvents.map((evt, idx) => {
          const sigColor = getSignificanceColor(evt.significance);
          return (
            <TouchableOpacity
              key={evt.id}
              style={styles.timelineCard}
              onPress={() => setSelectedEvent(evt)}
              activeOpacity={0.8}
            >
              {/* Left Timeline Line & Icon */}
              <View style={styles.cardHeader}>
                <View style={[styles.typeIconBox, { borderColor: sigColor }]}>
                  <MaterialCommunityIcons name={getEventIcon(evt.eventType)} size={16} color={sigColor} />
                </View>
                <View style={styles.titleArea}>
                  <View style={styles.dayAndTypeRow}>
                    <Text style={styles.dayBadgeText}>{evt.calendarDate}</Text>
                    <View style={[styles.sigBadge, { backgroundColor: `${sigColor}20`, borderColor: sigColor }]}>
                      <Text style={[styles.sigBadgeText, { color: sigColor }]}>{evt.eventType}</Text>
                    </View>
                  </View>
                  <Text style={styles.evtTitle}>{evt.title}</Text>
                </View>
              </View>

              <Text style={styles.evtSummary}>{evt.summary}</Text>

              {/* Metric Chips */}
              <View style={styles.metricsRow}>
                {evt.keyMetrics.heartRate !== undefined && (
                  <View style={styles.metricChip}>
                    <MaterialCommunityIcons name="heart-pulse" size={12} color={COLORS.heartRate} />
                    <Text style={styles.metricChipText}>{evt.keyMetrics.heartRate} BPM</Text>
                  </View>
                )}
                {evt.keyMetrics.spo2 !== undefined && (
                  <View style={styles.metricChip}>
                    <MaterialCommunityIcons name="water-percent" size={12} color={COLORS.bloodOxygen} />
                    <Text style={styles.metricChipText}>{evt.keyMetrics.spo2}%</Text>
                  </View>
                )}
                {evt.keyMetrics.radiationMicroSv !== undefined && (
                  <View style={styles.metricChip}>
                    <MaterialCommunityIcons name="radioactive" size={12} color={COLORS.statusWarning} />
                    <Text style={styles.metricChipText}>{evt.keyMetrics.radiationMicroSv} µSv/h</Text>
                  </View>
                )}
                {evt.keyMetrics.sleepHours !== undefined && (
                  <View style={styles.metricChip}>
                    <MaterialCommunityIcons name="bed-clock" size={12} color={COLORS.sleep} />
                    <Text style={styles.metricChipText}>{evt.keyMetrics.sleepHours} hrs</Text>
                  </View>
                )}
                {evt.keyMetrics.co2MmHg !== undefined && (
                  <View style={styles.metricChip}>
                    <MaterialCommunityIcons name="molecule-co2" size={12} color={COLORS.statusAlert} />
                    <Text style={styles.metricChipText}>{evt.keyMetrics.co2MmHg} mmHg</Text>
                  </View>
                )}
              </View>

              {evt.operationalAction && (
                <View style={styles.actionCallout}>
                  <MaterialCommunityIcons name="shield-check" size={12} color={COLORS.cyan} />
                  <Text style={styles.actionCalloutText}>{evt.operationalAction}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Event Details Inspection Modal */}
      <Modal visible={!!selectedEvent} transparent animationType="fade" onRequestClose={() => setSelectedEvent(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBadge}>
                <Text style={styles.modalBadgeText}>{selectedEvent?.calendarDate}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
            <Text style={styles.modalSummary}>{selectedEvent?.summary}</Text>

            {selectedEvent?.operationalAction && (
              <View style={styles.modalActionBox}>
                <Text style={styles.modalActionLabel}>OPERATIONAL COUNTERMEASURE EXECUTED:</Text>
                <Text style={styles.modalActionText}>{selectedEvent.operationalAction}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedEvent(null)}>
              <Text style={styles.modalCloseBtnText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  metaCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  metaVal: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 2,
  },
  metaBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  metaSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.cyan,
    borderRadius: 2,
  },
  filterSection: {
    marginBottom: SPACING.md,
  },
  filterSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: COLORS.cyan,
  },
  filterChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.cyan,
    fontWeight: '800',
  },
  timelineList: {
    gap: SPACING.md,
  },
  timelineCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  typeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleArea: {
    flex: 1,
  },
  dayAndTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  sigBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  sigBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  evtTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  evtSummary: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metricChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.06)',
    padding: 6,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.cyan,
  },
  actionCalloutText: {
    fontSize: 10,
    color: COLORS.textPrimary,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 24, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    padding: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
  },
  modalSummary: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  modalActionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.cyan,
  },
  modalActionLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.cyan,
    marginBottom: 4,
  },
  modalActionText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
});
