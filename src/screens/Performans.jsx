import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Icon, Logo, back } from '../components/ui.jsx';
import { shortDate } from '../data.js';

const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('tr-TR'));
export function deltaOf(d, days) {
  const h = (d && d.history) || [];
  if (h.length < 2) return null;
  const last = h[h.length - 1];
  const target = new Date(last.d); target.setDate(target.getDate() - days);
  const t = target.toISOString().slice(0, 10);
  const from = [...h].reverse().find((x) => x.d <= t) || h[0];
  return from.d === last.d ? null : { n: last.f - from.f, since: from.d };
}

function Spark({ history, width = 318, height = 120 }) {
  const pts = (history || []).slice(-60);
  if (pts.length < 2) return <div className="card pad small" style={{ textAlign: 'center' }}>Grafik için en az 2 günlük veri gerekiyor. Sayaçlar her sabah güncellenir.</div>;
  const vals = pts.map((p) => p.f);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max(1, (hi - lo) * 0.12);
  const y0 = lo - pad, y1 = hi + pad;
  const X = (i) => (i / (pts.length - 1)) * width;
  const Y = (v) => 10 + (1 - (v - y0) / (y1 - y0)) * (height - 30);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.f).toFixed(1)).join(' ');
  const area = path + ' L' + width + ' ' + (height - 20) + ' L0 ' + (height - 20) + ' Z';
  const last = pts[pts.length - 1];
  return (
    <svg width="100%" viewBox={'0 0 ' + width + ' ' + height} role="img" aria-label={'Takipçi grafiği: ' + shortDate(pts[0].d) + ' ' + fmt(pts[0].f) + ', ' + shortDate(last.d) + ' ' + fmt(last.f)} style={{ display: 'block', overflow: 'visible' }}>
      <line x1="0" x2={width} y1={height - 20} y2={height - 20} stroke="var(--line)" />
      <path d={area} fill="var(--moss)" opacity="0.08" />
      <path d={path} fill="none" stroke="var(--moss)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(pts.length - 1)} cy={Y(last.f)} r="4.5" fill="var(--moss)" stroke="var(--surface)" strokeWidth="2" />
      <text x="0" y={height - 4} fontSize="11" fill="var(--muted)" fontFamily="Inter, sans-serif">{shortDate(pts[0].d)}</text>
      <text x={width} y={height - 4} fontSize="11" fill="var(--muted)" fontFamily="Inter, sans-serif" textAnchor="end">{shortDate(last.d)}</text>
    </svg>
  );
}

