import * as SQLite from 'expo-sqlite';
import {
  HealthRecord,
  RadiationLogEntry,
  CabinEnvironmentData,
  HealthAlert,
  AstronautProfile,
} from '../types/astronaut';

const DB_NAME = 'orbit_health_astronaut.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeTables(dbInstance);
  }
  return dbInstance;
}

async function initializeTables(db: SQLite.SQLiteDatabase): Promise<void> {
  // 1. Health Records table with userId support for sovereign multi-astronaut data isolation
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS health_records (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT DEFAULT '',
      timestamp TEXT NOT NULL,
      heartRate REAL NOT NULL,
      bloodOxygen REAL NOT NULL,
      bloodPressureSys REAL NOT NULL,
      bloodPressureDia REAL NOT NULL,
      bodyTemperature REAL NOT NULL,
      sleepDurationHours REAL NOT NULL,
      sleepQuality TEXT NOT NULL,
      sleepInterruptions INTEGER NOT NULL,
      fatigueLevel INTEGER NOT NULL,
      stressLevel TEXT NOT NULL,
      moodWellbeing TEXT NOT NULL,
      exerciseType TEXT NOT NULL,
      exerciseDuration INTEGER NOT NULL,
      exerciseIntensity TEXT NOT NULL,
      isManual INTEGER NOT NULL,
      syncStatus TEXT NOT NULL,
      notes TEXT
    );
  `);

  // Migration: Add userId column if table existed previously without it
  try {
    await db.execAsync("ALTER TABLE health_records ADD COLUMN userId TEXT DEFAULT '';");
  } catch {
    // Column already exists
  }

  // Create user index for instant filtered retrieval
  try {
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_health_records_user ON health_records (userId, timestamp DESC);');
  } catch {
    // Index creation error ignored
  }

  // 2. Radiation Logs table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS radiation_logs (
      id TEXT PRIMARY KEY NOT NULL,
      timestamp TEXT NOT NULL,
      rateMicroSvPerHour REAL NOT NULL,
      location TEXT NOT NULL,
      isSimulatedDemo INTEGER NOT NULL
    );
  `);

  // 3. Cabin Environment table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS environment_logs (
      id TEXT PRIMARY KEY NOT NULL,
      timestamp TEXT NOT NULL,
      cabinTempCelsius REAL NOT NULL,
      cabinO2Percent REAL NOT NULL,
      cabinCO2mmHg REAL NOT NULL,
      cabinPressureKPa REAL NOT NULL,
      ambientRadiationMicroSv REAL NOT NULL,
      overallStatus TEXT NOT NULL,
      isSimulatedDemo INTEGER NOT NULL
    );
  `);

  // 4. Alerts table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS health_alerts (
      id TEXT PRIMARY KEY NOT NULL,
      timestamp TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      triggerReason TEXT NOT NULL,
      recommendedAction TEXT NOT NULL,
      acknowledged INTEGER NOT NULL
    );
  `);

  // Seed default data if database is empty
  await seedInitialDataIfEmpty(db);
}

// Default Astronaut Profile: Astronaut Aysel (Mars Transit Day 214)
export const DEFAULT_ASTRONAUT: AstronautProfile = {
  id: 'ASTRO-ORBIT-02',
  name: 'Astronaut Aysel',
  callsign: 'ORBIT-ENG-AYSEL',
  age: 34,
  missionName: 'Artemis Mars-1 Transit',
  missionDay: 214,
  totalMissionDays: 500,
  role: 'Flight Engineer & Science Officer',
  stationModule: 'Deep Space Transit Hab-1',
  baselines: {
    restingHeartRate: 66,
    bloodOxygen: 98,
    bloodPressureSys: 116,
    bloodPressureDia: 76,
    bodyTemperature: 36.6,
    sleepHours: 7.5,
    dailyExerciseMinutes: 90,
    radiationThresholdMicroSv: 25.0,
  },
  emergencyContact: {
    flightSurgeonName: 'Dr. Elena Rostova (Flight Surgeon)',
    commChannel: 'Deep Space Network (DSN Madrid DSS-63)',
    location: 'Mission Control Center Houston / Building 30',
    frequency: 'Ka-Band 32.05 GHz / X-Band 8.4 GHz',
  },
};

