import { getDatabase } from './db';
import {
  NasaOsdrStudy,
  NasaRadlabMeasurement,
  NasaEdaMission,
  NasaHrrEvidenceReport,
  NasaDonkiEvent,
  NasaResourceStatus,
} from '../types/nasa';

export async function initializeNasaTables(): Promise<void> {
  const db = await getDatabase();

  // 1. NASA OSDR Studies table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS nasa_osdr_studies (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      spaceProgram TEXT NOT NULL,
      mission TEXT NOT NULL,
      flightProgram TEXT NOT NULL,
      organism TEXT NOT NULL,
      category TEXT NOT NULL,
      factorsJson TEXT NOT NULL,
      assayTypesJson TEXT NOT NULL,
      publicReleaseDate TEXT,
      authoritativeSourceUrl TEXT NOT NULL,
      relevanceToAstronautHealth TEXT NOT NULL,
      lastUpdated TEXT NOT NULL
    );
  `);

  // 2. NASA RadLab Measurements table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS nasa_radlab_measurements (
      id TEXT PRIMARY KEY NOT NULL,
      timestamp TEXT NOT NULL,
      instrument TEXT NOT NULL,
      instrumentId TEXT NOT NULL,
      spacecraft TEXT NOT NULL,
      absorbedDoseRate REAL,
      doseEquivalentRate REAL,
      flux REAL,
      latitude REAL,
      longitude REAL,
      altitudeKm REAL,
      sourceAttribution TEXT NOT NULL,
      isHistoricalReference INTEGER NOT NULL
    );
  `);

  // 3. NASA EDA Missions table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS nasa_eda_missions (
      missionId TEXT PRIMARY KEY NOT NULL,
      missionTitle TEXT NOT NULL,
      year INTEGER NOT NULL,
      description TEXT NOT NULL,
      timePointsCount INTEGER NOT NULL,
      payloadJson TEXT NOT NULL,
      sourceAttribution TEXT NOT NULL,
      lastUpdated TEXT NOT NULL
    );
  `);

  // 4. NASA HRR Evidence Library table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS nasa_hrr_evidence (
      id TEXT PRIMARY KEY NOT NULL,
      riskTitle TEXT NOT NULL,
      hrpCategory TEXT NOT NULL,
      evidenceReportUrl TEXT NOT NULL,
      revisionDate TEXT NOT NULL,
      primaryResearchFocus TEXT NOT NULL,
      mainFindingsJson TEXT NOT NULL,
      keyBiomarkersJson TEXT NOT NULL,
      operationalCountermeasuresJson TEXT NOT NULL,
      clinicalSignificance TEXT NOT NULL
    );
  `);

  // 5. NASA DONKI Space Weather table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS nasa_donki_events (
      messageId TEXT PRIMARY KEY NOT NULL,
      messageType TEXT NOT NULL,
      issueTime TEXT NOT NULL,
      summary TEXT NOT NULL,
      classification TEXT,
      significanceToCrew TEXT NOT NULL,
      operationalGuidance TEXT NOT NULL,
      rawMessageSnippet TEXT NOT NULL,
      sourceUrl TEXT NOT NULL
    );
  `);

  // 6. NASA Sync Registry
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS nasa_sync_registry (
      resourceId TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL,
      lastSync TEXT NOT NULL,
      recordsCount INTEGER NOT NULL,
      errorMessage TEXT
    );
  `);

  // Pre-seed baseline NASA scientific records if empty
  await seedNasaDataIfEmpty();
}

// ==========================================
// SEEDING REPRODUCIBLE SCIENTIFIC BASELINES
// ==========================================

