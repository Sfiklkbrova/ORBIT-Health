// Space Fitness & Physical Countermeasure Service for Astronauts (Non-Step Tracking)

import { SpaceExerciseType } from '../types/astronaut';

export interface ExerciseSessionLog {
  id: string;
  timestamp: string;
  type: SpaceExerciseType;
  durationMinutes: number;
  intensity: 'Low' | 'Moderate' | 'High';
  preWorkoutFatigue: number; // 1 - 10
  postWorkoutFatigue: number; // 1 - 10
  recoveryDurationHours: number;
  peakHeartRate?: number;
  notes: string;
}

export interface FitnessRecoveryAnalysis {
  weeklyExerciseMinutes: number;
  sessionsCompleted: number;
  prescribedWeeklyTargetMinutes: number; // e.g. 360 min (6 days x 60 min)
  adherencePercentage: number;
  averageFatigueDelta: number; // post - pre
  recoveryRateStatus: 'OPTIMAL' | 'REQUIRING_EXTENDED_REST' | 'FATIGUED';
  cardioToResistanceRatio: string;
  aiCorrelationSummary: string;
}

let exerciseSessionStore: ExerciseSessionLog[] = [
  {
    id: 'fit_01',
    timestamp: new Date().toISOString(),
    type: 'ARED Resistive Exercise',
    durationMinutes: 60,
    intensity: 'High',
    preWorkoutFatigue: 3,
    postWorkoutFatigue: 5,
    recoveryDurationHours: 1.5,
    peakHeartRate: 142,
    notes: 'Squats (180 kg equiv), Romanian deadlifts, bench press. Excellent musculoskeletal loading.',
  },
  {
    id: 'fit_02',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    type: 'CEVIS Cycle Ergometer',
    durationMinutes: 45,
    intensity: 'High',
    preWorkoutFatigue: 2,
    postWorkoutFatigue: 5,
    recoveryDurationHours: 2.0,
    peakHeartRate: 156,
    notes: 'High-intensity interval protocol. Autonomic recovery to baseline resting HR within 22 minutes.',
  },
  {
    id: 'fit_03',
    timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    type: 'T2 Space Treadmill',
    durationMinutes: 40,
    intensity: 'Moderate',
    preWorkoutFatigue: 3,
    postWorkoutFatigue: 4,
    recoveryDurationHours: 1.0,
    peakHeartRate: 138,
    notes: 'Bungee harness loading set to 75% body weight equivalent. Axial skeletal compression nominal.',
  },
];

export function getExerciseSessions(): ExerciseSessionLog[] {
  return [...exerciseSessionStore];
}

export function logNewExerciseSession(session: Omit<ExerciseSessionLog, 'id'>): ExerciseSessionLog {
  const newSession: ExerciseSessionLog = {
    ...session,
    id: `fit_${Date.now()}`,
  };
  exerciseSessionStore.unshift(newSession);
  return newSession;
}

export function calculateFitnessAndRecovery(): FitnessRecoveryAnalysis {
  const sessions = exerciseSessionStore;
  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const targetMinutes = 360; // NASA standard: 6 x 60 min/week
  const adherence = Number(((totalMinutes / targetMinutes) * 100).toFixed(1));

  let totalFatigueDelta = 0;
  let aredCount = 0;
  let cardioCount = 0;

  for (const s of sessions) {
    totalFatigueDelta += s.postWorkoutFatigue - s.preWorkoutFatigue;
    if (s.type === 'ARED Resistive Exercise') aredCount += 1;
    else if (s.type === 'CEVIS Cycle Ergometer' || s.type === 'T2 Space Treadmill') cardioCount += 1;
  }

  const avgFatigueDelta = sessions.length > 0 ? Number((totalFatigueDelta / sessions.length).toFixed(1)) : 2.0;
  const recoveryStatus: 'OPTIMAL' | 'REQUIRING_EXTENDED_REST' | 'FATIGUED' =
    avgFatigueDelta <= 2.2 ? 'OPTIMAL' : avgFatigueDelta <= 3.5 ? 'REQUIRING_EXTENDED_REST' : 'FATIGUED';

  return {
    weeklyExerciseMinutes: totalMinutes,
    sessionsCompleted: sessions.length,
    prescribedWeeklyTargetMinutes: targetMinutes,
    adherencePercentage: adherence,
    averageFatigueDelta: avgFatigueDelta,
    recoveryRateStatus: recoveryStatus,
    cardioToResistanceRatio: `${aredCount} Resistive / ${cardioCount} Aerobic`,
    aiCorrelationSummary:
      'High compliance with ARED resistive protocol suppresses microgravity osteopenia while CEVIS ergometer workouts maintain stroke volume and baroreflex sensitivity.',
  };
}
