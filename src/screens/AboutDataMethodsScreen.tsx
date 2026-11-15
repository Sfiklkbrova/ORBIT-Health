import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';
import { DataSourceBadge } from '../components/DataSourceBadge';

interface AboutDataMethodsScreenProps {
  onBack?: () => void;
}

export const AboutDataMethodsScreen: React.FC<AboutDataMethodsScreenProps> = ({ onBack }) => {
  const openUrl = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed opening url:', err));
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.cyan} />
            </TouchableOpacity>
          )}
          <View style={styles.headerTextWrap}>
            <View style={styles.pillBadge}>
              <MaterialCommunityIcons name="certificate-outline" size={12} color={COLORS.cyan} />
              <Text style={styles.pillBadgeText}>NASA SPACE APPS 2026 // SCIENTIFIC COMPLIANCE</Text>
            </View>
            <Text style={styles.headerTitle}>About, Data & Methods</Text>
            <Text style={styles.headerSub}>
              Transparent scientific methodology, real vs simulated data catalog, and clinical formulas.
            </Text>
          </View>
        </View>

        {/* Value Proposition Hero */}
        <View style={styles.valuePropCard}>
          <MaterialCommunityIcons name="satellite-variant" size={22} color={COLORS.cyan} />
          <View style={styles.valuePropTextWrap}>
            <Text style={styles.valuePropHeading}>ONE-SENTENCE VALUE PROPOSITION</Text>
            <Text style={styles.valuePropQuote}>
              {'\"An offline-first AI health companion that lets astronauts on Mars-class missions monitor themselves and make medical decisions when Mission Control is 4-24 minutes away.\"'}
            </Text>
          </View>
        </View>

        {/* Official NASA Challenge Alignment */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="target" size={18} color={COLORS.cyan} />
            <Text style={styles.sectionTitle}>OFFICIAL NASA CHALLENGE ALIGNMENT</Text>
          </View>
          <Text style={styles.sectionBody}>
            <Text style={styles.boldText}>Challenge Track:</Text> Space Biology & Autonomous Astronaut Health: Deep Space Mission Health Monitoring and Autonomous Clinical Decision Support.
          </Text>
          <Text style={styles.sectionBody}>
            <Text style={styles.boldText}>Operational Reality:</Text> During 500+ day Mars transit, light propagation delay ranges from 4 to 24 minutes one-way (8 to 48 minutes round-trip), with periodic solar conjunction blackouts lasting up to 2 weeks. Earth telemedicine cannot triage acute medical events. The crew must operate autonomously.
          </Text>
        </View>

        {/* Real vs Simulated Data Catalog (Demanded by Judges) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="table-headers-eye" size={18} color={COLORS.cyan} />
            <Text style={styles.sectionTitle}>DATA HONESTY CATALOG: REAL VS SIMULATED</Text>
          </View>
          <Text style={styles.catalogIntro}>
            Judges require full honesty. Here is an exact accounting of every data source utilized:
          </Text>

          {/* Table Rows */}
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { flex: 1.8 }]}>DATA STREAM</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>STATUS</Text>
              <Text style={[styles.th, { flex: 2.2 }]}>OFFICIAL ENDPOINT / SOURCE</Text>
            </View>

            <View style={styles.tr}>
              <Text style={[styles.tdBold, { flex: 1.8 }]}>NASA DONKI (Space Weather)</Text>
              <View style={{ flex: 1.2 }}>
                <DataSourceBadge source="NASA_LIVE" compact />
              </View>
              <TouchableOpacity
                style={{ flex: 2.2 }}
                onPress={() => openUrl('https://api.nasa.gov/DONKI/notifications')}
              >
                <Text style={styles.tdLink}>api.nasa.gov/DONKI/notifications ↗</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tr}>
              <Text style={[styles.tdBold, { flex: 1.8 }]}>NASA OSDR (Open Science)</Text>
              <View style={{ flex: 1.2 }}>
                <DataSourceBadge source="NASA_LIVE" compact />
              </View>
              <TouchableOpacity
                style={{ flex: 2.2 }}
                onPress={() => openUrl('https://osdr.nasa.gov/osdr/data/search')}
              >
                <Text style={styles.tdLink}>osdr.nasa.gov/osdr/data/search ↗</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tr}>
              <Text style={[styles.tdBold, { flex: 1.8 }]}>NASA RadLab Dosimetry</Text>
              <View style={{ flex: 1.2 }}>
                <DataSourceBadge source="NASA_CACHED" compact />
              </View>
              <TouchableOpacity
                style={{ flex: 2.2 }}
                onPress={() => openUrl('https://visualization.osdr.nasa.gov/radlab/')}
              >
                <Text style={styles.tdLink}>Liulin-5 & DosTel-2 Flight Telemetry ↗</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tr}>
              <Text style={[styles.tdBold, { flex: 1.8 }]}>NASA HRR Evidence Reports</Text>
              <View style={{ flex: 1.2 }}>
                <DataSourceBadge source="NASA_CACHED" compact />
              </View>
              <TouchableOpacity
                style={{ flex: 2.2 }}
                onPress={() => openUrl('https://humanresearchroadmap.nasa.gov/')}
              >
                <Text style={styles.tdLink}>humanresearchroadmap.nasa.gov ↗</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tr}>
              <Text style={[styles.tdBold, { flex: 1.8 }]}>Astronaut Bio-Telemetry</Text>
              <View style={{ flex: 1.2 }}>
                <DataSourceBadge source="SIMULATED" compact />
              </View>
              <Text style={[styles.tdText, { flex: 2.2 }]}>
                Flight simulator data. Android Health Connect bridge ready for physical hardware.
              </Text>
            </View>

            <View style={styles.tr}>
              <Text style={[styles.tdBold, { flex: 1.8 }]}>Mars Comms Delay & Blackout</Text>
              <View style={{ flex: 1.2 }}>
                <DataSourceBadge source="SIMULATED" compact />
              </View>
              <Text style={[styles.tdText, { flex: 2.2 }]}>
                Physics-based light delay model (d = 2.24 AU, c = 300,000 km/s, Δt = 18m 42s).
              </Text>
            </View>
          </View>
        </View>

        {/* Formulas & Scientific Standards */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="calculator-variant" size={18} color={COLORS.cyan} />
            <Text style={styles.sectionTitle}>FORMULAS & CLINICAL THRESHOLDS</Text>
          </View>

          <View style={styles.formulaItem}>
            <Text style={styles.formulaName}>1. Vitality Index (Estimated Indicator - Not Official NASA Metric)</Text>
            <Text style={styles.formulaEquation}>
              Score = max(30, min(100, 100 - Σ PenaltyPoints))
            </Text>
            <Text style={styles.formulaExplanation}>
              Combines resting heart rate delta vs baseline (+15 pts if &gt;12 BPM), SpO2 deficit (+35 pts if &lt;95%), core body temperature elevation (+25 pts if &gt;37.5°C), sleep restriction (&lt;5.5h = +25 pts), and cabin CO2 elevation (&gt;3.5 mmHg = +20 pts).
            </Text>
          </View>

          <View style={styles.formulaItem}>
            <Text style={styles.formulaName}>2. Transparent Fatigue Rule (NASA HRR Sleep Evidence)</Text>
            <Text style={styles.formulaEquation}>
              IF (Sleep &lt; 5.5h AND RestingHR &gt; Baseline + 8 BPM) → HIGH FATIGUE RISK
            </Text>
            <Text style={styles.formulaExplanation}>
              Rule-based trigger derived from NASA Human Research Roadmap sleep loss evidence: sleep debt &lt;5.5h impairs cognitive vigilance and docking reaction time by &gt;35%.
            </Text>
          </View>

          <View style={styles.formulaItem}>
            <Text style={styles.formulaName}>3. Career Radiation Limit (NASA-STD-3001)</Text>
            <Text style={styles.formulaEquation}>
              Career Limit = 600 mSv (REID &lt; 3% at 95% Confidence Level)
            </Text>
            <Text style={styles.formulaExplanation}>
              Standard occupational astronaut limit across career. Biological dose equivalent H = D × Q, where Q ranges from 1.5 (protons) to &gt;10 (GCR heavy ions like Iron-56).
            </Text>
          </View>

          <View style={styles.formulaItem}>
            <Text style={styles.formulaName}>4. Countermeasure Exercise Target (NASA-STD-3001)</Text>
            <Text style={styles.formulaEquation}>Target = 90 min/day (ARED Resistive + T2 Treadmill / CEVIS)</Text>
            <Text style={styles.formulaExplanation}>
              Mandatory daily physical workload to restrict microgravity trabecular bone mineral loss to &lt;1% per month and prevent left ventricular cardiovascular atrophy.
            </Text>
          </View>
        </View>

        {/* Regulatory & Medical Disclaimer */}
        <View style={styles.disclaimerCard}>
          <MaterialCommunityIcons name="alert-box-outline" size={22} color="#FBBF24" />
          <View style={styles.disclaimerTextWrap}>
            <Text style={styles.disclaimerTitle}>NOT A MEDICAL DEVICE DISCLAIMER</Text>
            <Text style={styles.disclaimerBody}>
              ORBIT Health is an autonomous flight health decision-support software prototype developed for the NASA Space Apps Challenge 2026. It is NOT an FDA-cleared, CE-marked, or certified medical device. All outputs are for clinical decision support, astronaut self-monitoring, and ground surgeon coordination. Always contact Mission Control and follow certified flight medical kit instructions.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    marginTop: 4,
  },
  headerTextWrap: {
    flex: 1,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  pillBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  valuePropCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: 12,
  },
  valuePropTextWrap: {
    flex: 1,
  },
  valuePropHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  valuePropQuote: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E0F2FE',
    lineHeight: 17,
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.6,
  },
  sectionBody: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  boldText: {
    color: COLORS.cyan,
    fontWeight: '700',
  },
  catalogIntro: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  table: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(3, 7, 18, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  th: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.5,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tdBold: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tdLink: {
    fontSize: 10,
    color: COLORS.cyan,
    textDecorationLine: 'underline',
  },
  tdText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 13,
  },
  formulaItem: {
    backgroundColor: 'rgba(3, 7, 18, 0.5)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  formulaName: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  formulaEquation: {
    fontSize: 10.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: COLORS.cyan,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  formulaExplanation: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    padding: SPACING.md,
    gap: 12,
  },
  disclaimerTextWrap: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  disclaimerBody: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
});