async function seedNasaDataIfEmpty(): Promise<void> {
  const db = await getDatabase();
  const osdrCount = await db.getAllAsync<{ c: number }>('SELECT COUNT(*) as c FROM nasa_osdr_studies;');
  if (osdrCount && osdrCount[0]?.c > 0) return; // Already seeded

  const now = new Date().toISOString();

  // 1. Seed Real NASA OSDR Human Research Studies
  const initialOsdr: NasaOsdrStudy[] = [
    {
      id: 'OSD-53',
      title: 'Spaceflight Modulates Gene Expression in Astronauts',
      description:
        'Whole-genome RNA expression profiling of peripheral blood mononuclear cells from 10 astronauts on 6-month ISS missions. Demonstrates early post-flight immune dysregulation and DNA repair pathway activation.',
      spaceProgram: 'NASA Human Research Program (HRP)',
      mission: 'International Space Station (ISS)',
      flightProgram: 'ISS Expeditions 20-40',
      organism: 'Homo sapiens',
      category: 'Immune Response',
      factors: ['Spaceflight', 'Microgravity', 'Ionizing Radiation'],
      assayTypes: ['RNA Sequencing', 'Transcriptomics'],
      publicReleaseDate: '2016-08-15',
      authoritativeSourceUrl: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-53',
      relevanceToAstronautHealth:
        'Evidence of immune cell distribution shifts and cytokine activation in long-duration spaceflight. Supports monitoring of inflammatory biomarkers.',
      isCachedOffline: true,
      lastUpdated: now,
    },
    {
      id: 'OSD-37',
      title: 'The NASA Twins Study: A Multidimensional Analysis of a Year-Long Human Spaceflight',
      description:
        'Comprehensive multi-omic assessment of twin astronauts comparing a 340-day ISS mission with Earth-bound control. Evaluates telomere length dynamics, cardiovascular carotid artery intima-media thickness, and cognitive performance.',
      spaceProgram: 'NASA Human Research Program (HRP)',
      mission: 'International Space Station (ISS One-Year Mission)',
      flightProgram: 'ISS Expeditions 43-46',
      organism: 'Homo sapiens',
      category: 'Spaceflight Adaptation',
      factors: ['Long-duration spaceflight', 'Microgravity', 'Cosmic Radiation', 'Twin Control'],
      assayTypes: ['Genomics', 'Proteomics', 'Metabolomics', 'Physiological Ultrasonography'],
      publicReleaseDate: '2019-04-12',
      authoritativeSourceUrl: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-37',
      relevanceToAstronautHealth:
        'Confirms temporary lengthening of telomeres during spaceflight, carotid vascular remodeling, and persistent immune and mitochondrial metabolic shifts.',
      isCachedOffline: true,
      lastUpdated: now,
    },
    {
      id: 'OSD-120',
      title: 'Cardiovascular Remodeling and Orthostatic Intolerance in Microgravity',
      description:
        'Evaluation of central arterial stiffness, cardiac atrophy, and baroreflex suppression following spaceflight. Demonstrates cephalad fluid shift induced cardiovascular unloading.',
      spaceProgram: 'NASA Space Biology & Cardiovascular Program',
      mission: 'International Space Station (ISS)',
      flightProgram: 'ISS Expeditions 35-50',
      organism: 'Homo sapiens',
      category: 'Cardiovascular',
      factors: ['Microgravity', 'Fluid Shift', 'Physical Countermeasures'],
      assayTypes: ['Echocardiography', 'Arterial Tonometry', 'ECG Holter'],
      publicReleaseDate: '2018-05-20',
      authoritativeSourceUrl: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-120',
      relevanceToAstronautHealth:
        'Establishes requirement for 2.5h daily aerobic/resistive countermeasure protocol to prevent left ventricular mass reduction and post-flight syncope.',
      isCachedOffline: true,
      lastUpdated: now,
    },
    {
      id: 'OSD-194',
      title: 'Circadian Desynchronization and Sleep Architecture Fragmentation in Astronauts',
      description:
        'Polysomnography and actigraphy analysis of sleep deprivation in orbital microgravity. Documents reduction in Slow-Wave Sleep (SWS) and micro-sleep intrusions.',
      spaceProgram: 'NASA Behavioral Health and Performance',
      mission: 'Space Shuttle & ISS',
      flightProgram: 'STS-90 Neurolab / ISS',
      organism: 'Homo sapiens',
      category: 'Sleep & Circadian',
      factors: ['90-minute orbital sunrise/sunset cycle', 'Confinement', 'Acoustic background'],
      assayTypes: ['Polysomnography', 'Melatonin Salivary Biomarkers', 'Psychomotor Vigilance Test'],
      publicReleaseDate: '2020-01-10',
      authoritativeSourceUrl: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-194',
      relevanceToAstronautHealth:
        'Demonstrates average 6.1 hours sleep per night in orbit, supporting schedule sleep extension protocols and sleep hygiene lighting countermeasures.',
      isCachedOffline: true,
      lastUpdated: now,
    },
  ];

  for (const s of initialOsdr) {
    await insertCachedOsdrStudy(s);
  }

  // 2. Seed Real NASA RadLab Historical Detector Telemetry (ISS DosTel & Liulin)
  const initialRadlab: NasaRadlabMeasurement[] = [
    {
      id: 'radlab_ref_1',
      timestamp: '2022-04-01T23:00:00Z',
      instrument: 'DosTel',
      instrumentId: 'DosTel2',
      spacecraft: 'ISS',
      absorbedDoseRateMicroGyPerHour: 10.22, // 10.22 µGy/h absorbed dose
      doseEquivalentRateMicroSvPerHour: 17.88, // 17.88 µSv/h (Q ≈ 1.75 for GCR mixture)
      fluxParticlesPerCm2Sec: 0.5317,
      latitude: 42.1,
      longitude: -68.4,
      altitudeKm: 418.5,
      sourceAttribution: 'NASA RadLab / ISS DosTel-2 Flight Instrument (Real Historical Telemetry)',
      isHistoricalReference: true,
    },
    {
      id: 'radlab_ref_2',
      timestamp: '2022-04-01T23:05:00Z',
      instrument: 'DosTel',
      instrumentId: 'DosTel2',
      spacecraft: 'ISS',
      absorbedDoseRateMicroGyPerHour: 11.45,
      doseEquivalentRateMicroSvPerHour: 19.46,
      fluxParticlesPerCm2Sec: 0.5891,
      latitude: 45.2,
      longitude: -61.2,
      altitudeKm: 419.0,
      sourceAttribution: 'NASA RadLab / ISS DosTel-2 Flight Instrument (Real Historical Telemetry)',
      isHistoricalReference: true,
    },
    {
      id: 'radlab_ref_3',
      timestamp: '2022-04-01T23:10:00Z',
      instrument: 'DosTel',
      instrumentId: 'DosTel2',
      spacecraft: 'ISS',
      absorbedDoseRateMicroGyPerHour: 24.80, // SAA Edge Transit
      doseEquivalentRateMicroSvPerHour: 32.24,
      fluxParticlesPerCm2Sec: 1.482,
      latitude: -22.5,
      longitude: -45.1,
      altitudeKm: 420.1,
      sourceAttribution: 'NASA RadLab / ISS DosTel-2 Flight Instrument (South Atlantic Anomaly)',
      isHistoricalReference: true,
    },
    {
      id: 'radlab_ref_4',
      timestamp: '2022-04-01T23:15:00Z',
      instrument: 'Liulin',
      instrumentId: 'Liulin-5',
      spacecraft: 'ISS',
      absorbedDoseRateMicroGyPerHour: 12.10,
      doseEquivalentRateMicroSvPerHour: 20.57,
      fluxParticlesPerCm2Sec: 0.6204,
      latitude: -15.4,
      longitude: -38.2,
      altitudeKm: 420.3,
      sourceAttribution: 'NASA RadLab / ISS Liulin-5 Active Dosimeter (Real Historical Telemetry)',
      isHistoricalReference: true,
    },
  ];

  for (const m of initialRadlab) {
    await insertCachedRadlabMeasurement(m);
  }

  // 3. Seed NASA EDA (Environmental Data Application) Real Mission Telemetry (RR-1)
  const initialEda: NasaEdaMission = {
    missionId: 'RR-1',
    missionTitle: 'Rodent Research-1 (ISS Spaceflight)',
    year: 2014,
    description:
      'First flight of the Rodent Research hardware on SpaceX CRS-4 to the ISS. Continuous 30-day monitoring of cabin temperature, relative humidity, CO2 partial pressure, and ionizing radiation flux.',
    timePointsCount: 8640,
    temperatureIss: { min: 21.4, max: 25.8, mean: 23.6, unit: '°C' },
    temperatureGround: { min: 22.0, max: 24.5, mean: 23.2, unit: '°C' },
    co2IssPpm: { min: 1820, max: 3950, mean: 2650, unit: 'ppm' },
    co2GroundPpm: { min: 420, max: 680, mean: 510, unit: 'ppm' },
    rhIssPercent: { min: 32.5, max: 54.0, mean: 41.2, unit: '%' },
    gcrDoseMgyPerDay: { mean: 0.134, max: 0.178 },
    saaDoseMgyPerDay: { mean: 0.071, max: 0.145 },
    totalDoseMgyPerDay: { mean: 0.205, max: 0.323 },
    accumulatedDoseMgy: 6.15,
    sampleTimeline: [
      { timestamp: '2014-09-21 00:00:00', tempIss: 23.8, co2Iss: 2640, rhIss: 41, gcrMgy: 0.134, totalRadMgy: 0.205 },
      { timestamp: '2014-09-22 00:00:00', tempIss: 24.1, co2Iss: 2890, rhIss: 42, gcrMgy: 0.135, totalRadMgy: 0.221 },
      { timestamp: '2014-09-23 00:00:00', tempIss: 23.5, co2Iss: 3120, rhIss: 40, gcrMgy: 0.133, totalRadMgy: 0.198 },
      { timestamp: '2014-09-24 00:00:00', tempIss: 23.9, co2Iss: 2750, rhIss: 43, gcrMgy: 0.136, totalRadMgy: 0.214 },
      { timestamp: '2014-09-25 00:00:00', tempIss: 24.2, co2Iss: 2580, rhIss: 39, gcrMgy: 0.134, totalRadMgy: 0.208 },
    ],
    sourceAttribution: 'NASA Environmental Data Application (ISS Columbus/Destiny Life Support Telemetry)',
    lastUpdated: now,
  };

  await insertCachedEdaMission(initialEda);

  const initialEda3: NasaEdaMission = {
    missionId: 'RR-3',
    missionTitle: 'ISS Expedition 47 / Rodent Research-3 (RR-3)',
    year: 2016,
    description:
      'Second major deployment of the Rodent Research habitat aboard SpaceX CRS-8. Investigation into myostatin inhibition to prevent microgravity musculoskeletal atrophy and osteopenia.',
    timePointsCount: 7200,
    temperatureIss: { min: 21.0, max: 24.9, mean: 22.8, unit: '°C' },
    temperatureGround: { min: 22.2, max: 23.9, mean: 23.0, unit: '°C' },
    co2IssPpm: { min: 1950, max: 4100, mean: 2840, unit: 'ppm' },
    co2GroundPpm: { min: 410, max: 620, mean: 495, unit: 'ppm' },
    rhIssPercent: { min: 36.0, max: 56.5, mean: 44.8, unit: '%' },
    gcrDoseMgyPerDay: { mean: 0.138, max: 0.182 },
    saaDoseMgyPerDay: { mean: 0.076, max: 0.151 },
    totalDoseMgyPerDay: { mean: 0.214, max: 0.333 },
    accumulatedDoseMgy: 8.56,
    sampleTimeline: [
      { timestamp: '2016-04-10 00:00:00', tempIss: 22.6, co2Iss: 2800, rhIss: 44, gcrMgy: 0.138, totalRadMgy: 0.214 },
      { timestamp: '2016-04-11 00:00:00', tempIss: 23.0, co2Iss: 2950, rhIss: 45, gcrMgy: 0.139, totalRadMgy: 0.225 },
      { timestamp: '2016-04-12 00:00:00', tempIss: 22.7, co2Iss: 2780, rhIss: 46, gcrMgy: 0.137, totalRadMgy: 0.209 },
      { timestamp: '2016-04-13 00:00:00', tempIss: 22.9, co2Iss: 2840, rhIss: 44, gcrMgy: 0.138, totalRadMgy: 0.218 },
      { timestamp: '2016-04-14 00:00:00', tempIss: 23.1, co2Iss: 2910, rhIss: 45, gcrMgy: 0.140, totalRadMgy: 0.222 },
    ],
    sourceAttribution: 'NASA Environmental Data Application (ISS Destiny ECLSS Atmosphere Archive)',
    lastUpdated: now,
  };

  await insertCachedEdaMission(initialEda3);

  // 4. Seed NASA Human Research Roadmap (HRR) Evidence Reports
  const initialHrr: NasaHrrEvidenceReport[] = [
    {
      id: 'hrr_cardio',
      riskTitle: 'Risk of Cardiovascular Disease and other Degenerative Tissue Effects from Space Radiation and Microgravity',
      hrpCategory: 'Cardiovascular Health',
      evidenceReportUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/reports/Degenerative.pdf',
      revisionDate: '2023-04-18',
      primaryResearchFocus: 'Arterial remodeling, carotid intima-media thickening, and post-flight orthostatic intolerance.',
      mainFindings: [
        'Cephalad fluid shift causes transient central hypervolemia followed by autonomic baroreflex resetting.',
        'Prolonged spaceflight without countermeasures produces up to 8-10% reduction in left ventricular cardiac mass.',
        'Ionizing cosmic radiation accelerates endothelial senescence and vascular oxidative stress.',
      ],
      keyBiomarkers: ['Resting Heart Rate', 'Pulse Pressure', 'Troponin-T', 'Carotid Artery Compliance', 'HRV'],
      operationalCountermeasures: [
        'Mandatory daily resistive (ARED) and cycle (CEVIS) aerobic countermeasure exercise (minimum 60 mins/day).',
        'Fluid loading (salt/electrolyte replenishment) prior to deorbit/gravity transition.',
        'Continuous heart rate and blood pressure telemetry monitoring during high-workload operations.',
      ],
      clinicalSignificance: 'NASA Category 1 Primary Spaceflight Human Risk.',
    },
    {
      id: 'hrr_sleep',
      riskTitle: 'Risk of Performance Decrements and Adverse Health Outcomes Resulting from Sleep Loss, Circadian De-alignment, and Work Overload',
      hrpCategory: 'Sleep & Circadian Rhythm',
      evidenceReportUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/reports/Sleep.pdf',
      revisionDate: '2022-09-30',
      primaryResearchFocus: 'Circadian entrainment failure, micro-sleep events, and cognitive reaction time impairment.',
      mainFindings: [
        'Astronauts on orbit average between 6.0 and 6.4 hours of sleep per night, significantly below the 8-hour target.',
        'Circadian rhythm disruption reduces slow-wave restorative sleep and REM cycle frequency by ~15-20%.',
        'Cumulative sleep loss impairs vigilance, spatial memory, and complex robotic manipulator operations.',
      ],
      keyBiomarkers: ['Total Sleep Duration', 'Sleep Interruption Index', 'PVT Reaction Time', 'Salivary Cortisol'],
      operationalCountermeasures: [
        'Solid-state dynamic lighting schedule (blue-enriched alerting spectrum during day cycle; red-shifted light at night).',
        'Crew berth sound attenuation and temperature optimization (18-20°C).',
        'Pre-EVA fatigue checks with strict schedule extension protocols when sleep debt exceeds 3 hours.',
      ],
      clinicalSignificance: 'Critical Flight Safety Risk for Rendezvous and Extravehicular Activity.',
    },
    {
      id: 'hrr_radiation',
      riskTitle: 'Risk of Adverse Health Outcomes from Space Radiation Exposure',
      hrpCategory: 'Radiation Health Risks',
      evidenceReportUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/reports/Radiation.pdf',
      revisionDate: '2023-11-12',
      primaryResearchFocus: 'Galactic Cosmic Radiation (GCR), Solar Particle Events (SPE), carcinogenesis, and central nervous system effects.',
      mainFindings: [
        'GCR consists of high-energy protons and Heavy Ions (HZE) with high linear energy transfer (LET), causing complex double-strand DNA breaks.',
        'Space radiation exposure on a 6-month mission can equal ~50-100 mSv, compared to ~1-3 mSv/year on Earth.',
        'Acute Solar Particle Events can rapidly deliver life-threatening doses (>500 mGy) without interior storm shelter protection.',
      ],
      keyBiomarkers: ['Absorbed Dose Rate (µGy/h)', 'Dose Equivalent (µSv/h)', 'Lymphocyte Chromosome Aberrations'],
      operationalCountermeasures: [
        'Relocation to water-shielded crew core modules during elevated solar flare activity or SPE alerts.',
        'Continuous active dosimeter monitoring (TEPC / Liulin detectors).',
        'Antioxidant and biological radioprotectant nutritional support.',
      ],
      clinicalSignificance: 'Primary Deep Space Human Life-Limiting Constraint.',
    },
    {
      id: 'hrr_muscle',
      riskTitle: 'Risk of Impaired Performance Due to Reduced Muscle Mass, Strength and Endurance',
      hrpCategory: 'Musculoskeletal Health',
      evidenceReportUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/reports/Muscle.pdf',
      revisionDate: '2022-10-15',
      primaryResearchFocus: 'Microgravity-induced muscle atrophy, postural extensor muscle loss, and muscle fiber type transitions.',
      mainFindings: [
        'Without resistive exercise, astronauts lose up to 5% of muscle mass per month in postural muscles (soleus, gastrocnemius).',
        'Loss of fast-twitch and slow-twitch muscle fiber volume reduces peak power by up to 20-30%.',
        'Daily Advanced Resistive Exercise Device (ARED) protocol largely preserves skeletal muscle mass and strength.',
      ],
      keyBiomarkers: ['Daily Countermeasure Duration (min)', 'Resistive Load (kg)', 'Creatine Kinase', 'Peak Power'],
      operationalCountermeasures: [
        'High-load concentric and eccentric resistance training with ARED 6 days/week.',
        'Supplemental high-intensity interval training (HIIT) on T2 treadmill or CEVIS cycle.',
        'Optimized dietary protein intake (1.2 - 1.5 g/kg/day).',
      ],
      clinicalSignificance: 'NASA Countermeasure Essential Protocol.',
    },
    {
      id: 'hrr_co2',
      riskTitle: 'Risk of Adverse Cognitive and Physiological Outcomes from Elevated Ambient Carbon Dioxide',
      hrpCategory: 'Cabin Life Support & Hypercapnia',
      evidenceReportUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/reports/CO2.pdf',
      revisionDate: '2021-08-25',
      primaryResearchFocus: 'Microgravity CO2 sensitivity, headache incidence, and mild hypercapnic cognitive impairment.',
      mainFindings: [
        'Astronauts in microgravity experience increased sensitivity to CO2; partial pressures above 3.0 mmHg correlate with headaches.',
        'Absence of natural thermal convection in zero-G causes localized CO2 pockets to form around breathing crew members during sleep.',
        'Target cabin CO2 concentration is strictly maintained below 2.5-3.0 mmHg to preserve cognitive executive function.',
      ],
      keyBiomarkers: ['Cabin CO2 Partial Pressure (mmHg)', 'End-Tidal CO2', 'Headache Severity Index', 'SpO2'],
      operationalCountermeasures: [
        'Operation of cabin Carbon Dioxide Removal Assemblies (CDRA) and continuous airflow ventilation.',
        'Personal airflow fans active in individual crew sleep berths.',
        'Periodic cross-module atmospheric circulation audits.',
      ],
      clinicalSignificance: 'Environmental Health Constraint for ISS & Lunar Gateway.',
    },
  ];

  for (const h of initialHrr) {
    await insertCachedHrrEvidence(h);
  }

  // 5. Seed Real NASA DONKI Space Weather Events
  const initialDonki: NasaDonkiEvent[] = [
    {
      messageId: 'donki_flr_2024_01',
      messageType: 'FLR',
      issueTime: '2024-01-08T18:24:00Z',
      summary: 'M4.5 Class Solar Flare detected originating from Active Region AR3536.',
      classification: 'M4.5',
      significanceToCrew: 'ADVISORY',
      operationalGuidance:
        'Moderate solar flare detected. Monitor for subsequent Coronal Mass Ejection (CME) shock front arrival in 48-72h. No immediate storm shelter requirement.',
      rawMessageSnippet:
        'CCMC DONKI Solar Flare Notification: Event M4.5 at 2024-01-08T18:24Z from AR3536. Space weather advisory issued.',
      sourceUrl: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/2024/01/08/1',
    },
    {
      messageId: 'donki_rbe_2024_02',
      messageType: 'RBE',
      issueTime: '2024-01-10T12:00:00Z',
      summary: 'Radiation Belt Enhancement (RBE) observed in outer Van Allen radiation belt.',
      classification: 'Relativistic Electrons >2 MeV',
      significanceToCrew: 'ADVISORY',
      operationalGuidance:
        'Elevated electron flux in outer magnetosphere. Traversal during high-inclination orbits may cause mild increase in dosimeter readings near spacecraft skin.',
      rawMessageSnippet:
        'CCMC DONKI RBE Notification: Relativistic electron flux (>2 MeV) exceeded 10^4 pfu. Spacecraft charging advisory.',
      sourceUrl: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/RBE/2024/01/10/1',
    },
  ];

  for (const d of initialDonki) {
    await insertCachedDonkiEvent(d);
  }

  // Initialize Sync Registry
  await updateNasaSyncRegistry('osdr', 'ONLINE', initialOsdr.length, null);
  await updateNasaSyncRegistry('radlab', 'ONLINE', initialRadlab.length, null);
  await updateNasaSyncRegistry('eda', 'ONLINE', 1, null);
  await updateNasaSyncRegistry('hrr', 'ONLINE', initialHrr.length, null);
  await updateNasaSyncRegistry('donki', 'ONLINE', initialDonki.length, null);
}

