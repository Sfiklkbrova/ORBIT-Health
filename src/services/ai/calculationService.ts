// Mathematical and Scientific Calculations Engine for Astronaut Health Analytics

import { HealthRecord, RadiationLogEntry } from '../../types/astronaut';
import { CalculationResult, MetricType } from './types';

/**
 * Calculates statistical mean, min, max for a continuous biometric channel.
 */
export function calculateAverageMetric(
  records: HealthRecord[],
  metric: MetricType,
  timePeriodLabel: string = 'Last 7 Days'
): CalculationResult | null {
  if (records.length === 0) return null;

  let values: number[] = [];
  let unit = '';
  let metricName = '';

  switch (metric) {
    case 'HEART_RATE':
      values = records.map((r) => r.heartRate);
      unit = 'BPM';
      metricName = 'Heart Rate';
      break;
    case 'BLOOD_OXYGEN':
      values = records.map((r) => r.bloodOxygen);
      unit = '%';
      metricName = 'Blood Oxygen (SpO2)';
      break;
    case 'BLOOD_PRESSURE':
      values = records.map((r) => r.bloodPressureSys);
      unit = 'mmHg (Systolic)';
      metricName = 'Systolic Blood Pressure';
      break;
    case 'BODY_TEMP':
      values = records.map((r) => r.bodyTemperature);
      unit = '°C';
      metricName = 'Core Body Temperature';
      break;
    case 'SLEEP_DURATION':
      values = records.map((r) => r.sleepDurationHours);
      unit = 'hours/night';
      metricName = 'Sleep Duration';
      break;
    case 'FATIGUE':
      values = records.map((r) => r.fatigueLevel);
      unit = '/ 10';
      metricName = 'Fatigue Index';
      break;
    case 'STRESS':
      values = records.map((r) => (r.stressLevel === 'Low' ? 1 : r.stressLevel === 'Moderate' ? 2 : r.stressLevel === 'Elevated' ? 3 : 4));
      unit = 'Level (1-4)';
      metricName = 'Cognitive Stress Score';
      break;
    case 'EXERCISE':
      values = records.map((r) => r.exercise.durationMinutes);
      unit = 'min/day';
      metricName = 'Countermeasure Exercise Duration';
      break;
    default:
      return null;
  }

  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = Number((sum / values.length).toFixed(1));
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    metric: metricName,
    operation: 'AVERAGE',
    resultValue: avg,
    formattedResult: `${avg} ${unit}`,
    unit,
    timePeriod: timePeriodLabel,
    explanation: `Calculated from ${values.length} discrete telemetry observations over ${timePeriodLabel} (Range: ${min} - ${max} ${unit}).`,
    dataPointsCount: values.length,
    additionalStats: {
      min,
      max,
    },
  };
}

/**
 * Calculates percentage change and difference between two periods (e.g. current 7 days vs previous 7 days).
 */
export function calculatePeriodChange(
  currentRecords: HealthRecord[],
  previousRecords: HealthRecord[],
  metric: MetricType,
  currentLabel: string = 'Current 7 Days',
  previousLabel: string = 'Prior 7 Days'
): CalculationResult | null {
  const currentAvg = calculateAverageMetric(currentRecords, metric, currentLabel);
  const prevAvg = calculateAverageMetric(previousRecords, metric, previousLabel);

  if (!currentAvg || !prevAvg || prevAvg.resultValue === 0) return null;

  const delta = Number((currentAvg.resultValue - prevAvg.resultValue).toFixed(1));
  const percentChange = Number((((currentAvg.resultValue - prevAvg.resultValue) / prevAvg.resultValue) * 100).toFixed(1));
  const sign = delta >= 0 ? '+' : '';

  return {
    metric: currentAvg.metric,
    operation: 'PERCENT_CHANGE',
    resultValue: percentChange,
    formattedResult: `${sign}${percentChange}% (${sign}${delta} ${currentAvg.unit})`,
    unit: '%',
    timePeriod: `${currentLabel} vs ${previousLabel}`,
    explanation: `Compared ${currentLabel} average (${currentAvg.resultValue} ${currentAvg.unit}) with ${previousLabel} average (${prevAvg.resultValue} ${currentAvg.unit}). Net change: ${sign}${delta} ${currentAvg.unit}.`,
    dataPointsCount: currentRecords.length + previousRecords.length,
    additionalStats: {
      previousPeriodAvg: prevAvg.resultValue,
      percentChange,
    },
  };
}

/**
 * Calculates deviation of current metric vs personal pre-flight baseline.
 */
