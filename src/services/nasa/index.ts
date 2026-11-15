import { searchOsdrStudies } from './osdrService';
import { fetchNasaRadlabData } from './radlabService';
import { fetchNasaEdaData } from './edaService';
import { fetchNasaDonkiSpaceWeather } from './donkiService';
import { getHrrEvidenceReports } from './humanResearchService';
import { getNasaResourceStatuses } from '../nasaDb';

export * from './osdrService';
export * from './radlabService';
export * from './edaService';
export * from './humanResearchService';
export * from './donkiService';
export * from './nasaKnowledgeBase';

export interface NasaMasterSyncResult {
  timestamp: string;
  successCount: number;
  totalServices: number;
  summary: string;
}

/**
 * Triggers a comprehensive synchronization across all 5 NASA scientific resources.
 * Connects to live endpoints when network is online; gracefully preserves local cache when offline.
 */
export async function syncAllNasaServices(): Promise<NasaMasterSyncResult> {
  const timestamp = new Date().toISOString();
  let successCount = 0;

  try {
    // Run all 5 connectors in parallel
    const [osdrRes, radRes, edaRes, donkiRes, hrrRes] = await Promise.allSettled([
      searchOsdrStudies('astronaut', undefined, 6),
      fetchNasaRadlabData('DosTel'),
      fetchNasaEdaData('RR-1'),
      fetchNasaDonkiSpaceWeather(),
      getHrrEvidenceReports(),
    ]);

    if (osdrRes.status === 'fulfilled' && osdrRes.value.success) successCount += 1;
    if (radRes.status === 'fulfilled' && radRes.value.success) successCount += 1;
    if (edaRes.status === 'fulfilled' && edaRes.value.success) successCount += 1;
    if (donkiRes.status === 'fulfilled' && donkiRes.value.success) successCount += 1;
    if (hrrRes.status === 'fulfilled' && hrrRes.value.success) successCount += 1;

    return {
      timestamp,
      successCount,
      totalServices: 5,
      summary: `NASA Synchronization: ${successCount}/5 services refreshed. Scientific datasets archived in local SQLite.`,
    };
  } catch (err: any) {
    return {
      timestamp,
      successCount,
      totalServices: 5,
      summary: `NASA Sync offline mode: Local cached scientific records active. (${err.message})`,
    };
  }
}

export { getNasaResourceStatuses };
