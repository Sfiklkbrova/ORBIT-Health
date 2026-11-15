// Response Generation and Synthesis Service for ORBIT AI

import {
  CalculationResult,
  MultiStepAnalysisResult,
  AiResponsePayload,
} from './types';
import { RadiationAnalysisResult } from './radiationAnalysisService';
import { ResearchSynthesisResult } from './nasaResearchService';
import { NasaRagCitation } from '../nasa/nasaKnowledgeBase';
import { NASA_SCIENTIFIC_DISCLAIMER } from '../aiEngine';

/**
 * Builds an intelligent, formatted response for a calculation query.
 */
export function buildCalculationResponse(
  calc: CalculationResult,
  query: string,
  processingTimeMs: number
): AiResponsePayload {
  let answer = `### Mathematical Telemetry Calculation: ${calc.metric}\n\n`;
  answer += `• **Result:** \`${calc.formattedResult}\`\n`;
  answer += `• **Time Window:** ${calc.timePeriod}\n`;
  answer += `• **Sample Size:** ${calc.dataPointsCount} observation(s)\n\n`;
  answer += `**Calculation Breakdown & Method:**\n${calc.explanation}\n\n`;

  if (calc.limitations) {
    answer += `> **Data Notes & Limitations:** ${calc.limitations}\n\n`;
  }

  answer += `*Operational Context:* Telemetry computed dynamically by the local ORBIT mathematical analysis engine.`;

  return {
    answer,
    category: 'vital',
    intent: 'CALCULATION',
    calculations: [calc],
    suggestedQuestions: [
      'Compare my sleep quality over the last seven days.',
      'What is my cumulative radiation exposure?',
      'How does my current health compare with my personal baseline?',
    ],
    isOffline: true,
    confidence: 0.99,
    processingTimeMs,
    engineMode: 'AUTONOMOUS_LOCAL_ENGINE',
  };
}

/**
 * Builds an intelligent, formatted response for radiation queries.
 */
export function buildRadiationResponse(
  radAnalysis: RadiationAnalysisResult,
  processingTimeMs: number
): AiResponsePayload {
  let answer = `### Advanced Space Radiation Dosimetry Analysis\n\n`;
  answer += `• **Current Ambient Flux:** \`${radAnalysis.currentRateMicroSvPerHour.toFixed(1)} µSv/h\` (Dose Equivalent Rate)\n`;
  answer += `• **24-Hour Daily Dose:** \`${radAnalysis.dailyExposureMicroSv.toFixed(0)} µSv\`\n`;
  answer += `• **Cumulative Mission Dose:** \`${radAnalysis.cumulativeExposureMilliSv.toFixed(2)} mSv\` (${radAnalysis.percentCareerLimit}% of ${radAnalysis.careerLimitMilliSv} mSv NASA Career Limit)\n`;
  answer += `• **Dosimetry Trend:** **${radAnalysis.trend}** — ${radAnalysis.trendExplanation}\n\n`;

  if (radAnalysis.radlabBenchmark) {
    answer += `**NASA RadLab Real Flight Instrument Reference (${radAnalysis.radlabBenchmark.instrumentId}):**\n`;
    answer += `• Historical Absorbed Dose Rate: \`${radAnalysis.radlabBenchmark.absorbedDoseRateMicroGyPerHour?.toFixed(2) || '10.22'} µGy/h\` (physical energy in tissue)\n`;
    answer += `• Historical Dose Equivalent Rate: \`${radAnalysis.radlabBenchmark.doseEquivalentRateMicroSvPerHour?.toFixed(2) || '17.88'} µSv/h\` (adjusted by Quality Factor Q ≈ 1.75 - 2.0)\n`;
    answer += `• Radiation Particle Flux: \`${radAnalysis.radlabBenchmark.fluxParticlesPerCm2Sec?.toFixed(4) || '0.5317'} part/cm²·s\`\n\n`;
  }

  if (radAnalysis.latestDonkiEvent) {
    answer += `**NASA DONKI Space Weather Status:**\n`;
    answer += `• Event: \`[${radAnalysis.latestDonkiEvent.messageType}] ${radAnalysis.latestDonkiEvent.classification || 'Solar Event'}\` (${radAnalysis.latestDonkiEvent.significanceToCrew})\n`;
    answer += `• Summary: ${radAnalysis.latestDonkiEvent.summary}\n`;
    answer += `• Action: ${radAnalysis.latestDonkiEvent.operationalGuidance}\n\n`;
  }

  answer += `**Flight Operational Recommendations:**\n`;
  radAnalysis.operationalRecommendations.forEach((rec, i) => {
    answer += `${i + 1}. ${rec}\n`;
  });

  answer += `\n> ⚠️ **Scientific Principle:** ${radAnalysis.scientificShieldingNotice}\n\n`;
  answer += `*${NASA_SCIENTIFIC_DISCLAIMER}*`;

  const citations: NasaRagCitation[] = [];
  if (radAnalysis.radlabBenchmark) {
    citations.push({
      sourceName: 'NASA RadLab',
      documentTitle: 'ISS Columbus DosTel-2 Flight Telemetry Archive',
      url: 'https://visualization.osdr.nasa.gov/radlab/',
      keyFinding: 'Provides benchmark dose equivalent rates (~15 - 25 µSv/h) for LEO orbital trajectories.',
    });
  }

  return {
    answer,
    category: 'radiation',
    intent: 'RADIATION_ANALYSIS',
    calculations: radAnalysis.calculations,
    citations,
    suggestedQuestions: [
      'Are there any recent solar events relevant to space-weather monitoring?',
      'How much radiation have I accumulated?',
      'Analyze my health today.',
    ],
    isOffline: true,
    confidence: 0.98,
    processingTimeMs,
    engineMode: 'AUTONOMOUS_LOCAL_ENGINE',
  };
}

