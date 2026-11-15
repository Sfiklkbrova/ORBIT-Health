// Mission Timeline Service: Chronological Astronaut Operational History

export interface MissionTimelineEvent {
  id: string;
  missionDay: number;
  calendarDate: string;
  eventType: 'HEALTH_SUMMARY' | 'RADIATION_EVENT' | 'ECLSS_CHANGE' | 'OPERATIONAL_MILESTONE' | 'AI_ALERT';
  title: string;
  summary: string;
  keyMetrics: {
    heartRate?: number;
    spo2?: number;
    radiationMicroSv?: number;
    sleepHours?: number;
    fatigueLevel?: number;
    co2MmHg?: number;
  };
  operationalAction?: string;
  significance: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
}

export const MISSION_METADATA = {
  missionName: 'Artemis Gateway Alpha',
  spacecraft: 'Deep Space Habitat / Gateway Orbital Complex',
  launchDate: '2026-06-25T08:00:00Z',
  currentMissionDay: 142,
  totalMissionDays: 180,
  trajectory: 'Near-Rectilinear Halo Orbit (NRHO) Lunar Trajectory',
};

export const CHRONOLOGICAL_MISSION_EVENTS: MissionTimelineEvent[] = [
  {
    id: 'tl_evt_142',
    missionDay: 142,
    calendarDate: 'Day 142 (Today)',
    eventType: 'HEALTH_SUMMARY',
    title: 'Mission Day 142 Telemetry Synchronization',
    summary: 'Heart Rate 72 BPM, SpO2 98%, Sleep 8.0 hrs. Cardiovascular adaptation stable under ARED resistive training.',
    keyMetrics: { heartRate: 72, spo2: 98, sleepHours: 8.0, fatigueLevel: 3, radiationMicroSv: 18.5 },
    significance: 'NORMAL',
  },
  {
    id: 'tl_evt_140',
    missionDay: 140,
    calendarDate: 'Day 140',
    eventType: 'ECLSS_CHANGE',
    title: 'ECLSS CDRA Bed Filter Cycle',
    summary: 'Cabin CO2 transient elevation to 4.2 mmHg due to scrubber cycle desynchronization. Resolved after manual filter bed purge.',
    keyMetrics: { co2MmHg: 4.2, fatigueLevel: 4 },
    operationalAction: 'Crew refreshed berth ventilation ducting. Airflow restored to nominal.',
    significance: 'ELEVATED',
  },
  {
    id: 'tl_evt_136',
    missionDay: 136,
    calendarDate: 'Day 136',
    eventType: 'RADIATION_EVENT',
    title: 'Solar Particle Event (M-Class Flare) Advisory',
    summary: 'NASA DONKI reported M3.4 solar flare. Dosimeter telemetry recorded flux rise to 32.4 µSv/h before spacecraft hull attenuation.',
    keyMetrics: { radiationMicroSv: 32.4 },
    operationalAction: 'Crew rested in central water wall berth during 4-hour CME transit window.',
    significance: 'ELEVATED',
  },
  {
    id: 'tl_evt_128',
    missionDay: 128,
    calendarDate: 'Day 128',
    eventType: 'OPERATIONAL_MILESTONE',
    title: 'Extravehicular Activity (EVA-2) Spacewalk',
    summary: 'Successful 6.5-hour lunar Gateway external antenna array servicing. High metabolic energy expenditure recorded.',
    keyMetrics: { heartRate: 118, sleepHours: 6.2, fatigueLevel: 6 },
    operationalAction: 'Mandatory 10-hour rest block and isotonic hydration loading completed.',
    significance: 'NORMAL',
  },
  {
    id: 'tl_evt_115',
    missionDay: 115,
    calendarDate: 'Day 115',
    eventType: 'AI_ALERT',
    title: 'AI Detected Cumulative Sleep Debt',
    summary: 'ORBIT AI detected consecutive 3-night sleep debt total of 4.8 hours. Autonomous advisory issued to prevent cognitive slowing.',
    keyMetrics: { sleepHours: 5.8, fatigueLevel: 5 },
    operationalAction: 'Circadian lighting spectrum shifted to red 45 minutes earlier for 4 consecutive days.',
    significance: 'ELEVATED',
  },
  {
    id: 'tl_evt_90',
    missionDay: 90,
    calendarDate: 'Day 90',
    eventType: 'OPERATIONAL_MILESTONE',
    title: 'Mission Mid-Point Physiological Milestone',
    summary: 'Comprehensive bone density ultrasound and isometric strength testing completed. ARED protocol prevented anticipated osteopenia.',
    keyMetrics: { heartRate: 70, spo2: 98, sleepHours: 7.6 },
    significance: 'NORMAL',
  },
  {
    id: 'tl_evt_45',
    missionDay: 45,
    calendarDate: 'Day 45',
    eventType: 'HEALTH_SUMMARY',
    title: 'Initial Microgravity Fluid Shift Stabilization',
    summary: 'Baroreflex resetting stabilized; facial puffiness and cephalad fluid migration reached equilibrium.',
    keyMetrics: { heartRate: 74, spo2: 98, fatigueLevel: 4 },
    significance: 'NORMAL',
  },
  {
    id: 'tl_evt_01',
    missionDay: 1,
    calendarDate: 'Day 1',
    eventType: 'OPERATIONAL_MILESTONE',
    title: 'Artemis Gateway Alpha Insertion',
    summary: 'Successful trans-lunar injection and orbital docking at Gateway complex. Telemetry baseline calibration initiated.',
    keyMetrics: { heartRate: 82, spo2: 99, fatigueLevel: 5 },
    significance: 'NORMAL',
  },
];

export function getMissionTimeline(): MissionTimelineEvent[] {
  return [...CHRONOLOGICAL_MISSION_EVENTS];
}

export function getTimelineEventsByDay(day: number): MissionTimelineEvent[] {
  return CHRONOLOGICAL_MISSION_EVENTS.filter((e) => e.missionDay === day);
}
