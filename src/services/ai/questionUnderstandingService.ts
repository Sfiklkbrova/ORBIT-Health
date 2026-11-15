// Natural Language Intent Classification and Entity Extraction for ORBIT AI

import { AiIntent, MetricType, TimeWindow, ConversationTurn } from './types';

export interface ParsedQuestionIntent {
  intent: AiIntent;
  targetMetrics: MetricType[];
  timeWindow: TimeWindow;
  isCalculationRequired: boolean;
  isComparisonRequired: boolean;
  isFollowUp: boolean;
  complexity: 'SIMPLE' | 'CALCULATION' | 'RESEARCH' | 'COMPLEX_MULTI_STEP';
  resolvedSubject: string;
}

/**
 * Understands natural language query intent, entities, time ranges, and conversational follow-ups.
 */
export function understandQuestion(
  rawQuery: string,
  history: ConversationTurn[] = []
): ParsedQuestionIntent {
  const q = rawQuery.toLowerCase().trim();
  const lastTurn = history.length > 0 ? history[history.length - 1] : null;

  // 1. Detect Follow-up Questions and resolve pronouns
  const isFollowUpPattern =
    q.startsWith('what about') ||
    q.startsWith('and my') ||
    q.startsWith('how about') ||
    q.startsWith('bəs mənim') ||
    q.startsWith('bəs') ||
    q.startsWith('peki ya') ||
    q.startsWith('peki') ||
    q.includes('compare that') ||
    q.includes('what does that mean') ||
    q.includes('how does that compare') ||
    q.includes('bunun mənası nədir') ||
    q.includes('bu ne anlama geliyor') ||
    q.includes('is it');

  // 2. Extract Target Metrics
  const targetMetrics: MetricType[] = [];

  if (
    q.includes('heart') ||
    q.includes('pulse') ||
    q.includes('cardio') ||
    q.includes('bpm') ||
    q.includes('ürək') ||
    q.includes('nəbz') ||
    q.includes('döyüntü') ||
    q.includes('kalp') ||
    q.includes('atış')
  ) {
    targetMetrics.push('HEART_RATE');
  }
  if (
    q.includes('oxygen') ||
    q.includes('spo2') ||
    q.includes('o2 saturation') ||
    q.includes('oksigen') ||
    q.includes('doyğunluq')
  ) {
    targetMetrics.push('BLOOD_OXYGEN');
  }
  if (
    q.includes('blood pressure') ||
    q.includes('systolic') ||
    q.includes('diastolic') ||
    q.includes('bp') ||
    q.includes('təzyiq') ||
    q.includes('tansiyon')
  ) {
    targetMetrics.push('BLOOD_PRESSURE');
  }
  if (
    q.includes('temp') ||
    q.includes('temperature') ||
    q.includes('fever') ||
    q.includes('core') ||
    q.includes('hərarət') ||
    q.includes('temperatur') ||
    q.includes('istilik') ||
    q.includes('sıcaklık') ||
    q.includes('ateş')
  ) {
    targetMetrics.push('BODY_TEMP');
  }
  if (
    q.includes('sleep') ||
    q.includes('insomnia') ||
    q.includes('circadian') ||
    q.includes('rem') ||
    q.includes('rested') ||
    q.includes('yuxu') ||
    q.includes('yuxum') ||
    q.includes('uyku') ||
    q.includes('uykum')
  ) {
    targetMetrics.push('SLEEP_DURATION');
  }
  if (
    q.includes('fatigue') ||
    q.includes('tired') ||
    q.includes('exhaust') ||
    q.includes('cognitive readiness') ||
    q.includes('yorğunluq') ||
    q.includes('yorgunluk') ||
    q.includes('yorğun') ||
    q.includes('yorgun') ||
    q.includes('halsız')
  ) {
    targetMetrics.push('FATIGUE');
  }
  if (
    q.includes('stress') ||
    q.includes('anxiety') ||
    q.includes('mood') ||
    q.includes('wellbeing') ||
    q.includes('stres') ||
    q.includes('təşviş') ||
    q.includes('gerginlik')
  ) {
    targetMetrics.push('STRESS');
  }
  if (
    q.includes('exercise') ||
    q.includes('ared') ||
    q.includes('cevis') ||
    q.includes('t2') ||
    q.includes('workout') ||
    q.includes('countermeasure') ||
    q.includes('məşq') ||
    q.includes('idman') ||
    q.includes('fiziki') ||
    q.includes('egzersiz') ||
    q.includes('bərpa') ||
    q.includes('toparlanma')
  ) {
    targetMetrics.push('EXERCISE');
  }
  if (
    q.includes('radiation') ||
    q.includes('dose') ||
    q.includes('sievert') ||
    q.includes('gray') ||
    q.includes('flux') ||
    q.includes('dosimeter') ||
    q.includes('radlab') ||
    q.includes('radiasiya') ||
    q.includes('radyasyon') ||
    q.includes('doza') ||
    q.includes('doz')
  ) {
    targetMetrics.push('RADIATION');
  }
  if (
    q.includes('co2') ||
    q.includes('carbon dioxide') ||
    q.includes('hypercapnia') ||
    q.includes('cabin') ||
    q.includes('eclss') ||
    q.includes('air') ||
    q.includes('karbon') ||
    q.includes('hava')
  ) {
    targetMetrics.push('CO2');
  }

  // If follow up without explicit metric, inherit from previous turn
  if (targetMetrics.length === 0 && isFollowUpPattern && lastTurn && lastTurn.targetMetrics.length > 0) {
    targetMetrics.push(...lastTurn.targetMetrics);
  }

  // 3. Extract Time Window
  let timeWindow: TimeWindow = 'LAST_7_DAYS';
  if (q.includes('today') || q.includes('current') || q.includes('right now') || q.includes('latest')) {
    timeWindow = 'TODAY';
  } else if (q.includes('24 hours') || q.includes('yesterday') || q.includes('last day')) {
    timeWindow = 'LAST_24_HOURS';
  } else if (q.includes('two weeks') || q.includes('14 days') || q.includes('fortnight')) {
    timeWindow = 'LAST_14_DAYS';
  } else if (q.includes('month') || q.includes('30 days') || q.includes('four weeks')) {
    timeWindow = 'LAST_30_DAYS';
  } else if (q.includes('mission') || q.includes('career') || q.includes('all time') || q.includes('cumulative') || q.includes('total')) {
    timeWindow = 'MISSION_TOTAL';
  }

  // 4. Detect Calculation Requirements
  const isCalculationRequired =
    q.includes('calculate') ||
    q.includes('average') ||
    q.includes('mean') ||
    q.includes('how much') ||
    q.includes('percentage') ||
    q.includes('%') ||
    q.includes('total') ||
    q.includes('sum') ||
    q.includes('cumulative') ||
    q.includes('difference') ||
    q.includes('delta') ||
    q.includes('change') ||
    q.includes('hesabla') ||
    q.includes('hesapla') ||
    q.includes('orta') ||
    q.includes('ortalama') ||
    q.includes('faiz') ||
    q.includes('yüzde') ||
    q.includes('cəm') ||
    q.includes('toplam') ||
    q.includes('kəsiri') ||
    q.includes('borcu');

  // 5. Detect Comparison Requirements
  const isComparisonRequired =
    q.includes('compare') ||
    q.includes('versus') ||
    q.includes('vs') ||
    q.includes('changed') ||
    q.includes('previous') ||
    q.includes('prior') ||
    q.includes('baseline') ||
    q.includes('difference') ||
    q.includes('müqayisə') ||
    q.includes('karşılaştır') ||
    q.includes('dəyişib') ||
    q.includes('değişti') ||
    q.includes('əvvəlki') ||
    q.includes('önceki') ||
    q.includes('baza') ||
    q.includes('temel') ||
    q.includes('fərq') ||
    q.includes('fark');

  // 6. Determine Primary Intent
  let intent: AiIntent = 'GENERAL_CHAT';

  if (
    q.includes('solar') ||
    q.includes('flare') ||
    q.includes('cme') ||
    q.includes('donki') ||
    q.includes('geomagnetic') ||
    q.includes('space weather') ||
    q.includes('space-weather') ||
    q.includes('günəş') ||
    q.includes('güneş') ||
    q.includes('alovlanma') ||
    q.includes('parlama')
  ) {
    intent = 'SPACE_WEATHER';
  } else if (
    q.includes('radiation') ||
    q.includes('dosimeter') ||
    q.includes('radlab') ||
    q.includes('sievert') ||
    q.includes('microsv') ||
    q.includes('radiasiya') ||
    q.includes('radyasyon')
  ) {
    intent = 'RADIATION_ANALYSIS';
  } else if (
    q.includes('co2') ||
    q.includes('eclss') ||
    q.includes('eda') ||
    q.includes('cabin environment') ||
    q.includes('kabin mühiti') ||
    q.includes('kabin ortamı')
  ) {
    intent = 'ENVIRONMENTAL_ANALYSIS';
  } else if (
    q.includes('nasa research') ||
    q.includes('study') ||
    q.includes('osdr') ||
    q.includes('hrr') ||
    q.includes('evidence') ||
    q.includes('pubmed') ||
    q.includes('documents support') ||
    q.includes('tədqiqat') ||
    q.includes('araştırma')
  ) {
    intent = 'NASA_RESEARCH';
  } else if (isCalculationRequired && !isComparisonRequired) {
    intent = 'CALCULATION';
  } else if (isComparisonRequired) {
    intent = 'COMPARISON';
  } else if (
    q.includes('health') ||
    q.includes('vitals') ||
    q.includes('analyze') ||
    q.includes('status') ||
    q.includes('condition') ||
    q.includes('sağlamlıq') ||
    q.includes('sağlık') ||
    q.includes('vəziyyət') ||
    q.includes('durum') ||
    targetMetrics.length > 0
  ) {
    intent = 'HEALTH_SUMMARY';
  }

  // 7. Determine Complexity
  let complexity: 'SIMPLE' | 'CALCULATION' | 'RESEARCH' | 'COMPLEX_MULTI_STEP' = 'SIMPLE';
  if ((targetMetrics.length >= 2 && isComparisonRequired) || (q.includes('analyze') && q.includes('determine'))) {
    complexity = 'COMPLEX_MULTI_STEP';
  } else if (intent === 'NASA_RESEARCH' || intent === 'SPACE_WEATHER') {
    complexity = 'RESEARCH';
  } else if (isCalculationRequired || isComparisonRequired) {
    complexity = 'CALCULATION';
  }

  return {
    intent,
    targetMetrics,
    timeWindow,
    isCalculationRequired,
    isComparisonRequired,
    isFollowUp: isFollowUpPattern,
    complexity,
    resolvedSubject: targetMetrics.length > 0 ? targetMetrics.join(', ') : 'General Astronaut Telemetry',
  };
}

