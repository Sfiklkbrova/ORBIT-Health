import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Header } from '../components/Header';
import { HealthStatusCard } from '../components/HealthStatusCard';
import { VitalCard } from '../components/VitalCard';
import { AiInsightsCard } from '../components/AiInsightsCard';
import { AnalysisModal } from '../components/AnalysisModal';
import {
  DEMO_VITALS,
  DEMO_HEALTH_STATUS,
  DEMO_AI_INSIGHT,
} from '../data/demoData';
import { COLORS, SPACING } from '../theme/colors';
import { VitalMetric, TabType } from '../types/health';

interface HomeScreenProps {
  onNavigateTab: (tab: TabType) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateTab }) => {
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);

  const handleSelectVital = (vital: VitalMetric) => {
    Alert.alert(
      `${vital.name} Telemetry`,
      `Sample Value: ${vital.value} ${vital.unit}\nStatus: ${vital.status}\n\n${vital.subtext}\n${vital.changeText}\n\nNote: This is simulated demo telemetry for ORBIT Health.`,
      [{ text: 'Dismiss', style: 'cancel' }]
    );
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header */}
        <Header
          welcomeName="Commander Alex"
          onPressProfile={() => onNavigateTab('profile')}
        />

        {/* 3. Health Status (Visual Health Overview + Daily Activity Indicator) */}
        <HealthStatusCard statusData={DEMO_HEALTH_STATUS} />

        {/* 2. Health Overview Cards */}
        <View style={styles.sectionHeaderContainer}>
          <View>
            <Text style={styles.sectionTitle}>HEALTH OVERVIEW</Text>
            <Text style={styles.sectionSubtitle}>Real-time simulated telemetry feed</Text>
          </View>
          <View style={styles.sampleBadge}>
            <Text style={styles.sampleBadgeText}>SAMPLE VALUES</Text>
          </View>
        </View>

        <View style={styles.vitalsGrid}>
          {DEMO_VITALS.map((metric) => (
            <VitalCard
              key={metric.id}
              metric={metric}
              onPress={handleSelectVital}
            />
          ))}
        </View>

        {/* 4. AI Insights Card */}
        <AiInsightsCard
          insight={DEMO_AI_INSIGHT}
          onPressViewAnalysis={() => setAnalysisModalVisible(true)}
        />
      </ScrollView>

      {/* Detailed Analysis Modal */}
      <AnalysisModal
        visible={analysisModalVisible}
        onClose={() => setAnalysisModalVisible(false)}
        insight={DEMO_AI_INSIGHT}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  sampleBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  sampleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
});