async function seedInitialDataIfEmpty(db: SQLite.SQLiteDatabase): Promise<void> {
  const countResult = await db.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM health_records;'
  );
  if (countResult && countResult[0] && countResult[0].count > 0) {
    return; // Already seeded
  }

  // Pre-seed 7 days of realistic space mission biometric logs (DEMO DATA)
  const now = new Date();

  // Day 0 (Today)
  await db.runAsync(
    `INSERT INTO health_records (
      id, timestamp, heartRate, bloodOxygen, bloodPressureSys, bloodPressureDia,
      bodyTemperature, sleepDurationHours, sleepQuality, sleepInterruptions,
      fatigueLevel, stressLevel, moodWellbeing, exerciseType, exerciseDuration,
      exerciseIntensity, isManual, syncStatus, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'rec_today',
      now.toISOString(),
      72,
      98,
      120,
      80,
      36.6,
      8.0,
      'Optimal',
      1,
      3,
      'Low',
      'Focused',
      'ARED Resistive Exercise',
      90,
      'High',
      0,
      'synced',
      'Nominal sleep cycle completed in Crew Quarters. ARED protocol completed.',
    ]
  );

  // Day -1 (Yesterday)
  const d1 = new Date(now.getTime() - 24 * 3600 * 1000);
  await db.runAsync(
    `INSERT INTO health_records (
      id, timestamp, heartRate, bloodOxygen, bloodPressureSys, bloodPressureDia,
      bodyTemperature, sleepDurationHours, sleepQuality, sleepInterruptions,
      fatigueLevel, stressLevel, moodWellbeing, exerciseType, exerciseDuration,
      exerciseIntensity, isManual, syncStatus, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'rec_d1',
      d1.toISOString(),
      74,
      97.5,
      122,
      82,
      36.7,
      7.2,
      'Restless',
      2,
      4,
      'Moderate',
      'Stable',
      'CEVIS Cycle Ergometer',
      45,
      'Moderate',
      0,
      'synced',
      'Mild circadian shift recorded after payload operations in Node 2.',
    ]
  );

  // Day -2
  const d2 = new Date(now.getTime() - 48 * 3600 * 1000);
  await db.runAsync(
    `INSERT INTO health_records (
      id, timestamp, heartRate, bloodOxygen, bloodPressureSys, bloodPressureDia,
      bodyTemperature, sleepDurationHours, sleepQuality, sleepInterruptions,
      fatigueLevel, stressLevel, moodWellbeing, exerciseType, exerciseDuration,
      exerciseIntensity, isManual, syncStatus, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'rec_d2',
      d2.toISOString(),
      70,
      98,
      118,
      78,
      36.5,
      8.2,
      'Optimal',
      0,
      2,
      'Low',
      'Motivated',
      'T2 Space Treadmill',
      50,
      'High',
      0,
      'synced',
      'Excellent cardiovascular endurance following scheduled treadmill session.',
    ]
  );

  // Day -3
  const d3 = new Date(now.getTime() - 72 * 3600 * 1000);
  await db.runAsync(
    `INSERT INTO health_records (
      id, timestamp, heartRate, bloodOxygen, bloodPressureSys, bloodPressureDia,
      bodyTemperature, sleepDurationHours, sleepQuality, sleepInterruptions,
      fatigueLevel, stressLevel, moodWellbeing, exerciseType, exerciseDuration,
      exerciseIntensity, isManual, syncStatus, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'rec_d3',
      d3.toISOString(),
      76,
      97.8,
      124,
      82,
      36.8,
      6.8,
      'Disrupted',
      3,
      5,
      'Moderate',
      'Fatigued',
      'ARED Resistive Exercise',
      55,
      'Moderate',
      0,
      'synced',
      'Sleep interrupted by scheduled thruster reboost sequence.',
    ]
  );

  // Seed Radiation Telemetry Logs (Hourly samples for chart)
  const radiationHours = [
    { offset: 0, rate: 18.5, loc: 'Crew Quarters' },
    { offset: 2, rate: 19.1, loc: 'Destiny Lab' },
    { offset: 4, rate: 17.8, loc: 'Cupola Observation' },
    { offset: 6, rate: 22.4, loc: 'Columbus Module' },
    { offset: 8, rate: 26.8, loc: 'Quest Airlock' },
    { offset: 10, rate: 24.1, loc: 'Node 3 Tranquility' },
    { offset: 12, rate: 19.8, loc: 'Crew Quarters' },
    { offset: 16, rate: 18.2, loc: 'Deep Space Habitat' },
  ];

  for (const r of radiationHours) {
    const t = new Date(now.getTime() - r.offset * 3600 * 1000);
    await db.runAsync(
      `INSERT INTO radiation_logs (id, timestamp, rateMicroSvPerHour, location, isSimulatedDemo)
       VALUES (?, ?, ?, ?, ?)`,
      [`rad_${r.offset}`, t.toISOString(), r.rate, r.loc, 1]
    );
  }

  // Seed Cabin Environment Data
  await db.runAsync(
    `INSERT INTO environment_logs (
      id, timestamp, cabinTempCelsius, cabinO2Percent, cabinCO2mmHg,
      cabinPressureKPa, ambientRadiationMicroSv, overallStatus, isSimulatedDemo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['env_current', now.toISOString(), 21.8, 20.9, 2.8, 101.3, 18.5, 'Nominal', 1]
  );

  // Seed Initial Alert
  await db.runAsync(
    `INSERT INTO health_alerts (
      id, timestamp, title, category, severity, message, triggerReason, recommendedAction, acknowledged
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'alert_init_1',
      new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      'Airlock Radiation Elevation (Demonstration)',
      'RADIATION',
      'WARNING',
      'Radiation flux reached 26.8 µSv/h near Quest Airlock outer hull during South Atlantic Anomaly (SAA) passage.',
      'Dosimeter reading > 25.0 µSv/h threshold during orbit 2,241.',
      'Remain inside shielded Crew Quarters until orbital ground track exits SAA region.',
      0,
    ]
  );
}

