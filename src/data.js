// Sabit veriler: iş türleri, üretim aşamaları, ilk firmalar, özel günler, tarih yardımcıları.

export const TYPES = {
  cekim: { label: 'Çekim', bg: '#F6E3CF', fg: '#7A3E0C', dot: '#C46A1C' },
  gonderi: { label: 'Gönderi', bg: '#DCE7F3', fg: '#1F4770', dot: '#2F6DB0' },
  reels: { label: 'Reels', bg: '#DCE7F3', fg: '#1F4770', dot: '#2F6DB0' },
  hikaye: { label: 'Hikâye', bg: '#DCE7F3', fg: '#1F4770', dot: '#2F6DB0' },
  kurgu: { label: 'Kurgu', bg: '#ECE2F2', fg: '#5A2F73', dot: '#7D4A9C' },
  tasarim: { label: 'Tasarım', bg: '#ECE2F2', fg: '#5A2F73', dot: '#7D4A9C' },
  reklam: { label: 'Reklam', bg: '#F5DEDB', fg: '#8A2A1E', dot: '#B4471F' },
  toplanti: { label: 'Toplantı', bg: '#E3EADB', fg: '#2F4A2C', dot: '#2F4A2C' },
  rapor: { label: 'Rapor', bg: '#E6E4DB', fg: '#3A423C', dot: '#7C857E' },
  diger: { label: 'Diğer', bg: '#E6E4DB', fg: '#3A423C', dot: '#7C857E' }
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
  { id: 'mutlu-cocuklar', name: 'Mutlu Çocuklar Akademisi', sector: 'Çocuk', logo: '/logos/mutlu-cocuklar.png', active: true },
  { id: 'bogazici-vip', name: 'Boğaziçi VIP', sector: 'Eğitim', logo: '/logos/bogazici-vip.png', active: true, brand: 'Boğaziçi' },
  { id: 'bogazici-pancarli', name: 'Boğaziçi Pancarlı', sector: 'Eğitim', logo: '/logos/bogazici-vip.png', active: true, brand: 'Boğaziçi' },
  { id: 'bogazici-junior', name: 'Boğaziçi Junior', sector: 'Eğitim', logo: '/logos/bogazici-junior.png', active: true, brand: 'Boğaziçi' },
  { id: 'net-vip-akademi', name: 'Net VIP Akademi', sector: 'Eğitim', logo: '/logos/net-vip-akademi.png', active: true },
  { id: 'son-ders', name: 'Son Ders', sector: 'Eğitim', logo: '/logos/son-ders.png', active: true },
  { id: 'ekici-sanat', name: 'Ekici Sanat', sector: 'Sanat', logo: '/logos/ekici-sanat.png', active: true },
  { id: 'dsg-otomotiv', name: 'DSG Otomotiv', sector: 'Otomotiv', logo: '/logos/dsg-otomotiv.png', active: true },
  { id: 'agustos-doner', name: 'Ağustos Döner', sector: 'Yeme-içme', logo: '/logos/agustos-doner.png', active: true },
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
export function specialDays(year) {
  const fixed = [
    [0, 1, 'Yılbaşı', 'Tüm firmalar'],
    [1, 14, 'Sevgililer Günü', 'Yeme-içme, Sanat'],
    [2, 8, 'Dünya Kadınlar Günü', 'Tüm firmalar'],
    [2, 14, 'Tıp Bayramı', ''],
    [3, 23, 'Ulusal Egemenlik ve Çocuk Bayramı', 'Eğitim, Çocuk'],
    [4, 19, 'Atatürk’ü Anma, Gençlik ve Spor Bayramı', 'Tüm firmalar'],
    [6, 15, 'Demokrasi ve Milli Birlik Günü', 'Tüm firmalar'],
    [7, 30, 'Zafer Bayramı', 'Tüm firmalar'],
    [9, 29, 'Cumhuriyet Bayramı', 'Tüm firmalar'],
    [10, 10, 'Atatürk’ü Anma Günü', 'Tüm firmalar'],
    [10, 20, 'Dünya Çocuk Hakları Günü', 'Eğitim, Çocuk'],
    [10, 24, 'Öğretmenler Günü', 'Eğitim, Çocuk, Sanat'],
    [11, 31, 'Yılbaşı gecesi', 'Tüm firmalar']
  ].map(([m, d, name, who]) => ({ date: ymd(new Date(year, m, d)), name, who }));
  fixed.push({ date: ymd(nthSunday(year, 4, 2)), name: 'Anneler Günü', who: 'Tüm firmalar' });
  fixed.push({ date: ymd(nthSunday(year, 5, 3)), name: 'Babalar Günü', who: 'Tüm firmalar' });
  return fixed;
}
export function upcomingSpecialDays(days = 45) {
  const t = new Date();
  const from = todayYmd();
  const to = ymd(addDays(t, days));
  return specialDays(t.getFullYear()).concat(specialDays(t.getFullYear() + 1))
    .filter((s) => s.date >= from && s.date <= to)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
