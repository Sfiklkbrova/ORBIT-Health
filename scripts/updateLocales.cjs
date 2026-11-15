const fs = require('fs');
const path = require('path');

const updatesEn = {
  welcome: {
    valueProposition: 'An offline-first AI health companion that lets astronauts on Mars-class missions monitor themselves and make medical decisions when Mission Control is 4-24 minutes away.'
  },
  dashboard: {
    valueProposition: 'An offline-first AI health companion that lets astronauts on Mars-class missions monitor themselves and make medical decisions when Mission Control is 4-24 minutes away.',
    vitalityInfoTitle: 'Estimated Indicator Formula',
    vitalityInfoBody: 'Estimated indicator - not an official NASA metric. Calculated from resting HRV variance, SpO2 perfusion, and sleep architecture.',
    aredNotice: 'NASA-STD-3001: 90-min daily ARED exercise target required to counter microgravity bone mineral loss.',
    careerLimitNotice: 'NASA-STD-3001 career radiation exposure limit: 600 mSv (REID < 3% lifetime risk).'
  },
  comms: {
    linkStatus: 'Mission Control Link',
    connected: 'Connected (Earth AOS)',
    delayed: 'Delayed (4-24 min one-way)',
    blackout: 'Blackout (Solar Conjunction)',
    simulateBlackout: 'Simulate Comms Blackout',
    crewAutonomyMode: 'Crew Autonomy Mode Active',
    crewAutonomyDesc: 'Direct radio link severed. Local offline AI decision support & emergency checklists active.',
    outboxTitle: 'Flight Surgeon Uplink Outbox',
    outboxEmpty: 'No pending messages in queue. Telemetry will sync when link recovers.',
    sendToFlightSurgeon: 'Queue Message for Flight Surgeon',
    lightDelayTitle: 'One-Way Light Propagation Latency',
    lightDelayValue: '18m 42s',
    lightDelayDetail: 'Current Mars-Earth Distance: 2.24 AU (336,000,000 km). Radio packets travel at c (300,000 km/s). Real-time dialogue is physically impossible.'
  },
  beyondSpace: {
    title: 'Beyond Space: Earth Impact',
    subtitle: 'Extending deep-space offline medical autonomy to extreme environments and underserved populations on Earth.',
    tagline: 'NASA Technology Benefiting Humanity',
    polar: 'Polar Research Stations',
    polarDesc: 'Antarctic and Arctic winter-over expeditions isolated from telemedicine for 6+ months during severe polar blizzards.',
    remote: 'Remote & Indigenous Clinics',
    remoteDesc: 'Autonomous triage guidance for community health workers in off-grid rural regions lacking cellular and fiber infrastructure.',
    maritime: 'Deep-Sea Maritime & Submarines',
    maritimeDesc: 'Mission-critical clinical decision support for maritime and submarine crews operating under strict electronic emissions silence.',
    rescue: 'Disaster Relief & Mountain Search & Rescue',
    rescueDesc: 'Rapid deployment triage tools when hurricanes, earthquakes, or avalanches destroy terrestrial power and telecom networks.',
    elderly: 'Off-Grid Elder Remote Care',
    elderlyDesc: 'Early physiological decompensation detection for homebound seniors living in disconnected rural and mountainous areas.'
  },
  aiSafety: {
    disclaimer: 'Decision support only - not a medical diagnosis. Contact Mission Control when possible.',
    insufficientData: 'I do not have sufficient clinical data or NASA reference literature in the local database to answer this question reliably.',
    emergencyDetected: 'EMERGENCY PROTOCOL TRIGGERED',
    emergencyDisclaimer: 'Immediate critical protocol initiated. Follow steps below while queuing flight surgeon telemetry.'
  }
};

