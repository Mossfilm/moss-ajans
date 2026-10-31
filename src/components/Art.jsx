// Moss görsel dili: ChatGPT tasarımındaki fotoğraf dokularının SVG çizgi karşılıkları.
// Hepsi tek renk (currentColor), dekoratif (aria-hidden).

const S = (props) => <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props} />;

export const Camera = (p) => (
  <S {...p}>
    <rect x="14" y="44" width="62" height="40" rx="6" />
    <path d="M76 56l26-12v40L76 72" />
    <circle cx="32" cy="32" r="12" /><circle cx="58" cy="32" r="12" />
    <circle cx="32" cy="32" r="4" /><circle cx="58" cy="32" r="4" />
    <path d="M24 64h20M45 84l-8 22M45 84l8 22M45 84v22" />
  </S>
);
export const Reel = (p) => (
  <S {...p}>
    <circle cx="60" cy="60" r="44" /><circle cx="60" cy="60" r="8" />
    <circle cx="60" cy="32" r="10" /><circle cx="60" cy="88" r="10" /><circle cx="32" cy="60" r="10" /><circle cx="88" cy="60" r="10" />
    <path d="M100 86c8 6 12 14 14 24" />
  </S>
);
export const Strip = (p) => (
  <S {...p}>
    <path d="M6 90L104 22M18 106L116 38" />
    {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={20 + i * 15} y={78 - i * 10.4} width="7" height="5" rx="1" transform={`rotate(-34 ${23 + i * 15} ${80 - i * 10.4})`} />)}
    {[0, 1, 2, 3, 4].map((i) => <path key={'f' + i} d={`M${30 + i * 16} ${86 - i * 11}l10 14`} />)}
  </S>
);
export const Clapper = (p) => (
  <S {...p}>
    <rect x="18" y="52" width="84" height="52" rx="5" />
    <path d="M18 52l80-22 4 14-80 22z" />
    <path d="M36 47l10 12M56 41l10 12M76 36l10 12" />
    <path d="M30 72h40M30 86h26" />
  </S>
);
export const Spotlight = (p) => (
  <S {...p}>
    <path d="M70 40l26-14 12 24-26 14z" />
    <ellipse cx="74" cy="52" rx="8" ry="13" transform="rotate(-28 74 52)" />
    <path d="M90 58l6 18M96 76l-10 34M96 76l10 34M96 76v34" />
    <path d="M100 32l10-6M104 44l12 0" />
  </S>
);
export const Leaves = (p) => (
  <svg viewBox="0 0 160 200" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M20 200C40 150 60 110 100 70" stroke="currentColor" strokeWidth="3" fill="none" />
    <path d="M58 132c-26 0-40-14-44-34 22-2 40 8 44 34zM74 108c-6-24 2-42 20-52 8 20 2 40-20 52zM46 160c-22 6-38-2-48-18 20-8 38-4 48 18zM90 84c-22-8-30-26-28-46 20 4 32 22 28 46zM104 66c8-22 26-32 46-30-4 20-22 32-46 30z" />
  </svg>
);
export const Mic = (p) => (
  <S {...p}><rect x="46" y="16" width="28" height="52" rx="14" /><path d="M32 56c0 16 12 28 28 28s28-12 28-28M60 84v22M44 106h32" /></S>
);
export const Phone = (p) => (
  <S {...p}><rect x="36" y="10" width="48" height="100" rx="10" /><path d="M54 98h12" /><path d="M48 42l24 14-24 14z" /></S>
);
export const Pen = (p) => (
  <S {...p}><path d="M24 96l8-28 52-52 20 20-52 52z" /><path d="M76 24l20 20M24 96l28-8" /><circle cx="88" cy="96" r="12" /></S>
);
export const Megaphone = (p) => (
  <S {...p}><path d="M20 52v18l12 2 52 24V26L32 50z" /><path d="M32 72l6 26h12l-4-24M94 46c6 4 6 26 0 30" /></S>
);
export const Chart = (p) => (
  <S {...p}><path d="M14 102h92" /><path d="M20 84l24-22 18 12 30-34 12 8" /><rect x="22" y="88" width="10" height="14" /><rect x="46" y="80" width="10" height="22" /><rect x="70" y="70" width="10" height="32" /></S>
);
export const People = (p) => (
  <S {...p}><circle cx="40" cy="40" r="14" /><circle cx="82" cy="44" r="12" /><path d="M14 98c2-22 12-34 26-34s24 12 26 34M66 98c2-18 8-28 18-28s18 10 20 28" /></S>
);

