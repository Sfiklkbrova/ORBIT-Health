import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Universal3DView } from './Universal3DView';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../theme/colors';

interface CosmicRadiation3DProps {
  currentFluxRate?: number; // microSv per hour
  isSimulatedSpike?: boolean;
  onSimulateSpikeToggle?: () => void;
}

export const CosmicRadiation3D: React.FC<CosmicRadiation3DProps> = ({
  currentFluxRate = 18.5,
  isSimulatedSpike = false,
  onSimulateSpikeToggle,
}) => {
  const webViewRef = useRef<any>(null);
  const [shieldingActive, setShieldingActive] = useState(true);
  const [localSpike, setLocalSpike] = useState(isSimulatedSpike);

  const RADIATION_3D_HTML = `
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
  <canvas id="radCanvas"></canvas>
  <script>
    (function() {
      const canvas = document.getElementById('radCanvas');
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

      let isSpike = ${localSpike ? 'true' : 'false'};
      let shielding = ${shieldingActive ? 'true' : 'false'};
      let currentFlux = ${currentFluxRate};

      // 3D rotation
      let rotY = 0;
      let rotX = 0;
      let targetRotY = 0;
      let isDragging = false;
      let startX = 0;

      window.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
      });
      window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        startX = e.clientX;
        targetRotY += dx * 0.008;
      });
      window.addEventListener('pointerup', () => { isDragging = false; });
      window.addEventListener('pointercancel', () => { isDragging = false; });

      window.addEventListener('message', (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'SET_SPIKE') isSpike = msg.val;
          if (msg.type === 'SET_SHIELD') shielding = msg.val;
          if (msg.type === 'SET_FLUX') currentFlux = msg.val;
        } catch (err) {}
      });

      // Radiation particle beam simulation (GCR & SPE)
      const PARTICLE_COUNT = 120;
      const particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        resetParticle(i);
      }

      function resetParticle(i) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 320 + Math.random() * 200;
        const isGCR = Math.random() > 0.6; // Heavy iron ion vs proton
        particles[i] = {
          x: Math.cos(angle) * dist,
          y: (Math.random() - 0.5) * 240,
          z: Math.sin(angle) * dist,
          vx: -Math.cos(angle) * (isSpike ? 6.5 : 2.8),
          vy: (Math.random() - 0.5) * 0.5,
          vz: -Math.sin(angle) * (isSpike ? 6.5 : 2.8),
          isGCR: isGCR,
          color: isGCR ? '#C084FC' : (isSpike ? '#EF4444' : '#F59E0B'),
          history: [],
          energyMeV: isGCR ? 1200 : 80,
          penetrated: false,
        };
      }

      let clock = 0;

      function project3D(x, y, z, cx, cy) {
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const rx = x * cosY - z * sinY;
        const rz = x * sinY + z * cosY;
        const fov = 340;
        const finalZ = rz + 380;
        const scale = fov / Math.max(finalZ, 40);
        return {
          px: cx + rx * scale,
          py: cy + y * scale,
          scale: scale,
          z: finalZ
        };
      }

      function render() {
        clock += 0.016;
        rotY += (targetRotY - rotY) * 0.08;
        targetRotY += 0.003; // Auto slow rotation

        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, width, height);

        const cx = width * 0.5;
        const cy = height * 0.5;

        // 1. Deep Space Shielding Boundary (Magnetic & Hull Bubble)
        if (shielding) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          const shieldP = project3D(0, 0, 0, cx, cy);
          ctx.ellipse(shieldP.px, shieldP.py, 130 * shieldP.scale, 160 * shieldP.scale, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Magnetic field lines
          for (let f = -1; f <= 1; f += 2) {
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
            ctx.beginPath();
            ctx.ellipse(shieldP.px + f * 40 * shieldP.scale, shieldP.py, 90 * shieldP.scale, 140 * shieldP.scale, f * 0.2, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // 2. Central 3D Human Phantom (Astronaut)
        const astroP = project3D(0, 0, 0, cx, cy);
        const aScale = astroP.scale;

        // Head
        ctx.strokeStyle = '#38BDF8';
        ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(astroP.px, astroP.py - 60 * aScale, 18 * aScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Brain vulnerability glow
        const brainPulse = Math.sin(clock * 3) * 0.3 + 0.7;
        ctx.fillStyle = 'rgba(192, 132, 252, ' + (0.45 * brainPulse) + ')';
        ctx.beginPath();
        ctx.arc(astroP.px, astroP.py - 60 * aScale, 10 * aScale, 0, Math.PI * 2);
        ctx.fill();

        // Torso / Thorax
        ctx.beginPath();
        ctx.roundRect(astroP.px - 22 * aScale, astroP.py - 38 * aScale, 44 * aScale, 68 * aScale, 8 * aScale);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.2)';
        ctx.fill();
        ctx.stroke();

        // Bone Marrow / Spinal Axis (High Sensitivity hotspot)
        ctx.strokeStyle = isSpike ? '#EF4444' : '#F59E0B';
        ctx.lineWidth = 3 * aScale;
        ctx.beginPath();
        ctx.moveTo(astroP.px, astroP.py - 40 * aScale);
        ctx.lineTo(astroP.px, astroP.py + 25 * aScale);
        ctx.stroke();

        // Lower Limbs
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(astroP.px - 12 * aScale, astroP.py + 30 * aScale);
        ctx.lineTo(astroP.px - 16 * aScale, astroP.py + 95 * aScale);
        ctx.moveTo(astroP.px + 12 * aScale, astroP.py + 30 * aScale);
        ctx.lineTo(astroP.px + 16 * aScale, astroP.py + 95 * aScale);
        ctx.stroke();

        // 3. 3D Radiation Particle Trajectories
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const distToCenter = Math.hypot(p.x, p.y, p.z);

          // Interaction with shielding boundary
          if (shielding && distToCenter < 120 && !p.penetrated) {
            if (!p.isGCR) {
              // Solar protons deflected by magnetic field
              p.vx += (p.x / distToCenter) * 3.5;
              p.vz += (p.z / distToCenter) * 3.5;
            } else {
              // High energy GCR heavy ions penetrate
              p.penetrated = true;
            }
          }

          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;

          p.history.push({ x: p.x, y: p.y, z: p.z });
          if (p.history.length > 5) p.history.shift();

          // Reset if passed through or escaped
          if (distToCenter > 380 && p.history.length > 2) {
            resetParticle(i);
            continue;
          }

          // Check direct human collision (Ionization event)
          if (distToCenter < 35) {
            // Ionization impact flash
            ctx.fillStyle = isSpike ? '#EF4444' : '#FFFFFF';
            const hitP = project3D(p.x, p.y, p.z, cx, cy);
            ctx.beginPath();
            ctx.arc(hitP.px, hitP.py, 6 * hitP.scale, 0, Math.PI * 2);
            ctx.fill();
          }

          // Render Particle Track with Trail
          if (p.history.length > 1) {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = (p.isGCR ? 2.5 : 1.5);
            ctx.beginPath();
            for (let h = 0; h < p.history.length; h++) {
              const pt = project3D(p.history[h].x, p.history[h].y, p.history[h].z, cx, cy);
              if (h === 0) ctx.moveTo(pt.px, pt.py);
              else ctx.lineTo(pt.px, pt.py);
            }
            ctx.stroke();
          }
        }

        // 4. In-Chamber Telemetry Text Overlay
        ctx.fillStyle = isSpike ? '#EF4444' : '#38BDF8';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('DOSE FLUX: ' + (isSpike ? '142.8' : currentFlux.toFixed(1)) + ' µSv/h', 14, 24);
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('SHIELD: ' + (shielding ? 'WATER WALL SHELTER [ON]' : 'BARE HULL [ALERT]'), 14, 40);

        requestAnimationFrame(render);
      }

      render();
    })();
  </script>
</body>
</html>
`;

  const handleToggleSpike = () => {
    const nextVal = !localSpike;
    setLocalSpike(nextVal);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'SET_SPIKE', val: nextVal }));
    onSimulateSpikeToggle?.();
  };

  const handleToggleShield = () => {
    const nextVal = !shieldingActive;
    setShieldingActive(nextVal);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'SET_SHIELD', val: nextVal }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <MaterialCommunityIcons name="radioactive" size={18} color={localSpike ? COLORS.statusAlert : COLORS.cyan} />
          <Text style={[styles.headerTitle, localSpike && { color: COLORS.statusAlert }]}>
            3D COSMIC RADIATION DOSIMETRY CHAMBER
          </Text>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.shieldToggleBtn, shieldingActive && styles.shieldToggleBtnActive]}
            onPress={handleToggleShield}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="shield-sun"
              size={14}
              color={shieldingActive ? COLORS.background : COLORS.cyan}
            />
            <Text style={[styles.shieldToggleText, shieldingActive && styles.shieldToggleTextActive]}>
              {shieldingActive ? 'Shielded' : 'Unshielded'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.spikeBtn, localSpike && styles.spikeBtnActive]}
            onPress={handleToggleSpike}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="flash-alert"
              size={14}
              color={localSpike ? '#FFFFFF' : COLORS.statusAlert}
            />
            <Text style={[styles.spikeBtnText, localSpike && styles.spikeBtnTextActive]}>
              {localSpike ? 'Solar Storm Active' : 'Simulate Spike'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3D WebGL Canvas */}
      <View style={styles.canvasWrapper}>
        <Universal3DView
          ref={webViewRef}
          html={RADIATION_3D_HTML}
          style={styles.webView}
        />

        {/* Legend Overlay */}
        <View style={styles.legendOverlay}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#C084FC' }]} />
            <Text style={styles.legendText}>GCR Iron Ions (Deep Penetration)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Solar Protons (SPE Deflected)</Text>
          </View>
        </View>
      </View>

      {/* Biological Susceptibility Callout */}
      <View style={styles.susceptibilityCard}>
        <Text style={styles.cardHeader}>TISSUE SUSCEPTIBILITY MATRIX (NASA RADLAB)</Text>
        <View style={styles.tissueRow}>
          <Text style={styles.tissueName}>• Bone Marrow (Hematopoietic):</Text>
          <Text style={styles.tissueRisk}>Highest sensitivity (Daily check)</Text>
        </View>
        <View style={styles.tissueRow}>
          <Text style={styles.tissueName}>• Central Nervous System (CNS):</Text>
          <Text style={styles.tissueRisk}>GCR track ionizations monitored</Text>
        </View>
        <View style={styles.tissueRow}>
          <Text style={styles.tissueName}>• Eye Lens (Ocular Lens):</Text>
          <Text style={styles.tissueRisk}>Cataract risk threshold &lt; 500 mGy</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderHighlight,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.cyan,
    letterSpacing: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shieldToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  shieldToggleBtnActive: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  shieldToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  shieldToggleTextActive: {
    color: COLORS.background,
  },
  spikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  spikeBtnActive: {
    backgroundColor: COLORS.statusAlert,
    borderColor: COLORS.statusAlert,
  },
  spikeBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.statusAlert,
  },
  spikeBtnTextActive: {
    color: '#FFFFFF',
  },
  canvasWrapper: {
    height: 300,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#030712',
  },
  legendOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    gap: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  susceptibilityCard: {
    marginTop: SPACING.md,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 12,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.9,
    marginBottom: 4,
  },
  tissueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  tissueName: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  tissueRisk: {
    fontSize: 11,
    color: COLORS.cyan,
    fontWeight: '600',
  },
});
