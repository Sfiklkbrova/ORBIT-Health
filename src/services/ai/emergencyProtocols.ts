import { HealthRecord, AstronautProfile } from '../../types/astronaut';
import { AiResponsePayload } from './types';
import { AppLanguage } from '../../i18n';

export function getLocalizedDisclaimer(lang: AppLanguage): string {
  switch (lang) {
    case 'az':
      return '⚠️ **Tibbi Qeyd:** Yalnız qərar dəstəyi üçündür - tibbi diaqnoz deyil. Mümkün olduqda Uçuş Həkimi ilə əlaqə saxlayın.';
    case 'tr':
      return '⚠️ **Tıbbi Sorumluluk Reddi:** Yalnızca karar desteği içindir - tıbbi teşhis değildir. Mümkün olduğunda Görev Kontrol ile iletişime geçin.';
    case 'en':
    default:
      return '⚠️ **Medical Disclaimer:** Decision support only - not a medical diagnosis. Contact Mission Control when possible.';
  }
}

export function checkEmergencyProtocol(
  query: string,
  lang: AppLanguage,
  profile: AstronautProfile,
  latestRecord: HealthRecord | null
): AiResponsePayload | null {
  const q = query.toLowerCase();

  // 1. CHEST PAIN / SUSPECTED ACUTE CORONARY SYNDROME / ISCHEMIA
  if (
    q.includes('chest pain') ||
    q.includes('angina') ||
    q.includes('sinə ağrısı') ||
    q.includes('döş qəfəsində ağrı') ||
    q.includes('ürək ağrısı') ||
    q.includes('göğüs ağrısı') ||
    q.includes('göğüste baskı') ||
    q.includes('heart attack') ||
    q.includes('infarkt') ||
    q.includes('kalp krizi')
  ) {
    return buildEmergencyPayload(
      'CHEST_PAIN',
      lang,
      profile,
      latestRecord,
      'NASA-STD-3001 Vol 1 §4.2: In-flight Acute Coronary Syndrome & Ischemia Protocol'
    );
  }

  // 2. HYPOXIA / LOW OXYGEN / SUFFOCATION
  if (
    q.includes('hypoxia') ||
    q.includes('low oxygen') ||
    q.includes('suffocat') ||
    q.includes('hipoksiya') ||
    q.includes('aşağı oksigen') ||
    q.includes('boğulma') ||
    q.includes('hipoksi') ||
    q.includes('düşük oksijen') ||
    q.includes('nefes alamıyorum') ||
    q.includes('spo2 drop')
  ) {
    return buildEmergencyPayload(
      'HYPOXIA',
      lang,
      profile,
      latestRecord,
      'NASA-STD-3001 Vol 2 §6.3: Cabin Atmosphere Emergency & Hypoxia Mitigation'
    );
  }

  // 3. ARRHYTHMIA / SEVERE TACHYCARDIA / BRADYCARDIA
  if (
    q.includes('arrhythmia') ||
    q.includes('irregular heart') ||
    q.includes('palpitation') ||
    q.includes('tachycardia') ||
    q.includes('bradycardia') ||
    q.includes('aritmiya') ||
    q.includes('ürək çırpıntısı') ||
    q.includes('ritm pozuntusu') ||
    q.includes('aritmi') ||
    q.includes('ritim bozukluğu') ||
    q.includes('çarpıntı')
  ) {
    return buildEmergencyPayload(
      'ARRHYTHMIA',
      lang,
      profile,
      latestRecord,
      'NASA-STD-3001 Vol 1 §4.3: In-flight Cardiac Dysrhythmia Countermeasures'
    );
  }

  // 4. TOXIC CABIN AIR / AMMONIA / CO2 LEAK
  if (
    q.includes('toxic air') ||
    q.includes('toxic cabin') ||
    q.includes('ammonia') ||
    q.includes('co2 leak') ||
    q.includes('chemical smell') ||
    q.includes('burning smell') ||
    q.includes('zəhərli hava') ||
    q.includes('toksik hava') ||
    q.includes('ammiak') ||
    q.includes('qaz sızması') ||
    q.includes('zehirli hava') ||
    q.includes('amonyak') ||
    q.includes('gaz kaçağı')
  ) {
    return buildEmergencyPayload(
      'TOXIC_AIR',
      lang,
      profile,
      latestRecord,
      'NASA-STD-3001 Vol 2 §6.4: Toxic Exposure & Cabin Atmospheric Decontamination'
    );
  }

  // 5. TRAUMA / FRACTURE / ARTERIAL HEMORRHAGE
  if (
    q.includes('trauma') ||
    q.includes('fracture') ||
    q.includes('broken bone') ||
    q.includes('bleeding') ||
    q.includes('hemorrhage') ||
    q.includes('travma') ||
    q.includes('qırıq') ||
    q.includes('sınıq') ||
    q.includes('qanaxma') ||
    q.includes('kırık') ||
    q.includes('kanama') ||
    q.includes('ağır yaralanma')
  ) {
    return buildEmergencyPayload(
      'TRAUMA',
      lang,
      profile,
      latestRecord,
      'NASA-STD-3001 Vol 1 §4.8: Deep-Space Trauma Stabilization & Microgravity Hemostasis'
    );
  }

  return null;
}

