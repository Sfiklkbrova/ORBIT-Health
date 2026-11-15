import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';
import { DEMO_HISTORY } from '../data/demoData';
import { HistoryItem } from '../types/health';

export const HistoryScreen: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'optimal' | 'checkups'>('all');

  const handleSelectHistory = (item: HistoryItem) => {
    Alert.alert(
      item.title,
      `Date: ${item.date} at ${item.time}\nVital Score: ${item.vitalScore}/100\n\nMetrics:\n• HR: ${item.metrics.hr}\n• SpO2: ${item.metrics.spo2}\n• BP: ${item.metrics.bp}\n• Temp: ${item.metrics.temp}\n\nClinical Notes:\n${item.notes}`,
      [{ text: 'Close', style: 'cancel' }]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MISSION TELEMETRY LOGS</Text>
          <Text style={styles.subtitle}>Historical biometric checkups & orbital records</Text>
        </View>
        <View style={styles.sampleBadge}>
          <Text style={styles.sampleBadgeText}>SAMPLE LOGS</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All Logs (4)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'optimal' && styles.filterPillActive]}
          onPress={() => setFilter('optimal')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'optimal' && styles.filterTextActive]}>
            Optimal (&gt;95)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'checkups' && styles.filterPillActive]}
          onPress={() => setFilter('checkups')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, filter === 'checkups' && styles.filterTextActive]}>
            Full Telemetry
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timeline List */}
      <View style={styles.timelineList}>
        {DEMO_HISTORY.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={styles.historyCard}
            onPress={() => handleSelectHistory(item)}
            activeOpacity={0.75}
          >
            {/* Top row with date and score badge */}
            <View style={styles.cardHeader}>
              <View style={styles.dateGroup}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.cyan} />
                <Text style={styles.dateText}>{item.date} • {item.time}</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{item.vitalScore}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
            </View>

            <Text style={styles.logTitle}>{item.title}</Text>

            {/* Metrics Chips Row */}
            <View style={styles.metricChipsRow}>
              <View style={styles.chip}>
                <Text style={styles.chipLabel}>HR: </Text>
                <Text style={styles.chipVal}>{item.metrics.hr}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipLabel}>SpO2: </Text>
                <Text style={styles.chipVal}>{item.metrics.spo2}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipLabel}>BP: </Text>
                <Text style={styles.chipVal}>{item.metrics.bp}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipLabel}>Temp: </Text>
                <Text style={styles.chipVal}>{item.metrics.temp}</Text>
              </View>
            </View>

            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>

            <View style={styles.cardFooter}>
              <Text style={styles.viewDetailsText}>Tap to inspect telemetry log</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.textCyan} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sampleBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  sampleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.statusWarning,
    letterSpacing: 0.8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  filterPillActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: COLORS.cyan,
  },
  filterText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.cyan,
    fontWeight: '800',
  },
  timelineList: {
    gap: SPACING.md,
  },
  historyCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.statusNormal,
  },
  scoreMax: {
    fontSize: 9,
    color: COLORS.statusNormal,
    fontWeight: '700',
  },
  logTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  metricChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chipVal: {
    fontSize: 10,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  viewDetailsText: {
    fontSize: 10,
    color: COLORS.textCyan,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

