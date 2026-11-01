// Sabit veriler: iş türleri, üretim aşamaları, ilk firmalar, özel günler, tarih yardımcıları.

export const TYPES = {
  cekim: { label: 'Çekim', bg: '#E8E6F6', fg: '#51448F', dot: '#6E5FC0' },
  gonderi: { label: 'Gönderi', bg: '#E5EFF8', fg: '#28577D', dot: '#3D7BB0' },
  reels: { label: 'Reels', bg: '#F7E6EE', fg: '#8B325B', dot: '#B94C7E' },
  hikaye: { label: 'Hikâye', bg: '#F8EBCF', fg: '#76531B', dot: '#B8862E' },
  kurgu: { label: 'Kurgu', bg: '#E4ECF0', fg: '#345967', dot: '#4F8296' },
  tasarim: { label: 'Tasarım', bg: '#EFE6F5', fg: '#714184', dot: '#9A5DB3' },
  reklam: { label: 'Reklam', bg: '#F7E6DA', fg: '#85451E', dot: '#B9652F' },
  toplanti: { label: 'Toplantı', bg: '#E2EFEA', fg: '#276451', dot: '#3A8A71' },
  rapor: { label: 'Rapor', bg: '#E9EAE4', fg: '#4C5840', dot: '#76825F' },
  diger: { label: 'Diğer', bg: '#ECECEB', fg: '#555A55', dot: '#858A85' }
};
export const TYPE_ORDER = ['cekim', 'gonderi', 'reels', 'hikaye', 'kurgu', 'tasarim', 'reklam', 'toplanti', 'rapor', 'diger'];

export const STAGES = [
  { label: 'Fikir', short: 'Fikir', next: 'Senaryoya geçir' },
  { label: 'Senaryo / Metin', short: 'Senaryo', next: 'Çekime geçir' },
  { label: 'Çekim', short: 'Çekim', next: 'Kurguya geçir' },
  { label: 'Kurgu / Tasarım', short: 'Kurgu', next: 'Müşteriye onaya gönder' },
  { label: 'Müşteri onayı', short: 'Onay', next: 'Onaylandı, yayına hazır' },
  { label: 'Yayına hazır', short: 'Yayın', next: '' }
];

export const SECTORS = ['Eğitim', 'Çocuk', 'Sanat', 'Otomotiv', 'Yeme-içme', 'Astroloji', 'Diğer'];

// İlk açılışta veritabanı boşsa yüklenen firmalar.
export const SEED_FIRMS = [
  { id: 'mutlu-cocuklar', name: 'Mutlu Çocuklar Akademisi', sector: 'Çocuk', logo: '/logos/mutlu-cocuklar.png', active: true, instagram: 'https://www.instagram.com/mutlu_cocuklarakademi/' },
  { id: 'bogazici-vip', name: 'Boğaziçi VIP', sector: 'Eğitim', logo: '/logos/bogazici-vip.png', active: true, brand: 'Boğaziçi', instagram: 'https://www.instagram.com/gaziantepbogazicikoleji/' },
  { id: 'bogazici-pancarli', name: 'Boğaziçi Pancarlı', sector: 'Eğitim', logo: '/logos/bogazici-vip.png', active: true, brand: 'Boğaziçi', instagram: 'https://www.instagram.com/pancarlibogazicivip/' },
  { id: 'bogazici-junior', name: 'Boğaziçi Junior', sector: 'Eğitim', logo: '/logos/bogazici-junior.png', active: true, brand: 'Boğaziçi', instagram: 'https://www.instagram.com/bogazicijunior/' },
  { id: 'net-vip-akademi', name: 'Net VIP Akademi', sector: 'Eğitim', logo: '/logos/net-vip-akademi.png', active: true, instagram: 'https://www.instagram.com/karatasnetvip/' },
  { id: 'son-ders', name: 'Son Ders', sector: 'Eğitim', logo: '/logos/son-ders.png', active: true, instagram: 'https://www.instagram.com/sondersegitimkurumlari/' },
  { id: 'ekici-sanat', name: 'Ekici Sanat', sector: 'Sanat', logo: '/logos/ekici-sanat.png', active: true, instagram: 'https://www.instagram.com/ekicisanat/' },
  { id: 'dsg-otomotiv', name: 'DSG Otomotiv', sector: 'Otomotiv', logo: '/logos/dsg-otomotiv.png', active: true, instagram: 'https://www.instagram.com/dsgotomotivcom/' },
  { id: 'agustos-doner', name: 'Ağustos Döner', sector: 'Yeme-içme', logo: '/logos/agustos-doner.png', active: true, instagram: 'https://www.instagram.com/agustosdoner/' },
  { id: 'kristal-kedi', name: 'Kristal Kedi', sector: 'Astroloji', logo: '/logos/kristal-kedi.png', active: false }
];

