import { NasaHrrEvidenceReport } from '../../types/nasa';
import { getCachedHrrEvidence, insertCachedHrrEvidence, updateNasaSyncRegistry } from '../nasaDb';

export interface HrrQueryResult {
  success: boolean;
  reports: NasaHrrEvidenceReport[];
  source: 'LOCAL_OFFLINE_KNOWLEDGE_BASE';
  lastSuccessfulUpdate: string;
}

/**
 * NASA Human Research Roadmap (HRR) Evidence Library Service.
 * Manages peer-reviewed spaceflight evidence reports for RAG AI analysis.
 */
export async function getHrrEvidenceReports(): Promise<HrrQueryResult> {
  const reports = await getCachedHrrEvidence();
  const timestamp = new Date().toISOString();
  await updateNasaSyncRegistry('hrr', 'ONLINE', reports.length, null);

  return {
    success: true,
    reports,
    source: 'LOCAL_OFFLINE_KNOWLEDGE_BASE',
    lastSuccessfulUpdate: timestamp,
  };
}

/**
 * Searches the NASA HRR Evidence library by keyword or physiological domain.
 */
export async function searchHrrEvidence(keyword: string): Promise<NasaHrrEvidenceReport[]> {
  const reports = await getCachedHrrEvidence();
  const kw = keyword.toLowerCase().trim();

  return reports.filter((r) => {
    const combined = `${r.riskTitle} ${r.hrpCategory} ${r.primaryResearchFocus} ${r.keyBiomarkers.join(' ')} ${r.mainFindings.join(' ')}`.toLowerCase();
    return combined.includes(kw);
  });
}

/**
 * Adds or updates an evidence report in the local knowledge base.
 */
export async function saveHrrEvidenceReport(report: NasaHrrEvidenceReport): Promise<void> {
  await insertCachedHrrEvidence(report);
}

