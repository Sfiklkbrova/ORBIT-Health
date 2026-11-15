// Offline Autonomous Knowledge System and Local Execution Guard for ORBIT AI

import {
  getCachedOsdrStudies,
  getCachedHrrEvidence,
  getCachedRadlabMeasurements,
  getCachedDonkiEvents,
} from '../nasaDb';

export interface OfflineAiStatus {
  isOfflineMode: boolean;
  cachedStudiesCount: number;
  cachedHrrCount: number;
  cachedRadlabCount: number;
  cachedDonkiCount: number;
  engineName: string;
  operationalStatus: 'FULLY_OPERATIONAL_OFFLINE' | 'DEGRADED';
}

/**
 * Checks the status and completeness of local SQLite knowledge repositories
 * ensuring 100% offline flight autonomy without network dependency.
 */
export async function getOfflineAiSystemStatus(): Promise<OfflineAiStatus> {
  try {
    const [osdr, hrr, radlab, donki] = await Promise.all([
      getCachedOsdrStudies(),
      getCachedHrrEvidence(),
      getCachedRadlabMeasurements(10),
      getCachedDonkiEvents(10),
    ]);

    const isComplete = osdr.length > 0 && hrr.length > 0 && radlab.length > 0;

    return {
      isOfflineMode: true,
      cachedStudiesCount: osdr.length,
      cachedHrrCount: hrr.length,
      cachedRadlabCount: radlab.length,
      cachedDonkiCount: donki.length,
      engineName: 'ORBIT Spaceflight Autonomous Intelligence Engine (v2.5-PROD)',
      operationalStatus: isComplete ? 'FULLY_OPERATIONAL_OFFLINE' : 'DEGRADED',
    };
  } catch (err) {
    console.error('Error checking offline AI status:', err);
    return {
      isOfflineMode: true,
      cachedStudiesCount: 0,
      cachedHrrCount: 0,
      cachedRadlabCount: 0,
      cachedDonkiCount: 0,
      engineName: 'ORBIT Spaceflight Autonomous Intelligence Engine',
      operationalStatus: 'DEGRADED',
    };
  }
}