// ---- Tarih yardımcıları (yerel saat, "YYYY-MM-DD") ----
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const todayYmd = () => ymd(new Date());
export const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export const MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export function dayLabel(s) {
  const d = parseYmd(s);
  const t = todayYmd();
  const base = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + DAYS[d.getDay()];
  if (s === t) return 'Bugün · ' + base;
  if (s === ymd(addDays(new Date(), 1))) return 'Yarın · ' + base;
  if (s === ymd(addDays(new Date(), -1))) return 'Dün · ' + base;
  return base;
}
export function shortDate(s) {
  if (!s) return '';
  const d = parseYmd(s);
  return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()];
}
export function timeAgo(ms) {
  if (!ms) return '';
  const diff = (Date.now() - ms) / 1000;
  if (diff < 60) return 'şimdi';
  if (diff < 3600) return Math.floor(diff / 60) + ' dk önce';
  if (diff < 86400) return Math.floor(diff / 3600) + ' sa önce';
  const d = new Date(ms);
  return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()];
}

// ---- Özel günler (sabit tarihliler + hesaplananlar) ----
function nthSunday(year, month, n) {
  const d = new Date(year, month, 1);
  const first = (7 - d.getDay()) % 7; // ilk pazar
  return new Date(year, month, 1 + first + (n - 1) * 7);
}
// Ayın n. haftanın günü (wd: 0 pazar … 6 cumartesi)
function nthWeekday(year, month, wd, n) {
  const d = new Date(year, month, 1);
  return new Date(year, month, 1 + ((wd - d.getDay() + 7) % 7) + (n - 1) * 7);
}
function lastWeekday(year, month, wd) {
  const d = new Date(year, month + 1, 0);
  return new Date(year, month, d.getDate() - ((d.getDay() - wd + 7) % 7));
}

