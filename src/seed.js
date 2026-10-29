import { ymd, addDays } from './data.js';

// Prototipteki örnek işler (bugüne göre tarihlenir). "sample: true" ile kaydedilir, tek dokunuşla silinir.
export function sampleTasks() {
  const d = (n) => ymd(addDays(new Date(), n));
  const shoot = ['Kamera ve yedek bataryalar', 'Yaka mikrofonu', 'Işık seti', 'Çekim izinleri', 'Dikey + yatay format planı']
    .map((label, i) => ({ id: 'c' + i, label, done: i === 0 || i === 2 }));
  return [
    { firmId: 'bogazici-pancarli', title: 'Hafta sonu etüt hikâyesi', type: 'hikaye', date: d(0), time: '09:30', stage: 5, done: true, assignees: [], approval: false, commentCount: 0, revisions: 0 },
    { firmId: 'bogazici-vip', title: 'Tanıtım videosu çekimi', type: 'cekim', date: d(0), time: '10:00', stage: 2, done: false, assignees: [], approval: true, commentCount: 0, revisions: 0, location: 'Şube', deliver: d(4), checklist: shoot, note: 'Çekim listesi: dış mekân, sınıf içi görüntüler, kısa röportaj. Dikey ve yatay iki format alınacak.' },
    { firmId: 'ekici-sanat', title: 'Öğrenci konseri kurgusu', type: 'kurgu', date: d(0), time: '14:00', stage: 3, done: false, assignees: [], approval: true, commentCount: 0, revisions: 0 },
    { firmId: 'agustos-doner', title: 'Akşam servisi reels paylaşımı', type: 'reels', date: d(0), time: '18:00', stage: 5, done: false, assignees: [], approval: false, commentCount: 0, revisions: 0 },
    { firmId: 'dsg-otomotiv', title: 'Kış bakımı kampanya gönderisi', type: 'gonderi', date: d(1), time: '12:00', stage: 4, done: false, assignees: [], approval: true, commentCount: 0, revisions: 1 },
    { firmId: 'net-vip-akademi', title: 'Kasım içerik planı toplantısı', type: 'toplanti', date: d(1), time: '16:00', stage: null, done: false, assignees: ['all'], approval: false, commentCount: 0, revisions: 0 },
    { firmId: 'mutlu-cocuklar', title: 'Etkinlik günü çekimi', type: 'cekim', date: d(2), time: '11:00', stage: 2, done: false, assignees: [], approval: true, commentCount: 0, revisions: 0, checklist: shoot.map((c) => ({ ...c, done: false })) },
    { firmId: 'bogazici-junior', title: 'Kayıt dönemi afişi', type: 'tasarim', date: d(3), time: '13:00', stage: 4, done: false, assignees: [], approval: true, commentCount: 0, revisions: 0 },
    { firmId: 'son-ders', title: 'LGS deneme sınavı duyurusu', type: 'gonderi', date: d(4), time: '15:00', stage: 1, done: false, assignees: [], approval: true, commentCount: 0, revisions: 0 },
    { firmId: 'bogazici-vip', title: 'Tanıtım videosu teslimi', type: 'kurgu', date: d(4), time: '10:00', stage: 3, done: false, assignees: [], approval: true, commentCount: 0, revisions: 0 },
    { firmId: 'agustos-doner', title: 'Menü reels, 2. versiyon', type: 'reels', date: d(1), time: '19:00', stage: 4, done: false, assignees: [], approval: true, commentCount: 0, revisions: 2 },
    { firmId: 'agustos-doner', title: 'Yeni menü ürün çekimi', type: 'cekim', date: d(5), time: '15:00', stage: 2, done: false, assignees: [], approval: true, commentCount: 0, revisions: 0 },
    { firmId: 'mutlu-cocuklar', title: 'Dünya Çocuk Hakları Günü videosu', type: 'reels', date: '2026-11-20', time: '10:00', stage: 0, done: false, assignees: [], approval: true, commentCount: 0, revisions: 0 },
    { firmId: 'bogazici-vip', title: 'Öğretmenler Günü röportaj serisi', type: 'reels', date: '2026-11-24', time: '09:00', stage: 0, done: false, assignees: [], approval: true, commentCount: 0, revisions: 0 },
    { firmId: 'dsg-otomotiv', title: 'Ekim ayı performans raporu', type: 'rapor', date: d(6), time: '11:00', stage: null, done: false, assignees: [], approval: false, commentCount: 0, revisions: 0 }
  ];
}

const ACTIVE = ['mutlu-cocuklar', 'bogazici-vip', 'bogazici-pancarli', 'bogazici-junior', 'net-vip-akademi', 'son-ders', 'ekici-sanat', 'dsg-otomotiv', 'agustos-doner'];

// 10 Kasım için tüm aktif firmalara anma postu
export function anmaPosts() {
  return ACTIVE.map((firmId) => ({
    firmId,
    kind: 'post',
    title: '10 Kasım Atatürk’ü Anma Günü',
    date: '2026-11-10',
    time: '09:05',
    status: 'taslak',
    source: 'asistan',
    spec: {
      template: 'anma',
      format: 'kare',
      eyebrow: '10 Kasım 1938',
      headline: 'Saygı ve\nözlemle\nanıyoruz.',
      sub: 'Ebediyete intikalinin 88. yılında',
      foot: 'Mustafa Kemal Atatürk'
    },
    caption: 'Ebediyete intikalinin 88. yılında Gazi Mustafa Kemal Atatürk’ü ve tüm silah arkadaşlarını saygı, sevgi ve özlemle anıyoruz.',
    tags: '#10Kasım #Atatürk #SaygıylaAnıyoruz'
  }));
}