/**
 * Builds an intelligent, formatted response for scientific research inquiries.
 */
export function buildResearchResponse(
  research: ResearchSynthesisResult,
  processingTimeMs: number
): AiResponsePayload {
  let answer = `### NASA Scientific Research Synthesis: ${research.topic}\n\n`;
  answer += `**Verified Scientific Facts (NASA OSDR & Human Research Program):**\n`;
  research.verifiedFacts.forEach((fact) => {
    answer += `• ${fact}\n`;
  });

  answer += `\n**Scientific Interpretation & Multi-Omics Context:**\n${research.scientificInterpretation}\n\n`;

  answer += `**Evidence-Based Spaceflight Countermeasures:**\n`;
  research.operationalProtocols.forEach((proto, i) => {
    answer += `${i + 1}. ${proto}\n`;
  });

  answer += `\n**Official NASA Research Citations:**\n`;
  research.citations.forEach((c) => {
    answer += `• **[${c.sourceName}]** *${c.documentTitle}*\n  Key Finding: ${c.keyFinding}\n  [Source Link](${c.url})\n\n`;
  });

  answer += `*${NASA_SCIENTIFIC_DISCLAIMER}*`;

  return {
    answer,
    category: 'general',
    intent: 'NASA_RESEARCH',
    citations: research.citations,
    suggestedQuestions: [
      'Which NASA research documents support this recommendation?',
      'Analyze my health today.',
      'Check my radiation exposure.',
    ],
    isOffline: true,
    confidence: research.dataConfidence,
    processingTimeMs,
    engineMode: 'AUTONOMOUS_LOCAL_ENGINE',
  };
}

/**
 * Builds an intelligent, formatted response for deep multi-step health analysis.
 */
export function buildMultiStepHealthResponse(
  analysis: MultiStepAnalysisResult,
  missionDay: number,
  processingTimeMs: number
): AiResponsePayload {
  let answer = `### Multi-Step Spaceflight Physiological Assessment (Mission Day ${missionDay})\n\n`;
  answer += `**Primary Diagnostic Finding:**\n${analysis.primaryFinding}\n\n`;

  if (analysis.calculations.length > 0) {
    answer += `**Biometric Measurements & 7-Day Statistical Calculations:**\n`;
    analysis.calculations.forEach((c) => {
      answer += `• **${c.metric}:** \`${c.formattedResult}\` (${c.timePeriod})\n`;
    });
    answer += `\n`;
  }

  if (analysis.correlations.length > 0) {
    answer += `**Multi-System Inter-Indicator Correlations:**\n`;
    analysis.correlations.forEach((corr) => {
      answer += `• **${corr.indicatorA} ↔ ${corr.indicatorB}** [${corr.significance} SIGNIFICANCE]:\n  ${corr.finding}\n`;
    });
    answer += `\n`;
  }

  answer += `**Evidence-Based Preventive Recommendations:**\n`;
  analysis.recommendations.forEach((rec, i) => {
    answer += `${i + 1}. ${rec}\n`;
  });

  if (analysis.nasaCitations.length > 0) {
    answer += `\n**NASA Evidence Reports Cited:**\n`;
    analysis.nasaCitations.forEach((c) => {
      answer += `• **${c.sourceName}:** *${c.documentTitle}* — [Link](${c.url})\n`;
    });
  }

  answer += `\n*${NASA_SCIENTIFIC_DISCLAIMER}*`;

  return {
    answer,
    category: 'vital',
    intent: 'HEALTH_SUMMARY',
    calculations: analysis.calculations,
    citations: analysis.nasaCitations,
    suggestedQuestions: [
      'Compare my sleep quality over the last seven days.',
      'Check my radiation exposure.',
      'What does NASA research say about sleep disruption in space?',
    ],
    isOffline: true,
    confidence: 0.95,
    processingTimeMs,
    engineMode: 'AUTONOMOUS_LOCAL_ENGINE',
  };
}