// who: hangi firmalar için ("Tüm firmalar" ya da sektörler: Eğitim, Çocuk, Sanat, Otomotiv, Yeme-içme)
// kind: resmi | dini | anma | sinav | okul | dunya | sezon | yerel   ·   major: 3 hafta önceden hatırlatılır
// idea: içerik fikri (asistan ve ekip için)
const T = 'Tüm firmalar';
const FIXED = [
  // Resmi ve millî günler
  [0, 1, 'Yılbaşı', T, 'resmi', 1, 'Yeni yıl kutlaması; firmanın yılın özeti ya da yeni yıl hedefi.'],
  [2, 12, 'İstiklal Marşı’nın Kabulü ve Mehmet Akif Ersoy’u Anma Günü', 'Eğitim, Çocuk, Sanat', 'anma', 0, 'Ağırbaşlı tasarım; marşın kabul tarihi (12 Mart 1921) ve Mehmet Akif.'],
  [2, 18, 'Çanakkale Zaferi ve Şehitleri Anma Günü', T, 'anma', 1, 'Anma şablonu; 18 Mart 1915. Kutlama dili kullanma.'],
  [3, 23, 'Ulusal Egemenlik ve Çocuk Bayramı', 'Eğitim, Çocuk, Sanat', 'resmi', 1, 'Çocukların gösterileri, 23 Nisan etkinliği çekimi.'],
  [4, 19, 'Atatürk’ü Anma, Gençlik ve Spor Bayramı', T, 'resmi', 1, 'Gençlik ve spor teması; öğrenci etkinlikleri.'],
  [4, 29, 'İstanbul’un Fethi', 'Eğitim', 'anma', 0, '1453 Fethi; tarih bilgisi kartı.'],
  [6, 15, 'Demokrasi ve Millî Birlik Günü', T, 'anma', 1, 'Anma şablonu, ağırbaşlı dil.'],
  [7, 30, 'Zafer Bayramı', T, 'resmi', 1, '30 Ağustos 1922 Büyük Taarruz ve zafer.'],
  [9, 29, 'Cumhuriyet Bayramı', T, 'resmi', 1, 'Cumhuriyet coşkusu; DSG için 1961 Devrim otomobilleri hatırlatması da yapılabilir.'],
  [10, 1, 'Harf İnkılabı’nın Yıl Dönümü', 'Eğitim, Çocuk', 'resmi', 1, '1 Kasım 1928’de yeni Türk harflerinin kabulü; “harflerle tanışma” konsepti, eski ve yeni yazı karşılaştırması.'],
  [10, 10, 'Atatürk’ü Anma Günü', T, 'anma', 1, 'Siyah-beyaz anma şablonu; saat 09.05. Kutlama dili kullanma.'],
  [11, 25, 'Gaziantep’in Kurtuluşu', T, 'yerel', 1, '25 Aralık 1921; Gaziantep’e özel gurur postu, yerel bağ.'],
  [11, 31, 'Yılbaşı gecesi', T, 'resmi', 0, 'Yeni yıl mesajı ve kampanya.'],
  // Eğitim ve çocuk
  [0, 24, 'Dünya Eğitim Günü', 'Eğitim', 'dunya', 0, 'Kurumun eğitim anlayışı; öğretmenlerden kısa mesajlar.'],
  [1, 21, 'Dünya Anadili Günü', 'Eğitim, Çocuk', 'dunya', 0, 'Türkçeyi güzel kullanma; deyimler, kelime oyunları.'],
  [2, 14, 'Pi Günü (Dünya Matematik Günü)', 'Eğitim', 'dunya', 0, '3,14; matematik bilmecesi, öğrencilerle eğlenceli reels.'],
  [2, 21, 'Dünya Şiir Günü', 'Eğitim, Sanat', 'dunya', 0, 'Öğrencilerin okuduğu şiir; şiir dinletisi.'],
  [2, 21, 'Dünya Down Sendromu Farkındalık Günü', 'Eğitim, Çocuk', 'dunya', 0, 'Farkındalık postu; renkli çorap teması.'],
  [3, 2, 'Dünya Çocuk Kitapları Günü', 'Eğitim, Çocuk', 'dunya', 0, 'Kitap önerileri; okuma köşesi çekimi.'],
  [3, 2, 'Dünya Otizm Farkındalık Günü', 'Eğitim, Çocuk', 'dunya', 0, 'Mavi temalı farkındalık postu.'],
  [3, 23, 'Dünya Kitap Günü', 'Eğitim', 'dunya', 0, 'Öğretmenlerin kitap önerileri.'],
  [5, 1, 'Uluslararası Çocuk Günü', 'Çocuk, Eğitim', 'dunya', 0, 'Çocukların gülen yüzleri; oyun ve etkinlik çekimi.'],
  [5, 11, 'Uluslararası Oyun Günü', 'Çocuk', 'dunya', 0, 'Oyunla öğrenme; bahçe/oyun alanı reels’i.'],
  [7, 12, 'Uluslararası Gençlik Günü', 'Eğitim', 'dunya', 0, 'Gençlere motivasyon; mezun başarı hikâyeleri.'],
  [8, 8, 'Dünya Okuma Yazma Günü', 'Eğitim, Çocuk', 'dunya', 0, 'Okuma alışkanlığı; harf/kelime etkinliği.'],
  [9, 5, 'Dünya Öğretmenler Günü', 'Eğitim, Çocuk, Sanat', 'dunya', 0, 'Öğretmen kadrosunu tanıtma.'],
  [9, 15, 'Dünya El Yıkama Günü', 'Çocuk', 'dunya', 0, 'Çocuklarla el yıkama eğitimi; eğlenceli kısa video.'],
  [10, 20, 'Dünya Çocuk Hakları Günü', 'Eğitim, Çocuk', 'dunya', 0, 'Çocuk hakları; çocukların çizimleriyle tasarım.'],
  [10, 24, 'Öğretmenler Günü', 'Eğitim, Çocuk, Sanat', 'resmi', 1, 'Öğretmenlere teşekkür; öğrencilerden mesaj videosu.'],
  [11, 3, 'Dünya Engelliler Günü', 'Eğitim, Çocuk', 'dunya', 0, 'Kapsayıcılık ve farkındalık.'],
  [11, 5, 'Türk Kadınına Seçme ve Seçilme Hakkı Verilişi', 'Eğitim', 'anma', 0, '5 Aralık 1934; tarih bilgisi kartı.'],
  // Sanat ve müzik
  [2, 27, 'Dünya Tiyatro Günü', 'Sanat, Eğitim', 'dunya', 0, 'Drama/tiyatro çalışmalarından kare.'],
  [3, 15, 'Dünya Sanat Günü', 'Sanat, Çocuk', 'dunya', 0, 'Öğrenci eserleri sergisi; atölye çekimi.'],
  [3, 16, 'Dünya Ses Günü', 'Sanat', 'dunya', 0, 'Şan/ses eğitimi; doğru nefes ipuçları.'],
  [3, 29, 'Dünya Dans Günü', 'Sanat, Çocuk', 'dunya', 0, 'Dans/ritim çalışmasından reels.'],
  [3, 30, 'Uluslararası Caz Günü', 'Sanat', 'dunya', 0, 'Caz parçası çalan öğrenci videosu.'],
  [5, 21, 'Dünya Müzik Günü', 'Sanat, Çocuk', 'dunya', 1, 'Öğrenci konseri, enstrüman tanıtımı, kısa performanslar.'],
  [9, 1, 'Uluslararası Müzik Günü', 'Sanat', 'dunya', 0, 'Hocaların performansı; enstrüman seçme rehberi.'],
  // Otomotiv
  [0, 29, 'Otomobilin Doğum Günü (Benz patenti, 1886)', 'Otomotiv', 'dunya', 0, 'Otomobil tarihinden ilginç bilgi; ilk otomobil vs bugünkü şanzıman teknolojisi.'],
  [2, 4, 'Dünya Mühendislik Günü', 'Otomotiv', 'dunya', 0, 'Servisteki teknik ekip; DSG/şanzıman mühendisliği anlatımı.'],
  [2, 15, 'Yaz bakımı sezonu', 'Otomotiv', 'sezon', 0, 'Kış lastiği bitişi öncesi bakım kampanyası; klima ve şanzıman kontrolü.'],
  [3, 15, 'Zorunlu kış lastiği dönemi bitiyor', 'Otomotiv', 'sezon', 0, 'Yaz lastiğine geçiş ve bahar bakımı hatırlatması.'],
  [9, 15, 'Kış bakımı sezonu', 'Otomotiv', 'sezon', 0, 'Kışa hazırlık kontrol listesi; antifriz, akü, şanzıman yağı.'],
  [10, 15, 'Zorunlu kış lastiği dönemi başlıyor', 'Otomotiv', 'sezon', 1, '15 Kasım–15 Nisan, şehirlerarası ticari araçlar için; kış bakımı kampanyası.'],
  // Yeme-içme
  [9, 16, 'Dünya Gıda Günü', 'Yeme-içme', 'dunya', 0, 'Hijyen ve taze malzeme; mutfak kamera arkası.'],
  [4, 21, 'Türk Mutfağı Haftası (21–27 Mayıs)', 'Yeme-içme', 'dunya', 1, 'Antep mutfağı ve döner geleneği; ustanın hikâyesi, yöresel lezzet reels’i.'],
  [5, 18, 'Sürdürülebilir Gastronomi Günü', 'Yeme-içme', 'dunya', 0, 'Yerel üretici ve taze malzeme; israf etmeyen mutfak.'],
  [11, 5, 'Dünya Türk Kahvesi Günü', 'Yeme-içme', 'dunya', 0, 'Yemek sonrası Türk kahvesi ikramı; köpüklü kahve yakın çekimi.'],
  [11, 11, 'Gaziantep UNESCO Gastronomi Şehri yıl dönümü', 'Yeme-içme', 'yerel', 0, 'Gaziantep 2015’te UNESCO gastronomi şehri seçildi; Antep lezzeti gururu.'],
  [1, 14, 'Sevgililer Günü', 'Yeme-içme, Sanat', 'dunya', 0, 'İkili menü kampanyası.'],
  [2, 22, 'Dünya Su Günü', 'Çocuk, Eğitim', 'dunya', 0, 'Su tasarrufu farkındalığı.'],
  [11, 12, 'Tutum, Yatırım ve Türk Malları Haftası (12–18 Aralık)', 'Eğitim, Çocuk, Yeme-içme', 'okul', 0, 'Yerli malı teması; okullarda yerli malı etkinliği, dönerde yerel ürünler ve Antep lezzetleri.']
];