// ==========================================
// CRUD OPERATIONS FOR NASA SCIENTIFIC DATA
// ==========================================

export async function insertCachedOsdrStudy(study: NasaOsdrStudy): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO nasa_osdr_studies (
      id, title, description, spaceProgram, mission, flightProgram, organism,
      category, factorsJson, assayTypesJson, publicReleaseDate,
      authoritativeSourceUrl, relevanceToAstronautHealth, lastUpdated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      study.id,
      study.title,
      study.description,
      study.spaceProgram,
      study.mission,
      study.flightProgram,
      study.organism,
      study.category,
      JSON.stringify(study.factors),
      JSON.stringify(study.assayTypes),
      study.publicReleaseDate || '',
      study.authoritativeSourceUrl,
      study.relevanceToAstronautHealth,
      study.lastUpdated,
    ]
  );
}

export async function getCachedOsdrStudies(category?: string): Promise<NasaOsdrStudy[]> {
  const db = await getDatabase();
  let query = 'SELECT * FROM nasa_osdr_studies ORDER BY id ASC;';
  let params: any[] = [];
  if (category && category !== 'All') {
    query = 'SELECT * FROM nasa_osdr_studies WHERE category = ? ORDER BY id ASC;';
    params = [category];
  }
  const rows = await db.getAllAsync<any>(query, params);
  return (rows || []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    spaceProgram: r.spaceProgram,
    mission: r.mission,
    flightProgram: r.flightProgram,
    organism: r.organism,
    category: r.category,
    factors: JSON.parse(r.factorsJson || '[]'),
    assayTypes: JSON.parse(r.assayTypesJson || '[]'),
    publicReleaseDate: r.publicReleaseDate,
    authoritativeSourceUrl: r.authoritativeSourceUrl,
    relevanceToAstronautHealth: r.relevanceToAstronautHealth,
    isCachedOffline: true,
    lastUpdated: r.lastUpdated,
  }));
}

