// Offline Data Retrieval and Grounded NASA RAG Context Assembler
// Connects AI directly to SQLite: Health Records, Radiation Logs, Cabin Environment,
// Baselines, and Local NASA Knowledge Repositories (OSDR, RadLab, HRR, DONKI, EDA).

import {
  HealthRecord,
  AstronautProfile,
  CabinEnvironmentData,
  HealthAlert,
} from '../../types/astronaut';
import {
  getLatestHealthRecord,
  getAllHealthRecords,
  getRadiationHistory,
  getLatestCabinEnvironment,
  getActiveAlerts,
  DEFAULT_ASTRONAUT,
} from '../db';
import {
  getCachedOsdrStudies,
  getCachedHrrEvidence,
  getCachedRadlabMeasurements,
  getCachedDonkiEvents,
  getCachedEdaMissions,
} from '../nasaDb';
import { AppLanguage } from '../../i18n';

export interface RetrievedHealthContext {
  profile: AstronautProfile;
  latestRecord: HealthRecord | null;
  historyRecords: HealthRecord[];
  latestEnv: CabinEnvironmentData;
  activeAlerts: HealthAlert[];
  cumulativeRadiationDoseMsv: number;
  nasaCareerLimitPercent: number;
  metricDeltas: {
    heartRateDeltaBpm: number;
    heartRateDeltaPercent: number;
    spo2DeltaPercent: number;
    bpSysDeltaMmHg: number;
    bpDiaDeltaMmHg: number;
    tempDeltaCelsius: number;
    sleepDebtHours: number;
    recentAvgSleepHours: number;
    recentAvgFatigue: number;
    exerciseCompliancePercent: number;
  };
  nasaCitations: {
    sourceName: string;
    documentTitle: string;
    url: string;
    keyFinding: string;
    dateOrVersion?: string;
  }[];
  groundedContextText: string;
}

/**
 * Retrieves comprehensive telemetry, historical baselines, and NASA scientific evidence from local SQLite.
 */
