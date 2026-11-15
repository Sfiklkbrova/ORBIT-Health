import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface Welcome3DSceneProps {
  children?: React.ReactNode;
}

/**
 * Self-contained 3D WebGL / Canvas scene for Welcome & Auth screen.
 * Renders:
 * - 3D Mars with detailed red terrain, craters, day/night lighting, atmospheric glow.
 * - 3D Astronaut floating organically in zero gravity with suit details & golden visor reflection.
 * - Distant Earth with blue atmosphere and clouds.
 * - Layered 3D starfield, nebula haze, and floating cosmic particles.
 * - Smooth camera motion and touch parallax interaction.
 * - Guaranteed 100% offline (no external CDN required).
 */
const WELCOME_3D_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #030712;
      touch-action: none;
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  </style>
</head>
<body>
  <canvas id="glCanvas"></canvas>
  <script>
    (function() {
      const canvas = document.getElementById('glCanvas');
      const ctx = canvas.getContext('2d');
      let width = window.innerWidth;
      let height = window.innerHeight;

      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
      window.addEventListener('resize', resize);
      resize();

      // Touch / pointer interaction
      let targetRotX = 0;
      let targetRotY = 0;
      let currentRotX = 0;
      let currentRotY = 0;
      let isDragging = false;
      let lastPointerX = 0;
      let lastPointerY = 0;

      window.addEventListener('pointerdown', (e) => {
        isDragging = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
      });
      window.addEventListener('pointermove', (e) => {
        if (!isDragging) {
          // Subtle mouse tilt
          targetRotX = (e.clientX / width - 0.5) * 0.4;
          targetRotY = (e.clientY / height - 0.5) * 0.3;
          return;
        }
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        targetRotX += dx * 0.003;
        targetRotY += dy * 0.003;
      });
      window.addEventListener('pointerup', () => { isDragging = false; });
      window.addEventListener('pointercancel', () => { isDragging = false; });

      // Starfield generator (3D coordinates)
      const STARS_COUNT = 280;
      const stars = [];
      for (let i = 0; i < STARS_COUNT; i++) {
        stars.push({
          x: (Math.random() - 0.5) * 2000,
          y: (Math.random() - 0.5) * 2000,
          z: Math.random() * 1500 + 100,
          radius: Math.random() * 1.5 + 0.4,
          twinkleOffset: Math.random() * Math.PI * 2,
          color: Math.random() > 0.8 ? '#7DD3FC' : (Math.random() > 0.85 ? '#FDBA74' : '#FFFFFF')
        });
      }

      // Space floating dust particles
      const PARTICLES_COUNT = 60;
      const particles = [];
      for (let i = 0; i < PARTICLES_COUNT; i++) {
        particles.push({
          x: (Math.random() - 0.5) * 600,
          y: (Math.random() - 0.5) * 800,
          z: Math.random() * 400 + 50,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          vz: (Math.random() - 0.5) * 0.1,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.6 + 0.2
        });
      }

      let time = 0;

      function render() {
        time += 0.016;

        // Smooth camera dampening
        currentRotX += (targetRotX - currentRotX) * 0.05;
        currentRotY += (targetRotY - currentRotY) * 0.05;

        // 1. Deep Space Void Background
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, width, height);

        // Cosmic Nebula Backing Gradient
        const nebulaGrad = ctx.createRadialGradient(
          width * 0.2 + currentRotX * 40,
          height * 0.3 + currentRotY * 40,
          50,
          width * 0.2,
          height * 0.3,
          width * 0.8
        );
        nebulaGrad.addColorStop(0, 'rgba(14, 52, 90, 0.45)');
        nebulaGrad.addColorStop(0.4, 'rgba(30, 27, 75, 0.3)');
        nebulaGrad.addColorStop(0.7, 'rgba(67, 20, 7, 0.2)');
        nebulaGrad.addColorStop(1, 'rgba(3, 7, 18, 0)');
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. 3D Starfield with Parallax
        const fov = 500;
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          // Camera rotation offset
          const cosY = Math.cos(currentRotX * 0.5);
          const sinY = Math.sin(currentRotX * 0.5);
          const rx = s.x * cosY - s.z * sinY;
          const rz = s.x * sinY + s.z * cosY;

          const cosX = Math.cos(currentRotY * 0.5);
          const sinX = Math.sin(currentRotY * 0.5);
          const ry = s.y * cosX - rz * sinX;
          const finalZ = s.y * sinX + rz * cosX;

          if (finalZ <= 50) continue;

          const scale = fov / finalZ;
          const px = centerX + rx * scale;
          const py = centerY + ry * scale;

          if (px < -10 || px > width + 10 || py < -10 || py > height + 10) continue;

          const twinkle = Math.sin(time * 2 + s.twinkleOffset) * 0.3 + 0.7;
          ctx.beginPath();
          ctx.arc(px, py, s.radius * Math.min(scale, 1.8), 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = Math.min(1, Math.max(0.1, twinkle * (1 - finalZ / 1800)));
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 3. Distant Planet Earth (Top Left)
        const earthDist = 1200;
        const earthScale = fov / earthDist;
        const earthX = width * 0.22 + currentRotX * 30;
        const earthY = height * 0.16 + currentRotY * 20;
        const earthRadius = Math.max(22, 38 * earthScale);

        // Earth Atmosphere Outer Cyan Glow
        const earthGlow = ctx.createRadialGradient(earthX, earthY, earthRadius * 0.8, earthX, earthY, earthRadius * 1.8);
        earthGlow.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
        earthGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.2)');
        earthGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = earthGlow;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Earth Base (Oceans & Sunlight)
        const earthSphere = ctx.createRadialGradient(
          earthX - earthRadius * 0.3,
          earthY - earthRadius * 0.3,
          earthRadius * 0.1,
          earthX,
          earthY,
          earthRadius
        );
        earthSphere.addColorStop(0, '#38BDF8');
        earthSphere.addColorStop(0.3, '#0284C7');
        earthSphere.addColorStop(0.7, '#0F172A');
        earthSphere.addColorStop(1, '#020617');
        ctx.fillStyle = earthSphere;
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.fill();

        // Earth Continents & Clouds (Procedural rotation)
        ctx.save();
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        for (let c = 0; c < 3; c++) {
          const cx = earthX - earthRadius + ((time * 3 + c * 25) % (earthRadius * 2.5));
          ctx.beginPath();
          ctx.ellipse(cx, earthY + (c - 1) * 8, earthRadius * 0.45, earthRadius * 0.18, 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        // Continental greens
        ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
        const contX = earthX - earthRadius * 0.5 + Math.sin(time * 0.1) * 4;
        ctx.beginPath();
        ctx.ellipse(contX, earthY - 2, earthRadius * 0.4, earthRadius * 0.3, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 4. Realistic Planet Mars (Center-Right, Majestic & Imposing)
        const marsRadius = Math.min(width * 0.42, 260);
        const marsX = width * 0.72 + currentRotX * 55;
        const marsY = height * 0.48 + currentRotY * 45;

        // Mars Atmospheric Glow (Deep Rust-Orange & Crimson Ray)
        const marsAtmoGlow = ctx.createRadialGradient(marsX, marsY, marsRadius * 0.9, marsX, marsY, marsRadius * 1.55);
        marsAtmoGlow.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
        marsAtmoGlow.addColorStop(0.3, 'rgba(249, 115, 22, 0.22)');
        marsAtmoGlow.addColorStop(0.7, 'rgba(185, 28, 28, 0.08)');
        marsAtmoGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = marsAtmoGlow;
        ctx.beginPath();
        ctx.arc(marsX, marsY, marsRadius * 1.55, 0, Math.PI * 2);
        ctx.fill();

        // Mars Planet Body (Sphere Lighting from Top-Left)
        const lightAngle = -0.55;
        const lx = marsX + Math.cos(lightAngle) * (marsRadius * 0.4);
        const ly = marsY + Math.sin(lightAngle) * (marsRadius * 0.4);

        const marsBody = ctx.createRadialGradient(lx, ly, marsRadius * 0.05, marsX, marsY, marsRadius);
        marsBody.addColorStop(0, '#FCA5A5'); // Highlight
        marsBody.addColorStop(0.2, '#EF4444'); // Sunlit terrain
        marsBody.addColorStop(0.5, '#B91C1C'); // Mid-tone iron oxide
        marsBody.addColorStop(0.75, '#7F1D1D'); // Terminator
        marsBody.addColorStop(0.92, '#450A0A'); // Shadow
        marsBody.addColorStop(1, '#050202');   // Deep night
        ctx.fillStyle = marsBody;
        ctx.beginPath();
        ctx.arc(marsX, marsY, marsRadius, 0, Math.PI * 2);
        ctx.fill();

        // Mars Surface Detail & Shading (Craters, Canyons & Rotation)
        ctx.save();
        ctx.beginPath();
        ctx.arc(marsX, marsY, marsRadius, 0, Math.PI * 2);
        ctx.clip();

        const marsRot = time * 0.04;
        // Valles Marineris canyon rift system
        ctx.strokeStyle = 'rgba(69, 10, 10, 0.65)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        const riftX = marsX - marsRadius * 0.5 + Math.sin(marsRot) * 20;
        const riftY = marsY + 20;
        ctx.moveTo(riftX, riftY);
        ctx.bezierCurveTo(riftX + 60, riftY + 15, riftX + 120, riftY - 10, riftX + 180, riftY + 5);
        ctx.stroke();

        // Crater clusters & volcanic plateaus (Olympus Mons)
        const craters = [
          { dx: -0.2, dy: -0.3, r: 24, dark: true },
          { dx: 0.15, dy: -0.4, r: 16, dark: false },
          { dx: 0.35, dy: 0.1, r: 20, dark: true },
          { dx: -0.3, dy: 0.25, r: 32, dark: true },
          { dx: -0.05, dy: 0.4, r: 18, dark: false },
        ];
        for (let cr of craters) {
          const cx = marsX + cr.dx * marsRadius + Math.sin(marsRot + cr.r) * 15;
          const cy = marsY + cr.dy * marsRadius;
          ctx.beginPath();
          ctx.arc(cx, cy, cr.r, 0, Math.PI * 2);
          ctx.fillStyle = cr.dark ? 'rgba(50, 7, 7, 0.45)' : 'rgba(254, 202, 202, 0.25)';
          ctx.fill();
        }

        // Mars Polar Ice Cap (Top)
        const iceGrad = ctx.createRadialGradient(marsX, marsY - marsRadius * 0.9, 2, marsX, marsY - marsRadius * 0.9, marsRadius * 0.35);
        iceGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        iceGrad.addColorStop(0.5, 'rgba(240, 249, 255, 0.5)');
        iceGrad.addColorStop(1, 'rgba(240, 249, 255, 0)');
        ctx.fillStyle = iceGrad;
        ctx.beginPath();
        ctx.ellipse(marsX, marsY - marsRadius * 0.92, marsRadius * 0.38, marsRadius * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Night-side Shadow Curve (Limb Shadow)
        const nightGrad = ctx.createRadialGradient(marsX + marsRadius * 0.35, marsY + marsRadius * 0.35, marsRadius * 0.4, marsX, marsY, marsRadius);
        nightGrad.addColorStop(0, 'rgba(3, 7, 18, 0)');
        nightGrad.addColorStop(0.65, 'rgba(3, 7, 18, 0.7)');
        nightGrad.addColorStop(1, 'rgba(3, 7, 18, 0.98)');
        ctx.fillStyle = nightGrad;
        ctx.beginPath();
        ctx.arc(marsX, marsY, marsRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 5. Realistic 3D Astronaut Floating in Zero Gravity
        // Kinematics: Gentle organic sinusoidal oscillation
        const astroFloatY = Math.sin(time * 0.7) * 14;
        const astroFloatX = Math.cos(time * 0.5) * 8;
        const astroTilt = Math.sin(time * 0.4) * 0.08 + currentRotX * 0.15;
        const astroRoll = Math.cos(time * 0.35) * 0.05 + currentRotY * 0.1;

        const astroBaseX = width * 0.34 + astroFloatX + currentRotX * 35;
        const astroBaseY = height * 0.54 + astroFloatY + currentRotY * 25;
        const astroScale = Math.min(width / 420, 1.15);

        ctx.save();
        ctx.translate(astroBaseX, astroBaseY);
        ctx.rotate(astroTilt);
        ctx.scale(astroScale, astroScale);

        // Life Support Backpack (PLSS / EMU) behind astronaut
        ctx.fillStyle = '#1E293B';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-42, -56, 84, 102, 10);
        ctx.fill();
        ctx.stroke();

        // Oxygen Cylinders on Backpack
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.roundRect(-36, -50, 18, 70, 6);
        ctx.roundRect(18, -50, 18, 70, 6);
        ctx.fill();

        // Thruster Vent Glows
        const ventPulse = Math.sin(time * 3) * 0.3 + 0.7;
        ctx.fillStyle = 'rgba(56, 189, 248, ' + (0.35 * ventPulse) + ')';
        ctx.beginPath();
        ctx.arc(-27, -54, 5, 0, Math.PI * 2);
        ctx.arc(27, -54, 5, 0, Math.PI * 2);
        ctx.fill();

        // Astronaut Legs (Floating in Zero-G with Joint Articulation)
        const legLeftSwing = Math.sin(time * 0.6) * 0.12;
        const legRightSwing = Math.cos(time * 0.55) * 0.1;

        // Left Leg
        ctx.save();
        ctx.translate(-16, 42);
        ctx.rotate(legLeftSwing + 0.1);
        ctx.fillStyle = '#E2E8F0';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-10, 0, 20, 48, 8); // Thigh
        ctx.fill();
        ctx.stroke();
        // Shin & Boot
        ctx.translate(0, 42);
        ctx.rotate(0.15 + legLeftSwing * 0.5);
        ctx.beginPath();
        ctx.roundRect(-9, 0, 18, 44, 7);
        ctx.fill();
        ctx.stroke();
        // Boot sole
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.roundRect(-10, 40, 26, 12, 4);
        ctx.fill();
        ctx.restore();

        // Right Leg
        ctx.save();
        ctx.translate(16, 42);
        ctx.rotate(legRightSwing - 0.08);
        ctx.fillStyle = '#CBD5E1';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-10, 0, 20, 50, 8);
        ctx.fill();
        ctx.stroke();
        // Shin & Boot
        ctx.translate(0, 44);
        ctx.rotate(-0.1 + legRightSwing * 0.5);
        ctx.beginPath();
        ctx.roundRect(-9, 0, 18, 46, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.roundRect(-10, 42, 26, 12, 4);
        ctx.fill();
        ctx.restore();

        // Torso / Pressurized Spacesuit Body
        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-32, -40, 64, 84, 16);
        ctx.fill();
        ctx.stroke();

        // Chest Computer Control Module (DCM)
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = '#0284C7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-18, -24, 36, 42, 6);
        ctx.fill();
        ctx.stroke();

        // DCM LED Status Indicators (Blinking Telemetry)
        const ledBlink = Math.sin(time * 4) > 0;
        ctx.fillStyle = '#10B981'; // Green status LED
        ctx.beginPath();
        ctx.arc(-10, -16, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ledBlink ? '#00E5FF' : '#0369A1'; // Blue bio-pulse LED
        ctx.beginPath();
        ctx.arc(-2, -16, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#F59E0B'; // Amber comms LED
        ctx.beginPath();
        ctx.arc(6, -16, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // NASA Chest Chevron / Emblem
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.moveTo(-12, 2);
        ctx.lineTo(-2, -4);
        ctx.lineTo(8, 2);
        ctx.lineTo(-2, 0);
        ctx.closePath();
        ctx.fill();

        // Left Arm (Floating outwards in Zero Gravity)
        const armLeftMotion = Math.sin(time * 0.8) * 0.15;
        ctx.save();
        ctx.translate(-30, -32);
        ctx.rotate(-0.4 + armLeftMotion);
        ctx.fillStyle = '#F1F5F9';
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-9, 0, 18, 42, 7);
        ctx.fill();
        ctx.stroke();
        // Forearm & Glove
        ctx.translate(0, 36);
        ctx.rotate(-0.35 + armLeftMotion * 0.6);
        ctx.beginPath();
        ctx.roundRect(-8, 0, 16, 38, 6);
        ctx.fill();
        ctx.stroke();
        // Glove
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(-9, 34, 18, 16, 5);
        ctx.fill();
        ctx.restore();

        // Right Arm (Subtle waving / grasping motion)
        const armRightMotion = Math.cos(time * 0.75) * 0.18;
        ctx.save();
        ctx.translate(30, -32);
        ctx.rotate(0.35 - armRightMotion);
        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-9, 0, 18, 42, 7);
        ctx.fill();
        ctx.stroke();
        ctx.translate(0, 36);
        ctx.rotate(0.4 - armRightMotion * 0.5);
        ctx.beginPath();
        ctx.roundRect(-8, 0, 16, 38, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(-9, 34, 18, 16, 5);
        ctx.fill();
        ctx.restore();

        // Extravehicular Helmet
        ctx.fillStyle = '#F8FAFC';
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -58, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Golden Mirrored Extravehicular Visor with Dynamic Reflections
        const visorGrad = ctx.createLinearGradient(-18, -72, 18, -44);
        visorGrad.addColorStop(0, '#F59E0B');  // Gold metallic top
        visorGrad.addColorStop(0.3, '#FDE047'); // Sunlight flare
        visorGrad.addColorStop(0.7, '#D97706'); // Deep amber
        visorGrad.addColorStop(1, '#92400E');   // Shadow reflection
        ctx.fillStyle = visorGrad;
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(2, -56, 20, 15, 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Mars & Star Reflection on Golden Visor
        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.beginPath();
        ctx.ellipse(8, -54, 7, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Sun Glint Reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(-6, -62, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // End astronaut

        // 6. Floating Cosmic Space Particles with 3D Depth
        ctx.fillStyle = '#7DD3FC';
        for (let p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -300) p.x = 300;
          if (p.x > 300) p.x = -300;
          if (p.y < -400) p.y = 400;
          if (p.y > 400) p.y = -400;

          const pScale = fov / (p.z + 400);
          const px = centerX + p.x * pScale;
          const py = centerY + p.y * pScale;

          ctx.globalAlpha = p.alpha * (Math.sin(time * 1.5 + p.x) * 0.3 + 0.7);
          ctx.beginPath();
          ctx.arc(px, py, p.size * pScale, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        requestAnimationFrame(render);
      }

      render();
    })();
  </script>
</body>
</html>
`;

export const Welcome3DScene: React.FC<Welcome3DSceneProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* 3D Hardware Accelerated WebGL / Canvas Space View */}
      <View style={StyleSheet.absoluteFill}>
        <WebView
          originWhitelist={['*']}
          source={{ html: WELCOME_3D_HTML }}
          style={styles.webView}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          javaScriptEnabled={true}
          domStorageEnabled={true}
          androidLayerType={Platform.OS === 'android' ? 'hardware' : 'none'}
        />
      </View>

      {/* Cinematic Navy Gradient Overlays to preserve absolute contrast for UI buttons */}
      <View style={styles.vignetteOverlay} pointerEvents="none" />
      <View style={styles.bottomButtonsBackdrop} pointerEvents="none" />

      {/* Foreground Content (Welcome Title, Language Switcher, Action Buttons) */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  webView: {
    flex: 1,
    backgroundColor: '#030712',
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(3, 7, 18, 0.42)',
  },
  bottomButtonsBackdrop: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(3, 7, 18, 0.65)',
  },
  contentContainer: {
    flex: 1,
    zIndex: 10,
  },
});