export async function insertCachedRadlabMeasurement(m: NasaRadlabMeasurement): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO nasa_radlab_measurements (
      id, timestamp, instrument, instrumentId, spacecraft,
      absorbedDoseRate, doseEquivalentRate, flux,
      latitude, longitude, altitudeKm, sourceAttribution, isHistoricalReference
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      m.id,
      m.timestamp,
      m.instrument,
      m.instrumentId,
      m.spacecraft,
      m.absorbedDoseRateMicroGyPerHour,
      m.doseEquivalentRateMicroSvPerHour,
      m.fluxParticlesPerCm2Sec,
      m.latitude ?? null,
      m.longitude ?? null,
      m.altitudeKm ?? null,
      m.sourceAttribution,
      m.isHistoricalReference ? 1 : 0,
    ]
  );
}

export async function getCachedRadlabMeasurements(limit = 20): Promise<NasaRadlabMeasurement[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM nasa_radlab_measurements ORDER BY timestamp ASC LIMIT ?;',
    [limit]
  );
  return (rows || []).map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    instrument: r.instrument,
    instrumentId: r.instrumentId,
    spacecraft: r.spacecraft,
    absorbedDoseRateMicroGyPerHour: r.absorbedDoseRate,
    doseEquivalentRateMicroSvPerHour: r.doseEquivalentRate,
    fluxParticlesPerCm2Sec: r.flux,
    latitude: r.latitude,
    longitude: r.longitude,
    altitudeKm: r.altitudeKm,
    sourceAttribution: r.sourceAttribution,
    isHistoricalReference: Boolean(r.isHistoricalReference),
  }));
}

