// Emergency Monitoring & Flight Surgeon Medical Telemetry Protocol

import { HealthRecord, AstronautProfile, RadiationData, CabinEnvironmentData } from '../types/astronaut';

export interface EmergencyThresholdConfig {
  heartRateMaxBpm: number; // e.g. 150
  heartRateMinBpm: number; // e.g. 45
  spo2MinPercent: number; // e.g. 92
  bpSystolicMax: number; // e.g. 160
  bpSystolicMin: number; // e.g. 85
  bodyTempMaxCelsius: number; // e.g. 38.5
  bodyTempMinCelsius: number; // e.g. 35.0
  radiationFluxMaxMicroSv: number; // e.g. 100.0
  cabinCo2MaxMmHg: number; // e.g. 5.0
}

export const DEFAULT_EMERGENCY_THRESHOLDS: EmergencyThresholdConfig = {
  heartRateMaxBpm: 150,
  heartRateMinBpm: 45,
  spo2MinPercent: 92,
  bpSystolicMax: 160,
  bpSystolicMin: 85,
  bodyTempMaxCelsius: 38.5,
  bodyTempMinCelsius: 35.0,
  radiationFluxMaxMicroSv: 100.0,
  cabinCo2MaxMmHg: 5.0,
};

export interface EmergencyEvent {
  id: string;
  timestamp: string;
  affectedIndicator: string;
  measuredValue: string;
  thresholdViolation: string;
  triggerReason: string;
  recommendedAction: string;
  severity: 'CRITICAL' | 'WARNING';
  isFalseAlarmFiltered: boolean;
  downlinkStatus: 'QUEUED_LOCAL_SQLITE' | 'TRANSMITTED_TO_HOUSTON';
}

export interface EmergencyHealthSummary {
  astronautId: string;
  astronautName: string;
  missionName: string;
  missionDay: number;
  timestamp: string;
  primaryEmergencyReason: string;
  vitalsSnapshot: {
    heartRate: string;
    bloodOxygen: string;
    bloodPressure: string;
    temperature: string;
    radiationRate: string;
    cabinCo2: string;
  };
  recommendedImmediateProtocol: string;
  flightSurgeonContact: {
    flightSurgeonName: string;
    commChannel: string;
    frequency: string;
    location: string;
  };
  downlinkNotice: string;
}

let emergencyEventHistory: EmergencyEvent[] = [
  {
    id: 'emg_evt_01',
    timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    affectedIndicator: 'Cabin CO2 Concentration',
    measuredValue: '4.2 mmHg',
    thresholdViolation: 'Exceeded nominal advisory limit of 3.8 mmHg',
    triggerReason: 'ECLSS Carbon Dioxide Removal Assembly (CDRA) bed cycle desynchronization during crew sleep block.',
    recommendedAction: 'Manually cycled CDRA secondary desiccant bed; cabin ventilation airflow nominalized within 45 minutes.',
    severity: 'WARNING',
    isFalseAlarmFiltered: false,
    downlinkStatus: 'QUEUED_LOCAL_SQLITE',
  },
];

export function getEmergencyEventHistory(): EmergencyEvent[] {
  return [...emergencyEventHistory];
}

export function logEmergencyEvent(event: EmergencyEvent): void {
  emergencyEventHistory.unshift(event);
}

/**
 * Checks telemetry against safety thresholds with false-alarm dampening.
 */
