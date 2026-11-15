import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Universal3DView, Universal3DViewRef } from './Universal3DView';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../theme/colors';
import { HealthRecord } from '../../types/astronaut';

export interface OrganTelemetryInfo {
  id: string;
  name: string;
  system: string;
  status: 'OPTIMAL' | 'ELEVATED' | 'NOMINAL' | 'WARNING';
  metricLabel: string;
  metricValue: string;
  spaceImpact: string;
  nasaRef: string;
  color: string;
}

interface HumanBody3DProps {
  healthRecord?: HealthRecord | null;
  onSelectOrgan?: (organ: OrganTelemetryInfo) => void;
}

export const ORGANS_DATA: Record<string, OrganTelemetryInfo> = {
  heart: {
    id: 'heart',
    name: 'Cardiac Muscle & Ventricles',
    system: 'Cardiovascular',
    status: 'OPTIMAL',
    metricLabel: 'Heart Rate',
    metricValue: '72 BPM (Resting)',
    spaceImpact: 'Microgravity headward fluid shift resets baroreceptors. Heart works with lower stroke pressure.',
    nasaRef: 'NASA HRR: Cardiovascular Alterations in Microgravity (Cardio-01)',
    color: '#FF2A55',
  },
  lungs: {
    id: 'lungs',
    name: 'Pulmonary Lobes & Alveoli',
    system: 'Respiratory',
    status: 'OPTIMAL',
    metricLabel: 'Blood Oxygen (SpO2)',
    metricValue: '98% (Nominal)',
    spaceImpact: 'Alveolar ventilation remains uniform; ECLSS cabin O2 maintained at 20.9% at 101.3 kPa.',
    nasaRef: 'NASA OSDR: Pulmonary Gas Exchange During Long-Duration Spaceflight',
    color: '#00E5FF',
  },
  circulation: {
    id: 'circulation',
    name: 'Arterial & Venous Vasculature',
    system: 'Circulatory',
    status: 'NOMINAL',
    metricLabel: 'Blood Pressure',
    metricValue: '120/80 mmHg',
    spaceImpact: 'Venous blood pools in upper torso and cranial vault; active ARED conditioning counteracts pooling.',
    nasaRef: 'NASA Human Research Program: Hemodynamic Vascular Remodeling',
    color: '#38BDF8',
  },
  brain: {
    id: 'brain',
    name: 'Cerebral Cortex & Synaptic Mesh',
    system: 'Neuro-Vestibular',
    status: 'OPTIMAL',
    metricLabel: 'Cognitive Readiness',
    metricValue: 'Optimal (Sleep: 7.8 hrs)',
    spaceImpact: 'Space motion sickness (SMS) neuro-adaptation completed by Flight Day 3.',
    nasaRef: 'NASA HRR: Neurovestibular Adaptation & Cognitive Performance',
    color: '#A855F7',
  },
  spine: {
    id: 'spine',
    name: 'Vertebral Column & Core',
    system: 'Musculoskeletal',
    status: 'NOMINAL',
    metricLabel: 'Height Elongation',
    metricValue: '+4.2 cm (Spinal Decompression)',
    spaceImpact: 'Intervertebral discs expand in microgravity. Daily 90 min ARED loading preserves bone mineral density.',
    nasaRef: 'NASA HRP: Spaceflight-Induced Intervertebral Disc Height Changes',
    color: '#F59E0B',
  },
  core: {
    id: 'core',
    name: 'Metabolic Core & Hepatic System',
    system: 'Metabolism',
    status: 'OPTIMAL',
    metricLabel: 'Core Body Temp',
    metricValue: '36.6 °C (Circadian Low)',
    spaceImpact: 'Space fever phenomenon is mitigated by regulated cabin thermal airflow.',
    nasaRef: 'NASA OSDR: Core Body Temperature Circadian Shifts in Orbital Space',
    color: '#10B981',
  },
};