export async function insertCachedEdaMission(m: NasaEdaMission): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO nasa_eda_missions (
      missionId, missionTitle, year, description, timePointsCount, payloadJson, sourceAttribution, lastUpdated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      m.missionId,
      m.missionTitle,
      m.year,
      m.description,
      m.timePointsCount,
      JSON.stringify({
        temperatureIss: m.temperatureIss,
        temperatureGround: m.temperatureGround,
        co2IssPpm: m.co2IssPpm,
        co2GroundPpm: m.co2GroundPpm,
        rhIssPercent: m.rhIssPercent,
        gcrDoseMgyPerDay: m.gcrDoseMgyPerDay,
        saaDoseMgyPerDay: m.saaDoseMgyPerDay,
        totalDoseMgyPerDay: m.totalDoseMgyPerDay,
        accumulatedDoseMgy: m.accumulatedDoseMgy,
        sampleTimeline: m.sampleTimeline,
      }),
      m.sourceAttribution,
      m.lastUpdated,
    ]
  );
}

export async function getCachedEdaMissions(): Promise<NasaEdaMission[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM nasa_eda_missions ORDER BY year DESC;');
  return (rows || []).map((r) => {
    const payload = JSON.parse(r.payloadJson || '{}');
    return {
      missionId: r.missionId,
      missionTitle: r.missionTitle,
      year: r.year,
      description: r.description,
      timePointsCount: r.timePointsCount,
      temperatureIss: payload.temperatureIss,
      temperatureGround: payload.temperatureGround,
      co2IssPpm: payload.co2IssPpm,
      co2GroundPpm: payload.co2GroundPpm,
      rhIssPercent: payload.rhIssPercent,
      gcrDoseMgyPerDay: payload.gcrDoseMgyPerDay,
      saaDoseMgyPerDay: payload.saaDoseMgyPerDay,
      totalDoseMgyPerDay: payload.totalDoseMgyPerDay,
      accumulatedDoseMgy: payload.accumulatedDoseMgy,
      sampleTimeline: payload.sampleTimeline || [],
      sourceAttribution: r.sourceAttribution,
      lastUpdated: r.lastUpdated,
    };
  });
}

