import {
  HealthRecord,
  RadiationLogEntry,
  CabinEnvironmentData,
  AstronautProfile,
} from '../types/astronaut';

export interface NasaIntegrationModule {
  id: string;
  name: string;
  acronym: string;
  description: string;
  status: 'INTEGRATION_READY' | 'AUTHORIZATION_PENDING' | 'SANDBOX_MODE';
  protocol: string;
  schemaVersion: string;
  targetEndpoint: string;
  nasaProgram: string;
}

export const NASA_INTEGRATION_MODULES: NasaIntegrationModule[] = [
  {
    id: 'nasa_osdr',
    name: 'NASA Open Science Data Repository',
    acronym: 'NASA OSDR',
    description:
      'Archival database for space biology, crew multi-omics, and physiological telemetry from ISS and Artemis missions.',
    status: 'INTEGRATION_READY',
    protocol: 'RESTful Telemetry API / NASA Earthdata OAuth2',
    schemaVersion: 'OSDR-BioMetric-v3.2',
    targetEndpoint: 'https://osdr.nasa.gov/api/v2/telemetry/crew',
    nasaProgram: 'NASA Biological and Physical Sciences (BPS)',
  },
  {
    id: 'nasa_eda',
    name: 'NASA Environmental Data Application',
    acronym: 'NASA EDA',
    description:
      'Centralized life support environmental monitor providing atmospheric, acoustic, and thermal telemetry from deep space habitats.',
    status: 'INTEGRATION_READY',
    protocol: 'MQTT / CCSDS Space Packet Protocol',
    schemaVersion: 'EDA-Atmosphere-v2.1',
    targetEndpoint: 'https://eda.iss.nasa.gov/gateway/cabin/feed',
    nasaProgram: 'International Space Station & Gateway ECLSS',
  },
  {
    id: 'nasa_radlab',
    name: 'NASA RadLab Space Radiation Laboratory',
    acronym: 'NASA RadLab',
    description:
      'Space radiation dosimetry pipeline aggregating ionizing particle flux, SPE alerts, and deep-space dosimeter telemetry.',
    status: 'INTEGRATION_READY',
    protocol: 'NASA Space Weather Notification Network (DONKI)',
    schemaVersion: 'RadLab-TEPC-v4.0',
    targetEndpoint: 'https://radlab.jsc.nasa.gov/dosimetry/stream',
    nasaProgram: 'Space Radiation Analysis Group (SRAG) / JSC',
  },
  {
    id: 'nasa_hrr',
    name: 'NASA Human Research Roadmap',
    acronym: 'NASA HRR',
    description:
      'Evidence-based risk mitigation framework tracking crew physical countermeasures against microgravity deconditioning and bone loss.',
    status: 'INTEGRATION_READY',
    protocol: 'HRP Research Data Exchange Protocol',
    schemaVersion: 'HRR-Countermeasure-v5.0',
    targetEndpoint: 'https://humanresearchroadmap.nasa.gov/api/crew/logs',
    nasaProgram: 'NASA Human Research Program (HRP)',
  },
];

/**
 * Generates structured JSON export payload conforming to NASA OSDR metadata structure.
 * Includes anonymized astronaut metrics, MET timestamps, environmental logs, and matched NASA research references.
 */