// ========================
// PUBLIC CRUD OPERATIONS
// Multi-Astronaut Data Isolation Support
// ========================

export async function insertHealthRecord(record: HealthRecord, userId?: string): Promise<void> {
  const db = await getDatabase();
  const effectiveUserId = userId || record.userId || '';
  await db.runAsync(
    `INSERT INTO health_records (
      id, userId, timestamp, heartRate, bloodOxygen, bloodPressureSys, bloodPressureDia,
      bodyTemperature, sleepDurationHours, sleepQuality, sleepInterruptions,
      fatigueLevel, stressLevel, moodWellbeing, exerciseType, exerciseDuration,
      exerciseIntensity, isManual, syncStatus, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      effectiveUserId,
      record.timestamp,
      record.heartRate,
      record.bloodOxygen,
      record.bloodPressureSys,
      record.bloodPressureDia,
      record.bodyTemperature,
      record.sleepDurationHours,
      record.sleepQuality,
      record.sleepInterruptions,
      record.fatigueLevel,
      record.stressLevel,
      record.moodWellbeing,
      record.exercise.type,
      record.exercise.durationMinutes,
      record.exercise.intensity,
      record.isManual ? 1 : 0,
      record.syncStatus,
      record.notes || '',
    ]
  );
}

export async function getLatestHealthRecord(userId?: string): Promise<HealthRecord | null> {
  const db = await getDatabase();
  let query = 'SELECT * FROM health_records';
  const params: any[] = [];
  if (userId) {
    query += ' WHERE (userId = ? OR userId = "")';
    params.push(userId);
  }
  query += ' ORDER BY timestamp DESC LIMIT 1;';
  const rows = await db.getAllAsync<any>(query, params);
  if (!rows || rows.length === 0) return null;
  return mapDbRowToHealthRecord(rows[0]);
}

export async function getAllHealthRecords(limit = 30, userId?: string): Promise<HealthRecord[]> {
  const db = await getDatabase();
  let query = 'SELECT * FROM health_records';
  const params: any[] = [];
  if (userId) {
    query += ' WHERE (userId = ? OR userId = "")';
    params.push(userId);
  }
  query += ' ORDER BY timestamp DESC LIMIT ?;';
  params.push(limit);
  const rows = await db.getAllAsync<any>(query, params);
  return (rows || []).map(mapDbRowToHealthRecord);
}

export async function getUnsyncedHealthRecords(userId?: string): Promise<HealthRecord[]> {
  const db = await getDatabase();
  let query = "SELECT * FROM health_records WHERE syncStatus = 'pending'";
  const params: any[] = [];
  if (userId) {
    query += ' AND (userId = ? OR userId = "")';
    params.push(userId);
  }
  query += ' ORDER BY timestamp ASC;';
  const rows = await db.getAllAsync<any>(query, params);
  return (rows || []).map(mapDbRowToHealthRecord);
}

export async function markHealthRecordsAsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE health_records SET syncStatus = 'synced' WHERE id IN (${placeholders});`,
    ids
  );
}

export async function getRadiationHistory(limit = 24): Promise<RadiationLogEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM radiation_logs ORDER BY timestamp ASC LIMIT ?;',
    [limit]
  );
  return (rows || []).map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    rateMicroSvPerHour: r.rateMicroSvPerHour,
    location: r.location,
    isSimulatedDemo: Boolean(r.isSimulatedDemo),
  }));
}