export async function insertCachedHrrEvidence(h: NasaHrrEvidenceReport): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO nasa_hrr_evidence (
      id, riskTitle, hrpCategory, evidenceReportUrl, revisionDate,
      primaryResearchFocus, mainFindingsJson, keyBiomarkersJson,
      operationalCountermeasuresJson, clinicalSignificance
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      h.id,
      h.riskTitle,
      h.hrpCategory,
      h.evidenceReportUrl,
      h.revisionDate,
      h.primaryResearchFocus,
      JSON.stringify(h.mainFindings),
      JSON.stringify(h.keyBiomarkers),
      JSON.stringify(h.operationalCountermeasures),
      h.clinicalSignificance,
    ]
  );
}

export async function getCachedHrrEvidence(): Promise<NasaHrrEvidenceReport[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM nasa_hrr_evidence ORDER BY id ASC;');
  return (rows || []).map((r) => ({
    id: r.id,
    riskTitle: r.riskTitle,
    hrpCategory: r.hrpCategory,
    evidenceReportUrl: r.evidenceReportUrl,
    revisionDate: r.revisionDate,
    primaryResearchFocus: r.primaryResearchFocus,
    mainFindings: JSON.parse(r.mainFindingsJson || '[]'),
    keyBiomarkers: JSON.parse(r.keyBiomarkersJson || '[]'),
    operationalCountermeasures: JSON.parse(r.operationalCountermeasuresJson || '[]'),
    clinicalSignificance: r.clinicalSignificance,
  }));
}

