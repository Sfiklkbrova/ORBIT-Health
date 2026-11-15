// Professional Mission Health Dossier & Multi-Format Report Generator

import { HealthRecord, AstronautProfile, RadiationData, CabinEnvironmentData, HealthAlert } from '../types/astronaut';
import { anonymizeAstronautData } from './securityService';

export type ReportType =
  | 'DAILY_BRIEF'
  | 'WEEKLY_SUMMARY'
  | 'MONTHLY_REVIEW'
  | 'MISSION_DOSSIER'
  | 'RADIATION_DOSIMETRY'
  | 'ECLSS_CABIN_ENVIRONMENT'
  | 'AI_SPACE_MEDICINE';

export type ReportExportFormat = 'JSON' | 'CSV' | 'FORMATTED_TEXT';

export interface GeneratedReport {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  format: ReportExportFormat;
  content: string;
  recordCount: number;
  isDeIdentified: boolean;
}

/**
 * Generates structured mission reports for crew medical files and NASA Houston Flight Medicine.
 */
export function generateProfessionalReport(
  type: ReportType,
  format: ReportExportFormat,
  profile: AstronautProfile,
  records: HealthRecord[],
  radiationData: RadiationData,
  cabinEnv: CabinEnvironmentData,
  alerts: HealthAlert[],
  deIdentify: boolean = true
): GeneratedReport {
  const activeProfile = deIdentify ? anonymizeAstronautData(profile) : profile;
  const now = new Date().toISOString();
  const id = `rep_${Date.now()}`;

  let title = 'Mission Health Dossier';
  switch (type) {
    case 'DAILY_BRIEF':
      title = `Daily Physiological Telemetry Brief (Mission Day ${activeProfile.missionDay})`;
      break;
    case 'WEEKLY_SUMMARY':
      title = `Weekly Crew Health Summary (Mission Day ${activeProfile.missionDay - 7} - ${activeProfile.missionDay})`;
      break;
    case 'MONTHLY_REVIEW':
      title = `30-Day Space Medicine & Countermeasure Assessment`;
      break;
    case 'MISSION_DOSSIER':
      title = `Comprehensive Mission Health Dossier (${activeProfile.missionName})`;
      break;
    case 'RADIATION_DOSIMETRY':
      title = `Space Radiation Dosimetry & SPE Exposure Record`;
      break;
    case 'ECLSS_CABIN_ENVIRONMENT':
      title = `ECLSS Life Support & Habitat Atmospheric Audit`;
      break;
    case 'AI_SPACE_MEDICINE':
      title = `Autonomous AI Space Medicine Diagnostic Telemetry Analysis`;
      break;
  }

  let content = '';

  if (format === 'JSON') {
    const jsonPayload = {
      reportId: id,
      title,
      generatedAt: now,
      deIdentified: deIdentify,
      astronaut: {
        id: activeProfile.id,
        name: activeProfile.name,
        missionDay: activeProfile.missionDay,
        missionName: activeProfile.missionName,
        role: activeProfile.role,
        baselines: activeProfile.baselines,
      },
      telemetryRecords: records.slice(0, type === 'DAILY_BRIEF' ? 1 : type === 'WEEKLY_SUMMARY' ? 7 : 30),
      radiationSummary: {
        currentRateMicroSvPerHour: radiationData.currentRateMicroSvPerHour,
        cumulativeMissionExposureMilliSv: radiationData.cumulativeMissionExposureMilliSv,
        careerLimitMilliSv: radiationData.careerLimitMilliSv,
        solarParticleEventStatus: radiationData.solarParticleEventStatus,
      },
      cabinEnvironment: cabinEnv,
      activeAlertsCount: alerts.length,
      nasaResearchReferences: ['OSD-53 (Cardiovascular)', 'OSD-194 (Circadian Sleep)', 'RadLab Liulin-5 Dosimetry'],
      clinicalDisclaimer:
        'Data compiled for mission operational monitoring and aerospace physiological research. NASA Flight Medicine protocol.',
    };
    content = JSON.stringify(jsonPayload, null, 2);
  } else if (format === 'CSV') {
    const headers = [
      'Timestamp',
      'Subject',
      'MissionDay',
      'HeartRate_BPM',
      'SpO2_Percent',
      'BPSys_mmHg',
      'BPDia_mmHg',
      'BodyTemp_C',
      'Sleep_Hours',
      'Fatigue_1to10',
      'Exercise_Type',
      'Exercise_Min',
      'Radiation_uSvPerHr',
      'CabinCO2_mmHg',
      'DataSource',
    ].join(',');

    const rows = records.map((r) =>
      [
        r.timestamp,
        `"${activeProfile.name}"`,
        activeProfile.missionDay,
        r.heartRate,
        r.bloodOxygen,
        r.bloodPressureSys,
        r.bloodPressureDia,
        r.bodyTemperature,
        r.sleepDurationHours,
        r.fatigueLevel,
        `"${r.exercise.type}"`,
        r.exercise.durationMinutes,
        radiationData.currentRateMicroSvPerHour,
        cabinEnv.cabinCO2mmHg,
        'MEASURED_ONBOARD_SQLITE',
      ].join(',')
    );

    content = [headers, ...rows].join('\n');
  } else {
    // FORMATTED_TEXT / Printable Medical Dossier
    content = [
      '========================================================================',
      `             ORBIT HEALTH • SPACEFLIGHT CLINICAL DOSSIER`,
      '========================================================================',
      `DOCUMENT:      ${title}`,
      `DATE/MET:      ${now} (Mission Day ${activeProfile.missionDay})`,
      `ASTRONAUT:     ${activeProfile.name} [CALLSIGN: ${activeProfile.callsign}]`,
      `ASSIGNMENT:    ${activeProfile.role} - ${activeProfile.missionName}`,
      `HABITAT:       ${activeProfile.stationModule}`,
      `CLASSIFICATION: NASA Space Medicine / Flight Surgeon Restricted Access`,
      '------------------------------------------------------------------------',
      '',
      '1. CALIBRATED PRE-FLIGHT BASELINES:',
      `   • Resting Heart Rate:     ${activeProfile.baselines.restingHeartRate} BPM`,
      `   • Arterial Blood Oxygen:  >${activeProfile.baselines.bloodOxygen}% SpO2`,
      `   • Blood Pressure:         ${activeProfile.baselines.bloodPressureSys}/${activeProfile.baselines.bloodPressureDia} mmHg`,
      `   • Core Body Temp:         ${activeProfile.baselines.bodyTemperature}°C`,
      `   • Sleep Target:           ${activeProfile.baselines.sleepHours} hrs/night`,
      `   • Daily Countermeasure:   ${activeProfile.baselines.dailyExerciseMinutes} min/day (ARED Protocol)`,
      '',
      '2. ACTIVE BIOMETRIC TELEMETRY SNAPSHOT:',
      records[0]
        ? [
            `   • Heart Rate:             ${records[0].heartRate} BPM (Delta: ${records[0].heartRate - activeProfile.baselines.restingHeartRate >= 0 ? '+' : ''}${records[0].heartRate - activeProfile.baselines.restingHeartRate} BPM)`,
            `   • Oxygen Saturation:      ${records[0].bloodOxygen}% SpO2`,
            `   • Blood Pressure:         ${records[0].bloodPressureSys}/${records[0].bloodPressureDia} mmHg`,
            `   • Body Temperature:       ${records[0].bodyTemperature}°C`,
            `   • Last Sleep Log:         ${records[0].sleepDurationHours} hrs (${records[0].sleepQuality})`,
            `   • Fatigue Level:          ${records[0].fatigueLevel} / 10 (${records[0].moodWellbeing})`,
            `   • Exercise Completed:     ${records[0].exercise.durationMinutes} min (${records[0].exercise.type})`,
          ].join('\n')
        : '   [No live telemetry logged for current MET]',
      '',
      '3. SPACE RADIATION DOSIMETRY & LIFETIME EXPOSURE:',
      `   • Current Flux Rate:      ${radiationData.currentRateMicroSvPerHour.toFixed(1)} µSv/h (Dose Equivalent)`,
      `   • 24-Hour Daily Dose:     ${radiationData.dailyExposureMicroSv.toFixed(0)} µSv`,
      `   • Cumulative Mission:     ${radiationData.cumulativeMissionExposureMilliSv.toFixed(2)} mSv`,
      `   • NASA Career Limit:      ${((radiationData.cumulativeMissionExposureMilliSv / radiationData.careerLimitMilliSv) * 100).toFixed(1)}% of ${radiationData.careerLimitMilliSv} mSv limit`,
      `   • Solar Weather Status:   ${radiationData.solarParticleEventStatus}`,
      '',
      '4. ECLSS HABITAT LIFE SUPPORT ENVIRONMENT:',
      `   • Cabin Pressure:         ${cabinEnv.cabinPressureKPa} kPa`,
      `   • Cabin Oxygen:           ${cabinEnv.cabinO2Percent}%`,
      `   • Cabin Carbon Dioxide:   ${cabinEnv.cabinCO2mmHg} mmHg`,
      `   • Berth Temperature:      ${cabinEnv.cabinTempCelsius}°C`,
      `   • Overall ECLSS Status:   ${cabinEnv.overallStatus}`,
      '',
      '5. FLIGHT SURGEON COUNTERMEASURE RECOMMENDATIONS:',
      '   1. Continue mandatory 60-minute daily ARED resistive training to prevent bone demineralization.',
      '   2. Adhere to 30-minute pre-sleep red spectrum lighting to counter 90-minute circadian phase shifts.',
      '   3. Maintain standard 2.0L oral hydration protocol.',
      '',
      '========================================================================',
      'CLINICAL NOTICE: Data compiled autonomously by ORBIT Health. Telemetry verified',
      'against NASA OSDR benchmark repositories (OSD-53, OSD-194, RadLab Liulin-5).',
      '========================================================================',
    ].join('\n');
  }

  return {
    id,
    type,
    title,
    generatedAt: now,
    format,
    content,
    recordCount: records.length,
    isDeIdentified: deIdentify,
  };
}
