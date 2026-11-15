import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme/colors';

interface BeyondSpaceScreenProps {
  onBack?: () => void;
}

interface EarthDomainCard {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  titleKey: string;
  descKey: string;
  defaultTitle: string;
  defaultDesc: string;
  tag: string;
  badgeColor: string;
}

export const BeyondSpaceScreen: React.FC<BeyondSpaceScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();

  const domains: EarthDomainCard[] = [
    {
      id: 'polar',
      icon: 'snowflake',
      titleKey: 'beyondSpace.polar',
      descKey: 'beyondSpace.polarDesc',
      defaultTitle: 'Polar & Antarctic Research Stations',
      defaultDesc:
        'Zero-bandwidth autonomous health diagnostics for winter-over scientific teams completely isolated from telemedicine for 6+ months during severe blizzards.',
      tag: 'Zero Telemedicine Bandwidth',
      badgeColor: '#38BDF8',
    },
    {
      id: 'remote',
      icon: 'hospital-building',
      titleKey: 'beyondSpace.remote',
      descKey: 'beyondSpace.remoteDesc',
      defaultTitle: 'Remote Rural & Indigenous Clinics',
      defaultDesc:
        'Offline AI clinical decision support for community health workers operating in off-grid rural regions lacking cellular and fiber network infrastructure.',
      tag: 'Disconnected Healthcare',
      badgeColor: '#34D399',
    },
    {
      id: 'maritime',
      icon: 'ferry',
      titleKey: 'beyondSpace.maritime',
      descKey: 'beyondSpace.maritimeDesc',
      defaultTitle: 'Deep-Sea Maritime & Submarines',
      defaultDesc:
        'Mission-critical physiological monitoring and clinical protocols for naval and submarine crews operating under strict electronic and radio emission silence.',
      tag: 'Radio Silence Operations',
      badgeColor: '#818CF8',
    },
    {
      id: 'rescue',
      icon: 'hiking',
      titleKey: 'beyondSpace.rescue',
      descKey: 'beyondSpace.rescueDesc',
      defaultTitle: 'Disaster Response & Mountain SAR',
      defaultDesc:
        'Ruggedized offline triage workflows deployed when earthquakes, hurricanes, or avalanches sever terrestrial power grids and cellular towers.',
      tag: 'Infrastructure-Free Triage',
      badgeColor: '#F59E0B',
    },
    {
      id: 'elderly',
      icon: 'home-heart',
      titleKey: 'beyondSpace.elderly',
      descKey: 'beyondSpace.elderlyDesc',
      defaultTitle: 'Off-Grid Elder Remote Care',
      defaultDesc:
        'Continuous physiological drift detection and early decompensation warnings for homebound elderly individuals living in disconnected rural and mountainous valleys.',
      tag: 'Autonomous Drift Detection',
      badgeColor: '#F472B6',
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.cyan} />
            </TouchableOpacity>
          )}
          <View style={styles.headerTextWrap}>
            <View style={styles.headerTopPill}>
              <MaterialCommunityIcons name="earth" size={13} color={COLORS.cyan} />
              <Text style={styles.headerTopPillText}>DUAL-USE TECHNOLOGY TRANSFER</Text>
            </View>
            <Text style={styles.headerTitle}>{t('beyondSpace.title', 'Beyond Space: Earth Impact')}</Text>
            <Text style={styles.headerSub}>
              {t(
                'beyondSpace.subtitle',
                'Extending deep-space offline medical autonomy to extreme environments and underserved populations on Earth.'
              )}
            </Text>
          </View>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <MaterialCommunityIcons name="compass-rose" size={28} color={COLORS.cyan} />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTagline}>
              {t('beyondSpace.tagline', 'NASA Technology Benefiting Humanity')}
            </Text>
            <Text style={styles.heroBody}>
              Every clinical decision model, offline RAG pipeline, and local SQLite database engine engineered for Mars transit also solves a fundamental crisis on Earth: delivering reliable medical guidance when there is no cloud, no cell tower, and no doctor for hundreds of miles.
            </Text>
          </View>
        </View>

        {/* 5 Earth Impact Domains Grid */}
        <View style={styles.domainsList}>
          {domains.map((d) => (
            <View key={d.id} style={styles.domainCard}>
              <View style={styles.cardTopRow}>
                <View style={[styles.iconCircle, { borderColor: d.badgeColor }]}>
                  <MaterialCommunityIcons name={d.icon} size={22} color={d.badgeColor} />
                </View>
                <View style={[styles.domainBadge, { backgroundColor: `${d.badgeColor}18`, borderColor: `${d.badgeColor}40` }]}>
                  <Text style={[styles.domainBadgeText, { color: d.badgeColor }]}>{d.tag}</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>{t(d.titleKey, d.defaultTitle)}</Text>
              <Text style={styles.cardDesc}>{t(d.descKey, d.defaultDesc)}</Text>

              <View style={styles.featurePillRow}>
                <View style={styles.featurePill}>
                  <MaterialCommunityIcons name="wifi-off" size={11} color={COLORS.textMuted} />
                  <Text style={styles.featurePillText}>100% Offline</Text>
                </View>
                <View style={styles.featurePill}>
                  <MaterialCommunityIcons name="database-check" size={11} color={COLORS.textMuted} />
                  <Text style={styles.featurePillText}>Local SQLite Storage</Text>
                </View>
                <View style={styles.featurePill}>
                  <MaterialCommunityIcons name="brain" size={11} color={COLORS.textMuted} />
                  <Text style={styles.featurePillText}>Edge AI Inference</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Architecture Value Proposition Banner */}
        <View style={styles.footerCard}>
          <MaterialCommunityIcons name="shield-airplane" size={24} color={COLORS.cyan} />
          <View style={styles.footerTextWrap}>
            <Text style={styles.footerTitle}>OFFLINE-FIRST RESILIENCE</Text>
            <Text style={styles.footerBody}>
              Whether in deep space transit at 2.24 AU from Earth or at -50°C at Amundsen-Scott South Pole Station, ORBIT Health guarantees deterministic, peer-reviewed clinical decision support without single-point cloud failures.
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
  headerTopPill: {
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
  headerTopPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 12,
  },
  heroLeft: {
    marginTop: 2,
  },
  heroContent: {
    flex: 1,
  },
  heroTagline: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.cyan,
    marginBottom: 4,
  },
  heroBody: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  domainsList: {
    gap: SPACING.md,
  },
  domainCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: SPACING.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  domainBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  featurePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(3, 7, 18, 0.6)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  featurePillText: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  footerCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    padding: SPACING.md,
    marginTop: SPACING.lg,
    gap: 12,
  },
  footerTextWrap: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footerBody: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
});
