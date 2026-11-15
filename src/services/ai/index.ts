// Central Export Point for ORBIT AI System

import { processAssistantQuery } from './aiAssistantService';
import {
  HealthRecord,
  AstronautProfile,
  RadiationData,
  CabinEnvironmentData,
  HealthAlert,
} from '../../types/astronaut';
import { AssistantResponse } from '../assistantEngine';

export * from './types';
export * from './calculationService';
export * from './questionUnderstandingService';
export * from './conversationMemoryService';
export * from './healthAnalysisService';
export * from './radiationAnalysisService';
export * from './nasaResearchService';
export * from './responseGenerationService';
export * from './offlineAIService';
export * from './aiAssistantService';

/**
 * Backwards-compatible adapter for existing code calling generateAssistantReply.
 */
export async function generateAssistantReply(
  query: string,
  latestRecord: HealthRecord | null,
  recentRecords: HealthRecord[],
  radiationData: RadiationData,
  cabinEnv: CabinEnvironmentData,
  alerts: HealthAlert[],
  profile: AstronautProfile
): Promise<AssistantResponse> {
  const result = await processAssistantQuery(
    query,
    latestRecord,
    recentRecords,
    radiationData,
    cabinEnv,
    alerts,
    profile
  );

  return {
    answer: result.answer,
    category: result.category,
    suggestedQuestions: result.suggestedQuestions,
    citations: result.citations,
  };
}
