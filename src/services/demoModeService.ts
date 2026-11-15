import { insertHealthRecord, insertRadiationEntry } from './db';
import { insertCachedDonkiEvent } from './nasaDb';
import { setSimulateCommsBlackout, queueMessageForFlightSurgeon } from './commsDelayService';
import { HealthRecord, RadiationLogEntry } from '../types/astronaut';
import { NasaDonkiEvent } from '../types/nasa';

export interface DemoModeStatus {
  active: boolean;
  recordsLoaded: number;
  solarEventTriggered: boolean;
  commsBlackoutActive: boolean;
  outboxMessageQueued: boolean;
  timestamp: string;
}

let isDemoModeEnabled = false;

export function isDemoModeActive(): boolean {
  return isDemoModeEnabled;
}

/**
 * Initializes the 60-90 Second Judge Demo Scenario:
 * 1. Seeds 30 days of realistic Mars-transit physiological telemetry.
 * 2. Triggers an active M4.8 Solar Flare event via NASA DONKI.
 * 3. Engages Mars Communication Blackout Mode (Crew Autonomy Mode).
 * 4. Queues an urgent telemetry packet in Flight Surgeon Outbox.
 */
export async function activateJudgeDemoMode(userId?: string): Promise<DemoModeStatus> {
  const now = Date.now();
  const DAY_MS = 86400000;

  // 1. Seed 30 days of realistic astronaut records
  const records: HealthRecord[] = [];
  for (let i = 29; i >= 0; i--) {
    const recordTime = new Date(now - i * DAY_MS).toISOString();
    // Simulate slight physiological adaptation drift over 30 days
    const isRecentStress = i <= 2;
    const hr = isRecentStress ? 78 : Math.floor(66 + Math.random() * 8);
    const spo2 = isRecentStress ? 96 : Math.floor(98 + Math.random() * 2);
    const sleep = isRecentStress ? 5.2 : Number((6.8 + Math.random() * 1.4).toFixed(1));
    const exercise = i % 7 === 0 ? 45 : 90; // Rest day vs ARED 90 min

    const rec: HealthRecord = {
      id: `DEMO-REC-DAY-${30 - i}`,
      userId: userId || 'alex-vance-commander',
      timestamp: recordTime,
      heartRate: hr,
      bloodOxygen: spo2,
      bloodPressureSys: 118 + Math.floor(Math.random() * 6),
      bloodPressureDia: 76 + Math.floor(Math.random() * 4),
      bodyTemperature: Number((36.5 + Math.random() * 0.4).toFixed(1)),
      sleepDurationHours: sleep,
      sleepQuality: isRecentStress ? 'Disrupted' : 'Optimal',
      sleepInterruptions: isRecentStress ? 3 : 1,
      fatigueLevel: isRecentStress ? 7 : 3,
      stressLevel: isRecentStress ? 'Elevated' : 'Low',
      moodWellbeing: isRecentStress ? 'Fatigued' : 'Focused',
      exercise: {
        type: 'ARED Resistive Exercise',
        durationMinutes: exercise,
        intensity: 'High',
        caloriesBurned: exercise * 8,
      },
      isManual: false,
      syncStatus: 'synced',
      notes: isRecentStress
        ? 'High workload prior to scheduled EVA prep; mild sleep debt accumulated.'
        : 'Nominal deep-space transit routine. ARED countermeasure complete.',
    };

    records.push(rec);
    await insertHealthRecord(rec, userId || 'alex-vance-commander');
  }

  // 2. Seed radiation history with high-dose flare spike
  for (let i = 12; i >= 0; i--) {
    const radTime = new Date(now - i * 3600000).toISOString();
    const rate = i <= 2 ? 38.5 : Number((16.5 + Math.random() * 3.0).toFixed(1));
    const radEntry: RadiationLogEntry = {
      id: `DEMO-RAD-${i}`,
      timestamp: radTime,
      rateMicroSvPerHour: rate,
      location: i <= 2 ? 'Node 2 Storm Shelter' : 'Crew Quarters',
      isSimulatedDemo: true,
    };
    await insertRadiationEntry(radEntry);
  }

  // 3. Trigger Active NASA DONKI Solar Flare & Coronal Mass Ejection Alert
  const sampleFlare: NasaDonkiEvent = {
    messageType: 'FLR',
    messageId: `2026-DONKI-FLR-M48-${Date.now()}`,
    issueTime: new Date().toISOString(),
    summary:
      'ALERT: Class M4.8 Solar Flare detected from Active Region AR3892. High-energy Solar Energetic Particle (SEP) flux accelerating towards Mars orbital trajectory. Ambient dosimeter rate elevated to 38.5 µSv/h.',
    classification: 'M4.8',
    significanceToCrew: 'CRITICAL',
    operationalGuidance:
      'Relocate crew to Node 2 radiation storm shelter immediately. Abort scheduled EVA.',
    rawMessageSnippet:
      '## NASA CCMC DONKI Space Weather Notification\nType: Solar Flare (FLR)\nClass: M4.8\nActive Region: AR3892\nTarget: Mars Deep Space Trajectory',
    sourceUrl: 'https://api.nasa.gov/DONKI/notifications',
  };
  await insertCachedDonkiEvent(sampleFlare);

  // 4. Activate Mars Comms Blackout Mode
  setSimulateCommsBlackout(true);

  // 5. Queue message for Flight Surgeon
  await queueMessageForFlightSurgeon(
    'Commander Alex Vance',
    'CRITICAL: Class M4.8 Solar Event & Crew Storm Shelter Ingress',
    'Ambient dosimeter rate crossed 38.5 µSv/h threshold following M4.8 solar flare. Crew has ingressed Node 2 water-wall storm shelter. Bio-telemetry stable. Autonomy mode active during comms blackout.',
    'URGENT_EMERGENCY'
  );

  isDemoModeEnabled = true;

  return {
    active: true,
    recordsLoaded: records.length,
    solarEventTriggered: true,
    commsBlackoutActive: true,
    outboxMessageQueued: true,
    timestamp: new Date().toISOString(),
  };
}

export function deactivateJudgeDemoMode(): void {
  setSimulateCommsBlackout(false);
  isDemoModeEnabled = false;
}