export function generateMissionTelemetryJson(
  profile: AstronautProfile,
  records: HealthRecord[],
  radiationLogs: RadiationLogEntry[],
  cabinEnv: CabinEnvironmentData,
  anonymize: boolean = true
): string {
  const missionStart = new Date(Date.now() - profile.missionDay * 86400000);

  const calculateMET = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffMs = Math.max(0, d.getTime() - missionStart.getTime());
    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return `MET+${String(days).padStart(3, '0')}/${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const exportPayload = {
    metadata: {
      schemaVersion: 'NASA-OSDR-AstronautBiometric-v2.1',
      repository: 'NASA Open Science Data Repository (OSDR)',
      exportTimestamp: new Date().toISOString(),
      securityClassification: anonymize ? 'OPEN SCIENTIFIC RESEARCH / DE-IDENTIFIED' : 'CUI / MEDICAL TELEMETRY',
      originPlatform: 'International Space Station (ISS) / Artemis Gateway',
      anonymized: anonymize,
    },
    subject: {
      subjectIdentifier: anonymize ? `OSDR-SUBJ-${profile.id.slice(-6).toUpperCase()}` : profile.name,
      callsign: anonymize ? 'REDACTED' : profile.callsign,
      role: profile.role,
      missionAssignment: profile.missionName,
      missionDay: profile.missionDay,
      totalMissionDays: profile.totalMissionDays,
      baselines: {
        restingHeartRate: profile.baselines.restingHeartRate,
        bloodOxygenTarget: profile.baselines.bloodOxygen,
        bloodPressureNominal: `${profile.baselines.bloodPressureSys}/${profile.baselines.bloodPressureDia} mmHg`,
        coreTempNominal: profile.baselines.bodyTemperature,
        prescribedCountermeasureMins: profile.baselines.dailyExerciseMinutes,
      },
    },
    matchedNasaResearchReferences: [
      {
        accession: 'OSD-53',
        source: 'NASA OSDR',
        title: 'Microgravity-Induced Cardiovascular Remodeling and Endothelial Gene Expression',
        scientificRelevance: 'Correlated with resting heart rate and arterial pressure telemetry during long-duration flight.',
      },
      {
        accession: 'OSD-37',
        source: 'NASA OSDR',
        title: 'NASA Twins Study: Multi-Omics and Immune System Adaptation to Spaceflight',
        scientificRelevance: 'Correlated with core temperature thermoregulation and cellular inflammatory markers.',
      },
      {
        accession: 'OSD-120',
        source: 'NASA OSDR',
        title: 'Musculoskeletal Countermeasure Effectiveness (ARED vs T2) in Microgravity',
        scientificRelevance: 'Correlated with daily physical countermeasure duration and intensity.',
      },
      {
        accession: 'NASA-HRR-CARDIO',
        source: 'NASA Human Research Roadmap',
        title: 'Risk of Cardiovascular Disease and Impairment During Exploration Missions',
        scientificRelevance: 'Risk mitigation protocol for orthostatic intolerance and cephalic venous redistribution.',
      },
      {
        accession: 'NASA-HRR-SLEEP',
        source: 'NASA Human Research Roadmap',
        title: 'Risk of Adverse Cognitive Outcomes from Sleep Loss and Circadian Misalignment',
        scientificRelevance: 'Risk mitigation protocol for orbital day/night cycles and cognitive readiness.',
      },
      {
        accession: 'NASA-RADLAB-DOSTEL',
        source: 'NASA RadLab',
        title: 'ISS Columbus DosTel-2 & Liulin-5 Ionizing Radiation Telemetry Benchmark',
        scientificRelevance: 'Absorbed dose (µGy/h) and biological dose equivalent (µSv/h) baseline comparison.',
      },
    ],
    cabinEnvironmentSnapshot: {
      cabinTempCelsius: cabinEnv.cabinTempCelsius,
      cabinO2Percent: cabinEnv.cabinO2Percent,
      cabinCO2mmHg: cabinEnv.cabinCO2mmHg,
      cabinPressureKPa: cabinEnv.cabinPressureKPa,
      ambientRadiationMicroSv: cabinEnv.ambientRadiationMicroSv,
      lastUpdated: cabinEnv.lastUpdated,
    },
    biometricObservationsCount: records.length,
    biometricObservations: records.map((r) => ({
      observationId: r.id,
      timestampUTC: r.timestamp,
      missionElapsedTime: calculateMET(r.timestamp),
      heartRateBPM: r.heartRate,
      bloodOxygenSaturationSpO2: r.bloodOxygen,
      bloodPressureSystolic: r.bloodPressureSys,
      bloodPressureDiastolic: r.bloodPressureDia,
      bodyTemperatureCelsius: r.bodyTemperature,
      sleepDurationHours: r.sleepDurationHours,
      sleepQuality: r.sleepQuality,
      fatigueIndex1To10: r.fatigueLevel,
      stressLevel: r.stressLevel,
      moodWellbeing: r.moodWellbeing,
      physicalCountermeasure: {
        type: r.exercise.type,
        durationMinutes: r.exercise.durationMinutes,
        intensity: r.exercise.intensity,
      },
      isManualLog: r.isManual,
    })),
    dosimetryObservationsCount: radiationLogs.length,
    dosimetryObservations: radiationLogs.map((l) => ({
      logId: l.id,
      timestampUTC: l.timestamp,
      missionElapsedTime: calculateMET(l.timestamp),
      rateMicroSvPerHour: l.rateMicroSvPerHour,
      sensorLocation: l.location,
    })),
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Generates CSV data formatted for NASA scientific analysis by Flight Surgeons and Principal Investigators.
 */
export function generateCsvReport(
  records: HealthRecord[],
  cabinEnv?: CabinEnvironmentData,
  anonymize: boolean = true
): string {
  const headers = [
    'Subject_ID',
    'Timestamp_UTC',
    'HeartRate_BPM',
    'SpO2_Percent',
    'BP_Systolic_mmHg',
    'BP_Diastolic_mmHg',
    'BodyTemp_C',
    'Sleep_Hours',
    'SleepQuality',
    'Fatigue_Index_1_10',
    'StressLevel',
    'MoodWellbeing',
    'ExerciseType',
    'ExerciseMinutes',
    'ExerciseIntensity',
    'CabinCO2_mmHg',
    'CabinTemp_C',
    'AmbientRadiation_uSv_h',
    'Matched_NASA_OSDR_Ref',
  ];

  const subjectId = anonymize ? 'OSDR-SUBJ-ANON' : 'ASTRONAUT-PRIMARY';
  const co2 = cabinEnv?.cabinCO2mmHg.toFixed(1) || '2.8';
  const temp = cabinEnv?.cabinTempCelsius.toFixed(1) || '21.8';
  const rad = cabinEnv?.ambientRadiationMicroSv.toFixed(1) || '18.5';

  const rows = records.map((r) => [
    subjectId,
    r.timestamp,
    r.heartRate,
    r.bloodOxygen,
    r.bloodPressureSys,
    r.bloodPressureDia,
    r.bodyTemperature,
    r.sleepDurationHours,
    r.sleepQuality,
    r.fatigueLevel,
    r.stressLevel,
    r.moodWellbeing,
    `"${r.exercise.type}"`,
    r.exercise.durationMinutes,
    r.exercise.intensity,
    co2,
    temp,
    rad,
    '"OSD-53, OSD-37, NASA-HRR-CARDIO"',
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