export async function retrieveGroundedHealthContext(
  query: string,
  userProfile?: AstronautProfile,
  targetLang: AppLanguage = 'en'
): Promise<RetrievedHealthContext> {
  const profile = userProfile || DEFAULT_ASTRONAUT;
  const baselines = profile.baselines;

  // 1. Fetch telemetry from SQLite
  const [latestRecord, historyRecords, radHistory, latestEnv, activeAlerts, osdrStudies, hrrRisks, radlab, donki, eda] =
    await Promise.all([
      getLatestHealthRecord(),
      getAllHealthRecords(14),
      getRadiationHistory(30),
      getLatestCabinEnvironment(),
      getActiveAlerts(),
      getCachedOsdrStudies(),
      getCachedHrrEvidence(),
      getCachedRadlabMeasurements(10),
      getCachedDonkiEvents(5),
      getCachedEdaMissions(),
    ]);

  // 2. Compute Metric Deltas against Baseline
  const currentHR = latestRecord?.heartRate ?? baselines.restingHeartRate;
  const hrDelta = currentHR - baselines.restingHeartRate;
  const hrDeltaPct = Math.round((hrDelta / baselines.restingHeartRate) * 1000) / 10;

  const currentSpO2 = latestRecord?.bloodOxygen ?? baselines.bloodOxygen;
  const spo2Delta = Math.round((currentSpO2 - baselines.bloodOxygen) * 10) / 10;

  const currentSys = latestRecord?.bloodPressureSys ?? baselines.bloodPressureSys;
  const currentDia = latestRecord?.bloodPressureDia ?? baselines.bloodPressureDia;
  const sysDelta = currentSys - baselines.bloodPressureSys;
  const diaDelta = currentDia - baselines.bloodPressureDia;

  const currentTemp = latestRecord?.bodyTemperature ?? baselines.bodyTemperature;
  const tempDelta = Math.round((currentTemp - baselines.bodyTemperature) * 10) / 10;

  // Sleep debt calculation (last 3-7 days)
  let totalSleep = 0;
  let totalFatigue = 0;
  let exerciseDays = 0;
  const sampleCount = Math.min(historyRecords.length, 7);

  if (sampleCount > 0) {
    for (let i = 0; i < sampleCount; i++) {
      const r = historyRecords[i];
      totalSleep += r.sleepDurationHours;
      totalFatigue += r.fatigueLevel;
      if (r.exercise && r.exercise.durationMinutes >= 60) {
        exerciseDays += 1;
      }
    }
  }

  const recentAvgSleep = sampleCount > 0 ? Math.round((totalSleep / sampleCount) * 10) / 10 : baselines.sleepHours;
  const sleepDebt = Math.max(0, Math.round((baselines.sleepHours - recentAvgSleep) * sampleCount * 10) / 10);
  const recentAvgFatigue = sampleCount > 0 ? Math.round((totalFatigue / sampleCount) * 10) / 10 : 3.0;
  const exerciseCompliance = sampleCount > 0 ? Math.round((exerciseDays / sampleCount) * 100) : 100;

  // Radiation Cumulative Exposure
  let totalRadMicroSv = 0;
  for (const r of radHistory) {
    totalRadMicroSv += r.rateMicroSvPerHour * 1.0;
  }
  // Default baseline cumulative dose for Day 214 of Mars transit: ~178.4 mSv
  const cumulativeMsv = Math.round((178.4 + totalRadMicroSv / 1000) * 10) / 10;
  const careerLimitPct = Math.round((cumulativeMsv / 600.0) * 1000) / 10;

  // 3. Grounded NASA Evidence Matching (Keyword & Category RAG)
  const qLower = query.toLowerCase();
  const matchedCitations: RetrievedHealthContext['nasaCitations'] = [];

  // Match OSDR Studies
  for (const study of osdrStudies) {
    const titleLower = study.title.toLowerCase();
    const descLower = study.description.toLowerCase();
    const assayLower = (study.assayTypes || []).join(' ').toLowerCase();

    if (
      (qLower.includes('cardio') || qLower.includes('heart') || qLower.includes('blood')) &&
      (titleLower.includes('cardio') || titleLower.includes('heart') || study.id === 'OSD-53')
    ) {
      matchedCitations.push({
        sourceName: `NASA OSDR (${study.id})`,
        documentTitle: study.title,
        url: study.authoritativeSourceUrl,
        keyFinding: study.description.slice(0, 180) + '...',
        dateOrVersion: 'NASA Open Science Data Repository',
      });
    } else if (
      (qLower.includes('sleep') || qLower.includes('fatigue') || qLower.includes('circadian')) &&
      (titleLower.includes('sleep') || titleLower.includes('circadian') || titleLower.includes('behavioral'))
    ) {
      matchedCitations.push({
        sourceName: `NASA OSDR (${study.id})`,
        documentTitle: study.title,
        url: study.authoritativeSourceUrl,
        keyFinding: study.description.slice(0, 180) + '...',
        dateOrVersion: 'NASA Open Science Data Repository',
      });
    } else if (
      (qLower.includes('radiation') || qLower.includes('cme') || qLower.includes('solar') || qLower.includes('storm')) &&
      (titleLower.includes('radiation') || assayLower.includes('radiation') || descLower.includes('cosmic'))
    ) {
      matchedCitations.push({
        sourceName: `NASA OSDR (${study.id})`,
        documentTitle: study.title,
        url: study.authoritativeSourceUrl,
        keyFinding: study.description.slice(0, 180) + '...',
        dateOrVersion: 'NASA Open Science Data Repository',
      });
    }
  }

  // Match HRR (Human Research Roadmap) Risks
  for (const risk of hrrRisks) {
    const riskLower = (risk.riskTitle + ' ' + (risk.hrpCategory || '')).toLowerCase();
    if (
      (qLower.includes('radiation') && (riskLower.includes('radiation') || risk.id.includes('radiation'))) ||
      ((qLower.includes('sleep') || qLower.includes('fatigue')) && (riskLower.includes('sleep') || risk.id.includes('sleep'))) ||
      ((qLower.includes('heart') || qLower.includes('cardio') || qLower.includes('pressure')) && (riskLower.includes('cardio') || risk.id.includes('cardio'))) ||
      ((qLower.includes('eye') || qLower.includes('vision') || qLower.includes('sans')) && (riskLower.includes('vision') || risk.id.includes('sans')))
    ) {
      matchedCitations.push({
        sourceName: 'NASA Human Research Roadmap (HRR)',
        documentTitle: risk.riskTitle,
        url: risk.evidenceReportUrl,
        keyFinding: `NASA Risk Category: ${risk.hrpCategory}. Evidence confirms physiological adaptations in microgravity require continuous countermeasure validation.`,
        dateOrVersion: 'NASA Human Research Program (HRP)',
      });
    }
  }

  // Match DONKI Space Weather Alerts
  if (donki.length > 0 && (qLower.includes('solar') || qLower.includes('flare') || qLower.includes('cme') || qLower.includes('storm'))) {
    matchedCitations.push({
      sourceName: 'NASA DONKI Space Weather Service',
      documentTitle: `Space Weather Alert (${donki[0].messageType})`,
      url: donki[0].sourceUrl || 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
      keyFinding: donki[0].summary.slice(0, 160) + '...',
      dateOrVersion: donki[0].issueTime,
    });
  }

  // Match EDA Spaceflight Habitat telemetry
  if (eda.length > 0 && (qLower.includes('cabin') || qLower.includes('co2') || qLower.includes('environment') || qLower.includes('habitat'))) {
    matchedCitations.push({
      sourceName: 'NASA EDA Spaceflight Habitats',
      documentTitle: eda[0].missionTitle,
      url: 'https://osdr.nasa.gov/bio/repo/data/studies/',
      keyFinding: eda[0].description.slice(0, 160) + '...',
      dateOrVersion: 'NASA Environmental Data Archive',
    });
  }

  // Match RadLab Telemetry
  if (qLower.includes('radiation') || qLower.includes('dose') || qLower.includes('gcr') || qLower.includes('flare')) {
    matchedCitations.push({
      sourceName: 'NASA RadLab Dosimetry Database',
      documentTitle: radlab.length > 0 ? radlab[0].sourceAttribution : 'Liulin-5 and MSL RAD Deep Space Transit Microdosimetry',
      url: 'https://visualization.osdr.nasa.gov/radlab/',
      keyFinding: 'Galactic cosmic rays deliver ~1.5 - 1.8 mSv/day during interplanetary transit outside Earth magnetosphere.',
      dateOrVersion: 'RadLab Instrument Suite',
    });
  }

  // Fallback citation if none matched
  if (matchedCitations.length === 0) {
    matchedCitations.push({
      sourceName: 'NASA Human Research Program (HRP)',
      documentTitle: 'Human Integration Design Handbook (NASA/SP-2010-3407)',
      url: 'https://www.nasa.gov/hrp',
      keyFinding: 'Standard biometric operational envelopes and countermeasure efficacy standards for deep space transit.',
      dateOrVersion: 'NASA-STD-3001',
    });
  }

  // 4. Assemble Grounded Context Text
  let langHeader = 'LANGUAGE DIRECTIVE: Answer in ENGLISH.';
  if (targetLang === 'az') {
    langHeader = 'DİL TƏLİMATI: İstifadəçiyə tam olaraq AZƏRBAYCAN DİLİNDƏ cavab ver.';
  } else if (targetLang === 'tr') {
    langHeader = 'DİL TALİMATI: Kullanıcıya tamamen TÜRKÇE olarak cevap ver.';
  }

  const groundedContextText = `
=== ASTRONAUT TELEMETRY & FLIGHT CONTEXT ===
- Astronaut: ${profile.name} (${profile.callsign})
- Mission: ${profile.missionName} | Day ${profile.missionDay} of ${profile.totalMissionDays} (Mars Transit)
- Station Module: ${profile.stationModule}
- Status: Deep Space Autonomy Mode (Comms Link latency ~18.7 min one-way)

=== VITAL SIGNS (RETRIEVED FROM SQLITE) ===
- Resting Heart Rate: ${currentHR} bpm (Baseline: ${baselines.restingHeartRate} bpm | Delta: ${hrDelta >= 0 ? '+' : ''}${hrDelta} bpm / ${hrDeltaPct}%)
- Blood Oxygen (SpO2): ${currentSpO2}% (Baseline: ${baselines.bloodOxygen}% | Delta: ${spo2Delta}%)
- Blood Pressure: ${currentSys}/${currentDia} mmHg (Baseline: ${baselines.bloodPressureSys}/${baselines.bloodPressureDia} mmHg)
- Body Temperature: ${currentTemp} °C (Baseline: ${baselines.bodyTemperature} °C | Delta: ${tempDelta >= 0 ? '+' : ''}${tempDelta} °C)
- Sleep (Last night): ${latestRecord?.sleepDurationHours ?? 8.0}h (Quality: ${latestRecord?.sleepQuality ?? 'Optimal'})
- 7-Day Avg Sleep: ${recentAvgSleep}h/night (Accumulated Sleep Debt: ${sleepDebt}h)
- Fatigue Level: ${latestRecord?.fatigueLevel ?? 3}/10 (7-Day Avg: ${recentAvgFatigue}/10)
- Physical Activity: ${latestRecord?.exercise?.type ?? 'ARED Resistive'}, ${latestRecord?.exercise?.durationMinutes ?? 90} min (Adherence: ${exerciseCompliance}%)
- Cumulative Mission Radiation: ${cumulativeMsv} mSv (Career Limit: 600 mSv | Used: ${careerLimitPct}%)
- Cabin Atmosphere: O2 ${latestEnv.cabinO2Percent}%, CO2 ${latestEnv.cabinCO2mmHg} mmHg, Temp ${latestEnv.cabinTempCelsius}°C, Pressure ${latestEnv.cabinPressureKPa} kPa, Ambient Rad ${latestEnv.ambientRadiationMicroSv} µSv/h

=== ACTIVE HEALTH ALERTS ===
${activeAlerts.length > 0 ? activeAlerts.map((a) => `* [${a.severity}] ${a.title}: ${a.message} (Rule: ${a.triggerReason})`).join('\n') : '* No critical physiological alerts active.'}

=== GROUNDED NASA SCIENTIFIC EVIDENCE ===
${matchedCitations.map((c, i) => `[Source ${i + 1}] ${c.sourceName}: ${c.documentTitle} - "${c.keyFinding}" (${c.url})`).join('\n')}

=== SYSTEM INSTRUCTIONS ===
1. You are the autonomous on-board medical intelligence system for Astronaut Aysel aboard Artemis Mars-1.
2. ${langHeader}
3. Base your analysis STRICTLY on the actual telemetry and NASA citations above. Never invent fake data or hallucinate missing records.
4. When comparing indicators, cite exact numbers and deltas from the baseline.
5. Emphasize causal relationships (e.g. sleep debt vs resting HR elevation, exercise compliance vs cardiovascular deconditioning).
6. State clearly that this is decision support and not a final medical diagnosis.
`.trim();

  return {
    profile,
    latestRecord,
    historyRecords,
    latestEnv,
    activeAlerts,
    cumulativeRadiationDoseMsv: cumulativeMsv,
    nasaCareerLimitPercent: careerLimitPct,
    metricDeltas: {
      heartRateDeltaBpm: hrDelta,
      heartRateDeltaPercent: hrDeltaPct,
      spo2DeltaPercent: spo2Delta,
      bpSysDeltaMmHg: sysDelta,
      bpDiaDeltaMmHg: diaDelta,
      tempDeltaCelsius: tempDelta,
      sleepDebtHours: sleepDebt,
      recentAvgSleepHours: recentAvgSleep,
      recentAvgFatigue: recentAvgFatigue,
      exerciseCompliancePercent: exerciseCompliance,
    },
    nasaCitations: matchedCitations,
    groundedContextText,
  };
}
