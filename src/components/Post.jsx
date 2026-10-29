import { useEffect, useRef, useState } from 'react';

// Firma marka renkleri (logolardan alındı). Firma kaydında brand alanı varsa o kullanılır.
export const BRAND = {
  'agustos-doner': { bg: '#2A0F0C', fg: '#FFF4E6', accent: '#E8A43A', soft: '#F7E6D3' },
  'bogazici-junior': { bg: '#3B1F6E', fg: '#FFFFFF', accent: '#F2B21B', soft: '#EFE7FA' },
  'bogazici-vip': { bg: '#5E2378', fg: '#FFFFFF', accent: '#E0459B', soft: '#F6E8F3' },
  'bogazici-pancarli': { bg: '#5E2378', fg: '#FFFFFF', accent: '#E0459B', soft: '#F6E8F3' },
  'dsg-otomotiv': { bg: '#0B1A33', fg: '#FFFFFF', accent: '#2E7BFF', soft: '#E3ECFB' },
  'mutlu-cocuklar': { bg: '#F39A1E', fg: '#FFFFFF', accent: '#6D3A9C', soft: '#FFF0DA' },
  'net-vip-akademi': { bg: '#0F1F3D', fg: '#FFFFFF', accent: '#D9AE3A', soft: '#F4EBD3' },
  'ekici-sanat': { bg: '#161616', fg: '#FFFFFF', accent: '#C9C2B4', soft: '#EFEDE8' },
  'son-ders': { bg: '#1B2A5C', fg: '#FFFFFF', accent: '#4FA3E0', soft: '#E4EAF6' },
  'kristal-kedi': { bg: '#0B4FD8', fg: '#FFFFFF', accent: '#8FE3F5', soft: '#E1F3FB' }
};
const FALLBACK = { bg: '#2F4A2C', fg: '#FFFFFF', accent: '#F2C14E', soft: '#E3EADB' };
export const brandOf = (firm) => (firm && (firm.brand && typeof firm.brand === 'object' ? firm.brand : BRAND[firm.id])) || FALLBACK;

export const FORMATS = {
  kare: { w: 1080, h: 1080, label: 'Kare gönderi' },
  dikey: { w: 1080, h: 1350, label: 'Dikey gönderi' },
  hikaye: { w: 1080, h: 1920, label: 'Hikâye / Reels' }
};

export const TEMPLATES = {
  anma: 'Anma (siyah-beyaz)',
  kutlama: 'Özel gün kutlama',
  duyuru: 'Duyuru / kampanya',
  urun: 'Ürün / menü',
  alinti: 'Alıntı / söz'
};

const DISPLAY = "'Bricolage Grotesque', Inter, system-ui, sans-serif";
const BODY = 'Inter, system-ui, sans-serif';

function LogoTile({ firm, size, ring }) {
  if (!firm || !firm.logo) return null;
  return <img src={firm.logo} alt="" crossOrigin="anonymous" style={{ width: size, height: size, borderRadius: size * 0.2, objectFit: 'cover', border: ring ? '4px solid ' + ring : 0, display: 'block' }} />;
}

