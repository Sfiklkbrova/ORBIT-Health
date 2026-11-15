import {
  HealthRecord,
  AstronautProfile,
  RadiationData,
  CabinEnvironmentData,
  HealthAlert,
} from '../types/astronaut';
import { NasaRagCitation } from './nasa/nasaKnowledgeBase';
import { processAssistantQuery } from './ai/aiAssistantService';
import { CalculationResult } from './ai/types';

export interface AssistantResponse {
  answer: string;
  category: 'general' | 'radiation' | 'fatigue' | 'vital' | 'environment';
  suggestedQuestions: string[];
  citations?: NasaRagCitation[];
  calculations?: CalculationResult[];
}

/**
 * Advanced AI Health Assistant Engine for Astronauts.
 * Powered by dedicated Mathematical & Scientific Calculation Engine,
 * NASA OSDR Space Biology, NASA RadLab Dosimetry, NASA HRR, and NASA DONKI.
 */
export async function generateAssistantReply(
  query: string,
  latestRecord: HealthRecord | null,
  recentRecords: HealthRecord[],
  radiationData: RadiationData,
  cabinEnv: CabinEnvironmentData,
  alerts: HealthAlert[],
  profile: AstronautProfile,
  onStreamChunk?: (chunk: string) => void
): Promise<AssistantResponse> {
  const result = await processAssistantQuery(
    query,
    latestRecord,
    recentRecords,
    radiationData,
    cabinEnv,
    alerts,
    profile,
    onStreamChunk
  );

  return {
    answer: result.answer,
    category: result.category,
    suggestedQuestions: result.suggestedQuestions,
    citations: result.citations,
    calculations: result.calculations,
  };
}