const updatesAz = {
  welcome: {
    valueProposition: 'Mars tipli missiyalarda astronavtlara Uçuş İdarəetmə Mərkəzi 4-24 dəqiqə uzaqda olduqda özlərini izləməyə və tibbi qərarlar qəbul etməyə imkan verən oflayn süni intellekt sağlamlıq yoldaşı.'
  },
  dashboard: {
    valueProposition: 'Mars tipli missiyalarda astronavtlara Uçuş İdarəetmə Mərkəzi 4-24 dəqiqə uzaqda olduqda özlərini izləməyə və tibbi qərarlar qəbul etməyə imkan verən oflayn süni intellekt sağlamlıq yoldaşı.',
    vitalityInfoTitle: 'Təxmini Göstərici Formulu',
    vitalityInfoBody: 'Təxmini göstərici - rəsmi NASA metriki deyil. Sakitlik HRV dəyişkənliyi, SpO2 perfuziyası və yuxu arxitekturasından hesablanır.',
    aredNotice: 'NASA-STD-3001: Mikromaqnitizmdə sümük itkisinin qarşısını almaq üçün gündəlik 90 dəqiqə ARED məşqi tələb olunur.',
    careerLimitNotice: 'NASA-STD-3001 karyera radiasiya limiti: 600 mSv (Ömürlük REID < 3% risk).'
  },
  comms: {
    linkStatus: 'Uçuş İdarəetmə Əlaqəsi',
    connected: 'Qoşuldu (Yer AOS)',
    delayed: 'Gecikmə ilə (4-24 dəqiqə)',
    blackout: 'Əlaqə Kəsilib (Günəş Tutulması)',
    simulateBlackout: 'Əlaqənin Kəsilməsini Simulyasiya Et',
    crewAutonomyMode: 'Heyət Muxtariyyəti Rejimi Aktivdir',
    crewAutonomyDesc: 'Birbaşa radio əlaqəsi kəsildi. Yerli oflayn süni intellekt qərar dəstəyi və təcili protokollar aktivdir.',
    outboxTitle: 'Uçuş Həkiminə Göndəriləcək Növbə',
    outboxEmpty: 'Növbədə gözləyən mesaj yoxdur. Əlaqə bərpa olunduqda telemetriya avtomatik sinxronlaşacaq.',
    sendToFlightSurgeon: 'Uçuş Həkiminə Mesaj Növbəsinə Əlavə Et',
    lightDelayTitle: 'İşığın Biristiqamətli Yayılma Gecikməsi',
    lightDelayValue: '18d 42s',
    lightDelayDetail: 'Hazırkı Mars-Yer məsafəsi: 2.24 AU (336,000,000 km). Radio siqnalları işıq sürəti ilə hərəkət edir. Canlı səsli dialoq fiziki olaraq qeyri-mümkündür.'
  },
  beyondSpace: {
    title: 'Kosmosdan Kənarda: Yerdəki Təsiri',
    subtitle: 'Dərin kosmos oflayn tibbi muxtariyyətini Yerdəki çətin mühitlərə və ucqar bölgələrə daşımaq.',
    tagline: 'Bəşəriyyətə Xidmət Edən NASA Texnologiyası',
    polar: 'Qütb Tədqiqat Stansiyaları',
    polarDesc: 'Şiddətli qütb çovğunlarında 6+ ay teletibb əlaqəsi kəsilən Antarktika və Arktika qışlama heyətləri üçün oflayn diaqnostika.',
    remote: 'Ucqar və Kənd Tibb Məntəqələri',
    remoteDesc: 'Mobil rabitə və fiber-optik olmayan bölgələrdə icma tibb işçilərinə oflayn süni intellekt rəhbərliyi.',
    maritime: 'Dərin Dəniz və Sualtı Qayıqlar',
    maritimeDesc: 'Elektron susqunluq rejimində çalışan sualtı qayıq heyətləri üçün muxtar klinik dəstək.',
    rescue: 'Fəlakət Bölgələri və Dağ Xilasetmə',
    rescueDesc: 'Zəlzələ və ya qar uçqunu rabitə qüllələrini dağıtdıqda operativ çeşidləmə və ilkin tibbi yardım.',
    elderly: 'Şəbəkədən Kənar Ahıllara Qayğı',
    elderlyDesc: 'İnternetsiz ucqar kəndlərdə yaşayan tənha yaşlıların fizioloji vəziyyətinin erkən xəbərdarlıq sistemi.'
  },
  aiSafety: {
    disclaimer: 'Yalnız qərar dəstəyi üçündür - tibbi diaqnoz deyil. Mümkün olduqda Uçuş Həkimi ilə əlaqə saxlayın.',
    insufficientData: 'Bu sualı etibarlı cavablandırmaq üçün yerli bazada kifayət qədər klinik telemetriya və ya rəsmi NASA ədəbiyyatı mövcud deyil.',
    emergencyDetected: 'TƏCİLİ PROTOKOL İŞƏ DÜŞDÜ',
    emergencyDisclaimer: 'Dərhal təcili protokol başladı. Həkimə mesaj növbəyə alınarkən aşağıdakı addımları yerinə yetirin.'
  }
};