// Tek bir gönderinin 1080 genişliğindeki tam boy tasarımı
export function PostArt({ spec, firm }) {
  const f = FORMATS[spec.format] || FORMATS.kare;
  const b = { ...brandOf(firm), ...(spec.colors || {}) };
  const pad = 96;
  const base = { width: f.w, height: f.h, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', fontFamily: BODY };
  const name = firm ? firm.name : '';
  const t = spec.template || 'duyuru';

  if (t === 'anma') {
    return (
      <div style={{ ...base, background: 'radial-gradient(circle at 50% 40%, #222 0%, #0B0B0C 70%)', color: '#F2F0EA', padding: pad, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ filter: 'grayscale(1)' }}><LogoTile firm={firm} size={128} ring="#3A3A3A" /></div>
          <span style={{ fontSize: 34, letterSpacing: 4, textTransform: 'uppercase', color: '#9A9890' }}>{name}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <span style={{ fontSize: 40, letterSpacing: 14, textTransform: 'uppercase', color: '#B8B5AC' }}>{spec.eyebrow}</span>
          <span style={{ fontFamily: DISPLAY, fontSize: f.h > 1100 ? 132 : 116, lineHeight: 1.04, fontWeight: 700, letterSpacing: -2, whiteSpace: 'pre-line' }}>{spec.headline}</span>
          <span style={{ width: 180, height: 3, background: '#F2F0EA', opacity: 0.6 }} />
          {spec.sub && <span style={{ fontSize: 40, lineHeight: 1.4, color: '#CFCCC3', whiteSpace: 'pre-line' }}>{spec.sub}</span>}
        </div>
        <span style={{ fontSize: 36, letterSpacing: 6, textTransform: 'uppercase', color: '#9A9890' }}>{spec.foot}</span>
      </div>
    );
  }

  if (t === 'kutlama') {
    return (
      <div style={{ ...base, background: b.bg, color: b.fg, padding: pad, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ position: 'absolute', right: -160, top: -160, width: 560, height: 560, borderRadius: '50%', background: b.accent, opacity: 0.9 }} />
        <div style={{ position: 'absolute', right: 220, top: 300, width: 90, height: 90, borderRadius: '50%', background: b.fg, opacity: 0.18 }} />
        <div style={{ position: 'absolute', left: -120, bottom: -120, width: 380, height: 380, borderRadius: '50%', border: '24px solid ' + b.accent, opacity: 0.5 }} />
        <LogoTile firm={firm} size={140} ring={b.fg} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 32 }}>
          <span style={{ fontSize: 42, fontWeight: 600, letterSpacing: 6, textTransform: 'uppercase', color: b.accent }}>{spec.eyebrow}</span>
          <span style={{ fontFamily: DISPLAY, fontSize: 128, lineHeight: 1.0, fontWeight: 800, letterSpacing: -3, whiteSpace: 'pre-line' }}>{spec.headline}</span>
          {spec.sub && <span style={{ fontSize: 42, lineHeight: 1.35, opacity: 0.92, whiteSpace: 'pre-line' }}>{spec.sub}</span>}
        </div>
        <span style={{ position: 'relative', fontSize: 34, fontWeight: 600, opacity: 0.85 }}>{spec.foot || name}</span>
      </div>
    );
  }

  if (t === 'urun') {
    return (
      <div style={{ ...base, background: 'radial-gradient(circle at 70% 30%, ' + b.accent + '55 0%, ' + b.bg + ' 60%)', backgroundColor: b.bg, color: b.fg, padding: pad, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <LogoTile firm={firm} size={150} />
          <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: b.accent }}>{spec.eyebrow}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 150, lineHeight: 0.98, fontWeight: 800, letterSpacing: -4, whiteSpace: 'pre-line' }}>{spec.headline}</span>
          {spec.sub && <span style={{ fontSize: 44, lineHeight: 1.35, opacity: 0.9, whiteSpace: 'pre-line' }}>{spec.sub}</span>}
        </div>
        <span style={{ alignSelf: 'flex-start', padding: '22px 36px', borderRadius: 999, background: b.accent, color: b.bg, fontSize: 36, fontWeight: 700 }}>{spec.foot || name}</span>
      </div>
    );
  }

  if (t === 'alinti') {
    return (
      <div style={{ ...base, background: b.soft, color: b.bg, padding: pad, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 320, lineHeight: 0.7, fontWeight: 800, color: b.accent }}>“</span>
        <span style={{ fontFamily: DISPLAY, fontSize: 84, lineHeight: 1.12, fontWeight: 700, letterSpacing: -1.5, whiteSpace: 'pre-line' }}>{spec.headline}</span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <span style={{ fontSize: 38, fontWeight: 600 }}>{spec.sub || spec.foot}</span>
          <LogoTile firm={firm} size={120} />
        </div>
      </div>
    );
  }

  // duyuru (varsayılan)
  return (
    <div style={{ ...base, background: '#F6F3EC', color: '#16201A', padding: pad, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: f.h * 0.42, background: b.bg }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <LogoTile firm={firm} size={140} ring="#FFFFFF" />
        <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: b.accent }}>{spec.eyebrow}</span>
      </div>
      <div style={{ position: 'relative', background: '#FFFFFF', borderRadius: 44, padding: 72, display: 'flex', flexDirection: 'column', gap: 28, boxShadow: '0 30px 60px rgba(0,0,0,0.12)' }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 104, lineHeight: 1.02, fontWeight: 800, letterSpacing: -2.5, whiteSpace: 'pre-line' }}>{spec.headline}</span>
        {spec.sub && <span style={{ fontSize: 40, lineHeight: 1.4, color: '#4A544D', whiteSpace: 'pre-line' }}>{spec.sub}</span>}
      </div>
      <span style={{ position: 'relative', alignSelf: 'flex-start', padding: '22px 36px', borderRadius: 999, background: b.bg, color: b.fg, fontSize: 34, fontWeight: 700 }}>{spec.foot || name}</span>
    </div>
  );
}

// Ölçeklenmiş önizleme
export function PostPreview({ spec, firm, width = 320, radius = 14 }) {
  const f = FORMATS[spec.format] || FORMATS.kare;
  const s = width / f.w;
  return (
    <div style={{ width, height: f.h * s, overflow: 'hidden', borderRadius: radius, position: 'relative', background: '#000', flexShrink: 0 }} role="img" aria-label={(spec.title || spec.headline || '').replace(/\n/g, ' ')}>
      <div style={{ transform: 'scale(' + s + ')', transformOrigin: 'top left', width: f.w, height: f.h, pointerEvents: 'none' }}>
        <PostArt spec={spec} firm={firm} />
      </div>
    </div>
  );
}