// Yıla göre değişen kesin tarihler (dini bayramlar, sınavlar, MEB takvimi)
const EXACT = {
  2026: [
    ['2026-11-16', 'Birinci dönem ara tatili başlıyor (16–20 Kasım)', 'Eğitim, Çocuk', 'okul', 0, 'Ara tatil etkinlik/kamp duyurusu; tatilde tekrar programı.'],
    ['2026-11-15', 'Dünya Trafik Kazası Kurbanlarını Anma Günü', 'Otomotiv', 'anma', 0, 'Güvenli sürüş ve araç bakımı farkındalığı; ağırbaşlı dil.']
  ],
  2027: [
    ['2027-01-22', 'Karne günü ve yarıyıl tatili', 'Eğitim, Çocuk', 'okul', 1, 'Karne tebriği; yarıyıl kampı / tekrar kursu duyurusu.'],
    ['2027-02-08', 'İkinci dönem başlıyor', 'Eğitim, Çocuk', 'okul', 0, 'Yeni döneme hoş geldin; kayıt ve program duyurusu.'],
    ['2027-02-08', 'Ramazan ayı başlıyor', T, 'dini', 1, 'Hayırlı Ramazanlar; Ağustos Döner için iftar menüsü.'],
    ['2027-03-08', 'İkinci dönem ara tatili (8–12 Mart)', 'Eğitim, Çocuk', 'okul', 0, 'Ara tatil programı.'],
    ['2027-03-09', 'Ramazan Bayramı', T, 'dini', 1, 'Bayram tebriği (9–11 Mart; arefe 8 Mart).'],
    ['2027-03-20', 'MSÜ sınavı', 'Eğitim', 'sinav', 1, 'Adaylara başarı mesajı; sınav günü ipuçları.'],
    ['2027-04-15', 'MSÜ sonuçları', 'Eğitim', 'sinav', 1, 'Başarılı öğrencileri tebrik postu ([İSİM], [SONUÇ] yer tutucularıyla).'],
    ['2027-04-18', 'ALES', 'Eğitim', 'sinav', 0, 'Adaylara başarı mesajı.'],
    ['2027-05-16', 'Kurban Bayramı', T, 'dini', 1, 'Bayram tebriği (16–19 Mayıs; arefe 15 Mayıs).'],
    ['2027-06-19', 'YKS (TYT 19 Haziran, AYT/YDT 20 Haziran)', 'Eğitim', 'sinav', 1, 'Sınav öncesi motivasyon, sınav günü hatırlatmaları.'],
    ['2027-07-09', 'Dünya Kebap Günü', 'Yeme-içme', 'dunya', 1, 'Döner/kebap kampanyası; ustanın döner kesimi reels’i.'],
    ['2027-07-18', 'DGS', 'Eğitim', 'sinav', 0, 'Adaylara başarı mesajı.'],
    ['2027-07-21', 'YKS sonuçları', 'Eğitim', 'sinav', 1, 'Derece yapan öğrencileri tebrik postu.'],
    ['2027-09-12', 'KPSS (genel yetenek/genel kültür)', 'Eğitim', 'sinav', 0, 'Adaylara başarı mesajı.'],
    ['2027-11-21', 'Dünya Trafik Kazası Kurbanlarını Anma Günü', 'Otomotiv', 'anma', 0, 'Güvenli sürüş farkındalığı.']
  ]
};

