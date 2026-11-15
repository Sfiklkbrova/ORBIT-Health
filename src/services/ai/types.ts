// Domain Types for Advanced Autonomous ORBIT AI Assistant

import {
  HealthRecord,
  AstronautProfile,
  RadiationData,
  CabinEnvironmentData,
  HealthAlert,
} from '../../types/astronaut';
import { NasaRagCitation } from '../nasa/nasaKnowledgeBase';

export type AiIntent =
  | 'HEALTH_SUMMARY'
  | 'CALCULATION'
  | 'COMPARISON'
  | 'RADIATION_ANALYSIS'
  | 'SPACE_WEATHER'
  | 'NASA_RESEARCH'
  | 'ENVIRONMENTAL_ANALYSIS'
  | 'GENERAL_CHAT'
  | 'FOLLOW_UP';

export type MetricType =
  | 'HEART_RATE'
  | 'BLOOD_OXYGEN'
  | 'BLOOD_PRESSURE'
  | 'BODY_TEMP'
  | 'SLEEP_DURATION'
  | 'SLEEP_QUALITY'
  | 'FATIGUE'
  | 'STRESS'
  | 'EXERCISE'
  | 'RADIATION'
  | 'CO2'
  | 'CABIN_TEMP'
  | 'ALL_VITALS';

export type TimeWindow =
  | 'TODAY'
  | 'LAST_24_HOURS'
  | 'LAST_7_DAYS'
  | 'LAST_14_DAYS'
  | 'LAST_30_DAYS'
  | 'MISSION_TOTAL';

export interface CalculationResult {
  metric: string;
  operation:
    | 'AVERAGE'
    | 'PERCENT_CHANGE'
    | 'MIN_MAX'
    | 'CUMULATIVE_DOSE'
    | 'DELTA'
    | 'TREND'
    | 'DIFFERENCE';
  resultValue: number;
  formattedResult: string;
  unit: string;
  timePeriod: string;
  explanation: string;
  dataPointsCount: number;
  limitations?: string;
  additionalStats?: {
    min?: number;
    max?: number;
    baseline?: number;
    previousPeriodAvg?: number;
    percentChange?: number;
  };
}

export interface MultiStepAnalysisResult {
  primaryFinding: string;
  calculations: CalculationResult[];
  correlations: {
    indicatorA: string;
    indicatorB: string;
    finding: string;
    significance: 'LOW' | 'MODERATE' | 'HIGH';
  }[];
  nasaCitations: NasaRagCitation[];
  recommendations: string[];
  riskRating: 'NOMINAL' | 'ADVISORY' | 'WARNING' | 'CRITICAL';
}

export interface ConversationTurn {
  id: string;
  query: string;
  intent: AiIntent;
  targetMetrics: MetricType[];
  timeWindow: TimeWindow;
  responseSummary: string;
  timestamp: string;
}

export interface AiResponsePayload {
  answer: string;
  category: 'general' | 'radiation' | 'fatigue' | 'vital' | 'environment';
  intent: AiIntent;
  calculations?: CalculationResult[];
  citations?: NasaRagCitation[];
  suggestedQuestions: string[];
  isOffline: boolean;
  confidence: number;
  processingTimeMs: number;
  engineMode: 'AUTONOMOUS_LOCAL_ENGINE' | 'STREAMING_LOCAL_AGENT';
}

export interface AssistantContext {
  query: string;
  latestRecord: HealthRecord | null;
  recentRecords: HealthRecord[];
  radiationData: RadiationData;
  cabinEnv: CabinEnvironmentData;
  alerts: HealthAlert[];
  profile: AstronautProfile;
  conversationHistory: ConversationTurn[];
}

