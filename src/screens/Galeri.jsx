import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Nav, Icon, Logo, back, go, useRoute } from '../components/ui.jsx';
import { PostPreview, VideoPlayer, downloadPost, startDrawing, FORMATS, TEMPLATES } from '../components/Post.jsx';
import { shortDate } from '../data.js';

const STATUS = [['taslak', 'Taslak'], ['onaylandi', 'Onaylandı'], ['paylasildi', 'Paylaşıldı']];
const statusPill = (s) => s === 'paylasildi' ? 'pill ok' : s === 'onaylandi' ? 'pill ok' : 'pill neutral';
const statusLabel = (s) => (STATUS.find(([k]) => k === s) || STATUS[0])[1];

export function GalleryGrid({ items, firms, cols = 2 }) {
  if (!items.length) return <div className="card empty">Galeride henüz içerik yok.</div>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + cols + ', minmax(0, 1fr))', gap: 12 }}>
      {items.map((g) => {
        const firm = firms.find((f) => f.id === g.firmId);
        return (
          <a key={g.id} href={'#/galeri/' + g.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <GridThumb g={g} firm={firm} />
            <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="tiny" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Logo firm={firm} size={18} radius={5} />{firm ? firm.name : ''}</span>
              <span style={{ fontSize: 13, fontWeight: 600, lineHeight: '17px' }}>{g.title}</span>
              <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className={statusPill(g.status)}>{statusLabel(g.status)}</span>
                <span className="pill neutral">{g.kind === 'video' ? 'Video' : 'Post'}</span>
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function GridThumb({ g, firm }) {
  const [w, setW] = useState(0);
  return (
    <div ref={(el) => { if (el && el.clientWidth !== w) setW(el.clientWidth); }} style={{ width: '100%', background: '#111' }}>
      {w > 0 && (g.kind === 'video'
        ? <VideoThumb g={g} firm={firm} width={w} />
        : <PostPreview spec={{ ...(g.spec || {}), imageStatus: g.imageStatus }} firm={firm} width={w} radius={0} />)}
    </div>
  );
}

function VideoThumb({ g, firm, width }) {
  const first = (g.spec && g.spec.scenes && g.spec.scenes[0]) || {};
  return (
    <div style={{ position: 'relative' }}>
      <PostPreview spec={{ template: 'kutlama', format: 'dikey', eyebrow: 'Reels', headline: first.text || g.title, foot: firm ? firm.name : '' }} firm={firm} width={width} radius={0} />
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
        <span style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="#16201A"><path d="M8 5v14l11-7z" /></svg></span>
      </span>
    </div>
  );
}

export default function Galeri() {
  const { gallery, firms } = useStore();
  const r = useRoute();
  const [firm, setFirm] = useState(r.q.get('firma') || 'all');
  const [kind, setKind] = useState('all');
  const items = gallery.filter((g) => (firm === 'all' || g.firmId === firm) && (kind === 'all' || g.kind === kind));
  const active = firms.filter((f) => f.active !== false);
  return (
    <div className="screen">
      <div className="topbar" style={{ marginTop: 12 }}>
        <h1 className="h1" style={{ margin: 0 }}>Galeri</h1>
        <a className="btn sm" href={'#/asistan' + (firm !== 'all' ? '?firma=' + firm : '')} style={{ color: 'var(--moss)' }}><Icon name="sparkle" size={18} />Asistandan iste</a>
      </div>
      <p className="small" style={{ margin: '8px 0 14px' }}>Asistanın ve ekibin hazırladığı postlar ve videolar. Dokunup indir, metnini kopyala, durumunu güncelle.</p>
      <div className="chips">
        <button className="chip" aria-pressed={firm === 'all'} onClick={() => setFirm('all')}>Tüm firmalar</button>
        {active.map((f) => <button key={f.id} className="chip" aria-pressed={firm === f.id} onClick={() => setFirm(f.id)} style={{ paddingLeft: 6 }}><Logo firm={f} size={26} radius={8} />{f.name}</button>)}
      </div>
      <div className="seg" style={{ gridTemplateColumns: 'repeat(3, 1fr)', margin: '12px 0 16px' }}>
        {[['all', 'Hepsi'], ['post', 'Postlar'], ['video', 'Videolar']].map(([k, l]) => <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}
      </div>
      <GalleryGrid items={items} firms={firms} />
      <Nav active="/firmalar" />
    </div>
  );
}

export function GaleriItem({ id }) {
  const { gallery, firms, updateGallery, deleteGallery } = useStore();
  const g = gallery.find((x) => x.id === id);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [w, setW] = useState(0);
  if (!g) return <div className="screen no-nav"><button className="back" onClick={() => back('/galeri')}><Icon name="left" size={20} />Galeri</button><p className="small">İçerik bulunamadı ya da silindi.</p></div>;
  const firm = firms.find((f) => f.id === g.firmId);
  const spec = { ...(g.spec || {}), imageStatus: g.imageStatus };
  const text = (g.caption || '') + (g.tags ? '\n\n' + g.tags : '');

  return (
    <div className="screen no-nav">
      <div className="topbar">
        <button className="back" onClick={() => back('/galeri')}><Icon name="left" size={20} />Galeri</button>
        <a className="btn sm" href={'#/asistan?firma=' + g.firmId + '&galeri=' + g.id}><Icon name="sparkle" size={16} />Asistanla düzenle</a>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <a href={firm ? '#/firma/' + firm.id : '#/firmalar'} className="pill ok" style={{ gap: 6, padding: '4px 10px 4px 4px' }}><Logo firm={firm} size={22} />{firm ? firm.name : ''}</a>
        <span className="pill neutral">{g.kind === 'video' ? 'Video' : (FORMATS[spec.format] || FORMATS.kare).label}</span>
      </div>
      <h1 className="h1" style={{ fontSize: 26, lineHeight: '30px', margin: '12px 0 16px' }}>{g.title}</h1>

      <div ref={(el) => { if (el && el.clientWidth !== w) setW(el.clientWidth); }} style={{ display: 'flex', justifyContent: 'center' }}>
        {w > 0 && (g.kind === 'video'
          ? <VideoPlayer spec={spec} firm={firm} width={Math.min(300, w)} />
          : <PostPreview spec={spec} firm={firm} width={Math.min(w, 520)} />)}
      </div>

      {g.imageStatus === 'hazirlaniyor' && <p className="small" role="status" style={{ textAlign: 'center', marginTop: 10 }}>ChatGPT görseli çiziyor. Genelde 30–60 saniye sürer; bu sayfa kendiliğinden güncellenir.</p>}
      {g.imageStatus === 'hata' && <p className="err" role="alert" style={{ marginTop: 10 }}>Görsel çizilemedi: {g.imageError || 'bilinmeyen hata'}</p>}
      {spec.imagePrompt && g.imageStatus !== 'hazirlaniyor' && (
        <button className="btn" style={{ width: '100%', marginTop: 10, color: 'var(--moss)' }}
          onClick={async () => { await updateGallery(g.id, { imageStatus: 'hazirlaniyor', imageError: '' }); startDrawing(g.id, spec.imagePrompt, spec.format).catch(() => updateGallery(g.id, { imageStatus: 'hata', imageError: 'Bağlantı kurulamadı' })); }}>
          <Icon name="sparkle" size={18} />ChatGPT ile yeniden çiz
        </button>
      )}
      {g.kind !== 'video' && (
        <button className="btn primary" style={{ width: '100%', marginTop: 14 }} disabled={busy}
          onClick={async () => { setBusy(true); try { await downloadPost(spec, firm, (firm ? firm.id : 'post') + '-' + (g.date || 'post')); } catch (e) { alert('İndirilemedi: ' + e.message); } setBusy(false); }}>
          {busy ? 'Hazırlanıyor…' : 'PNG olarak indir (' + (FORMATS[spec.format] || FORMATS.kare).w + '×' + (FORMATS[spec.format] || FORMATS.kare).h + ')'}
        </button>
      )}
      {g.kind === 'video' && <p className="tiny" style={{ marginTop: 10 }}>Video şu an uygulama içinde oynatılabilir önizleme. MP4 olarak indirme, render servisi bağlanınca açılacak.</p>}

      <h2 className="h2">Durum</h2>
      <div className="seg" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {STATUS.map(([k, l]) => <button key={k} aria-pressed={(g.status || 'taslak') === k} onClick={() => updateGallery(g.id, { status: k })}>{l}</button>)}
      </div>

      {(g.date || g.time) && <p className="small" style={{ marginTop: 12 }}>Paylaşım: {shortDate(g.date)} {g.time || ''}</p>}

      <h2 className="h2">Paylaşım metni</h2>
      <div className="card pad stack" style={{ gap: 12 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: '22px', whiteSpace: 'pre-wrap' }}>{g.caption || 'Metin yok.'}</p>
        {g.tags && <p style={{ margin: 0, fontSize: 14, color: '#1F4770', fontWeight: 500 }}>{g.tags}</p>}
        <button className="btn sm" style={{ alignSelf: 'flex-start', color: 'var(--moss)' }}
          onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); } catch (e) { setCopied(false); } }}>
          {copied ? 'Kopyalandı' : 'Metni kopyala'}
        </button>
      </div>

      {g.kind === 'video' && (spec.scenes || []).length > 0 && (
        <>
          <h2 className="h2">Sahne sahne senaryo</h2>
          <div className="stack">
            {spec.scenes.map((s, i) => (
              <div key={i} className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><b style={{ fontSize: 13 }}>Sahne {i + 1}</b><span className="pill neutral">{s.sec || 3} sn</span></div>
                <div style={{ fontSize: 14, lineHeight: '19px' }}><span className="small">Görüntü: </span>{s.shot}</div>
                <div style={{ fontSize: 14, lineHeight: '19px', fontWeight: 600 }}><span className="small" style={{ fontWeight: 400 }}>Ekranda: </span>{s.text}</div>
                {s.vo && <div style={{ fontSize: 14, lineHeight: '19px', fontStyle: 'italic' }}><span className="small" style={{ fontStyle: 'normal' }}>Seslendirme: </span>{s.vo}</div>}
              </div>
            ))}
          </div>
          {spec.music && <p className="small" style={{ marginTop: 10 }}>Müzik: {spec.music}</p>}
        </>
      )}

      {g.kind !== 'video' && <p className="tiny" style={{ marginTop: 16 }}>Şablon: {TEMPLATES[spec.template] || spec.template} · Hazırlayan: {g.byName}</p>}

      <button className="btn danger" style={{ width: '100%', marginTop: 24 }} onClick={() => { if (confirm('Bu içerik galeriden silinsin mi?')) { deleteGallery(g.id); go('/galeri'); } }}>
        <Icon name="trash" size={18} />Galeriden sil
      </button>
    </div>
  );
}
