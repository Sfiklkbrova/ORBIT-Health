import { getDatabase } from './db';

export type CommsLinkStatus = 'CONNECTED' | 'DELAYED' | 'BLACKOUT';

export interface FlightSurgeonMessage {
  id: string;
  senderName: string;
  subject: string;
  body: string;
  priority: 'ROUTINE' | 'PRIORITY' | 'URGENT_EMERGENCY';
  queuedAt: string;
  estimatedArrivalAt: string;
  status: 'QUEUED' | 'IN_TRANSIT' | 'DELIVERED';
}

export interface CommsDelayState {
  status: CommsLinkStatus;
  oneWayMinutes: number;
  oneWaySeconds: number;
  distanceAu: number;
  distanceKm: number;
  isBlackoutSimulated: boolean;
  activeGroundStation: string;
  carrierFrequency: string;
}

let simulatedBlackout = false;

export async function initializeCommsTables(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS flight_surgeon_outbox (
      id TEXT PRIMARY KEY NOT NULL,
      senderName TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      priority TEXT NOT NULL,
      queuedAt TEXT NOT NULL,
      estimatedArrivalAt TEXT NOT NULL,
      status TEXT NOT NULL
    );
  `);
}

export function getCommsDelayState(): CommsDelayState {
  if (simulatedBlackout) {
    return {
      status: 'BLACKOUT',
      oneWayMinutes: 0,
      oneWaySeconds: 0,
      distanceAu: 2.24,
      distanceKm: 336000000,
      isBlackoutSimulated: true,
      activeGroundStation: 'NONE (SOLAR CONJUNCTION / LOS)',
      carrierFrequency: 'CARRIER LOST',
    };
  }

  // Realistic Mars transit distance (2.24 AU = 336 million km -> ~18.66 minutes light delay)
  return {
    status: 'DELAYED',
    oneWayMinutes: 18,
    oneWaySeconds: 42,
    distanceAu: 2.24,
    distanceKm: 336000000,
    isBlackoutSimulated: false,
    activeGroundStation: 'NASA DSN Madrid (DSS-63, 70m)',
    carrierFrequency: 'Ka-Band 32.05 GHz / X-Band 8.4 GHz',
  };
}

export function setSimulateCommsBlackout(blackout: boolean): CommsDelayState {
  simulatedBlackout = blackout;
  return getCommsDelayState();
}

export function isCommsBlackoutActive(): boolean {
  return simulatedBlackout;
}

export async function queueMessageForFlightSurgeon(
  senderName: string,
  subject: string,
  body: string,
  priority: 'ROUTINE' | 'PRIORITY' | 'URGENT_EMERGENCY' = 'PRIORITY'
): Promise<FlightSurgeonMessage> {
  const db = await getDatabase();
  await initializeCommsTables();

  const id = `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date();
  const arrival = new Date(now.getTime() + 18.7 * 60 * 1000); // 18.7 min propagation

  const msg: FlightSurgeonMessage = {
    id,
    senderName,
    subject,
    body,
    priority,
    queuedAt: now.toISOString(),
    estimatedArrivalAt: arrival.toISOString(),
    status: simulatedBlackout ? 'QUEUED' : 'IN_TRANSIT',
  };

  await db.runAsync(
    `INSERT INTO flight_surgeon_outbox (
      id, senderName, subject, body, priority, queuedAt, estimatedArrivalAt, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      msg.id,
      msg.senderName,
      msg.subject,
      msg.body,
      msg.priority,
      msg.queuedAt,
      msg.estimatedArrivalAt,
      msg.status,
    ]
  );

  return msg;
}

export async function getFlightSurgeonOutbox(): Promise<FlightSurgeonMessage[]> {
  const db = await getDatabase();
  await initializeCommsTables();

  const rows = await db.getAllAsync<any>(
    'SELECT * FROM flight_surgeon_outbox ORDER BY queuedAt DESC;'
  );

  return rows.map((r) => ({
    id: r.id,
    senderName: r.senderName,
    subject: r.subject,
    body: r.body,
    priority: r.priority as any,
    queuedAt: r.queuedAt,
    estimatedArrivalAt: r.estimatedArrivalAt,
    status: r.status as any,
  }));
}