export function specialDays(year) {
  const mk = (date, name, who, kind, major, idea) => ({ date, name, who, kind, major: Boolean(major), idea });
  const list = FIXED.map(([m, d, name, who, kind, major, idea]) => mk(ymd(new Date(year, m, d)), name, who, kind, major, idea));
  list.push(mk(ymd(nthSunday(year, 4, 2)), 'Anneler Günü', T, 'dunya', 1, 'Annelere özel kampanya ya da duygusal kısa video.'));
  list.push(mk(ymd(nthSunday(year, 5, 3)), 'Babalar Günü', T, 'dunya', 1, 'Babalara özel; DSG için “babana bakım hediyesi” fikri.'));
  list.push(mk(ymd(nthWeekday(year, 2, 1, 1)), 'Bilim ve Teknoloji Haftası', 'Eğitim, Çocuk', 'okul', 0, 'Deney videosu; bilim köşesi.'));
  list.push(mk(ymd(lastWeekday(year, 2, 1)), 'Kütüphane Haftası', 'Eğitim, Çocuk', 'okul', 0, 'Okuma etkinliği, kitap önerileri.'));
  list.push(mk(ymd(nthWeekday(year, 4, 1, 1)), 'Trafik ve İlk Yardım Haftası', 'Otomotiv, Çocuk', 'dunya', 0, 'Güvenli sürüş ve araç kontrolü ipuçları.'));
  list.push(mk(ymd(nthWeekday(year, 9, 5, 1)), 'Dünya Gülümseme Günü', 'Çocuk, Yeme-içme', 'dunya', 0, 'Gülümseyen müşteri/öğrenci kareleri.'));
  list.push(mk(ymd(new Date(year, 0, 88)), 'Dünya Piyano Günü', 'Sanat', 'dunya', 0, 'Yılın 88. günü; piyano öğrencisi performansı.'));
  (EXACT[year] || []).forEach(([date, name, who, kind, major, idea]) => list.push(mk(date, name, who, kind, major, idea)));
  return list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// Bu özel gün bu firmayı ilgilendiriyor mu?
export function appliesTo(s, firm) {
  if (!firm) return false;
  const who = s.who || '';
  if (who.includes(T)) return true;
  return who.split(',').map((x) => x.trim()).includes(firm.sector);
}
export function firmsFor(s, firms) {
  return (firms || []).filter((f) => f.active !== false && appliesTo(s, f));
}
export function upcomingSpecialDays(days = 45) {
  const t = new Date();
  const from = todayYmd();
  const to = ymd(addDays(t, days));
  return specialDays(t.getFullYear()).concat(specialDays(t.getFullYear() + 1))
    .filter((s) => s.date >= from && s.date <= to)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
