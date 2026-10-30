import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Nav, Fab, Logo, TypePill, Icon } from '../components/ui.jsx';
import { STAGES, shortDate } from '../data.js';
import { useAsk } from '../components/Dialog.jsx';

const HINTS = [
  'Konuşulan fikirler. Uygun görülenler senaryo aşamasına geçer.',
  'Metin, senaryo ya da çekim listesi hazırlanıyor.',
  'Çekim günü planlanan ya da çekimi süren içerikler.',
  'Video kurgusu ya da görsel tasarım yapılıyor.',
  'Firmaya gönderildi; onay ya da revize bekleniyor.',
  'Onaylandı ve paylaşım saati planlandı.'
];

export default function Uretim() {
  const { tasks, firms, setStage, addRevision } = useStore();
  const [stage, setSt] = useState(4);
  const ask = useAsk();
  const open = tasks.filter((t) => !t.done && typeof t.stage === 'number');
  const items = open.filter((t) => t.stage === stage).sort((a, b) => ((a.date || '9') < (b.date || '9') ? -1 : 1));

  return (
    <div className="screen">
      <h1 className="h1" style={{ marginBottom: 6 }}>Üretim hattı</h1>
      <p className="small" style={{ margin: '0 0 16px' }}>Her içerik fikirden yayına kadar bu aşamalardan geçer.</p>

      <div className="chips">
        {STAGES.map((s, i) => (
          <button key={s.label} className="chip" aria-pressed={stage === i} onClick={() => setSt(i)}>
            {s.label}<span className="count">{open.filter((t) => t.stage === i).length}</span>
          </button>
        ))}
      </div>
      <p className="small" style={{ margin: '14px 0 12px' }}>{HINTS[stage]}</p>

      {items.length === 0 && <div className="card empty">Bu aşamada içerik yok.</div>}
      <div className="stack">
        {items.map((t) => {
          const f = firms.find((x) => x.id === t.firmId);
          return (
            <div key={t.id} className="card" style={{ overflow: 'hidden' }}>
              <a href={'#/is/' + t.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 14px 10px' }}>
                <span className="small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Logo firm={f} size={22} />{f ? f.name : ''}</span>
                <span style={{ fontSize: 16, lineHeight: '21px', fontWeight: 600 }}>{t.title}</span>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TypePill type={t.type} />
                  {t.date && <span className="tiny">{shortDate(t.date)}{t.time ? ' ' + t.time : ''}</span>}
                  {t.revisions > 0 && <span className="pill alert">{t.revisions}. revize</span>}
                </span>
              </a>
              {stage < 5 && (
                <div style={{ display: 'grid', gridTemplateColumns: stage === 4 ? '1fr 1fr' : '1fr', borderTop: '1px solid var(--line-2)' }}>
                  {stage === 4 && (
                    <button style={{ height: 44, border: 0, borderRight: '1px solid var(--line-2)', background: 'transparent', fontWeight: 600, fontSize: 14, color: 'var(--alert-ink)' }}
                      onClick={async () => { const n = await ask({ title: 'Firma revize istedi', message: 'Revize notunu yaz (isteğe bağlı). İş kurgu aşamasına döner.', input: true, placeholder: 'Örn. Döner kesim sahnesi daha uzun olsun', confirmText: 'Revizeyi kaydet' }); if (n !== null) addRevision(t, n); }}>
                      Revize istendi
                    </button>
                  )}
                  <button style={{ height: 44, border: 0, background: 'transparent', fontWeight: 600, fontSize: 14, color: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={() => setStage(t, stage + 1)}>
                    {STAGES[stage].next}<Icon name="send" size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Fab to="/yeni?stage=0" />
      <Nav active="/uretim" />
    </div>
  );
}
