// NASA Scientific Data Integration Types

export type NasaPhysiologicalCategory =
  | 'Cardiovascular'
  | 'Sleep & Circadian'
  | 'Radiation Biology'
  | 'Musculoskeletal & Bone'
  | 'Immune Response'
  | 'Neuro-ocular & Fluid Shift'
  | 'Spaceflight Adaptation';

// 1. NASA OSDR (Open Science Data Repository)
export interface NasaOsdrStudy {
  id: string; // e.g. "OSD-53"
  title: string;
  description: string;
  spaceProgram: string; // e.g. "NASA Space Biology"
  mission: string; // e.g. "ISS", "Artemis", "Shuttle"
  flightProgram: string;
  organism: string; // e.g. "Homo sapiens", "Mus musculus"
  category: NasaPhysiologicalCategory;
  factors: string[];
  assayTypes: string[];
  publicReleaseDate?: string;
  authoritativeSourceUrl: string;
  relevanceToAstronautHealth: string;
  isCachedOffline: boolean;
  lastUpdated: string;
}

// 2. NASA RadLab
export interface NasaRadlabMeasurement {
  id: string;
  timestamp: string; // ISO
  instrument: string; // e.g. "DosTel", "Liulin", "RAD"
  instrumentId: string; // e.g. "DosTel2"
  spacecraft: string; // e.g. "ISS", "MSL"
  absorbedDoseRateMicroGyPerHour: number | null; // µGy/h (Absorbed dose - physical energy absorbed)
  doseEquivalentRateMicroSvPerHour: number | null; // µSv/h (Dose equivalent - biological risk with quality factor)
  fluxParticlesPerCm2Sec: number | null; // particles / cm²·s
  latitude?: number | null;
  longitude?: number | null;
  altitudeKm?: number | null;
  sourceAttribution: string; // e.g. "NASA RadLab / ISS DosTel Flight Instrument"
  isHistoricalReference: boolean; // Always true for NASA historical detector telemetry
}

// 3. NASA EDA (Environmental Data Application)
export interface NasaEdaMission {
  missionId: string; // e.g. "RR-1", "RR-3", "RR-6"
  missionTitle: string;
  year: number;
  description: string;
  timePointsCount: number;
  // Summary Stats for ISS Cabin
  temperatureIss: { min: number; max: number; mean: number; unit: '°C' };
  temperatureGround: { min: number; max: number; mean: number; unit: '°C' };
  co2IssPpm: { min: number; max: number; mean: number; unit: 'ppm' };
  co2GroundPpm: { min: number; max: number; mean: number; unit: 'ppm' };
  rhIssPercent: { min: number; max: number; mean: number; unit: '%' };
  // Radiation stats (mGy)
  gcrDoseMgyPerDay: { mean: number; max: number };
  saaDoseMgyPerDay: { mean: number; max: number };
  totalDoseMgyPerDay: { mean: number; max: number };
  accumulatedDoseMgy: number;
  sampleTimeline: {
    timestamp: string;
    tempIss: number;
    co2Iss: number;
    rhIss: number;
    gcrMgy: number;
    totalRadMgy: number;
  }[];
  sourceAttribution: string;
  lastUpdated: string;
}

// 4. NASA Human Research Roadmap (HRR) Evidence Reports
export interface NasaHrrEvidenceReport {
  id: string;
  riskTitle: string;
  hrpCategory: string; // e.g. "Cardiovascular", "Behavioral Health", "Radiation"
  evidenceReportUrl: string;
  revisionDate: string;
  primaryResearchFocus: string;
  mainFindings: string[];
  keyBiomarkers: string[];
  operationalCountermeasures: string[];
  clinicalSignificance: string;
}

// 5. NASA DONKI (Space Weather Database)
export interface NasaDonkiEvent {
  messageId: string;
  messageType: 'FLR' | 'CME' | 'SEP' | 'GST' | 'RBE' | 'OTHER';
  issueTime: string; // ISO
  summary: string;
  classification?: string; // e.g. "X1.2", "M4.5", "Kp 6"
  significanceToCrew: 'NOMINAL' | 'ADVISORY' | 'WARNING' | 'CRITICAL';
  operationalGuidance: string;
  rawMessageSnippet: string;
  sourceUrl: string;
}

// Connection & Sync Status for NASA Data Center
export interface NasaResourceStatus {
  resourceId: 'osdr' | 'radlab' | 'eda' | 'hrr' | 'donki';
  name: string;
  shortDescription: string;
  officialUrl: string;
  endpointUrl: string;
  status: 'ONLINE' | 'OFFLINE_CACHED' | 'SYNCING' | 'ERROR';
  lastSuccessfulSync: string | null;
  cachedRecordsCount: number;
  dataTypesSummary: string;
  errorMessage?: string;
}

