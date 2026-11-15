import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme/colors';
import { MainNavTab } from '../types/astronaut';

interface BottomNavBarProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
}

interface NavItem {
  key: MainNavTab;
  labelKey: string;
  defaultLabel: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', labelKey: 'nav.dashboard', defaultLabel: 'Dashboard', icon: 'view-dashboard-variant-outline' },
  { key: 'twin', labelKey: 'nav.twin', defaultLabel: 'Twin', icon: 'human' },
  { key: 'fitness', labelKey: 'nav.fitness', defaultLabel: 'Fitness', icon: 'weight-lifter' },
  { key: 'emergency', labelKey: 'nav.emergency', defaultLabel: 'Emergency', icon: 'shield-alert-outline' },
  { key: 'assistant', labelKey: 'nav.assistant', defaultLabel: 'AI Advisor', icon: 'brain' },
  { key: 'profile', labelKey: 'nav.profile', defaultLabel: 'Profile', icon: 'account-circle-outline' },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentTab === item.key;
          const translatedLabel = t(item.labelKey, item.defaultLabel);

          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => onSelectTab(item.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${translatedLabel} tab`}
            >
              {/* Active Indicator Top Glow */}
              {isActive && <View style={styles.activeGlowBar} />}

              <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={isActive ? COLORS.cyan : COLORS.textMuted}
                />
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {translatedLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#070E22',
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.22)',
    paddingBottom: SPACING.md,
    paddingTop: SPACING.xs,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  tabButtonActive: {},
  activeGlowBar: {
    position: 'absolute',
    top: -SPACING.xs,
    width: 28,
    height: 3,
    backgroundColor: COLORS.cyan,
    borderRadius: 2,
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    padding: 3,
    borderRadius: 10,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
  },
  tabLabel: {
    fontSize: 9.5,
    marginTop: 2,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.cyan,
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: COLORS.textMuted,
  },
});