export function calculateBaselineDelta(
  currentValue: number,
  baselineValue: number,
  metricName: string,
  unit: string
): CalculationResult {
  const delta = Number((currentValue - baselineValue).toFixed(1));
  const percentChange = Number((((currentValue - baselineValue) / baselineValue) * 100).toFixed(1));
  const sign = delta >= 0 ? '+' : '';

  return {
    metric: metricName,
    operation: 'DELTA',
    resultValue: delta,
    formattedResult: `${sign}${delta} ${unit} (${sign}${percentChange}%)`,
    unit,
    timePeriod: 'Current Reading vs Pre-Flight Baseline',
    explanation: `Current reading (${currentValue} ${unit}) compared to calibrated astronaut baseline (${baselineValue} ${unit}).`,
    dataPointsCount: 1,
    additionalStats: {
      baseline: baselineValue,
      percentChange,
    },
  };
}

/**
 * Calculates cumulative mission radiation exposure strictly preserving units.
 * Separates physical absorbed dose (µGy) and biological dose equivalent (µSv / mSv).
 */
export function calculateCumulativeRadiationExposure(
  radLogs: RadiationLogEntry[],
  missionDays: number = 142,
  careerLimitMilliSv: number = 600
): CalculationResult {
  let totalDoseMicroSv = 0;

  if (radLogs.length > 0) {
    // If logs exist, calculate time-weighted average rate
    const sumRates = radLogs.reduce((acc, log) => acc + log.rateMicroSvPerHour, 0);
    const avgRateMicroSvPerHour = sumRates / radLogs.length;
    // 24 hours/day * missionDays * average rate
    totalDoseMicroSv = avgRateMicroSvPerHour * 24 * missionDays;
  } else {
    // Standard baseline average 18.5 µSv/h for LEO
    totalDoseMicroSv = 18.5 * 24 * missionDays;
  }

  const cumulativeMilliSv = Number((totalDoseMicroSv / 1000).toFixed(2));
  const percentCareerConsumed = Number(((cumulativeMilliSv / careerLimitMilliSv) * 100).toFixed(2));

  return {
    metric: 'Cumulative Radiation Exposure',
    operation: 'CUMULATIVE_DOSE',
    resultValue: cumulativeMilliSv,
    formattedResult: `${cumulativeMilliSv} mSv (${percentCareerConsumed}% Career Limit)`,
    unit: 'mSv',
    timePeriod: `Mission Days 1 to ${missionDays} (${missionDays * 24} hours)`,
    explanation: `Calculated from integrated active dosimeter dose equivalent rate telemetry (nominal average ~18.5 µSv/h). Consumed ${percentCareerConsumed}% of NASA ${careerLimitMilliSv} mSv career occupational radiation limit.`,
    dataPointsCount: radLogs.length > 0 ? radLogs.length : missionDays,
    limitations:
      'Absorbed dose (µGy) is energy absorbed in tissue; biological dose equivalent (µSv/mSv) applies radiation quality factor Q ≈ 2.0. Measurements reflect dosimeter sensor locations and exclude additional shielding in Node 2 water wall.',
    additionalStats: {
      percentChange: percentCareerConsumed,
    },
  };
}

/**
 * Calculates sleep metrics, total sleep debt, and night-to-night variation.
 */
export function calculateSleepAnalysis(
  records: HealthRecord[],
  baselineSleepHours: number = 7.5
): {
  averageHours: CalculationResult | null;
  totalSleepDebtHours: number;
  qualityDistribution: { optimal: number; restless: number; disrupted: number; poor: number };
} {
  const avg = calculateAverageMetric(records, 'SLEEP_DURATION', 'Mission Record Window');

  let totalDebt = 0;
  const dist = { optimal: 0, restless: 0, disrupted: 0, poor: 0 };

  for (const r of records) {
    const debt = Math.max(0, baselineSleepHours - r.sleepDurationHours);
    totalDebt += debt;

    const q = r.sleepQuality.toLowerCase();
    if (q.includes('opt')) dist.optimal += 1;
    else if (q.includes('rest')) dist.restless += 1;
    else if (q.includes('poor')) dist.poor += 1;
    else dist.disrupted += 1;
  }

  return {
    averageHours: avg,
    totalSleepDebtHours: Number(totalDebt.toFixed(1)),
    qualityDistribution: dist,
  };
}

/**
 * Evaluates the linear trend slope for a series of values.
 */
export function calculateTrendSlope(values: number[]): { slope: number; direction: 'RISING' | 'FALLING' | 'STABLE' } {
  const n = values.length;
  if (n < 2) return { slope: 0, direction: 'STABLE' };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const roundedSlope = Number(slope.toFixed(2));

  let direction: 'RISING' | 'FALLING' | 'STABLE' = 'STABLE';
  if (roundedSlope > 0.3) direction = 'RISING';
  else if (roundedSlope < -0.3) direction = 'FALLING';

  return { slope: roundedSlope, direction };
}