// Tam çözünürlükte PNG indirme
export async function downloadPost(spec, firm, fileName) {
  const { toPng } = await import('html-to-image');
  const { createRoot } = await import('react-dom/client');
  const f = FORMATS[spec.format] || FORMATS.kare;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-20000px;top:0;width:' + f.w + 'px;height:' + f.h + 'px;';
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(<PostArt spec={spec} firm={firm} />);
  await new Promise((r) => setTimeout(r, 400));
  await Promise.all(Array.from(host.querySelectorAll('img')).map((img) => (img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; }))));
  try {
    const url = await toPng(host.firstChild, { width: f.w, height: f.h, pixelRatio: 1, cacheBust: true });
    const a = document.createElement('a');
    a.href = url; a.download = (fileName || 'moss-post') + '.png';
    document.body.appendChild(a); a.click(); a.remove();
  } finally {
    root.unmount(); host.remove();
  }
}

// ---- Dikey animasyonlu video (sahne sahne) ----
export function VideoPlayer({ spec, firm, width = 260 }) {
  const scenes = spec.scenes || [];
  const b = { ...brandOf(firm), ...(spec.colors || {}) };
  const durs = scenes.map((s) => Math.max(1.5, Number(s.sec) || 3));
  const total = durs.reduce((a, x) => a + x, 0) + 2.5;
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const last = useRef(0);
  useEffect(() => {
    if (!playing) return undefined;
    last.current = performance.now();
    const tick = (now) => {
      const dt = (now - last.current) / 1000; last.current = now;
      setT((x) => { const n = x + dt; if (n >= total) { setPlaying(false); return total; } return n; });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, total]);

  let acc = 0; let idx = scenes.length; let local = 0;
  for (let i = 0; i < scenes.length; i++) { if (t < acc + durs[i]) { idx = i; local = t - acc; break; } acc += durs[i]; }
  const scene = scenes[idx];
  const s = width / 1080;
  const appear = Math.min(1, local / 0.5);
  const toggle = () => { if (t >= total) setT(0); setPlaying(!playing); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width }}>
      <div style={{ width, height: 1920 * s, borderRadius: 16, overflow: 'hidden', position: 'relative', background: b.bg }}>
        <div style={{ transform: 'scale(' + s + ')', transformOrigin: 'top left', width: 1080, height: 1920, position: 'absolute', inset: 0, color: b.fg, fontFamily: BODY }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at ' + (30 + idx * 15) + '% ' + (25 + idx * 10) + '%, ' + b.accent + '66 0%, transparent 55%)' }} />
          {scene ? (
            <div key={idx} style={{ position: 'absolute', left: 90, right: 90, bottom: 360, display: 'flex', flexDirection: 'column', gap: 30, opacity: appear, transform: 'translateY(' + (1 - appear) * 60 + 'px)' }}>
              <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase', color: b.accent }}>Sahne {idx + 1} · {scene.shot ? scene.shot.slice(0, 40) : ''}</span>
              <span style={{ fontFamily: DISPLAY, fontSize: 112, lineHeight: 1.02, fontWeight: 800, letterSpacing: -2, whiteSpace: 'pre-line' }}>{scene.text || ' '}</span>
            </div>
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
              <LogoTile firm={firm} size={300} ring={b.fg} />
              <span style={{ fontFamily: DISPLAY, fontSize: 72, fontWeight: 800 }}>{firm ? firm.name : ''}</span>
            </div>
          )}
          {scene && scene.vo && (
            <div style={{ position: 'absolute', left: 90, right: 90, bottom: 150, padding: '24px 32px', borderRadius: 24, background: 'rgba(0,0,0,0.45)', fontSize: 40, lineHeight: 1.35 }}>{scene.vo}</div>
          )}
          <div style={{ position: 'absolute', left: 60, right: 60, top: 60, display: 'flex', gap: 10 }}>
            {scenes.concat([{}]).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#fff', width: (i < idx ? 100 : i === idx ? Math.min(100, (local / (durs[i] || 2.5)) * 100) : 0) + '%' }} />
              </div>
            ))}
          </div>
        </div>
        <button onClick={toggle} aria-label={playing ? 'Duraklat' : 'Oynat'} style={{ position: 'absolute', inset: 0, border: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!playing && <span style={{ width: 64, height: 64, borderRadius: 32, background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="26" height="26" viewBox="0 0 24 24" fill="#16201A" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg></span>}
        </button>
      </div>
      <span className="tiny">{Math.round(total)} sn · dokunarak oynat / durdur</span>
    </div>
  );
}