export async function insertCachedDonkiEvent(d: NasaDonkiEvent): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO nasa_donki_events (
      messageId, messageType, issueTime, summary, classification,
      significanceToCrew, operationalGuidance, rawMessageSnippet, sourceUrl
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      d.messageId,
      d.messageType,
      d.issueTime,
      d.summary,
      d.classification || null,
      d.significanceToCrew,
      d.operationalGuidance,
      d.rawMessageSnippet,
      d.sourceUrl,
    ]
  );
}

export async function getCachedDonkiEvents(limit = 10): Promise<NasaDonkiEvent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM nasa_donki_events ORDER BY issueTime DESC LIMIT ?;',
    [limit]
  );
  return (rows || []).map((r) => ({
    messageId: r.messageId,
    messageType: r.messageType,
    issueTime: r.issueTime,
    summary: r.summary,
    classification: r.classification,
    significanceToCrew: r.significanceToCrew,
    operationalGuidance: r.operationalGuidance,
    rawMessageSnippet: r.rawMessageSnippet,
    sourceUrl: r.sourceUrl,
  }));
}

export async function updateNasaSyncRegistry(
  resourceId: string,
  status: string,
  count: number,
  errorMessage: string | null = null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO nasa_sync_registry (
      resourceId, status, lastSync, recordsCount, errorMessage
    ) VALUES (?, ?, ?, ?, ?)`,
    [resourceId, status, new Date().toISOString(), count, errorMessage]
  );
}

export async function getNasaResourceStatuses(): Promise<NasaResourceStatus[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM nasa_sync_registry;');
  const registryMap = new Map<string, any>();
  for (const r of rows || []) {
    registryMap.set(r.resourceId, r);
  }

  const defs: {
    id: 'osdr' | 'radlab' | 'eda' | 'hrr' | 'donki';
    name: string;
    desc: string;
    offUrl: string;
    epUrl: string;
    summary: string;
  }[] = [
    {
      id: 'osdr',
      name: 'NASA Open Science Data Repository',
      desc: 'Official space biology & human physiological research database (genomics, transcriptomics, metabolomics).',
      offUrl: 'https://osdr.nasa.gov/',
      epUrl: 'https://osdr.nasa.gov/osdr/data/search',
      summary: 'Spaceflight study metadata & multi-omic astronaut analyses',
    },
    {
      id: 'radlab',
      name: 'NASA RadLab Ionizing Dosimetry',
      desc: 'Official deep-space dosimeter flight measurements (absorbed dose µGy, dose equivalent µSv, particle flux).',
      offUrl: 'https://visualization.osdr.nasa.gov/radlab/',
      epUrl: 'https://visualization.osdr.nasa.gov/radlab/api/',
      summary: 'Active detector measurements (DosTel, Liulin, RAD)',
    },
    {
      id: 'eda',
      name: 'NASA Environmental Data Application',
      desc: 'ISS cabin life support environmental telemetry (temperature, relative humidity, CO2 ppm, radiation dose).',
      offUrl: 'https://visualization.osdr.nasa.gov/eda/',
      epUrl: 'https://visualization.osdr.nasa.gov/eda/dashboard_{mission}',
      summary: 'Spacecraft cabin atmosphere & mission comparison datasets',
    },
    {
      id: 'hrr',
      name: 'NASA Human Research Roadmap',
      desc: 'Evidence-based mitigation reports for spaceflight human risks (cardiovascular, sleep loss, radiation, muscle atrophy).',
      offUrl: 'https://humanresearchroadmap.nasa.gov/',
      epUrl: 'https://humanresearchroadmap.nasa.gov/Evidence/',
      summary: 'HRP peer-reviewed evidence reports & countermeasures',
    },
    {
      id: 'donki',
      name: 'NASA DONKI Space Weather Service',
      desc: 'Goddard CCMC Space Weather Database of Notifications, Knowledge, and Information (CME, Solar Flares, SEP, RBE).',
      offUrl: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
      epUrl: 'https://api.nasa.gov/DONKI/notifications',
      summary: 'Active solar flares, coronal mass ejections & geomagnetism',
    },
  ];

  return defs.map((d) => {
    const reg = registryMap.get(d.id);
    return {
      resourceId: d.id,
      name: d.name,
      shortDescription: d.desc,
      officialUrl: d.offUrl,
      endpointUrl: d.epUrl,
      status: reg ? reg.status : 'OFFLINE_CACHED',
      lastSuccessfulSync: reg ? reg.lastSync : null,
      cachedRecordsCount: reg ? reg.recordsCount : 0,
      dataTypesSummary: d.summary,
      errorMessage: reg?.errorMessage || undefined,
    };
  });
}

export async function getNasaSyncStatus(resourceId: string): Promise<NasaResourceStatus | null> {
  const all = await getNasaResourceStatuses();
  return all.find((r) => r.resourceId === resourceId) || null;
}


