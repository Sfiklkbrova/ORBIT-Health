// Deep Multi-System Health Analytics and Correlation Engine for ORBIT AI

import {
  HealthRecord,
  AstronautProfile,
  CabinEnvironmentData,
} from '../../types/astronaut';
import {
  calculateAverageMetric,
  calculateBaselineDelta,
  calculateSleepAnalysis,
} from './calculationService';
import { retrieveNasaScientificContext, NasaRagCitation } from '../nasa/nasaKnowledgeBase';
import { CalculationResult, MultiStepAnalysisResult } from './types';

/**
 * Conducts multi-step deep reasoning across multiple physiological indicators
 * and detects spaceflight adaptations and inter-metric correlations.
 */
export async function performDeepHealthAnalysis(
  latestRecord: HealthRecord | null,
  recentRecords: HealthRecord[],
  cabinEnv: CabinEnvironmentData,
  profile: AstronautProfile
): Promise<MultiStepAnalysisResult | null> {
  if (!latestRecord && recentRecords.length === 0) {
    return null; // Insufficient data signal
  }

  const allRecords = recentRecords.length > 0 ? recentRecords : latestRecord ? [latestRecord] : [];
  const calculations: CalculationResult[] = [];
  const correlations: { indicatorA: string; indicatorB: string; finding: string; significance: 'LOW' | 'MODERATE' | 'HIGH' }[] = [];
  const recommendations: string[] = [];

  // 1. Calculations: Heart Rate, Sleep, SpO2, Blood Pressure, Fatigue
  const hrAvg = calculateAverageMetric(allRecords, 'HEART_RATE', 'Past 7 Days');
  const sleepAnalysis = calculateSleepAnalysis(allRecords, profile.baselines.sleepHours);
  const fatigueAvg = calculateAverageMetric(allRecords, 'FATIGUE', 'Past 7 Days');
  const spo2Avg = calculateAverageMetric(allRecords, 'BLOOD_OXYGEN', 'Past 7 Days');
  const bpAvg = calculateAverageMetric(allRecords, 'BLOOD_PRESSURE', 'Past 7 Days');

  if (hrAvg) calculations.push(hrAvg);
  if (sleepAnalysis.averageHours) calculations.push(sleepAnalysis.averageHours);
  if (fatigueAvg) calculations.push(fatigueAvg);
  if (spo2Avg) calculations.push(spo2Avg);
  if (bpAvg) calculations.push(bpAvg);

  // Baseline comparison for current reading
  if (latestRecord) {
    const hrDelta = calculateBaselineDelta(
      latestRecord.heartRate,
      profile.baselines.restingHeartRate,
      'Resting Heart Rate Delta',
      'BPM'
    );
    calculations.push(hrDelta);
  }

  // 2. Multi-Indicator Correlation Detection
  const currentHr = latestRecord ? latestRecord.heartRate : hrAvg?.resultValue || profile.baselines.restingHeartRate;
  const currentSleep = latestRecord ? latestRecord.sleepDurationHours : sleepAnalysis.averageHours?.resultValue || 7.0;
  const currentFatigue = latestRecord ? latestRecord.fatigueLevel : fatigueAvg?.resultValue || 3;

  // Correlation A: Sleep Deficit -> Elevated Resting Heart Rate & Fatigue
  if (sleepAnalysis.totalSleepDebtHours > 2.0 || currentSleep < 6.5) {
    if (currentFatigue >= 5 || currentHr > profile.baselines.restingHeartRate + 5) {
      correlations.push({
        indicatorA: 'Sleep Duration Deficit',
        indicatorB: 'Sympathetic Autonomic Activation (Heart Rate)',
        finding: `Accumulated sleep debt of ${sleepAnalysis.totalSleepDebtHours.toFixed(1)} hours correlates with an elevated resting pulse (+${(currentHr - profile.baselines.restingHeartRate).toFixed(0)} BPM) and fatigue index (${currentFatigue}/10).`,
        significance: 'HIGH',
      });
      recommendations.push('Schedule a 90-minute restorative sleep extension prior to high-workload robotic or docking operations.');
    }
  }

  // Correlation B: Cabin CO2 -> Cognitive Fatigue & Headaches
  if (cabinEnv.cabinCO2mmHg > 3.0) {
    correlations.push({
      indicatorA: 'Cabin Partial CO2 Pressure',
      indicatorB: 'Neuro-vascular Vasodilation / Fatigue',
      finding: `Ambient cabin CO2 is elevated at ${cabinEnv.cabinCO2mmHg.toFixed(1)} mmHg (Limit: 3.0 mmHg). In microgravity, cephalad venous congestion lowers the physiological threshold for hypercapnia-induced headaches and drowsiness.`,
      significance: 'MODERATE',
    });
    recommendations.push('Verify cabin ECLSS CDRA scrubber regeneration and check ventilation baffling in crew sleep quarters.');
  }

  // Correlation C: Physical Countermeasure Compliance -> Musculoskeletal Maintenance
  const exerciseMins = latestRecord?.exercise.durationMinutes || 90;
  if (exerciseMins < profile.baselines.dailyExerciseMinutes) {
    correlations.push({
      indicatorA: 'Physical Countermeasure Duration',
      indicatorB: 'Bone Mineral Density & Muscle Mass Retention',
      finding: `Logged exercise duration (${exerciseMins} min) is below target ${profile.baselines.dailyExerciseMinutes} min/day. Microgravity induces ~1-1.5% bone mineral density decline per month without full resistive loading (ARED).`,
      significance: 'MODERATE',
    });
    recommendations.push('Complete full 90-minute prescribed resistive (ARED) protocol.');
  }

  // 3. Determine Overall Risk Rating
  let riskRating: 'NOMINAL' | 'ADVISORY' | 'WARNING' | 'CRITICAL' = 'NOMINAL';
  if (correlations.some((c) => c.significance === 'HIGH')) {
    riskRating = 'WARNING';
  } else if (correlations.length > 0) {
    riskRating = 'ADVISORY';
  }

  // 4. Retrieve NASA Research Citations (HRR & OSDR)
  const ragContext = await retrieveNasaScientificContext('cardiovascular sleep fatigue co2');
  const citations: NasaRagCitation[] = ragContext.citations.slice(0, 3);

  // 5. Synthesize Primary Finding
  let primaryFinding = '';
  if (riskRating === 'NOMINAL') {
    primaryFinding = `All primary physiological telemetry channels are stable on Mission Day ${profile.missionDay}. Cardiovascular parameters and sleep architecture are nominal and align with pre-flight baselines.`;
  } else if (riskRating === 'ADVISORY') {
    primaryFinding = `Mild physiological stress indicators identified on Mission Day ${profile.missionDay}. Mild sleep debt or environmental variations are detected, but all vital organs remain well-compensated.`;
  } else {
    primaryFinding = `Multi-indicator stress detected: Cumulative sleep loss is actively driving elevated fatigue (${currentFatigue}/10) and sympathetic cardiovascular strain (+${(currentHr - profile.baselines.restingHeartRate).toFixed(0)} BPM). Operational pacing required.`;
  }

  return {
    primaryFinding,
    calculations,
    correlations,
    nasaCitations: citations,
    recommendations: recommendations.length > 0 ? recommendations : ['Maintain current nominal flight protocol.'],
    riskRating,
  };
}