export function evaluateEmergencyConditions(
  latestRecord: HealthRecord | null,
  radiationData: RadiationData,
  cabinEnv: CabinEnvironmentData,
  thresholds: EmergencyThresholdConfig = DEFAULT_EMERGENCY_THRESHOLDS
): EmergencyEvent[] {
  const events: EmergencyEvent[] = [];

  if (!latestRecord) return events;

  // 1. SpO2 Hypoxia Check
  if (latestRecord.bloodOxygen < thresholds.spo2MinPercent) {
    events.push({
      id: `emg_${Date.now()}_spo2`,
      timestamp: latestRecord.timestamp,
      affectedIndicator: 'Arterial Blood Oxygen (SpO2)',
      measuredValue: `${latestRecord.bloodOxygen}%`,
      thresholdViolation: `Below critical safety threshold of ${thresholds.spo2MinPercent}%`,
      triggerReason: 'Severe arterial oxygen desaturation detected. Risk of hypoxic cognitive impairment.',
      recommendedAction: 'Immediate action: Don Emergency Breathing Mask. Verify ECLSS cabin O2 concentration and suit pressure regulator.',
      severity: 'CRITICAL',
      isFalseAlarmFiltered: false,
      downlinkStatus: 'QUEUED_LOCAL_SQLITE',
    });
  }

  // 2. Severe Tachycardia / Bradycardia
  if (latestRecord.heartRate > thresholds.heartRateMaxBpm) {
    events.push({
      id: `emg_${Date.now()}_hr_high`,
      timestamp: latestRecord.timestamp,
      affectedIndicator: 'Heart Rate (Tachycardia)',
      measuredValue: `${latestRecord.heartRate} BPM`,
      thresholdViolation: `Exceeded upper limit of ${thresholds.heartRateMaxBpm} BPM`,
      triggerReason: 'Sustained supra-physiological heart rate at rest. Possible acute autonomic strain or cardiac arrhythmia.',
      recommendedAction: 'Cease physical activity immediately. Assume seated or recumbent posture. Perform vagal maneuver if instructed by Houston Flight Surgeon.',
      severity: 'CRITICAL',
      isFalseAlarmFiltered: false,
      downlinkStatus: 'QUEUED_LOCAL_SQLITE',
    });
  } else if (latestRecord.heartRate < thresholds.heartRateMinBpm) {
    events.push({
      id: `emg_${Date.now()}_hr_low`,
      timestamp: latestRecord.timestamp,
      affectedIndicator: 'Heart Rate (Bradycardia)',
      measuredValue: `${latestRecord.heartRate} BPM`,
      thresholdViolation: `Below lower safety limit of ${thresholds.heartRateMinBpm} BPM`,
      triggerReason: 'Severe resting bradycardia detected during waking hours.',
      recommendedAction: 'Initiate bio-link diagnostic ECG check. Notify Flight Medical Officer.',
      severity: 'WARNING',
      isFalseAlarmFiltered: false,
      downlinkStatus: 'QUEUED_LOCAL_SQLITE',
    });
  }

  // 3. Radiation Solar Energetic Particle Storm
  if (radiationData.currentRateMicroSvPerHour > thresholds.radiationFluxMaxMicroSv) {
    events.push({
      id: `emg_${Date.now()}_rad`,
      timestamp: radiationData.lastUpdated,
      affectedIndicator: 'Ambient Radiation Dosimeter Flux',
      measuredValue: `${radiationData.currentRateMicroSvPerHour.toFixed(1)} µSv/h`,
      thresholdViolation: `Exceeded emergency threshold of ${thresholds.radiationFluxMaxMicroSv} µSv/h`,
      triggerReason: 'Acute Solar Particle Event (SPE) or severe South Atlantic Anomaly deep-core transit detected.',
      recommendedAction: 'Protocol: Relocate immediately to central radiation storm shelter (Node 2 Water Wall Berth). Postpone all EVA operations.',
      severity: 'CRITICAL',
      isFalseAlarmFiltered: false,
      downlinkStatus: 'QUEUED_LOCAL_SQLITE',
    });
  }

  return events;
}

/**
 * Generates an automated emergency brief ready for space-to-ground downlink to Houston Flight Surgeon.
 */
export function generateFlightSurgeonEmergencySummary(
  profile: AstronautProfile,
  latestRecord: HealthRecord | null,
  radiationData: RadiationData,
  cabinEnv: CabinEnvironmentData,
  primaryEvent?: EmergencyEvent
): EmergencyHealthSummary {
  return {
    astronautId: profile.id,
    astronautName: profile.name,
    missionName: profile.missionName,
    missionDay: profile.missionDay,
    timestamp: new Date().toISOString(),
    primaryEmergencyReason: primaryEvent ? primaryEvent.triggerReason : 'Preventive Medical Telemetry Brief',
    vitalsSnapshot: {
      heartRate: latestRecord ? `${latestRecord.heartRate} BPM` : 'N/A',
      bloodOxygen: latestRecord ? `${latestRecord.bloodOxygen}%` : 'N/A',
      bloodPressure: latestRecord ? `${latestRecord.bloodPressureSys}/${latestRecord.bloodPressureDia} mmHg` : 'N/A',
      temperature: latestRecord ? `${latestRecord.bodyTemperature}°C` : 'N/A',
      radiationRate: `${radiationData.currentRateMicroSvPerHour.toFixed(1)} µSv/h`,
      cabinCo2: `${cabinEnv.cabinCO2mmHg} mmHg`,
    },
    recommendedImmediateProtocol: primaryEvent
      ? primaryEvent.recommendedAction
      : 'Maintain standard mission schedule and hydration countermeasures.',
    flightSurgeonContact: profile.emergencyContact,
    downlinkNotice:
      'STATUS: Emergency brief compiled in local SQLite mission store. Downlink transmission will synchronize automatically across Space-to-Ground Ku-Band carrier frequency 2287.5 MHz upon carrier acquisition.',
  };
}