const updatesTr = {
  welcome: {
    valueProposition: 'Mars sınıfı görevlerde Yer Kontrol Merkezi 4-24 dakika uzaktayken astronotların kendilerini izlemelerini ve tıbbi kararlar almalarını sağlayan çevrimdışı öncelikli yapay zeka sağlık yardımcısı.'
  },
  dashboard: {
    valueProposition: 'Mars sınıfı görevlerde Yer Kontrol Merkezi 4-24 dakika uzaktayken astronotların kendilerini izlemelerini ve tıbbi kararlar almalarını sağlayan çevrimdışı öncelikli yapay zeka sağlık yardımcısı.',
    vitalityInfoTitle: 'Tahmini Gösterge Formülü',
    vitalityInfoBody: 'Tahmini gösterge - resmi NASA metriği değildir. Dinlenme HRV değişkenliği, SpO2 perfüzyonu ve uyku mimarisinden hesaplanır.',
    aredNotice: 'NASA-STD-3001: Mikroyerçekiminde kemik mineral kaybını önlemek için günlük 90 dakika ARED egzersizi zorunludur.',
    careerLimitNotice: 'NASA-STD-3001 kariyer radyasyon maruziyet limiti: 600 mSv (Yaşam boyu REID < %3 risk).'
  },
  comms: {
    linkStatus: 'Görev Kontrol Bağlantısı',
    connected: 'Bağlı (Dünya AOS)',
    delayed: 'Gecikmeli (4-24 dk tek yön)',
    blackout: 'Kesinti (Güneş Kavuşumu)',
    simulateBlackout: 'İletişim Kesintisini Simüle Et',
    crewAutonomyMode: 'Mürettebat Özerklik Modu Aktif',
    crewAutonomyDesc: 'Doğrudan radyo bağlantısı koptu. Yerel çevrimdışı yapay zeka karar desteği ve acil durum kontrol listeleri devrede.',
    outboxTitle: 'Uçuş Cerrahı İletişim Kuyruğu',
    outboxEmpty: 'Kuyrukta bekleyen mesaj yok. Bağlantı sağlandığında telemetri otomatik senkronize edilecek.',
    sendToFlightSurgeon: 'Uçuş Cerrahı İçin Mesaj Kuyruğuna Ekle',
    lightDelayTitle: 'Işığın Tek Yönlü Yayılma Gecikmesi',
    lightDelayValue: '18dk 42sn',
    lightDelayDetail: 'Mevcut Mars-Dünya Mesafesi: 2.24 AU (336.000.000 km). Radyo paketleri ışık hızında iletilir. Gerçek zamanlı sesli diyalog fiziksel olarak imkansızdır.'
  },
  beyondSpace: {
    title: 'Uzayın Ötesinde: Dünya Etkisi',
    subtitle: 'Derin uzay çevrimdışı tıbbi özerkliğini Dünyadaki zorlu ortamlara ve erişimi kısıtlı bölgelere taşımak.',
    tagline: 'İnsanlığa Hizmet Eden NASA Teknolojisi',
    polar: 'Kutup Araştırma İstasyonları',
    polarDesc: 'Şiddetli kutup fırtınalarında 6+ ay tele-tıp erişimi kesilen Antarktika ve Arktik kışlama ekipleri için bağımsız tanı sistemi.',
    remote: 'Uzak ve Kırsal Sağlık Ocakları',
    remoteDesc: 'Hücresel veya fiber ağların bulunmadığı kırsal bölgelerde görev yapan toplum sağlığı çalışanlarına çevrimdışı yapay zeka desteği.',
    maritime: 'Derin Deniz ve Denizaltılar',
    maritimeDesc: 'Elektronik sessizlik protokolü altında operasyon yürüten denizaltı mürettebatı için bağımsız klinik rehberlik.',
    rescue: 'Afet Yardımı ve Dağ Arama Kurtarma',
    rescueDesc: 'Deprem veya çığ felaketlerinde kara şebekeleri çöktüğünde sahada kesintisiz triyaj ve ilk yardım desteği.',
    elderly: 'Şebekeden Uzak Yaşlı Bakımı',
    elderlyDesc: 'İnternetsiz uzak dağ köylerinde yaşayan yalnız yaşlıların fizyolojik takibi ve erken dekompansasyon uyarısı.'
  },
  aiSafety: {
    disclaimer: 'Yalnızca karar desteği içindir - tıbbi teşhis değildir. Mümkün olduğunda Görev Kontrol ile iletişime geçin.',
    insufficientData: 'Bu soruyu güvenilir bir şekilde yanıtlamak için yerel veri tabanında yeterli klinik telemetri veya NASA referansı bulunmamaktadır.',
    emergencyDetected: 'ACİL DURUM PROTOKOLÜ DEVREYE GİRDİ',
    emergencyDisclaimer: 'Acil klinik durum algılandı. Uçuş cerrahına telemetri kuyruğa alınırken aşağıdaki adımları derhal uygulayın.'
  }
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const map = [
  ['en', updatesEn],
  ['az', updatesAz],
  ['tr', updatesTr]
];

for (const [lang, updates] of map) {
  const filePath = path.join(__dirname, '..', 'src', 'i18n', 'locales', `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  deepMerge(data, updates);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Successfully merged updates into ${lang}.json`);
}
