// Interactive Anatomical Digital Twin Model for Astronaut Physiological Monitoring
// Visual Vector Body Map with Touchable Organ System Hotspots & NASA Evidence Overlays

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  Path,
  G,
} from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/colors';

export type AnatomyHotspot =
  | 'NEURO'
  | 'CARDIO'
  | 'PULMONARY'
  | 'MUSCULO'
  | 'RADIATION'
  | 'THERMO';

interface AstronautAnatomyMapProps {
  activeHotspot?: AnatomyHotspot;
  onSelectHotspot?: (hotspot: AnatomyHotspot) => void;
  vitals?: {
    heartRate: number;
    spo2: number;
    temperature: number;
    fatigueLevel: number;
    radiationRate: number;
    boneRetention: number;
  };
}

export const AstronautAnatomyMap: React.FC<AstronautAnatomyMapProps> = ({
  activeHotspot = 'CARDIO',
  onSelectHotspot,
  vitals = {
    heartRate: 72,
    spo2: 98,
    temperature: 36.6,
    fatigueLevel: 3,
    radiationRate: 18.5,
    boneRetention: 98.8,
  },
}) => {
  const [selected, setSelected] = useState<AnatomyHotspot>(activeHotspot);

  const handlePress = (spot: AnatomyHotspot) => {
    setSelected(spot);
    if (onSelectHotspot) onSelectHotspot(spot);
  };

  const getHotspotDetail = () => {
    switch (selected) {
      case 'NEURO':
        return {
          title: 'NEURO-VESTIBULAR & FATIGUE',
          reading: `Fatigue: ${vitals.fatigueLevel}/10 • Circadian: Phase Delayed`,
          sub: 'Space motion adaptation nominal. Zero spatial disorientation detected.',
          citation: 'NASA HRR Neurovestibular Risk Assessment',
          icon: 'brain',
        };
      case 'CARDIO':
        return {
          title: 'CARDIOVASCULAR & HEMODYNAMICS',
          reading: `Heart Rate: ${vitals.heartRate} BPM • MAP: 91 mmHg`,
          sub: 'Cephalad microgravity fluid shift compensated by baroreflex reset.',
          citation: 'NASA OSDR (OSD-53) Spaceflight Hemodynamics',
          icon: 'heart-pulse',
        };
      case 'PULMONARY':
        return {
          title: 'PULMONARY & O2 EXCHANGE',
          reading: `Blood Oxygen: ${vitals.spo2}% SpO2 • Pleth: 99%`,
          sub: 'Alveolar gas diffusion nominal in 101.3 kPa cabin atmosphere.',
          citation: 'NASA HRP Cardiopulmonary Adaptations',
          icon: 'lungs',
        };
      case 'MUSCULO':
        return {
          title: 'MUSCULOSKELETAL INTEGRITY',
          reading: `Bone Retention: ${vitals.boneRetention}% • ARED Volume: 100%`,
          sub: 'Resistive exercise countermeasures active against microgravity osteopenia.',
          citation: 'NASA OSDR (OSD-37) Muscle Atrophy Countermeasures',
          icon: 'bone',
        };
      case 'RADIATION':
        return {
          title: 'RADIOBIOLOGICAL BURDEN',
          reading: `Rate: ${vitals.radiationRate} µSv/h • Liulin-5 Active`,
          sub: 'Galactic cosmic ray flux beneath extravehicular activity warning threshold.',
          citation: 'NASA RadLab Dosimetry Repository',
          icon: 'radioactive',
        };
      case 'THERMO':
      default:
        return {
          title: 'THERMOREGULATION & CORE',
          reading: `Core Temp: ${vitals.temperature}°C • Heat Flux: Nominal`,
          sub: 'Microgravity convection impairment counterbalanced by cabin airflow.',
          citation: 'NASA Human Research Program Thermal Balance',
          icon: 'thermometer',
        };
    }
  };

  const detail = getHotspotDetail();

  return (
    <View style={styles.container}>
      {/* Visual Silhouette & Hotspots */}
      <View style={styles.bodyMapWrapper}>
        <Svg width={240} height={260} viewBox="0 0 240 260">
          <Defs>
            <LinearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#00F2FE" stopOpacity="0.25" />
              <Stop offset="50%" stopColor="#0284C7" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.08" />
            </LinearGradient>

            <RadialGradient id="pulseGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#00F2FE" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#00F2FE" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Astronaut Stylized Silhouette */}
          <G stroke="#00F2FE" strokeWidth="1.2" strokeOpacity={0.6} fill="url(#bodyGradient)">
            {/* Helmet / Head */}
            <Circle cx="120" cy="36" r="22" />
            {/* Visor */}
            <Path d="M 106 32 Q 120 28 134 32 Q 134 42 120 44 Q 106 42 106 32 Z" fill="#00F2FE" opacity={0.4} />

            {/* Torso & Shoulders */}
            <Path d="M 98 62 L 72 80 L 80 140 L 98 135 L 102 170 L 138 170 L 142 135 L 160 140 L 168 80 L 142 62 Z" />

            {/* Left Arm */}
            <Path d="M 72 80 L 52 130 L 62 135 L 80 92 Z" />
            {/* Right Arm */}
            <Path d="M 168 80 L 188 130 L 178 135 L 160 92 Z" />

            {/* Left Leg */}
            <Path d="M 102 170 L 95 240 L 112 240 L 118 170 Z" />
            {/* Right Leg */}
            <Path d="M 138 170 L 145 240 L 128 240 L 122 170 Z" />
          </G>

          {/* Hotspot Target Markers */}
          {/* Neuro / Head Hotspot (120, 36) */}
          <Circle
            cx="120"
            cy="36"
            r={selected === 'NEURO' ? 12 : 7}
            fill={selected === 'NEURO' ? 'url(#pulseGlow)' : '#A855F7'}
            opacity={selected === 'NEURO' ? 0.9 : 0.6}
          />

          {/* Heart / Cardio Hotspot (126, 88) */}
          <Circle
            cx="126"
            cy="88"
            r={selected === 'CARDIO' ? 14 : 8}
            fill={selected === 'CARDIO' ? 'url(#pulseGlow)' : COLORS.cyan}
            opacity={selected === 'CARDIO' ? 1 : 0.7}
          />

          {/* Lungs / Pulmonary Hotspot (114, 88) */}
          <Circle
            cx="114"
            cy="88"
            r={selected === 'PULMONARY' ? 12 : 6}
            fill={selected === 'PULMONARY' ? 'url(#pulseGlow)' : '#38BDF8'}
            opacity={selected === 'PULMONARY' ? 0.9 : 0.5}
          />

          {/* Core / Thermoregulatory (120, 118) */}
          <Circle
            cx="120"
            cy="118"
            r={selected === 'THERMO' ? 12 : 6}
            fill={selected === 'THERMO' ? 'url(#pulseGlow)' : '#F59E0B'}
            opacity={selected === 'THERMO' ? 0.9 : 0.5}
          />

          {/* Spine / Musculoskeletal (120, 150) */}
          <Circle
            cx="120"
            cy="150"
            r={selected === 'MUSCULO' ? 12 : 6}
            fill={selected === 'MUSCULO' ? 'url(#pulseGlow)' : COLORS.statusNormal}
            opacity={selected === 'MUSCULO' ? 0.9 : 0.5}
          />

          {/* Dosimeter / Left Chest (134, 104) */}
          <Circle
            cx="134"
            cy="104"
            r={selected === 'RADIATION' ? 12 : 6}
            fill={selected === 'RADIATION' ? 'url(#pulseGlow)' : '#EF4444'}
            opacity={selected === 'RADIATION' ? 0.9 : 0.5}
          />
        </Svg>

        {/* Hotspot Touch Buttons */}
        <View style={styles.hotspotTouchColumn}>
          <TouchableOpacity
            style={[styles.spotChip, selected === 'NEURO' && styles.spotChipActive]}
            onPress={() => handlePress('NEURO')}
          >
            <MaterialCommunityIcons name="brain" size={14} color="#A855F7" />
            <Text style={styles.spotChipText}>Brain</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.spotChip, selected === 'CARDIO' && styles.spotChipActive]}
            onPress={() => handlePress('CARDIO')}
          >
            <MaterialCommunityIcons name="heart-pulse" size={14} color={COLORS.cyan} />
            <Text style={styles.spotChipText}>Heart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.spotChip, selected === 'PULMONARY' && styles.spotChipActive]}
            onPress={() => handlePress('PULMONARY')}
          >
            <MaterialCommunityIcons name="lungs" size={14} color="#38BDF8" />
            <Text style={styles.spotChipText}>Lungs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.spotChip, selected === 'THERMO' && styles.spotChipActive]}
            onPress={() => handlePress('THERMO')}
          >
            <MaterialCommunityIcons name="thermometer" size={14} color="#F59E0B" />
            <Text style={styles.spotChipText}>Core</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.spotChip, selected === 'MUSCULO' && styles.spotChipActive]}
            onPress={() => handlePress('MUSCULO')}
          >
            <MaterialCommunityIcons name="bone" size={14} color={COLORS.statusNormal} />
            <Text style={styles.spotChipText}>Spine</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.spotChip, selected === 'RADIATION' && styles.spotChipActive]}
            onPress={() => handlePress('RADIATION')}
          >
            <MaterialCommunityIcons name="radioactive" size={14} color="#EF4444" />
            <Text style={styles.spotChipText}>Dose</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected System Interactive Detail Box */}
      <View style={styles.detailBox}>
        <View style={styles.detailTop}>
          <MaterialCommunityIcons name={detail.icon as any} size={16} color={COLORS.cyan} />
          <Text style={styles.detailTitle}>{detail.title}</Text>
        </View>
        <Text style={styles.detailReading}>{detail.reading}</Text>
        <Text style={styles.detailSub}>{detail.sub}</Text>
        <View style={styles.citationRow}>
          <MaterialCommunityIcons name="link-variant" size={12} color={COLORS.cyan} />
          <Text style={styles.citationText}>{detail.citation}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 18,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    marginBottom: SPACING.lg,
  },
  bodyMapWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  hotspotTouchColumn: {
    gap: 6,
  },
  spotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceCardSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  spotChipActive: {
    borderColor: COLORS.cyan,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  spotChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  detailBox: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surfaceCardSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  detailTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: COLORS.cyan,
    letterSpacing: 0.8,
  },
  detailReading: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  detailSub: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    lineHeight: 14,
    marginBottom: 6,
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 4,
  },
  citationText: {
    fontSize: 9,
    color: COLORS.cyan,
    fontWeight: '700',
  },
});