export const HumanBody3D: React.FC<HumanBody3DProps> = ({
  healthRecord,
  onSelectOrgan,
}) => {
  const webViewRef = useRef<Universal3DViewRef>(null);

  const [activeSystem, setActiveSystem] = useState<string>('ALL');
  const [selectedOrganId, setSelectedOrganId] = useState<string>('heart');
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const selectedOrgan = ORGANS_DATA[selectedOrganId] || ORGANS_DATA.heart;

  const currentBpm = healthRecord?.heartRate || 72;
  const currentSpo2 = healthRecord?.bloodOxygen || 98;
  const currentTemp = healthRecord?.bodyTemperature || 36.6;

  // HTML5 WebGL / High-Performance 3D Anatomical Renderer
  const BODY_3D_HTML = `
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
  <canvas id="bodyCanvas"></canvas>
  <script>
    (function() {
      const canvas = document.getElementById('bodyCanvas');
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

      // Telemetry config
      let bpm = ${currentBpm};
      let spo2 = ${currentSpo2};
      let bodyTemp = ${currentTemp};
      let activeSystem = 'ALL';
      let selectedOrgan = 'heart';
      let autoRotate = true;
      let zoom = 1.0;

      // 3D rotation state
      let rotY = 0;
      let rotX = 0;
      let targetRotY = 0;
      let targetRotX = 0;
      let isDragging = false;
      let startX = 0;
      let startY = 0;

      window.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        autoRotate = false;
      });

      window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        startX = e.clientX;
        startY = e.clientY;
        targetRotY += dx * 0.008;
        targetRotX += dy * 0.005;
        targetRotX = Math.max(-0.6, Math.min(0.6, targetRotX));
      });

      window.addEventListener('pointerup', () => { isDragging = false; });
      window.addEventListener('pointercancel', () => { isDragging = false; });

      // Organ click picking
      window.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check distance to projected organ centers
        const organs = [
          { id: 'brain', y: 0.18, r: 40 },
          { id: 'lungs', y: 0.36, r: 50 },
          { id: 'heart', y: 0.38, r: 35 },
          { id: 'core', y: 0.50, r: 45 },
          { id: 'spine', y: 0.44, r: 30 },
          { id: 'circulation', y: 0.65, r: 50 }
        ];

        const cx = width * 0.5;
        for (let org of organs) {
          const oy = height * org.y;
          const dist = Math.hypot(clickX - cx, clickY - oy);
          if (dist < org.r) {
            selectedOrgan = org.id;
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ORGAN_CLICK', id: org.id }));
            }
            break;
          }
        }
      });

      // Handle messages from React Native
      window.addEventListener('message', (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'SET_SYSTEM') {
            activeSystem = msg.system;
          } else if (msg.type === 'SET_ORGAN') {
            selectedOrgan = msg.organ;
          } else if (msg.type === 'SET_AUTOROTATE') {
            autoRotate = msg.autoRotate;
          } else if (msg.type === 'SET_ZOOM') {
            zoom = msg.zoom;
          } else if (msg.type === 'UPDATE_TELEMETRY') {
            if (msg.bpm) bpm = msg.bpm;
            if (msg.spo2) spo2 = msg.spo2;
            if (msg.temp) bodyTemp = msg.temp;
          }
        } catch (err) {}
      });

      // Blood circulation corpuscle particles
      const BLOOD_PARTICLES = 50;
      const bloodPoints = [];
      for (let i = 0; i < BLOOD_PARTICLES; i++) {
        bloodPoints.push({
          t: Math.random(),
          speed: Math.random() * 0.003 + 0.002,
          isArterial: i % 2 === 0,
          side: i % 4 === 0 ? 1 : -1,
        });
      }

      let clock = 0;

      // 3D Point Projection Helper
      function project3D(x, y, z, cx, cy, fov) {
        // Rotate around Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const rx = x * cosY - z * sinY;
        const rz = x * sinY + z * cosY;

        // Rotate around X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const ry = y * cosX - rz * sinX;
        const finalZ = y * sinX + rz * cosX + 400;

        const scale = (fov / finalZ) * zoom;
        return {
          px: cx + rx * scale,
          py: cy + ry * scale,
          scale: scale,
          z: finalZ
        };
      }

      function render() {
        clock += 0.016;

        if (autoRotate) {
          targetRotY += 0.006;
        }
        rotY += (targetRotY - rotY) * 0.08;
        rotX += (targetRotX - rotX) * 0.08;

        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, width, height);

        const cx = width * 0.5;
        const cy = height * 0.48;
        const fov = 380;

        // Holographic Background Grid Radar
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        const radarR = Math.min(width, height) * 0.45;
        ctx.beginPath();
        ctx.arc(cx, cy, radarR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, radarR * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        // Heartbeat animation rate linked to actual BPM
        // 72 BPM = 1.2 Hz -> interval = 60 / BPM
        const beatFreq = (bpm / 60) * Math.PI * 2;
        const heartPulse = Math.pow(Math.max(0, Math.sin(clock * beatFreq)), 3) * 0.18 + 0.92;

        // Lung breathing expansion cycle (~14 breaths / min = 0.23 Hz)
        const breathCycle = Math.sin(clock * 1.45) * 0.12 + 1.0;

        // 1. 3D Anatomical Wireframe Silhouette (Full Body Translucent Mesh)
        ctx.save();

        // 3D Skeleton & Spinal Column
        if (activeSystem === 'ALL' || activeSystem === 'SPINE' || activeSystem === 'MUSCULO') {
          ctx.strokeStyle = selectedOrgan === 'spine' ? '#F59E0B' : 'rgba(148, 163, 184, 0.35)';
          ctx.lineWidth = selectedOrgan === 'spine' ? 3 : 1.5;

          // Spine Vertebrae (Chain of 18 3D points)
          let lastPt = null;
          for (let v = 0; v < 18; v++) {
            const vy = -110 + v * 14;
            const vz = -8 + Math.sin(v * 0.3) * 6;
            const pt = project3D(0, vy, vz, cx, cy, fov);
            if (lastPt) {
              ctx.beginPath();
              ctx.moveTo(lastPt.px, lastPt.py);
              ctx.lineTo(pt.px, pt.py);
              ctx.stroke();
            }
            // Vertebral disc marker
            ctx.beginPath();
            ctx.arc(pt.px, pt.py, 2.5 * pt.scale, 0, Math.PI * 2);
            ctx.fillStyle = selectedOrgan === 'spine' ? '#F59E0B' : 'rgba(203, 213, 225, 0.5)';
            ctx.fill();
            lastPt = pt;
          }

          // Ribcage arches
          for (let r = 0; r < 6; r++) {
            const ry = -70 + r * 14;
            const rWidth = (36 + Math.sin(r * 0.5) * 20) * breathCycle;
            const ptLeft = project3D(-rWidth, ry, 0, cx, cy, fov);
            const ptRight = project3D(rWidth, ry, 0, cx, cy, fov);
            const ptCenter = project3D(0, ry, 15, cx, cy, fov);

            ctx.beginPath();
            ctx.moveTo(ptLeft.px, ptLeft.py);
            ctx.quadraticCurveTo(ptCenter.px, ptCenter.py, ptRight.px, ptRight.py);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // 2. 3D Respiratory System (Lungs)
        if (activeSystem === 'ALL' || activeSystem === 'LUNGS' || activeSystem === 'RESPIRATORY') {
          const isSelected = selectedOrgan === 'lungs';
          const lungScale = breathCycle * (isSelected ? 1.08 : 1.0);

          // Left Lung Lobe
          const leftLung = project3D(-24, -45, 8, cx, cy, fov);
          ctx.fillStyle = isSelected ? 'rgba(0, 229, 255, 0.35)' : 'rgba(56, 189, 248, 0.22)';
          ctx.strokeStyle = isSelected ? '#00E5FF' : '#38BDF8';
          ctx.lineWidth = isSelected ? 2.5 : 1.2;
          ctx.beginPath();
          ctx.ellipse(leftLung.px, leftLung.py, 22 * leftLung.scale * lungScale, 34 * leftLung.scale * lungScale, -0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Right Lung Lobe
          const rightLung = project3D(24, -45, 8, cx, cy, fov);
          ctx.beginPath();
          ctx.ellipse(rightLung.px, rightLung.py, 22 * rightLung.scale * lungScale, 34 * rightLung.scale * lungScale, 0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Bronchial Tree Glow
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          const trachea = project3D(0, -85, 4, cx, cy, fov);
          ctx.moveTo(trachea.px, trachea.py);
          ctx.lineTo(leftLung.px, leftLung.py);
          ctx.moveTo(trachea.px, trachea.py);
          ctx.lineTo(rightLung.px, rightLung.py);
          ctx.stroke();
        }

        // 3. 3D Cardiovascular System (Pulsing Heart)
        if (activeSystem === 'ALL' || activeSystem === 'HEART' || activeSystem === 'CARDIO') {
          const isSelected = selectedOrgan === 'heart';
          const heartCenter = project3D(-6, -42, 18, cx, cy, fov);
          const currentHeartR = (isSelected ? 26 : 22) * heartCenter.scale * heartPulse;

          // Heart Pulsing Glow Wave
          const heartGrad = ctx.createRadialGradient(
            heartCenter.px,
            heartCenter.py,
            currentHeartR * 0.2,
            heartCenter.px,
            heartCenter.py,
            currentHeartR * 2.2
          );
          heartGrad.addColorStop(0, 'rgba(255, 42, 85, 0.9)');
          heartGrad.addColorStop(0.4, 'rgba(239, 68, 68, 0.45)');
          heartGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = heartGrad;
          ctx.beginPath();
          ctx.arc(heartCenter.px, heartCenter.py, currentHeartR * 2.2, 0, Math.PI * 2);
          ctx.fill();

          // 3D Cardiac Muscle Sphere & Aortic Arch
          ctx.fillStyle = isSelected ? '#FF2A55' : '#EF4444';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = isSelected ? 2.5 : 1;
          ctx.beginPath();
          ctx.arc(heartCenter.px, heartCenter.py, currentHeartR, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Aorta arch
          const aortaTop = project3D(-2, -64, 14, cx, cy, fov);
          ctx.strokeStyle = '#FF2A55';
          ctx.lineWidth = 4 * heartCenter.scale;
          ctx.beginPath();
          ctx.moveTo(heartCenter.px, heartCenter.py - currentHeartR * 0.5);
          ctx.bezierCurveTo(heartCenter.px - 6, aortaTop.py, aortaTop.px + 10, aortaTop.py, aortaTop.px, aortaTop.py + 10);
          ctx.stroke();
        }

        // 4. Circulatory Vasculature & Moving Blood Particles
        if (activeSystem === 'ALL' || activeSystem === 'CIRCULATION' || activeSystem === 'CARDIO') {
          // Arterial & Venous Vascular Main Trunks
          const branches = [
            // Head / Carotid
            { from: [0, -60, 10], to: [0, -120, 10], isArterial: true },
            // Left Arm Brachial
            { from: [-20, -50, 10], to: [-85, 30, 0], isArterial: true },
            // Right Arm Brachial
            { from: [20, -50, 10], to: [85, 30, 0], isArterial: false },
            // Abdominal Aorta
            { from: [0, -30, 10], to: [0, 60, 5], isArterial: true },
            // Left Femoral Leg
            { from: [-15, 60, 5], to: [-38, 210, 0], isArterial: true },
            // Right Femoral Leg
            { from: [15, 60, 5], to: [38, 210, 0], isArterial: false },
          ];

          for (let b of branches) {
            const p1 = project3D(b.from[0], b.from[1], b.from[2], cx, cy, fov);
            const p2 = project3D(b.to[0], b.to[1], b.to[2], cx, cy, fov);
            ctx.strokeStyle = b.isArterial ? 'rgba(239, 68, 68, 0.45)' : 'rgba(56, 189, 248, 0.45)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }

          // Dynamic Blood Flow Particles
          for (let bp of bloodPoints) {
            bp.t = (bp.t + bp.speed) % 1;
            // Interpolate position along circulatory loop
            const legProgress = bp.t * 260 - 60;
            const legX = bp.side * (12 + Math.sin(bp.t * 3) * 20);
            const pt = project3D(legX, legProgress, 6, cx, cy, fov);

            ctx.fillStyle = bp.isArterial ? '#FF2A55' : '#00E5FF';
            ctx.beginPath();
            ctx.arc(pt.px, pt.py, (bp.isArterial ? 2.8 : 2.2) * pt.scale, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 5. 3D Neuro / Brain Activity (Cranium Synapses)
        if (activeSystem === 'ALL' || activeSystem === 'BRAIN' || activeSystem === 'NEURO') {
          const isSelected = selectedOrgan === 'brain';
          const brainCenter = project3D(0, -135, 6, cx, cy, fov);
          const brainR = (isSelected ? 32 : 28) * brainCenter.scale;

          // Translucent Cranial Shell
          ctx.fillStyle = isSelected ? 'rgba(168, 85, 247, 0.35)' : 'rgba(168, 85, 247, 0.18)';
          ctx.strokeStyle = isSelected ? '#A855F7' : 'rgba(192, 132, 252, 0.5)';
          ctx.lineWidth = isSelected ? 2.5 : 1.2;
          ctx.beginPath();
          ctx.ellipse(brainCenter.px, brainCenter.py, brainR * 0.95, brainR * 1.15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Synaptic Firing Electrical Pulses
          const synapticNodes = [
            { dx: -12, dy: -8 }, { dx: 12, dy: -8 },
            { dx: -6, dy: 6 }, { dx: 6, dy: 6 },
            { dx: 0, dy: -14 }, { dx: -14, dy: 4 }, { dx: 14, dy: 4 }
          ];

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1;
          for (let i = 0; i < synapticNodes.length; i++) {
            const sn = synapticNodes[i];
            const pulse = Math.sin(clock * 4 + i * 1.3) * 0.5 + 0.5;
            const sx = brainCenter.px + sn.dx * brainCenter.scale;
            const sy = brainCenter.py + sn.dy * brainCenter.scale;

            if (pulse > 0.6) {
              ctx.beginPath();
              ctx.arc(sx, sy, 3.5 * brainCenter.scale * pulse, 0, Math.PI * 2);
              ctx.fillStyle = '#E9D5FF';
              ctx.fill();

              // Connect to neighbor
              const nextSn = synapticNodes[(i + 1) % synapticNodes.length];
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(brainCenter.px + nextSn.dx * brainCenter.scale, brainCenter.py + nextSn.dy * brainCenter.scale);
              ctx.stroke();
            }
          }
        }

        // 6. Metabolic Core & Hepatic System (Liver & Abdomen)
        if (activeSystem === 'ALL' || activeSystem === 'CORE' || activeSystem === 'METABOLISM') {
          const isSelected = selectedOrgan === 'core';
          const liverCenter = project3D(18, 0, 10, cx, cy, fov);
          ctx.fillStyle = isSelected ? 'rgba(16, 185, 129, 0.45)' : 'rgba(16, 185, 129, 0.22)';
          ctx.strokeStyle = isSelected ? '#10B981' : 'rgba(52, 211, 153, 0.4)';
          ctx.lineWidth = isSelected ? 2.5 : 1;
          ctx.beginPath();
          ctx.ellipse(liverCenter.px, liverCenter.py, 22 * liverCenter.scale, 16 * liverCenter.scale, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // 7. Thermal Heatmap Shader Overlay (When in THERMAL mode)
        if (activeSystem === 'THERMAL') {
          // Core trunk warm gradient (36.6 °C)
          const corePt = project3D(0, -10, 10, cx, cy, fov);
          const heatGrad = ctx.createRadialGradient(corePt.px, corePt.py, 10, corePt.px, corePt.py, 120 * corePt.scale);
          heatGrad.addColorStop(0, 'rgba(239, 68, 68, 0.65)'); // Hot Core
          heatGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.45)'); // Torso
          heatGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.25)'); // Extremities
          heatGrad.addColorStop(1, 'rgba(3, 7, 18, 0)');
          ctx.fillStyle = heatGrad;
          ctx.beginPath();
          ctx.arc(corePt.px, corePt.py, 120 * corePt.scale, 0, Math.PI * 2);
          ctx.fill();
        }

        // 8. Holographic HUD Reticle on Selected Organ
        let targetProj = null;
        if (selectedOrgan === 'heart') targetProj = project3D(-6, -42, 18, cx, cy, fov);
        else if (selectedOrgan === 'lungs') targetProj = project3D(0, -45, 8, cx, cy, fov);
        else if (selectedOrgan === 'brain') targetProj = project3D(0, -135, 6, cx, cy, fov);
        else if (selectedOrgan === 'spine') targetProj = project3D(0, 0, 0, cx, cy, fov);
        else if (selectedOrgan === 'core') targetProj = project3D(18, 0, 10, cx, cy, fov);
        else if (selectedOrgan === 'circulation') targetProj = project3D(0, 40, 5, cx, cy, fov);

        if (targetProj) {
          const reticleR = 38 * targetProj.scale;
          const rx = targetProj.px;
          const ry = targetProj.py;

          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 1.5;

          // Corner bracket reticle
          const bLen = 10;
          ctx.beginPath();
          // Top-Left
          ctx.moveTo(rx - reticleR, ry - reticleR + bLen);
          ctx.lineTo(rx - reticleR, ry - reticleR);
          ctx.lineTo(rx - reticleR + bLen, ry - reticleR);
          // Top-Right
          ctx.moveTo(rx + reticleR - bLen, ry - reticleR);
          ctx.lineTo(rx + reticleR, ry - reticleR);
          ctx.lineTo(rx + reticleR, ry - reticleR + bLen);
          // Bottom-Left
          ctx.moveTo(rx - reticleR, ry + reticleR - bLen);
          ctx.lineTo(rx - reticleR, ry + reticleR);
          ctx.lineTo(rx - reticleR + bLen, ry + reticleR);
          // Bottom-Right
          ctx.moveTo(rx + reticleR - bLen, ry + reticleR);
          ctx.lineTo(rx + reticleR, ry + reticleR);
          ctx.lineTo(rx + reticleR, ry + reticleR - bLen);
          ctx.stroke();

          // Target pulse line
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(rx + reticleR, ry);
          ctx.lineTo(rx + reticleR + 45, ry - 18);
          ctx.lineTo(rx + reticleR + 110, ry - 18);
          ctx.stroke();
          ctx.setLineDash([]);

          // HUD Label Callout
          ctx.fillStyle = '#00E5FF';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(selectedOrgan.toUpperCase() + ' // LOCKED', rx + reticleR + 48, ry - 24);
        }

        ctx.restore();
        requestAnimationFrame(render);
      }

      render();
    })();
  </script>
</body>
</html>
`;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ORGAN_CLICK' && ORGANS_DATA[data.id]) {
        setSelectedOrganId(data.id);
        onSelectOrgan?.(ORGANS_DATA[data.id]);
      }
    } catch { }
  };

  const handleSystemChange = (sys: string) => {
    setActiveSystem(sys);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'SET_SYSTEM', system: sys }));
  };

  const handleOrganSelect = (organKey: string) => {
    setSelectedOrganId(organKey);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'SET_ORGAN', organ: organKey }));
    if (ORGANS_DATA[organKey]) {
      onSelectOrgan?.(ORGANS_DATA[organKey]);
    }
  };

  const toggleAutoRotate = () => {
    const nextVal = !isAutoRotating;
    setIsAutoRotating(nextVal);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'SET_AUTOROTATE', autoRotate: nextVal }));
  };

  const handleZoom = (delta: number) => {
    const nextZoom = Math.max(0.7, Math.min(1.8, zoomLevel + delta));
    setZoomLevel(nextZoom);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'SET_ZOOM', zoom: nextZoom }));
  };

  return (
    <View style={styles.container}>
      {/* 3D Model Header Controls */}
      <View style={styles.controlsBar}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="cube-scan" size={18} color={COLORS.cyan} />
          <Text style={styles.barTitle}>3D INTERACTIVE BIOMETRIC TWIN</Text>
        </View>

        <View style={styles.actionButtonsGroup}>
          <TouchableOpacity
            style={[styles.miniBtn, isAutoRotating && styles.miniBtnActive]}
            onPress={toggleAutoRotate}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isAutoRotating ? 'rotate-3d-variant' : 'pause'}
              size={16}
              color={isAutoRotating ? COLORS.background : COLORS.cyan}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.miniBtn} onPress={() => handleZoom(0.15)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="magnify-plus" size={16} color={COLORS.cyan} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.miniBtn} onPress={() => handleZoom(-0.15)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="magnify-minus" size={16} color={COLORS.cyan} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Layer / Mode Selector Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
        {[
          { id: 'ALL', label: 'All Systems', icon: 'human' },
          { id: 'HEART', label: 'Cardio & Heartbeat', icon: 'heart-pulse' },
          { id: 'LUNGS', label: 'Lungs & Respiration', icon: 'lungs' },
          { id: 'CIRCULATION', label: 'Blood Circulation', icon: 'water' },
          { id: 'BRAIN', label: 'Brain Synapses', icon: 'brain' },
          { id: 'SPINE', label: 'Spine & Posture', icon: 'human-handsdown' },
          { id: 'THERMAL', label: 'Thermal & SpO2', icon: 'thermometer' },
        ].map((sys) => (
          <TouchableOpacity
            key={sys.id}
            style={[styles.systemChip, activeSystem === sys.id && styles.systemChipActive]}
            onPress={() => handleSystemChange(sys.id)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={sys.icon as any}
              size={14}
              color={activeSystem === sys.id ? COLORS.background : COLORS.cyan}
            />
            <Text style={[styles.systemChipText, activeSystem === sys.id && styles.systemChipTextActive]}>
              {sys.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 3D WebGL Canvas Container */}
      <View style={styles.canvasWrapper}>
        <Universal3DView
          ref={webViewRef}
          html={BODY_3D_HTML}
          style={styles.webView}
          onMessage={handleWebViewMessage}
        />

        {/* Real-time Physiological Live Badge Overlay */}
        <View style={styles.liveOverlayBadge}>
          <View style={styles.pulsingDot} />
          <Text style={styles.liveOverlayText}>
            LIVE SENSORS // {currentBpm} BPM • {currentSpo2}% SpO2 • {currentTemp}°C
          </Text>
        </View>

        {/* Gesture Guidance Pill */}
        <View style={styles.gestureHint}>
          <MaterialCommunityIcons name="gesture-swipe-horizontal" size={14} color={COLORS.textMuted} />
          <Text style={styles.gestureHintText}>Drag to Rotate 360° • Tap Organ to Inspect</Text>
        </View>
      </View>

      {/* Organ Carousel Selector */}
      <View style={styles.organCarousel}>
        {Object.keys(ORGANS_DATA).map((key) => {
          const org = ORGANS_DATA[key];
          const isSelected = selectedOrganId === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.organCard,
                isSelected && { borderColor: org.color, backgroundColor: 'rgba(56, 189, 248, 0.12)' },
              ]}
              onPress={() => handleOrganSelect(key)}
              activeOpacity={0.7}
            >
              <View style={[styles.organIconDot, { backgroundColor: org.color }]} />
              <Text style={[styles.organCardTitle, isSelected && { color: '#FFFFFF', fontWeight: '800' }]}>
                {org.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Detailed Selected Organ Dossier Card */}
      {selectedOrgan && (
        <View style={[styles.dossierCard, { borderLeftColor: selectedOrgan.color }]}>
          <View style={styles.dossierHeader}>
            <View>
              <Text style={styles.dossierSystem}>{selectedOrgan.system.toUpperCase()}</Text>
              <Text style={styles.dossierTitle}>{selectedOrgan.name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${selectedOrgan.color}22`, borderColor: selectedOrgan.color }]}>
              <Text style={[styles.statusBadgeText, { color: selectedOrgan.color }]}>{selectedOrgan.status}</Text>
            </View>
          </View>

          <View style={styles.dossierMetricRow}>
            <Text style={styles.metricLabel}>{selectedOrgan.metricLabel}:</Text>
            <Text style={[styles.metricValue, { color: selectedOrgan.color }]}>{selectedOrgan.metricValue}</Text>
          </View>

          <Text style={styles.spaceImpactText}>{selectedOrgan.spaceImpact}</Text>

          <View style={styles.nasaCitationRow}>
            <MaterialCommunityIcons name="book-open-outline" size={14} color={COLORS.cyan} />
            <Text style={styles.nasaCitationText}>{selectedOrgan.nasaRef}</Text>
          </View>
        </View>
      )}
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
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: COLORS.cyan,
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBtnActive: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  chipsScroll: {
    marginBottom: SPACING.sm,
  },
  chipsContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  systemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  systemChipActive: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  systemChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  systemChipTextActive: {
    color: COLORS.background,
    fontWeight: '800',
  },
  canvasWrapper: {
    height: 360,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#030712',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  webView: {
    flex: 1,
    backgroundColor: '#030712',
  },
  liveOverlayBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.statusNormal,
  },
  liveOverlayText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.cyan,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  gestureHint: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(3, 7, 18, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  gestureHintText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  organCarousel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.md,
    justifyContent: 'space-between',
  },
  organCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
    minWidth: '31%',
    justifyContent: 'center',
  },
  organIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  organCardTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  dossierCard: {
    marginTop: SPACING.md,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 14,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  dossierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  dossierSystem: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  dossierTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dossierMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  spaceImpactText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  nasaCitationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.12)',
  },
  nasaCitationText: {
    fontSize: 10,
    color: COLORS.cyan,
    flex: 1,
  },
});