export default function Performans() {
  const { firms, insta } = useStore();
  const active = firms.filter((f) => f.active !== false);
  const withData = active.filter((f) => insta[f.id] && insta[f.id].followers !== undefined);
  const [sel, setSel] = useState(null);
  const [range, setRange] = useState(30);
  const cur = sel || (withData[0] && withData[0].id);
  const firm = firms.find((f) => f.id === cur);
  const d = cur ? insta[cur] : null;
  const delta = deltaOf(d, range);

  return (
    <div className="screen no-nav">
      <button className="back" onClick={() => back('/firmalar')}><Icon name="left" size={20} />Firmalar</button>
      <h1 className="h1" style={{ margin: '8px 0 6px' }}>Instagram performansı</h1>

      {withData.length === 0 ? (
        <>
          <p className="small" style={{ margin: 0, lineHeight: '19px' }}>Takipçi ve izlenme sayaçları Meta bağlantısı kurulunca her sabah 06:15’te güncellenir. Şimdilik hesap linkleri hazır.</p>
          <div className="card pad" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="ig" size={28} color="var(--moss)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{active.filter((f) => f.instagram).length}/{active.length} firmanın linki girildi</div>
              <div className="bar" style={{ marginTop: 8 }}><div style={{ width: (active.length ? Math.round(active.filter((f) => f.instagram).length / active.length * 100) : 0) + '%' }} /></div>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="small" style={{ margin: 0 }}>Her sabah güncellenir · Son güncelleme {d && d.updated ? shortDate(d.updated) : '—'}</p>
          <div className="chips" style={{ marginTop: 14 }}>
            {withData.map((f) => <button key={f.id} className="chip" aria-pressed={cur === f.id} onClick={() => setSel(f.id)} style={{ paddingLeft: 6 }}><Logo firm={f} size={26} radius={8} />{f.name}</button>)}
          </div>
          {d && (
            <div className="card pad" style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span className="small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Logo firm={firm} size={22} />@{d.username} · Takipçi</span>
                  <span style={{ fontFamily: 'var(--display)', fontSize: 40, lineHeight: '44px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{fmt(d.followers)}</span>
                </div>
                <div className="seg" style={{ gridTemplateColumns: '1fr 1fr', padding: 3 }}>
                  {[7, 30].map((r) => <button key={r} aria-pressed={range === r} onClick={() => setRange(r)} style={{ height: 34, fontSize: 12, padding: '0 10px', whiteSpace: 'nowrap' }}>{r} gün</button>)}
                </div>
              </div>
              {delta && (
                <span style={{ display: 'inline-block', marginTop: 4, fontSize: 14, fontWeight: 600, color: delta.n >= 0 ? 'var(--moss)' : 'var(--alert-ink)' }}>
                  {delta.n >= 0 ? '▲ +' : '▼ −'}{fmt(Math.abs(delta.n))} · {shortDate(delta.since)}’den bu yana
                </span>
              )}
              <div style={{ marginTop: 12 }}><Spark history={d.history} /></div>
              {d.error && <p className="err" style={{ marginTop: 8 }}>Son güncellemede sorun: {d.error}</p>}
            </div>
          )}
          {d && (d.recent || []).length > 0 && (
            <>
              <h2 className="h2">Son paylaşımlar</h2>
              <div className="card list">
                {d.recent.map((m) => (
                  <a key={m.id} href={m.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                    <span className="pill neutral" style={{ width: 64, justifyContent: 'center' }}>{m.type === 'VIDEO' ? 'Reels' : m.type === 'CAROUSEL_ALBUM' ? 'Albüm' : 'Gönderi'}</span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.caption || 'Açıklamasız paylaşım'}</span>
                      <span className="tiny">{m.at ? shortDate(m.at.slice(0, 10)) : ''} · {fmt(m.likes)} beğeni · {fmt(m.comments)} yorum</span>
                    </span>
                    <span style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                      <b style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{fmt(m.views)}</b><span className="tiny">izlenme</span>
                    </span>
                  </a>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="row-h2"><h2 className="h2">Tüm firmalar</h2><span className="tiny">{withData.length ? range + ' günlük değişim' : ''}</span></div>
      <div className="card list">
        {active.map((f) => {
          const x = insta[f.id];
          const dl = deltaOf(x, range);
          const user = f.instagram ? f.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/[/?].*$/, '') : '';
          return (
            <button key={f.id} onClick={() => (x ? setSel(f.id) : window.open(f.instagram || '#/firma/' + f.id, '_blank'))} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: 0, background: cur === f.id && x ? 'var(--surface-2)' : 'transparent', textAlign: 'left', fontFamily: 'inherit', color: 'var(--ink)' }}>
              <Logo firm={f} size={36} radius={10} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{f.name}</span>
                <span className="tiny" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user || 'Link yok'}</span>
              </span>
              {x && x.followers !== undefined ? (
                <span style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', fontVariantNumeric: 'tabular-nums' }}>
                  <b style={{ fontSize: 14 }}>{fmt(x.followers)}</b>
                  {dl && <span style={{ fontSize: 12, fontWeight: 700, color: dl.n >= 0 ? 'var(--moss)' : 'var(--alert-ink)' }}>{dl.n >= 0 ? '+' : '−'}{fmt(Math.abs(dl.n))}</span>}
                </span>
              ) : <span className={f.instagram ? 'pill neutral' : 'pill alert'}>{f.instagram ? 'Bağlantı bekliyor' : 'Link eksik'}</span>}
            </button>
          );
        })}
      </div>
      {firms.some((f) => f.active === false) && <p className="tiny" style={{ marginTop: 10 }}>Aktif olmayan sayfalar listede gösterilmez.</p>}
    </div>
  );
}
