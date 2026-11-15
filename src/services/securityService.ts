// Security, Privacy, Role-Based Access Control and Audit Logging for ORBIT Health

import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'COMMANDER' | 'FLIGHT_SURGEON' | 'RESEARCHER';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'AUTHENTICATE' | 'EXPORT_DATA' | 'EMERGENCY_TRIGGER' | 'CONFIG_CHANGE' | 'BACKUP_CREATED' | 'RESTORE_DATA';
  actorRole: UserRole;
  details: string;
  ipOrModule: string;
  status: 'SUCCESS' | 'DENIED' | 'FLAGGED';
}

const PIN_STORAGE_KEY = 'orbit_security_pin_hash';
const ROLE_STORAGE_KEY = 'orbit_user_role';
const PIN_LOCK_ENABLED_KEY = 'orbit_pin_lock_enabled';

let inMemoryAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit_init',
    timestamp: new Date().toISOString(),
    action: 'AUTHENTICATE',
    actorRole: 'COMMANDER',
    details: 'Crew terminal unlocked via authenticated hardware key.',
    ipOrModule: 'Node 2 Habitation Terminal',
    status: 'SUCCESS',
  },
];

/**
 * Basic non-reversible hash helper for PIN storage.
 */
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    hash = (hash << 5) - hash + pin.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

export async function setSecurityPin(pin: string): Promise<void> {
  const hashed = hashPin(pin);
  await AsyncStorage.setItem(PIN_STORAGE_KEY, hashed);
  await logSecurityEvent('CONFIG_CHANGE', 'COMMANDER', 'Security PIN configured for onboard terminal.');
}

export async function verifySecurityPin(pin: string): Promise<boolean> {
  const saved = await AsyncStorage.getItem(PIN_STORAGE_KEY);
  if (!saved) return true; // Default no PIN set
  const isMatch = saved === hashPin(pin);
  await logSecurityEvent(
    'AUTHENTICATE',
    'COMMANDER',
    isMatch ? 'PIN verification successful.' : 'Incorrect PIN entered.',
    isMatch ? 'SUCCESS' : 'DENIED'
  );
  return isMatch;
}

export async function isPinLockEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(PIN_LOCK_ENABLED_KEY);
  return val === 'true';
}

export async function setPinLockEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(PIN_LOCK_ENABLED_KEY, enabled ? 'true' : 'false');
  await logSecurityEvent(
    'CONFIG_CHANGE',
    'COMMANDER',
    `Terminal biometric/PIN lock set to ${enabled ? 'ENABLED' : 'DISABLED'}.`
  );
}

export async function getActiveUserRole(): Promise<UserRole> {
  const role = (await AsyncStorage.getItem(ROLE_STORAGE_KEY)) as UserRole;
  return role || 'COMMANDER';
}

export async function setActiveUserRole(role: UserRole): Promise<void> {
  await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);
  await logSecurityEvent('CONFIG_CHANGE', role, `Active user role switched to ${role}.`);
}

export async function logSecurityEvent(
  action: AuditLogEntry['action'],
  actorRole: UserRole,
  details: string,
  status: 'SUCCESS' | 'DENIED' | 'FLAGGED' = 'SUCCESS'
): Promise<void> {
  const entry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    action,
    actorRole,
    details,
    ipOrModule: 'Deep Space Gateway Node 2',
    status,
  };
  inMemoryAuditLogs.unshift(entry);
  if (inMemoryAuditLogs.length > 50) {
    inMemoryAuditLogs.pop();
  }
}

export function getAuditLogs(): AuditLogEntry[] {
  return [...inMemoryAuditLogs];
}

/**
 * Anonymizes/masks Personally Identifiable Information (PII) for HIPAA/NASA OSDR research exports.
 */
export function anonymizeAstronautData<T extends { name?: string; callsign?: string; emergencyContact?: any }>(
  data: T
): T {
  return {
    ...data,
    name: 'DE-IDENTIFIED-CREW-SUBJECT-8492',
    callsign: 'ANONYMIZED-SUBJ',
    emergencyContact: {
      flightSurgeonName: 'NASA Houston Flight Medicine Clinic (Redacted)',
      commChannel: 'Secure Downlink',
      frequency: 'Classified',
      location: 'Johnson Space Center',
    },
  };
}