export const GradCap = (p) => (
  <S {...p}><path d="M8 46l52-22 52 22-52 22z" /><path d="M30 56v22c0 8 14 14 30 14s30-6 30-14V56" /><path d="M104 50v26" /><circle cx="104" cy="80" r="4" /><path d="M20 104h44l6-10H26z" /></S>
);
export const Balloons = (p) => (
  <S {...p}><ellipse cx="44" cy="40" rx="18" ry="22" /><ellipse cx="78" cy="34" rx="16" ry="20" /><path d="M44 62c-2 12 6 22 0 46M78 54c4 14-4 26 2 54M40 62h8M74 54h8" /><path d="M96 86l4 8 8 1-6 6 2 8-8-4-8 4 2-8-6-6 8-1z" /></S>
);
export const Note = (p) => (
  <S {...p}><path d="M48 88V30l52-12v58" /><circle cx="36" cy="88" r="12" /><circle cx="88" cy="76" r="12" /><path d="M48 44l52-12" /></S>
);
export const Car = (p) => (
  <S {...p}><path d="M14 78l8-24c2-6 6-10 14-10h40c8 0 12 4 16 10l14 24v14H14z" /><path d="M30 54h60M14 78h92" /><circle cx="36" cy="92" r="10" /><circle cx="86" cy="92" r="10" /><path d="M100 30l10-6M104 42l12-2" /></S>
);
export const Dish = (p) => (
  <S {...p}><path d="M60 14v66M44 20l16 10 16-10M42 36l18 10 18-10M42 52l18 10 18-10" /><path d="M16 86h88c-4 14-22 22-44 22S20 100 16 86z" /><path d="M96 20v40" /></S>
);
export const Moon = (p) => (
  <S {...p}><path d="M74 18a40 40 0 1 0 28 66A34 34 0 0 1 74 18z" /><path d="M96 24l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" /></S>
);
export const Bell = (p) => (
  <S {...p}><path d="M60 14v10M34 84V60a26 26 0 0 1 52 0v24l10 10H24z" /><path d="M50 98a10 10 0 0 0 20 0" /><path d="M96 36c6 6 8 14 8 22M24 36c-6 6-8 14-8 22" /></S>
);
export const SECTOR_ART = { 'Eğitim': GradCap, 'Çocuk': Balloons, 'Sanat': Note, 'Otomotiv': Car, 'Yeme-içme': Dish, 'Astroloji': Moon, 'Diğer': Clapper };

// İş türüne göre filigran
export const TYPE_ART = {
  cekim: Camera, gonderi: Phone, reels: Strip, hikaye: Phone, kurgu: Reel,
  tasarim: Pen, reklam: Megaphone, toplanti: People, rapor: Chart, diger: Clapper
};

// Ekran başı: sıcak ışık, yaprak gölgesi ve spot ışık
export const CalPage = (p) => (
  <S {...p}><rect x="22" y="26" width="76" height="76" rx="10" /><path d="M22 48h76M42 16v18M78 16v18" /><text x="60" y="88" textAnchor="middle" fontSize="34" fontWeight="700" fill="currentColor" stroke="none" fontFamily="Manrope, sans-serif">31</text></S>
);
const HERO_ART = { bell: Bell, spot: Spotlight, cal: CalPage, camera: Camera, reel: Reel, clapper: Clapper, chart: Chart };
export function Hero({ tall = false, art = 'spot', color, Art }) {
  const A = Art || HERO_ART[art] || Spotlight;
  return (
    <div className={'hero' + (tall ? ' tall' : '')} aria-hidden="true" style={color ? { '--hero': color } : undefined}>
      <span className="beam" />
      <Leaves className="leaves" />
      <A className={'spot art-' + art} />
    </div>
  );
}
