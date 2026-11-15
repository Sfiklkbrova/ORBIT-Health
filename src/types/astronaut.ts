// Space Mission Domain Types & Interfaces for Astronaut Health Monitoring

export type HealthCondition = 'NORMAL' | 'NEEDS_ATTENTION' | 'CRITICAL';

export type RadiationRiskLevel = 'NORMAL' | 'ELEVATED' | 'HIGH';

export type SpaceExerciseType =
  | 'ARED Resistive Exercise'
  | 'CEVIS Cycle Ergometer'
  | 'T2 Space Treadmill'
  | 'EVA Spacewalk Activity'
  | 'None / Rest Day';

export type SleepQuality = 'Optimal' | 'Restless' | 'Disrupted' | 'Poor';

export type StressLevel = 'Low' | 'Moderate' | 'Elevated' | 'High';

export type MoodWellbeing = 'Focused' | 'Stable' | 'Motivated' | 'Fatigued' | 'Strained';

export interface CountermeasureExercise {
  type: SpaceExerciseType;
  durationMinutes: number;
  intensity: 'Low' | 'Moderate' | 'High';
  caloriesBurned?: number;
}

export interface AstronautProfile {
  id: string;
  name: string;
  callsign: string;
  age: number;
  missionName: string;
  missionDay: number;
  totalMissionDays: number;
  role: string;
  stationModule: string;
  baselines: {
    restingHeartRate: number; // e.g. 68 BPM
    bloodOxygen: number; // e.g. 98%
    bloodPressureSys: number; // e.g. 118
    bloodPressureDia: number; // e.g. 78
    bodyTemperature: number; // e.g. 36.6 °C
    sleepHours: number; // e.g. 7.5 hrs
    dailyExerciseMinutes: number; // e.g. 90 min
    radiationThresholdMicroSv: number; // e.g. 25 µSv/h
  };
  emergencyContact: {
    flightSurgeonName: string;
    commChannel: string;
    location: string;
    frequency: string;
  };
  avatarId?: string;
  userId?: string;
}

export interface HealthRecord {
  id: string;
  userId?: string; // Astronaut sovereign user ID for strict data isolation
  timestamp: string; // ISO-8601
  heartRate: number; // BPM
  bloodOxygen: number; // SpO2 %
  bloodPressureSys: number; // mmHg
  bloodPressureDia: number; // mmHg
  bodyTemperature: number; // °C
  sleepDurationHours: number; // hrs
  sleepQuality: SleepQuality;
  sleepInterruptions: number; // count
  fatigueLevel: number; // 1 (Energized) to 10 (Exhausted)
  stressLevel: StressLevel;
  moodWellbeing: MoodWellbeing;
  exercise: CountermeasureExercise;
  isManual: boolean; // Must distinguish manual from live telemetry
  syncStatus: 'synced' | 'pending' | 'failed';
  notes?: string;
}

export interface RadiationData {
  currentRateMicroSvPerHour: number; // µSv/h
  dailyExposureMicroSv: number; // µSv
  cumulativeMissionExposureMilliSv: number; // mSv
  careerLimitMilliSv: number; // e.g. 600 mSv NASA limit
  thresholdRiskLevel: RadiationRiskLevel;
  solarParticleEventStatus: 'Quiet' | 'Advisory' | 'Active SPE Warning';
  recommendations: string[];
  isSimulatedDemo: boolean;
  lastUpdated: string;
}

export interface RadiationLogEntry {
  id: string;
  timestamp: string;
  rateMicroSvPerHour: number;
  location: string; // e.g. "Cupola", "Crew Quarters", "Airlock"
  isSimulatedDemo: boolean;
}

export interface CabinEnvironmentData {
  cabinTempCelsius: number; // nominal 21.0 - 24.0 °C
  cabinO2Percent: number; // nominal 20.9%
  cabinCO2mmHg: number; // nominal < 3.0 mmHg
  cabinPressureKPa: number; // nominal 101.3 kPa
  ambientRadiationMicroSv: number; // µSv/h
  overallStatus: 'Nominal' | 'Advisory' | 'Caution';
  isSimulatedDemo: boolean;
  lastUpdated: string;
}

export interface HealthAlert {
  id: string;
  timestamp: string;
  title: string;
  category: 'VITAL' | 'RADIATION' | 'ENVIRONMENT' | 'FATIGUE' | 'SLEEP';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  triggerReason: string;
  recommendedAction: string;
  acknowledged: boolean;
  ruleFormula?: string;
  inputValues?: string;
  dataSourceBadge?: 'NASA_LIVE' | 'NASA_CACHED' | 'SIMULATED' | 'MANUAL' | 'SENSOR';
}

export interface AiHealthAssessment {
  overallCondition: HealthCondition;
  vitalityScore: number; // 0 - 100
  summary: string;
  keyObservations: {
    metric: string;
    finding: string;
    status: 'Optimal' | 'Attention' | 'Warning';
  }[];
  fatigueAndSleepAnalysis: string;
  environmentalRiskAnalysis: string;
  preventiveRecommendations: string[];
  earlyWarnings: string[];
  confidenceScore: number;
  engineMode: 'ONNX_MODEL_FALLBACK_RULE_ENGINE' | 'ONNX_RUNTIME_MOBILE';
  lastEvaluated: string;
  nasaCitations?: {
    source: string;
    accession?: string;
    title: string;
    finding: string;
  }[];
  scientificDisclaimer?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  contextCategory?: 'general' | 'radiation' | 'fatigue' | 'vital' | 'environment';
}

export type MainNavTab =
  | 'dashboard'
  | 'health'
  | 'radiation'
  | 'twin'
  | 'timeline'
  | 'fitness'
  | 'emergency'
  | 'control'
  | 'voice'
  | 'assistant'
  | 'nasa'
  | 'profile'
  | 'beyond_space'
  | 'about'
  | 'sans'
  | 'behavioral';