export async function insertRadiationEntry(entry: RadiationLogEntry): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO radiation_logs (id, timestamp, rateMicroSvPerHour, location, isSimulatedDemo)
     VALUES (?, ?, ?, ?, ?)`,
    [entry.id, entry.timestamp, entry.rateMicroSvPerHour, entry.location, entry.isSimulatedDemo ? 1 : 0]
  );
}

export async function getLatestCabinEnvironment(): Promise<CabinEnvironmentData> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM environment_logs ORDER BY timestamp DESC LIMIT 1;'
  );
  if (rows && rows.length > 0) {
    const r = rows[0];
    return {
      cabinTempCelsius: r.cabinTempCelsius,
      cabinO2Percent: r.cabinO2Percent,
      cabinCO2mmHg: r.cabinCO2mmHg,
      cabinPressureKPa: r.cabinPressureKPa,
      ambientRadiationMicroSv: r.ambientRadiationMicroSv,
      overallStatus: r.overallStatus,
      isSimulatedDemo: Boolean(r.isSimulatedDemo),
      lastUpdated: r.timestamp,
    };
  }

  return {
    cabinTempCelsius: 21.8,
    cabinO2Percent: 20.9,
    cabinCO2mmHg: 2.8,
    cabinPressureKPa: 101.3,
    ambientRadiationMicroSv: 18.5,
    overallStatus: 'Nominal',
    isSimulatedDemo: true,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getActiveAlerts(): Promise<HealthAlert[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM health_alerts ORDER BY timestamp DESC LIMIT 20;'
  );
  return (rows || []).map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    title: r.title,
    category: r.category,
    severity: r.severity,
    message: r.message,
    triggerReason: r.triggerReason,
    recommendedAction: r.recommendedAction,
    acknowledged: Boolean(r.acknowledged),
  }));
}

export async function insertAlert(alert: HealthAlert): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO health_alerts (
      id, timestamp, title, category, severity, message, triggerReason, recommendedAction, acknowledged
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      alert.id,
      alert.timestamp,
      alert.title,
      alert.category,
      alert.severity,
      alert.message,
      alert.triggerReason,
      alert.recommendedAction,
      alert.acknowledged ? 1 : 0,
    ]
  );
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE health_alerts SET acknowledged = 1 WHERE id = ?;', [alertId]);
}

export async function getDatabaseRecordCounts(userId?: string): Promise<{
  healthRecords: number;
  radiationLogs: number;
  unsyncedCount: number;
  alertsCount: number;
}> {
  const db = await getDatabase();
  let hrQuery = 'SELECT COUNT(*) as c FROM health_records';
  let unsyncedQuery = "SELECT COUNT(*) as c FROM health_records WHERE syncStatus = 'pending'";
  const params: any[] = [];
  if (userId) {
    hrQuery += ' WHERE (userId = ? OR userId = "")';
    unsyncedQuery += ' AND (userId = ? OR userId = "")';
    params.push(userId);
  }
  const hr = await db.getAllAsync<{ c: number }>(hrQuery + ';', params);
  const rad = await db.getAllAsync<{ c: number }>('SELECT COUNT(*) as c FROM radiation_logs;');
  const unsynced = await db.getAllAsync<{ c: number }>(unsyncedQuery + ';', params);
  const al = await db.getAllAsync<{ c: number }>('SELECT COUNT(*) as c FROM health_alerts;');

  return {
    healthRecords: hr[0]?.c || 0,
    radiationLogs: rad[0]?.c || 0,
    unsyncedCount: unsynced[0]?.c || 0,
    alertsCount: al[0]?.c || 0,
  };
}

// Internal row mapper
function mapDbRowToHealthRecord(row: any): HealthRecord {
  return {
    id: row.id,
    userId: row.userId || undefined,
    timestamp: row.timestamp,
    heartRate: Number(row.heartRate),
    bloodOxygen: Number(row.bloodOxygen),
    bloodPressureSys: Number(row.bloodPressureSys),
    bloodPressureDia: Number(row.bloodPressureDia),
    bodyTemperature: Number(row.bodyTemperature),
    sleepDurationHours: Number(row.sleepDurationHours),
    sleepQuality: row.sleepQuality,
    sleepInterruptions: Number(row.sleepInterruptions),
    fatigueLevel: Number(row.fatigueLevel),
    stressLevel: row.stressLevel,
    moodWellbeing: row.moodWellbeing,
    exercise: {
      type: row.exerciseType,
      durationMinutes: Number(row.exerciseDuration),
      intensity: row.exerciseIntensity,
    },
    isManual: Boolean(row.isManual),
    syncStatus: row.syncStatus,
    notes: row.notes,
  };
}

/**
 * Returns an astronaut profile customized for the authenticated astronaut session.
 */
export function getCurrentAstronautProfile(user?: any): AstronautProfile {
  if (user && user.fullName) {
    return {
      id: user.astronautId || user.id || DEFAULT_ASTRONAUT.id,
      name: user.fullName,
      callsign: user.astronautId || DEFAULT_ASTRONAUT.callsign,
      age: 38,
      missionName: user.missionName || DEFAULT_ASTRONAUT.missionName,
      missionDay: DEFAULT_ASTRONAUT.missionDay,
      totalMissionDays: DEFAULT_ASTRONAUT.totalMissionDays,
      role: user.role === 'COMMANDER' ? 'Mission Commander & EVA Lead' : 'Flight Surgeon / Specialist',
      stationModule: DEFAULT_ASTRONAUT.stationModule,
      baselines: DEFAULT_ASTRONAUT.baselines,
      emergencyContact: DEFAULT_ASTRONAUT.emergencyContact,
      avatarId: user.avatarId || 'commander',
      userId: user.id,
    };
  }
  return DEFAULT_ASTRONAUT;
}

export interface RollingBaselineSummary {
  windowDays: 7 | 30;
  recordsCount: number;
  avgHeartRate: number;
  avgBloodOxygen: number;
  avgBloodPressureSys: number;
  avgBloodPressureDia: number;
  avgSleepDurationHours: number;
  avgDailyExerciseMinutes: number;
  lastUpdated: string;
}

/**
 * Computes rolling 7-day and 30-day astronaut physiological baselines
 * directly in local SQLite from historical bio-telemetry records.
 */
export async function calculateRollingBaselines(
  days: 7 | 30 = 7,
  userId?: string
): Promise<RollingBaselineSummary> {
  const db = await getDatabase();
  const cutoffDate = new Date(Date.now() - days * 86400000).toISOString();

  let query = `
    SELECT 
      COUNT(*) as count,
      AVG(heartRate) as avgHr,
      AVG(bloodOxygen) as avgSpo2,
      AVG(bloodPressureSys) as avgSys,
      AVG(bloodPressureDia) as avgDia,
      AVG(sleepDurationHours) as avgSleep,
      AVG(exerciseDurationMinutes) as avgExercise
    FROM health_records
    WHERE timestamp >= ?
  `;
  const params: any[] = [cutoffDate];

  if (userId) {
    query += ' AND userId = ?';
    params.push(userId);
  }

  const rows = await db.getAllAsync<any>(query, params);
  const row = rows && rows[0] ? rows[0] : null;

  if (row && row.count > 0) {
    return {
      windowDays: days,
      recordsCount: row.count,
      avgHeartRate: Math.round(row.avgHr || DEFAULT_ASTRONAUT.baselines.restingHeartRate),
      avgBloodOxygen: Number((row.avgSpo2 || DEFAULT_ASTRONAUT.baselines.bloodOxygen).toFixed(1)),
      avgBloodPressureSys: Math.round(row.avgSys || DEFAULT_ASTRONAUT.baselines.bloodPressureSys),
      avgBloodPressureDia: Math.round(row.avgDia || DEFAULT_ASTRONAUT.baselines.bloodPressureDia),
      avgSleepDurationHours: Number((row.avgSleep || DEFAULT_ASTRONAUT.baselines.sleepHours).toFixed(1)),
      avgDailyExerciseMinutes: Math.round(row.avgExercise || DEFAULT_ASTRONAUT.baselines.dailyExerciseMinutes),
      lastUpdated: new Date().toISOString(),
    };
  }

  // Fallback to default pre-flight calibrated baselines if insufficient records
  return {
    windowDays: days,
    recordsCount: 0,
    avgHeartRate: DEFAULT_ASTRONAUT.baselines.restingHeartRate,
    avgBloodOxygen: DEFAULT_ASTRONAUT.baselines.bloodOxygen,
    avgBloodPressureSys: DEFAULT_ASTRONAUT.baselines.bloodPressureSys,
    avgBloodPressureDia: DEFAULT_ASTRONAUT.baselines.bloodPressureDia,
    avgSleepDurationHours: DEFAULT_ASTRONAUT.baselines.sleepHours,
    avgDailyExerciseMinutes: DEFAULT_ASTRONAUT.baselines.dailyExerciseMinutes,
    lastUpdated: new Date().toISOString(),
  };
}