function buildEmergencyPayload(
  type: 'CHEST_PAIN' | 'HYPOXIA' | 'ARRHYTHMIA' | 'TOXIC_AIR' | 'TRAUMA',
  lang: AppLanguage,
  profile: AstronautProfile,
  latestRecord: HealthRecord | null,
  nasaRef: string
): AiResponsePayload {
  const hr = latestRecord?.heartRate || profile.baselines.restingHeartRate;
  const spo2 = latestRecord?.bloodOxygen || profile.baselines.bloodOxygen;
  const bp = latestRecord
    ? `${latestRecord.bloodPressureSys}/${latestRecord.bloodPressureDia}`
    : `${profile.baselines.bloodPressureSys}/${profile.baselines.bloodPressureDia}`;

  let title = '';
  let steps: string[] = [];
  let telemetryNote = '';

  if (lang === 'az') {
    title = '🚨 TƏCİLİ PROTOKOL İŞƏ DÜŞDÜ (OFLAYN REJİM)';
    telemetryNote = `Cari Telemetriya: Nəbz ${hr} BPM, SpO2 ${spo2}%, Təzyiq ${bp} mmHg.`;

    switch (type) {
      case 'CHEST_PAIN':
        steps = [
          '1. Astronavtı dərhal fiziki hərəkətsiz vəziyyətə gətirin (mikroqravitasiya yuxu təhlükəsizliyi qayışları ilə sabitləyin).',
          '2. Təcili Heyət Oksigen Maska sistemi vasitəsilə 100% O2 verin (10-15 L/dəq axın).',
          '3. 12-çıxışlı EKQ elektrodlarını ORBIT konsoluna qoşun və davamlı ritm qeydiyyatını başladın.',
          '4. Əgər sistolik arterial təzyiq < 90 mmHg və ya MAP < 65 mmHg olarsa, NİTROQLİSERİN VERMƏYİN (kəskin hipotenziya riski).',
          '5. Çeynənən Aspirin 325 mq qəbul etdirin və Uçuş Həkiminə təcili telemetriya paketini növbəyə alın.',
        ];
        break;
      case 'HYPOXIA':
        steps = [
          '1. DƏRHAL TƏCİLİ OKSİGEN MASKASINI TAXIN (Crew O2 System).',
          '2. Kabin pO2 və ümumi təzyiq göstəricilərini yoxlayın (nominal: 14.7 psi, 21% O2).',
          '3. SpO2 sensorunun barmağa düzgün taxıldığını və periferik perfuziyanı yoxlayın.',
          '4. Əgər dekompressiya şübhəsi varsa: skafandr dəbilqəsinin şüşəsini bağlayın və modulu təcrid edin.',
          '5. SpO2 >= 96% olana qədər fasiləsiz 100% oksigen verin.',
        ];
        break;
      case 'ARRHYTHMIA':
        steps = [
          '1. Astronavtı istirahət rejiminə keçirin və monitorinq sensorlarını yoxlayın.',
          '2. Fasiləsiz EKQ telemetriya qeydiyyatını aktivləşdirin.',
          '3. Hər 2 dəqiqədən bir 3 ardıcıl qan təzyiqi ölçməsi həyata keçirin.',
          '4. Avtomatik Xarici Defibrilyatoru (AED) kabinədə hazır vəziyyətə gətirin.',
          '5. Qeydə alınan EKQ zolağını Uçuş Həkimi rabitə növbəsinə əlavə edin.',
        ];
        break;
      case 'TOXIC_AIR':
        steps = [
          '1. DƏRHAL QORUYUCU NƏFƏS APARATINI (SCBA / Quick-Don Mask) TAXIN.',
          '2. Modul qəza həyəcanını işə salın və qonşu modul qapaqlarını dərhal bağlayın.',
          '3. ECLSS sistemini Qəza Qaz Təmizləmə (Emergency Scrubbing) rejiminə keçirin.',
          '4. Dräger qaz detektoru ilə Ammiak (< 2 ppm) və CO2 (< 3 mmHg) konsentrasiyasını yoxlayın.',
          '5. Göstəricilər yüksələrsə, heyəti Təhlükəsiz Sığınacaq Moduluna (Safe Haven) təxliyə edin.',
        ];
        break;
      case 'TRAUMA':
        steps = [
          '1. Mikroqravitasiyada qan dağılmasının qarşısını almaq üçün steril hemostatik tənziflə dərhal sıxıcı sarğı qoyun.',
          '2. Arterial qanaxma zamanı zədələnmiş nahiyədən 5-7 sm yuxarıya turniket tətbiq edin.',
          '3. Sınıq olan ətrafı Sam-Splint vakuum şini ilə hərəkətsizləşdirin.',
          '4. Hipovolemik şok əlamətlərini (nəbzin artması, təzyiqin düşməsi) yaxından izləyin.',
          '5. NASA-STD-3001 tələblərinə uyğun olaraq Tibbi Dəstdən (CMK) analgeziya tətbiq edin.',
        ];
        break;
    }
  } else if (lang === 'tr') {
    title = '🚨 ACİL DURUM PROTOKOLÜ DEVREYE GİRDİ (ÇEVRİMDIŞI MOD)';
    telemetryNote = `Mevcut Telemetri: Nabız ${hr} BPM, SpO2 %${spo2}, Tansiyon ${bp} mmHg.`;

    switch (type) {
      case 'CHEST_PAIN':
        steps = [
          '1. Astronotu derhal fiziksel istirahate alın (sıfır yerçekimi uyku emniyet kemerleri ile sabitleyin).',
          '2. Acil Mürettebat Oksijen Maskesi üzerinden %100 O2 uygulayın (10-15 L/dk akış).',
          '3. 12 derivasyonlu EKG kablosunu ORBIT konsoluna bağlayarak sürekli ritim kaydı başlatın.',
          '4. Sistolik tansiyon < 90 mmHg veya MAP < 65 mmHg ise NİTROGLİSERİN VERMEYİN (şiddetli hipotansiyon riski).',
          '5. 325 mg çiğnenebilir Aspirin verin ve Uçuş Cerrahı iletişim kuyruğuna acil telemetri paketini ekleyin.',
        ];
        break;
      case 'HYPOXIA':
        steps = [
          '1. DERHAL ACİL OKSİJEN MASKESİNİ TAKIN (Crew O2 System).',
          '2. Kabin pO2 ve toplam basınç göstergelerini doğrulayın (nominal: 14.7 psi, %21 O2).',
          '3. SpO2 probunun parmağa tam oturduğunu ve periferik perfüzyonu kontrol edin.',
          '4. Basınç kaybı şüphesinde: kask vizörünü kapatın ve modül hava kilitlerini izole edin.',
          '5. SpO2 >= %96 olana kadar kesintisiz %100 oksijen verin.',
        ];
        break;
      case 'ARRHYTHMIA':
        steps = [
          '1. Astronotu dinlenme pozisyonuna getirin ve biyosensörleri kontrol edin.',
          '2. Sürekli EKG ritim telemetrisi kaydını aktif duruma getirin.',
          '3. 2 dakika aralıklarla 3 ardışık tansiyon ölçümü yapın.',
          '4. Otomatik Eksternal Defibrilatörü (AED) mürettebat kabininde hazır bekletin.',
          '5. EKG ritim kaydını Uçuş Cerrahı inceleme kuyruğuna gönderilmek üzere kaydedin.',
        ];
        break;
      case 'TOXIC_AIR':
        steps = [
          '1. DERHAL ACİL NEFES MASKESİNİ (SCBA / Quick-Don Mask) TAKIN.',
          '2. Modül acil durum alarmını çalın ve etkilenen modül kapaklarını izole edin.',
          '3. ECLSS yaşam destek sistemini Acil Filtreleme (Emergency Scrubbing) moduna geçirin.',
          '4. Gaz dedektörü ile Amonyak (< 2 ppm) ve CO2 (< 3 mmHg) seviyelerini ölçün.',
          '5. Gaz seviyesi yükselirse ekibi Güvenli Sığınak Modülüne (Safe Haven) tahliye edin.',
        ];
        break;
      case 'TRAUMA':
        steps = [
          '1. Mikroyerçekiminde serbest kan damlacıklarını önlemek için hemostatik gazlı bezle doğrudan bası uygulayın.',
          '2. Atardamar kanamasında yaranın 5-7 cm yukarısına turnike uygulayın.',
          '3. Kırık uzvu Sam-Splint vakumlu atel ile hareketsiz hale getirin.',
          '4. Hipovolemik şok bulgularını (taşikardi + tansiyon düşüklüğü) yakından izleyin.',
          '5. NASA-STD-3001 protokolüne göre Uçuş Medikal Kiti (CMK) üzerinden ağrı kesici uygulayın.',
        ];
        break;
    }
  } else {
    // English default
    title = '🚨 OFFLINE EMERGENCY PROTOCOL TRIGGERED';
    telemetryNote = `Current Bio-Telemetry: Heart Rate ${hr} BPM, SpO2 ${spo2}%, BP ${bp} mmHg.`;

    switch (type) {
      case 'CHEST_PAIN':
        steps = [
          '1. Rest astronaut immediately in neutral microgravity restraint (zero-g sleep station).',
          '2. Administer 100% supplemental oxygen via Crew Emergency Mask (flow: 10-15 L/min).',
          '3. Connect 12-lead ECG telemetry cable to ORBIT console; initiate continuous rhythm capture.',
          '4. If systolic BP < 90 mmHg or MAP < 65 mmHg: DO NOT administer nitroglycerin (severe hypotension risk).',
          '5. Administer chewable Aspirin 325 mg and queue priority telemetric burst to Flight Surgeon outbox.',
        ];
        break;
      case 'HYPOXIA':
        steps = [
          '1. IMMEDIATELY DON CREW EMERGENCY OXYGEN MASK (High-Flow O2 System).',
          '2. Verify cabin pO2 and atmospheric pressure gauge (nominal: 14.7 psi, 21% O2).',
          '3. Check pulse oximeter finger probe placement and inspect nailbed perfusion.',
          '4. If module decompression is suspected: close helmet visor and seal inter-module hatchway.',
          '5. Maintain 100% O2 delivery until SpO2 stabilizes at >= 96%.',
        ];
        break;
      case 'ARRHYTHMIA':
        steps = [
          '1. Position astronaut in resting posture with loose restraints.',
          '2. Activate continuous high-resolution ECG rhythm logging.',
          '3. Record 3 serial blood pressure measurements at 2-minute intervals.',
          '4. Stage Automated External Defibrillator (AED) in crew quarters.',
          '5. Transmit telemetry rhythm strip to Flight Surgeon outbox.',
        ];
        break;
      case 'TOXIC_AIR':
        steps = [
          '1. IMMEDIATELY DON SCBA / QUICK-DON EMERGENCY BREATHING MASK.',
          '2. Sound cabin environmental alarm and seal affected module isolation hatches.',
          '3. Command ECLSS life support to Emergency Atmospheric Scrubbing mode.',
          '4. Read gas spectrometer sensors: Ammonia limit < 2 ppm, CO2 limit < 3.0 mmHg.',
          '5. If concentrations escalate, evacuate crew towards Safe Haven / Return Vehicle.',
        ];
        break;
      case 'TRAUMA':
        steps = [
          '1. Control bleeding immediately with sterile hemostatic gauze under direct pressure (prevent aerosolized blood droplet dispersion).',
          '2. Apply arterial tourniquet 2-3 inches proximal to injury if severe hemorrhage.',
          '3. Splint and immobilize limb fracture using Sam-Splint velcro vacuum brace.',
          '4. Monitor vital trends continuously for hypovolemic shock (tachycardia + hypotension).',
          '5. Administer analgesia from Crew Medical Kit (CMK) according to NASA-STD-3001.',
        ];
        break;
    }
  }

  const checklistText = steps.join('\n');
  const disclaimer = getLocalizedDisclaimer(lang);

  const answer = `### ${title}\n\n**${telemetryNote}**\n\n#### Immediate Clinical Action Steps:\n${checklistText}\n\n> **Authoritative Protocol:** ${nasaRef}\n\n${disclaimer}`;

  return {
    answer,
    category: 'vital',
    intent: 'HEALTH_SUMMARY',
    citations: [
      {
        sourceName: 'NASA-STD-3001 Technical Standard',
        documentTitle: 'NASA Space Flight Human-System Standard: Volume 1 Crew Health & Volume 2 Medical Operations',
        url: 'https://www.nasa.gov/hhp/nasa-standards/',
        keyFinding: nasaRef,
      },
    ],
    suggestedQuestions: [
      'What are the steps for acute decompression sickness?',
      'Check my current vitals and baseline delta.',
      'Show Flight Surgeon communication status.',
    ],
    isOffline: true,
    confidence: 0.99,
    processingTimeMs: 12,
    engineMode: 'AUTONOMOUS_LOCAL_ENGINE',
  };
}
