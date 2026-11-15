import {
  NasaHrrEvidenceReport,
  NasaOsdrStudy,
  NasaRadlabMeasurement,
  NasaDonkiEvent,
  NasaEdaMission,
} from '../../types/nasa';
import {
  getCachedHrrEvidence,
  getCachedOsdrStudies,
  getCachedRadlabMeasurements,
  getCachedDonkiEvents,
  getCachedEdaMissions,
} from '../nasaDb';

export interface NasaRagCitation {
  sourceName: string;
  documentTitle: string;
  url: string;
  keyFinding: string;
}

export interface NasaRagContext {
  hrrReports: NasaHrrEvidenceReport[];
  osdrStudies: NasaOsdrStudy[];
  radlabReferences: NasaRadlabMeasurement[];
  donkiEvents: NasaDonkiEvent[];
  edaBaseline: NasaEdaMission | null;
  citations: NasaRagCitation[];
  scientificSummary: string;
}

/**
 * Retrieves scientifically grounded context from local NASA research databases (RAG).
 * Connects NASA Human Research Roadmap, OSDR studies, and space weather data to queries.
 */
export async function retrieveNasaScientificContext(query: string): Promise<NasaRagContext> {
  const q = query.toLowerCase();

  const [allHrr, allOsdr, radlab, donki, eda] = await Promise.all([
    getCachedHrrEvidence(),
    getCachedOsdrStudies(),
    getCachedRadlabMeasurements(10),
    getCachedDonkiEvents(5),
    getCachedEdaMissions(),
  ]);

  const matchedHrr: NasaHrrEvidenceReport[] = [];
  const matchedOsdr: NasaOsdrStudy[] = [];
  const citations: NasaRagCitation[] = [];

  // Match HRR Evidence Reports
  for (const h of allHrr) {
    const text = `${h.riskTitle} ${h.hrpCategory} ${h.primaryResearchFocus} ${h.keyBiomarkers.join(' ')}`.toLowerCase();
    if (
      (q.includes('cardio') || q.includes('heart') || q.includes('pulse')) && text.includes('cardiovascular') ||
      (q.includes('sleep') || q.includes('insomnia') || q.includes('circadian') || q.includes('rest')) && text.includes('sleep') ||
      (q.includes('radiation') || q.includes('solar') || q.includes('radlab') || q.includes('spe')) && text.includes('radiation') ||
      (q.includes('muscle') || q.includes('exercise') || q.includes('countermeasure') || q.includes('fitness')) && text.includes('muscle') ||
      (q.includes('co2') || q.includes('hypercapnia') || q.includes('cabin') || q.includes('air')) && text.includes('carbon dioxide') ||
      q.includes('nasa research') || q.includes('evidence') || q.includes('document')
    ) {
      if (!matchedHrr.some((m) => m.id === h.id)) {
        matchedHrr.push(h);
        citations.push({
          sourceName: 'NASA Human Research Roadmap (HRR)',
          documentTitle: h.riskTitle,
          url: h.evidenceReportUrl,
          keyFinding: h.mainFindings[0] || h.primaryResearchFocus,
        });
      }
    }
  }

  // If no specific match, include the cardiovascular & sleep primary risks as default baseline
  if (matchedHrr.length === 0 && allHrr.length > 0) {
    matchedHrr.push(allHrr[0]);
    citations.push({
      sourceName: 'NASA Human Research Roadmap (HRR)',
      documentTitle: allHrr[0].riskTitle,
      url: allHrr[0].evidenceReportUrl,
      keyFinding: allHrr[0].mainFindings[0],
    });
  }

  // Match OSDR Studies
  for (const s of allOsdr) {
    const text = `${s.title} ${s.description} ${s.category}`.toLowerCase();
    if (
      (q.includes('cardio') || q.includes('heart')) && (s.category === 'Cardiovascular' || text.includes('cardio')) ||
      (q.includes('sleep') || q.includes('circadian')) && s.category === 'Sleep & Circadian' ||
      (q.includes('radiation') || q.includes('cosmic')) && s.category === 'Radiation Biology' ||
      (q.includes('gene') || q.includes('immune') || q.includes('twins') || q.includes('study')) && s.id === 'OSD-37' ||
      (q.includes('rna') || q.includes('expression')) && s.id === 'OSD-53'
    ) {
      if (!matchedOsdr.some((m) => m.id === s.id)) {
        matchedOsdr.push(s);
        citations.push({
          sourceName: `NASA OSDR (${s.id})`,
          documentTitle: s.title,
          url: s.authoritativeSourceUrl,
          keyFinding: s.relevanceToAstronautHealth,
        });
      }
    }
  }

  // Generate scientific synthesis summary
  let synthesis = '';
  if (matchedHrr.length > 0) {
    const h = matchedHrr[0];
    synthesis = `Scientific evidence from ${h.riskTitle} (${h.hrpCategory}) confirms: ${h.mainFindings.slice(0, 2).join(' ')}`;
  } else if (matchedOsdr.length > 0) {
    const o = matchedOsdr[0];
    synthesis = `NASA OSDR Study ${o.id} ("${o.title}") establishes: ${o.relevanceToAstronautHealth}`;
  } else {
    synthesis = 'NASA Human Research Program protocols emphasize adherence to daily physical countermeasures and active dosimetry monitoring.';
  }

  return {
    hrrReports: matchedHrr,
    osdrStudies: matchedOsdr,
    radlabReferences: radlab,
    donkiEvents: donki,
    edaBaseline: eda.length ? eda[0] : null,
    citations,
    scientificSummary: synthesis,
  };
}

