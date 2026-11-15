// ============================================================================
// ORBIT HEALTH — ASTRONAUT SPACEWALK (EVA) CARTOON / STYLIZED 3D ANIMATION
// Stylized Cartoon Astronaut floating in zero-G above Planet Earth
// Distant panoramic framing, gentle floating kinematics, radiant Sun, and space sparkles
// ============================================================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Circle,
  Path,
  G,
  Ellipse,
} from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SpacewalkBackgroundProps {
  children?: React.ReactNode;
}

export const SpacewalkBackground: React.FC<SpacewalkBackgroundProps> = ({ children }) => {
  // Continuous smooth floating animations
  const floatY = useRef(new Animated.Value(0)).current;
  const floatX = useRef(new Animated.Value(0)).current;
  const floatRotate = useRef(new Animated.Value(0)).current;
  const sunShimmer = useRef(new Animated.Value(0.8)).current;
  const sunRotate = useRef(new Animated.Value(0)).current;
  const earthAtmoPulse = useRef(new Animated.Value(0.7)).current;
  const starsTwinkle = useRef(new Animated.Value(0.4)).current;
  const thrusterPulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // 1. Serene vertical zero-gravity floating oscillation
    const floatYAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: 1,
          duration: 3400,
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: -1,
          duration: 3600,
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Gentle sideways drift
    const floatXAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(floatX, {
          toValue: 1,
          duration: 4400,
          useNativeDriver: true,
        }),
        Animated.timing(floatX, {
          toValue: -1,
          duration: 4600,
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Subtle organic roll / rotation
    const floatRotAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(floatRotate, {
          toValue: 1,
          duration: 5200,
          useNativeDriver: true,
        }),
        Animated.timing(floatRotate, {
          toValue: -1,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    );

    // 4. Sun flare shimmer & rotation
    const sunPulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(sunShimmer, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sunShimmer, {
          toValue: 0.65,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    const sunRotAnim = Animated.loop(
      Animated.timing(sunRotate, {
        toValue: 1,
        duration: 18000,
        useNativeDriver: true,
      })
    );

    // 5. Earth atmospheric glow pulse
    const atmoAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(earthAtmoPulse, {
          toValue: 0.95,
          duration: 3200,
          useNativeDriver: true,
        }),
        Animated.timing(earthAtmoPulse, {
          toValue: 0.55,
          duration: 3200,
          useNativeDriver: true,
        }),
      ])
    );

    // 6. Stars twinkling
    const starAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(starsTwinkle, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(starsTwinkle, {
          toValue: 0.35,
          duration: 2400,
          useNativeDriver: true,
        }),
      ])
    );

    // 7. Thruster subtle micro-puff
    const thrusterAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(thrusterPulse, {
          toValue: 0.85,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(thrusterPulse, {
          toValue: 0.2,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );

    floatYAnim.start();
    floatXAnim.start();
    floatRotAnim.start();
    sunPulseAnim.start();
    sunRotAnim.start();
    atmoAnim.start();
    starAnim.start();
    thrusterAnim.start();

    return () => {
      floatYAnim.stop();
      floatXAnim.stop();
      floatRotAnim.stop();
      sunPulseAnim.stop();
      sunRotAnim.stop();
      atmoAnim.stop();
      starAnim.stop();
      thrusterAnim.stop();
    };
  }, [floatY, floatX, floatRotate, sunShimmer, sunRotate, earthAtmoPulse, starsTwinkle, thrusterPulse]);

  // Interpolations for the floating cartoon astronaut
  const translateY = floatY.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [12, 0, -14],
  });

  const translateX = floatX.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-9, 0, 9],
  });

  const rotate = floatRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3deg', '0deg', '3deg'],
  });

  const sunRayRotate = sunRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const earthCurvatureHeight = Math.max(SCREEN_HEIGHT * 0.44, 340);

  return (
    <View style={styles.container}>
      {/* 1. Deep Space Cosmic Canvas with Stars */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          <Defs>
            <LinearGradient id="cosmosGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#02040B" />
              <Stop offset="40%" stopColor="#050B1E" />
              <Stop offset="75%" stopColor="#071330" />
              <Stop offset="100%" stopColor="#0B1A40" />
            </LinearGradient>

            <RadialGradient id="nebulaSoft" cx="30%" cy="30%" rx="60%" ry="45%">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.12" />
              <Stop offset="50%" stopColor="#1E3A8A" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#02040B" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#cosmosGrad)" />
          <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#nebulaSoft)" />

          {/* Stylized Cartoon Stars & Sparkles (✦) */}
          {[
            { x: 30, y: 70, s: 1.2 },
            { x: 80, y: 140, s: 2.0 },
            { x: 140, y: 50, s: 1.4 },
            { x: 230, y: 110, s: 2.4 },
            { x: 310, y: 65, s: 1.6 },
            { x: 360, y: 150, s: 1.8 },
            { x: 50, y: 240, s: 1.3 },
            { x: 120, y: 310, s: 2.2 },
            { x: 280, y: 260, s: 1.5 },
            { x: 340, y: 340, s: 2.0 },
            { x: 40, y: 410, s: 1.4 },
            { x: 200, y: 390, s: 1.8 },
          ].map((st, i) => (
            <G key={i} transform={`translate(${st.x * (SCREEN_WIDTH / 400)}, ${st.y * (SCREEN_HEIGHT / 800)})`}>
              <Circle cx="0" cy="0" r={st.s} fill="#FFFFFF" opacity={0.8} />
              {/* 4-point sparkle cross on larger stars */}
              {st.s >= 2.0 && (
                <>
                  <Path d={`M -${st.s * 2.5} 0 L ${st.s * 2.5} 0`} stroke="#7DD3FC" strokeWidth="0.8" opacity={0.6} />
                  <Path d={`M 0 -${st.s * 2.5} L 0 ${st.s * 2.5}`} stroke="#7DD3FC" strokeWidth="0.8" opacity={0.6} />
                </>
              )}
            </G>
          ))}
        </Svg>
      </View>

      {/* 2. Radiant Cartoon Sun with Optical Starburst (Upper-Left) */}
      <View style={styles.sunWrapper} pointerEvents="none">
        {/* Rotating Sun Rays */}
        <Animated.View
          style={[
            styles.sunRayContainer,
            {
              transform: [{ rotate: sunRayRotate }],
              opacity: sunShimmer,
            },
          ]}
        >
          <Svg width={160} height={160} viewBox="0 0 160 160">
            <Defs>
              <RadialGradient id="sunBeamGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <Stop offset="30%" stopColor="#FDE047" stopOpacity="0.45" />
                <Stop offset="65%" stopColor="#38BDF8" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            {/* 8-point ray starburst */}
            <Path d="M 0 80 L 160 80" stroke="#FFFFFF" strokeWidth="2.2" opacity={0.75} />
            <Path d="M 80 0 L 80 160" stroke="#FFFFFF" strokeWidth="2.2" opacity={0.75} />
            <Path d="M 23 23 L 137 137" stroke="#FDE047" strokeWidth="1.6" opacity={0.6} />
            <Path d="M 137 23 L 23 137" stroke="#FDE047" strokeWidth="1.6" opacity={0.6} />
            <Circle cx="80" cy="80" r="70" fill="url(#sunBeamGrad)" />
          </Svg>
        </Animated.View>

        {/* Brilliant Sun Core */}
        <View style={styles.sunCoreGlow}>
          <Svg width={60} height={60} viewBox="0 0 60 60">
            <Defs>
              <RadialGradient id="coreGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <Stop offset="45%" stopColor="#FEF08A" stopOpacity="0.9" />
                <Stop offset="75%" stopColor="#F59E0B" stopOpacity="0.5" />
                <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="30" cy="30" r="28" fill="url(#coreGrad)" />
            <Circle cx="30" cy="30" r="10" fill="#FFFFFF" />
          </Svg>
        </View>
      </View>

      {/* 3. Stylized Planet Earth Below (Majestic Curved Horizon & Clouds) */}
      <View style={styles.earthContainer} pointerEvents="none">
        <Svg width={SCREEN_WIDTH} height={earthCurvatureHeight} viewBox={`0 0 ${SCREEN_WIDTH} ${earthCurvatureHeight}`}>
          <Defs>
            {/* Atmospheric Outer Halo Glow */}
            <LinearGradient id="earthAtmoGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#00F2FE" stopOpacity="0.55" />
              <Stop offset="25%" stopColor="#0284C7" stopOpacity="0.3" />
              <Stop offset="65%" stopColor="#0369A1" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#030712" stopOpacity="0" />
            </LinearGradient>

            {/* Earth Ocean Surface Gradient */}
            <LinearGradient id="earthOcean" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#0284C7" />
              <Stop offset="30%" stopColor="#0369A1" />
              <Stop offset="70%" stopColor="#075985" />
              <Stop offset="100%" stopColor="#0C4A6E" />
            </LinearGradient>

            {/* Earth Horizon Rim Lighting */}
            <LinearGradient id="rimLight" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <Stop offset="35%" stopColor="#38BDF8" stopOpacity="0.8" />
              <Stop offset="70%" stopColor="#0284C7" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#075985" stopOpacity="0.2" />
            </LinearGradient>
          </Defs>

          {/* Earth Atmospheric Glow Layer */}
          <Path
            d={`M -50 ${earthCurvatureHeight} Q ${SCREEN_WIDTH * 0.5} 15 ${SCREEN_WIDTH + 50} ${earthCurvatureHeight} Z`}
            fill="url(#earthAtmoGlow)"
          />

          {/* Earth Solid Curvature Body */}
          <Path
            d={`M -50 ${earthCurvatureHeight} Q ${SCREEN_WIDTH * 0.5} 35 ${SCREEN_WIDTH + 50} ${earthCurvatureHeight} Z`}
            fill="url(#earthOcean)"
          />

          {/* Stylized Cartoon Continents (Emerald green / cyan landmasses) */}
          <G opacity={0.65}>
            {/* Continent 1 (Left) */}
            <Path
              d={`M ${SCREEN_WIDTH * 0.08} ${earthCurvatureHeight * 0.35} 
                  Q ${SCREEN_WIDTH * 0.18} ${earthCurvatureHeight * 0.28} ${SCREEN_WIDTH * 0.28} ${earthCurvatureHeight * 0.45}
                  Q ${SCREEN_WIDTH * 0.22} ${earthCurvatureHeight * 0.6} ${SCREEN_WIDTH * 0.12} ${earthCurvatureHeight * 0.52} Z`}
              fill="#10B981"
            />
            {/* Continent 2 (Right) */}
            <Path
              d={`M ${SCREEN_WIDTH * 0.62} ${earthCurvatureHeight * 0.38} 
                  Q ${SCREEN_WIDTH * 0.78} ${earthCurvatureHeight * 0.26} ${SCREEN_WIDTH * 0.92} ${earthCurvatureHeight * 0.42}
                  Q ${SCREEN_WIDTH * 0.85} ${earthCurvatureHeight * 0.65} ${SCREEN_WIDTH * 0.7} ${earthCurvatureHeight * 0.55} Z`}
              fill="#059669"
            />
          </G>

          {/* Stylized Cartoon Swirling Cloud Bands */}
          <G opacity={0.78}>
            {/* Cloud stream 1 (Top rim) */}
            <Path
              d={`M ${SCREEN_WIDTH * 0.05} ${earthCurvatureHeight * 0.28}
                  Q ${SCREEN_WIDTH * 0.32} ${earthCurvatureHeight * 0.22} ${SCREEN_WIDTH * 0.55} ${earthCurvatureHeight * 0.32}
                  Q ${SCREEN_WIDTH * 0.42} ${earthCurvatureHeight * 0.36} ${SCREEN_WIDTH * 0.15} ${earthCurvatureHeight * 0.32} Z`}
              fill="#FFFFFF"
            />
            {/* Cloud stream 2 (Center swirling vortex) */}
            <Ellipse
              cx={SCREEN_WIDTH * 0.45}
              cy={earthCurvatureHeight * 0.48}
              rx={SCREEN_WIDTH * 0.18}
              ry={22}
              fill="#FFFFFF"
              opacity={0.8}
              transform={`rotate(-8 ${SCREEN_WIDTH * 0.45} ${earthCurvatureHeight * 0.48})`}
            />
            {/* Cloud stream 3 (Right) */}
            <Path
              d={`M ${SCREEN_WIDTH * 0.68} ${earthCurvatureHeight * 0.36}
                  Q ${SCREEN_WIDTH * 0.82} ${earthCurvatureHeight * 0.3} ${SCREEN_WIDTH * 0.96} ${earthCurvatureHeight * 0.4}
                  Q ${SCREEN_WIDTH * 0.85} ${earthCurvatureHeight * 0.46} ${SCREEN_WIDTH * 0.72} ${earthCurvatureHeight * 0.42} Z`}
              fill="#FFFFFF"
            />
          </G>

          {/* Sharp Vibrant Atmospheric Horizon Line */}
          <Path
            d={`M -50 ${earthCurvatureHeight} Q ${SCREEN_WIDTH * 0.5} 35 ${SCREEN_WIDTH + 50} ${earthCurvatureHeight}`}
            stroke="url(#rimLight)"
            strokeWidth="3"
            fill="none"
          />
        </Svg>
      </View>

      {/* 4. Stylized Cartoon Astronaut Floating in Distant View ("yungul hereket etsin havada suzulsun") */}
      <Animated.View
        style={[
          styles.astronautFloatContainer,
          {
            transform: [
              { translateY },
              { translateX },
              { rotate },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={230} height={270} viewBox="0 0 230 270">
          <Defs>
            {/* Gold Visor Metallic Mirror Gradient */}
            <LinearGradient id="visorGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FEF08A" />
              <Stop offset="25%" stopColor="#F59E0B" />
              <Stop offset="65%" stopColor="#D97706" />
              <Stop offset="100%" stopColor="#78350F" />
            </LinearGradient>

            {/* Astronaut Spacesuit Shading Gradient */}
            <LinearGradient id="suitShade" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="60%" stopColor="#E2E8F0" />
              <Stop offset="100%" stopColor="#94A3B8" />
            </LinearGradient>

            {/* Backpack Life Support Shading */}
            <LinearGradient id="backpackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#334155" />
              <Stop offset="50%" stopColor="#1E293B" />
              <Stop offset="100%" stopColor="#0F172A" />
            </LinearGradient>

            {/* Thruster Mist Glow */}
            <RadialGradient id="thrusterMist" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#00F2FE" stopOpacity="0.8" />
              <Stop offset="50%" stopColor="#0284C7" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#030712" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* --- ASTRONAUT BACKPACK (PLSS / MMU) --- */}
          <G id="backpack">
            {/* Main Backpack Unit */}
            <Rect x="72" y="58" width="86" height="105" rx="14" fill="url(#backpackGrad)" stroke="#38BDF8" strokeWidth="2" />

            {/* Dual Oxygen Cylinders */}
            <Rect x="64" y="65" width="18" height="78" rx="8" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
            <Rect x="148" y="65" width="18" height="78" rx="8" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />

            {/* Comm Antenna Mast */}
            <Path d="M 152 65 L 175 22" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
            <Circle cx="175" cy="22" r="3.5" fill="#EF4444" />

            {/* MMU Thruster Pods (Left & Right) with animated micro-puff glow */}
            <Rect x="54" y="80" width="14" height="22" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
            <Rect x="162" y="80" width="14" height="22" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
            {/* Thruster Puffs */}
            <Circle cx="48" cy="91" r="12" fill="url(#thrusterMist)" />
            <Circle cx="182" cy="91" r="12" fill="url(#thrusterMist)" />
          </G>

          {/* --- LEGS (Trailing in Weightlessness with Joint Rings) --- */}
          <G id="legs">
            {/* Left Leg */}
            <G transform="rotate(6 95 160)">
              {/* Thigh */}
              <Rect x="86" y="152" width="22" height="42" rx="9" fill="url(#suitShade)" stroke="#475569" strokeWidth="2" />
              <Path d="M 86 172 L 108 172" stroke="#64748B" strokeWidth="2" />
              {/* Boot */}
              <Rect x="84" y="190" width="24" height="38" rx="8" fill="url(#suitShade)" stroke="#475569" strokeWidth="2" />
              {/* Boot Sole */}
              <Path d="M 82 224 Q 96 230 112 224 L 112 218 L 82 218 Z" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
            </G>

            {/* Right Leg (Trailing slightly back) */}
            <G transform="rotate(-8 135 160)">
              {/* Thigh */}
              <Rect x="122" y="152" width="22" height="44" rx="9" fill="url(#suitShade)" stroke="#475569" strokeWidth="2" />
              <Path d="M 122 172 L 144 172" stroke="#64748B" strokeWidth="2" />
              {/* Boot */}
              <Rect x="122" y="192" width="24" height="40" rx="8" fill="url(#suitShade)" stroke="#475569" strokeWidth="2" />
              {/* Boot Sole */}
              <Path d="M 120 228 Q 134 234 150 228 L 150 222 L 120 222 Z" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
            </G>
          </G>

          {/* --- TORSO & CHEST PACK --- */}
          <G id="torso">
            {/* Main Puffy Spacesuit Body */}
            <Rect x="80" y="75" width="70" height="85" rx="20" fill="url(#suitShade)" stroke="#475569" strokeWidth="2.5" />

            {/* Chest Utility Module (DCM) */}
            <Rect x="94" y="90" width="42" height="48" rx="8" fill="#0F172A" stroke="#0284C7" strokeWidth="2" />

            {/* DCM Status Telemetry LEDs */}
            <Circle cx="104" cy="100" r="3" fill="#10B981" />
            <Circle cx="115" cy="100" r="3" fill="#00E5FF" />
            <Circle cx="126" cy="100" r="3" fill="#F59E0B" />

            {/* NASA Chevron Red Wing Patch */}
            <Path d="M 100 118 L 115 110 L 130 118 L 115 114 Z" fill="#EF4444" />

            {/* Waist Utility Belt & Ring */}
            <Path d="M 80 148 L 150 148" stroke="#38BDF8" strokeWidth="3" />
            <Circle cx="115" cy="148" r="4.5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
          </G>

          {/* --- ARMS (Floating in Microgravity) --- */}
          <G id="arms">
            {/* Left Arm (Floating outwards) */}
            <G transform="rotate(-12 80 85)">
              <Rect x="54" y="80" width="22" height="42" rx="9" fill="url(#suitShade)" stroke="#475569" strokeWidth="2" />
              <Path d="M 54 100 L 76 100" stroke="#64748B" strokeWidth="2" />
              {/* Forearm */}
              <Rect x="46" y="118" width="22" height="38" rx="8" fill="url(#suitShade)" stroke="#475569" strokeWidth="2" />
              {/* Pressurized Glove */}
              <Circle cx="55" cy="158" r="11" fill="#334155" stroke="#38BDF8" strokeWidth="1.5" />
              <Path d="M 48 158 Q 55 165 62 158" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
            </G>

            {/* Right Arm (Waving gently forward) */}
            <G transform="rotate(14 150 85)">
              <Rect x="154" y="80" width="22" height="42" rx="9" fill="url(#suitShade)" stroke="#475569" strokeWidth="2" />
              <Path d="M 154 100 L 176 100" stroke="#64748B" strokeWidth="2" />
              {/* Forearm */}
              <Rect x="162" y="118" width="22" height="38" rx="8" fill="url(#suitShade)" stroke="#475569" strokeWidth="2" />
              {/* Pressurized Glove */}
              <Circle cx="175" cy="158" r="11" fill="#334155" stroke="#38BDF8" strokeWidth="1.5" />
              <Path d="M 168 158 Q 175 165 182 158" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
            </G>
          </G>

          {/* --- HELMET & GOLD METALLIC VISOR --- */}
          <G id="helmet">
            {/* Helmet Shell Outer Contour */}
            <Circle cx="115" cy="54" r="34" fill="url(#suitShade)" stroke="#334155" strokeWidth="2.5" />

            {/* Helmet Side Lights (Dual LED Torches) */}
            <Rect x="76" y="46" width="6" height="14" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
            <Rect x="148" y="46" width="6" height="14" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
            <Circle cx="79" cy="53" r="2.5" fill="#FFFFFF" />
            <Circle cx="151" cy="53" r="2.5" fill="#FFFFFF" />

            {/* Large Spherical Golden Visor (Iconic NASA Gold Mirror Coating) */}
            <Ellipse cx="115" cy="54" rx="24" ry="19" fill="url(#visorGold)" stroke="#78350F" strokeWidth="2" />

            {/* Earth Reflection on Visor Curve (Cyan / Blue curve) */}
            <Path
              d="M 97 58 Q 115 67 133 58 Q 128 69 115 70 Q 102 69 97 58 Z"
              fill="rgba(56, 189, 248, 0.65)"
            />

            {/* Sunlight Specular Flare Gleam on Visor Corner */}
            <Path
              d="M 102 42 Q 112 38 124 40"
              stroke="#FFFFFF"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
              opacity={0.95}
            />
            <Circle cx="106" cy="48" r="2.5" fill="#FFFFFF" opacity={0.8} />

            {/* Helmet Neck Ring Interlock */}
            <Path d="M 94 82 L 136 82" stroke="#00F2FE" strokeWidth="3" strokeLinecap="round" />
          </G>
        </Svg>
      </Animated.View>

      {/* 5. Dark Navy Glass Vignette for Button Readability */}
      <View style={styles.topVignette} pointerEvents="none" />
      <View style={styles.bottomVignette} pointerEvents="none" />

      {/* 6. Foreground Screen Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02040B',
    overflow: 'hidden',
  },
  sunWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    left: 12,
    zIndex: 2,
  },
  sunRayContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunCoreGlow: {
    position: 'absolute',
    top: 50,
    left: 50,
  },
  earthContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  astronautFloatContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.16,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    // Distant / wide perspective scale so astronaut floats gracefully above Earth
    transform: [{ scale: 0.92 }],
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(2, 4, 11, 0.45)',
    zIndex: 5,
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(2, 4, 11, 0.72)',
    zIndex: 5,
  },
  content: {
    flex: 1,
    zIndex: 10,
  },
});
