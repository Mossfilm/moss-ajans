import { useState } from 'react';
import { Hero, Camera, Clapper } from '../components/Art.jsx';
import { brandOf } from '../components/Post.jsx';
import { ref as sref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useStore } from '../store.jsx';
import { Nav, Icon, Logo, back, go } from '../components/ui.jsx';
import { GalleryGrid } from './Galeri.jsx';
import { storage, auth } from '../firebase.js';
import { timeAgo } from '../data.js';

const STATUS = {
  '': { label: 'Taslak', cls: 'pill neutral' },
  plan: { label: 'Montaj planı hazır', cls: 'pill ok' },
  kuyruk: { label: 'Render sırada', cls: 'pill neutral' },
  render: { label: 'Render alınıyor', cls: 'pill neutral' },
  hazir: { label: 'Ham ürün hazır', cls: 'pill ok' },
  hata: { label: 'Hata', cls: 'pill alert' }
};
const statusOf = (p) => STATUS[p.renderStatus || (p.plan ? 'plan' : '')] || STATUS[''];

function kindOf(file) {
  const t = file.type || '';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('audio/')) return 'audio';
  return 'other';
}
function mediaDuration(file, kind) {
  if (kind !== 'video' && kind !== 'audio') return Promise.resolve(null);
  return new Promise((res) => {
    const el = document.createElement(kind);
    el.preload = 'metadata';
    el.onloadedmetadata = () => { const d = el.duration; URL.revokeObjectURL(el.src); res(Number.isFinite(d) ? Math.round(d * 10) / 10 : null); };
    el.onerror = () => res(null);
    el.src = URL.createObjectURL(file);
  });
}
async function callFn(name, body) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
  return fetch('/.netlify/functions/' + name, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token }, body: JSON.stringify({ ...body, idToken: token }) });
}

export default function Edit() {
  const { projects, firms, gallery, addProject } = useStore();
  const [tab, setTab] = useState('projeler');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const active = firms.filter((f) => f.active !== false);
  const [firmId, setFirmId] = useState('');

  const roots = {};
  projects.forEach((p) => { const r = p.rootId || p.id; (roots[r] = roots[r] || []).push(p); });
  const groups = Object.values(roots).map((list) => list.sort((a, b) => (b.version || 1) - (a.version || 1)))
    .sort((a, b) => b[0].atMs - a[0].atMs);

  const create = async (e) => {
    e.preventDefault();
    const f = firmId || (active[0] && active[0].id);
    if (!name.trim() || !f) return;
    const id = await addProject({ name: name.trim(), baseName: name.trim(), firmId: f });
    setName(''); setAdding(false); go('/edit/' + id);
  };

  return (
    <div className="screen">
      <Hero art="clapper" />
      <div className="topbar" style={{ marginTop: 12 }}>
        <h1 className="h1" style={{ margin: 0 }}>Edit</h1>
        {tab === 'projeler' && <button className="btn sm" style={{ color: 'var(--moss)' }} onClick={() => setAdding(!adding)}><Icon name="plus" size={18} />Yeni montaj</button>}
      </div>
      <p className="small" style={{ margin: '8px 0 14px', lineHeight: '19px' }}>Ham dosyaları yükle, montajı anlat; kurguyu ve render’ı uygulama yapsın. Her revize ayrı bir versiyon olarak saklanır.</p>
      <div className="seg" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
        <button aria-pressed={tab === 'projeler'} onClick={() => setTab('projeler')}>Montaj projeleri</button>
        <button aria-pressed={tab === 'kutuphane'} onClick={() => setTab('kutuphane')}>Kütüphane ({gallery.length})</button>
      </div>

      {tab === 'projeler' && (
        <>
          {adding && (
            <form onSubmit={create} className="card pad stack" style={{ gap: 12, marginBottom: 16 }}>
              <div className="field"><label className="label" htmlFor="pn">Proje adı</label><input id="pn" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Ceyda Güzellik" required autoFocus /></div>
              <div className="field">
                <span className="label" id="pf">Firma</span>
                <div className="chips" role="group" aria-labelledby="pf">
                  {active.map((f) => <button type="button" key={f.id} className="chip" aria-pressed={(firmId || (active[0] && active[0].id)) === f.id} onClick={() => setFirmId(f.id)} style={{ paddingLeft: 6 }}><Logo firm={f} size={26} radius={8} />{f.name}</button>)}
                </div>
              </div>
              <button className="btn primary" type="submit">Projeyi aç</button>
            </form>
          )}
          {groups.length === 0 && !adding && (
            <div className="card empty illus">
              <Camera className="big-art" />
              <b style={{ fontSize: 16, color: 'var(--ink)' }}>Henüz montaj projesi yok</b>
              <span style={{ marginTop: 6 }}>“Yeni montaj” ile başla.</span>
              <button className="btn primary" style={{ marginTop: 20 }} onClick={() => setAdding(true)}><Icon name="plus" size={18} />Yeni montaj oluştur</button>
            </div>
          )}
          <div className="stack">
            {groups.map((list) => {
              const latest = list[0];
              const root = list.find((x) => x.id === (latest.rootId || latest.id)) || list[list.length - 1];
              const f = firms.find((x) => x.id === latest.firmId);
              const st = statusOf(latest);
              return (
                <div key={root.id} className="card firm" style={{ '--edge': brandOf(f).edge || 'var(--moss)', padding: 0, gap: 0 }}>
                  <a href={'#/edit/' + latest.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 14px 14px 17px' }}>
                    <span className="thumb" style={{ '--tb': brandOf(f).bg }}>
                      <Logo firm={f} size={30} radius={8} />
                      <span className="play"><Icon name="up" size={12} color="#fff" width={2.6} /></span>
                      <span className="dur">v{latest.version || 1}</span>
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 600 }}>{latest.name}</span>
                      <span className="tiny">{f ? f.name : ''} · {(latest.files || []).length} dosya · {timeAgo(latest.atMs)}</span>
                      <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><span className={st.cls}>{st.label}</span>{list.length > 1 && <span className="pill neutral">{list.length} versiyon</span>}</span>
                    </span>
                    <Icon name="right" size={18} color="var(--muted)" />
                  </a>
                  {list.length > 1 && (
                    <div style={{ borderTop: '1px solid var(--line-2)', padding: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span className="tiny" style={{ fontWeight: 600 }}>Revizeler</span>
                      {list.slice(1).map((v) => <a key={v.id} href={'#/edit/' + v.id} className="small" style={{ color: 'var(--ink-2)' }}>v{v.version || 1} · {v.name}</a>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'kutuphane' && (
        <>
          <a href="#/asistan" className="dark-card" style={{ marginBottom: 14 }}>
            <span aria-hidden="true" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="sparkle" size={20} color="#fff" /></span>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 15, fontWeight: 600 }}>Asistandan post ya da video iste</span><span className="sub">Hazırlananlar bu kütüphaneye düşer</span></span>
            <Icon name="right" size={18} color="#fff" />
          </a>
          <GalleryGrid items={gallery} firms={firms} />
        </>
      )}
      <Nav active="/edit" />
    </div>
  );
}

export function EditProje({ id }) {
  const { projects, firms, updateProject, reviseProject, deleteProject } = useStore();
  const p = projects.find((x) => x.id === id);
  const [up, setUp] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [brief, setBrief] = useState(null);
  const [revLabel, setRevLabel] = useState('');
  const [revNote, setRevNote] = useState('');
  const [revOpen, setRevOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  if (!p) return <div className="screen no-nav"><button className="back" onClick={() => back('/edit')}><Icon name="left" size={20} />Edit</button><p className="small">Proje bulunamadı ya da silindi.</p></div>;

  const firm = firms.find((f) => f.id === p.firmId);
  const files = p.files || [];
  const siblings = projects.filter((x) => (x.rootId || x.id) === (p.rootId || p.id)).sort((a, b) => (a.version || 1) - (b.version || 1));
  const st = statusOf(p);
  const text = brief === null ? (p.brief || '') : brief;

  const upload = async (list) => {
    if (!storage) { setErr('Dosya deposu kapalı.'); return; }
    setErr('');
    const added = [];
    for (const file of Array.from(list)) {
      const kind = kindOf(file);
      if (kind === 'other') continue;
      const dur = await mediaDuration(file, kind);
      const path = 'projects/' + (p.rootId || p.id) + '/' + Date.now() + '-' + file.name.replace(/[^\w.\-]+/g, '_');
      const task = uploadBytesResumable(sref(storage, path), file, { contentType: file.type });
      await new Promise((res, rej) => task.on('state_changed', (s) => setUp({ name: file.name, pct: Math.round((s.bytesTransferred / s.totalBytes) * 100) }), rej, res))
        .catch((e) => { setErr('Yükleme başarısız: ' + (e.code === 'storage/unauthorized' ? 'izin yok' : e.message)); });
      if (task.snapshot.state !== 'success') continue;
      const url = await getDownloadURL(task.snapshot.ref);
      added.push({ id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: file.name, kind, url, path, size: file.size, duration: dur });
    }
    setUp(null);
    if (added.length) await updateProject(p.id, { files: files.concat(added) });
  };

  const makePlan = async () => {
    setErr(''); setBusy('plan');
    await updateProject(p.id, { brief: text });
    try {
      const prev = p.parentId ? projects.find((x) => x.id === p.parentId) : null;
      const r = await callFn('kurgu', { name: p.name, firmName: firm ? firm.name : '', brief: text, files, revisionNote: p.revisionNote || '', previousPlan: prev ? prev.plan : null });
      const j = await r.json().catch(() => ({}));
      if (r.status === 404 || r.status === 503) setErr('Kurgu asistanı henüz bağlı değil (Claude API anahtarı ve sunucu yüklemesi gerekiyor).');
      else if (j.error === 'no_media') setErr('Önce en az bir video ya da görsel yükle.');
      else if (!r.ok) setErr('Montaj planı yapılamadı: ' + (j.message || j.error || r.status));
      else await updateProject(p.id, { plan: j.plan, renderStatus: '', outputUrl: '', renderError: '' });
    } catch (e) { setErr('Sunucuya ulaşılamadı.'); }
    setBusy('');
  };

  const render = async () => {
    setErr(''); setBusy('render');
    await updateProject(p.id, { renderStatus: 'kuyruk', renderError: '', outputUrl: '' });
    try {
      const r = await callFn('render-background', { projectId: p.id, plan: p.plan, files });
      if (!(r.ok || r.status === 202)) { await updateProject(p.id, { renderStatus: 'hata', renderError: 'Render servisine ulaşılamadı (' + r.status + ')' }); }
    } catch (e) { await updateProject(p.id, { renderStatus: 'hata', renderError: 'Sunucuya ulaşılamadı' }); }
    setBusy('');
  };

  const revise = async (e) => {
    e.preventDefault();
    if (!revNote.trim()) return;
    const nid = await reviseProject(p, revLabel, revNote.trim(), projects);
    setRevOpen(false); setRevLabel(''); setRevNote('');
    go('/edit/' + nid);
  };

  const fileById = Object.fromEntries(files.map((f) => [f.id, f]));
  const total = p.plan ? (p.plan.clips || []).reduce((a, c) => a + (c.length || 0), 0) + (p.plan.endText ? 2.5 : 0) : 0;

  return (
    <div className="screen no-nav">
      <button className="back" onClick={() => back('/edit')}><Icon name="left" size={20} />Edit</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <a href={firm ? '#/firma/' + firm.id : '#/firmalar'} className="pill ok" style={{ gap: 6, padding: '4px 10px 4px 4px' }}><Logo firm={firm} size={22} />{firm ? firm.name : ''}</a>
        <span className="pill neutral">v{p.version || 1}</span>
        <span className={st.cls}>{st.label}</span>
      </div>
      <h1 className="h1" style={{ fontSize: 28, lineHeight: '32px', margin: '12px 0 6px' }}>{p.name}</h1>
      {p.revisionNote && <p className="small" style={{ margin: '0 0 6px' }}>Revize isteği: “{p.revisionNote}”</p>}

      {siblings.length > 1 && (
        <>
          <h2 className="h2">Versiyonlar</h2>
          <div className="chips">
            {siblings.map((v) => <a key={v.id} href={'#/edit/' + v.id} className="chip" aria-pressed={v.id === p.id}>v{v.version || 1}{v.revisionLabel ? ' · ' + v.revisionLabel : ''}</a>)}
          </div>
        </>
      )}

      <div className="row-h2"><h2 className="h2">1 · Ham dosyalar</h2><span className="small">{files.length} dosya</span></div>
      <div className="card list">
        {files.map((f) => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
            <span aria-hidden="true" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, background: 'var(--track)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={f.kind === 'audio' ? 'music' : f.kind === 'image' ? 'star' : 'camera'} size={18} />
            </span>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
              <span className="tiny">{f.kind === 'video' ? 'Video' : f.kind === 'image' ? 'Görsel' : 'Ses'}{f.duration ? ' · ' + f.duration + ' sn' : ''}{f.size ? ' · ' + (f.size >= 1048576 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' KB') : ''}</span>
            </span>
            <button aria-label={f.name + ' dosyasını projeden çıkar'} onClick={() => updateProject(p.id, { files: files.filter((x) => x.id !== f.id) })} style={{ width: 44, height: 44, border: 0, background: 'transparent' }}><Icon name="trash" size={18} color="#7C857E" /></button>
          </div>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, fontWeight: 600, color: 'var(--moss)', cursor: 'pointer' }}>
          <Icon name="upload" size={20} />{up ? up.name + ' · %' + up.pct : 'Video, fotoğraf ya da müzik yükle'}
          <input type="file" multiple accept="video/*,image/*,audio/*" className="sr" onChange={(e) => { upload(e.target.files); e.target.value = ''; }} disabled={Boolean(up)} />
        </label>
      </div>

      <h2 className="h2">2 · Montajı anlat</h2>
      <label htmlFor="tarif" className="sr">Montaj tarifi</label>
      <textarea id="tarif" className="textarea" style={{ minHeight: 130 }} value={text} onChange={(e) => setBrief(e.target.value)}
        placeholder="Örn. 30 saniyelik dikey reels. Salon girişiyle aç, sonra işlem öncesi ve sonrası yan yana. Hızlı kesmeler, enerjik müzik, sonda logo ve ‘Randevu için DM’ yazısı." />
      <button className="btn primary" style={{ width: '100%', marginTop: 10 }} disabled={busy === 'plan' || !files.length} onClick={makePlan}>
        <Icon name="sparkle" size={18} color="#fff" />{busy === 'plan' ? 'Claude montajı planlıyor…' : p.plan ? 'Montajı yeniden planla' : 'Montajı yap'}
      </button>

      {p.plan && (
        <>
          <div className="row-h2"><h2 className="h2">3 · Montaj planı</h2><span className="small">{p.plan.aspect} · ~{Math.round(total)} sn</span></div>
          <p className="card pad" style={{ margin: 0, fontSize: 15, lineHeight: '22px' }}>{p.plan.summary}</p>
          <div className="card list" style={{ marginTop: 10 }}>
            {(p.plan.clips || []).map((c, i) => {
              const f = fileById[c.fileId];
              return (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', alignItems: 'flex-start' }}>
                  <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 8, background: 'var(--moss-soft)', color: 'var(--moss)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f ? f.name : 'Dosya silinmiş'}</span>
                    <span className="tiny">{c.trim}–{(c.trim + c.length).toFixed(1)} sn · {c.length} sn{c.transition && c.transition !== 'none' ? ' · ' + c.transition : ''}</span>
                    {c.text && <span style={{ fontSize: 13, fontWeight: 600 }}>“{c.text}”</span>}
                  </span>
                </div>
              );
            })}
            {(p.plan.musicFileId || p.plan.endText) && (
              <div style={{ padding: '10px 14px' }} className="small">
                {p.plan.musicFileId && fileById[p.plan.musicFileId] ? 'Müzik: ' + fileById[p.plan.musicFileId].name : ''}{p.plan.musicFileId && p.plan.endText ? ' · ' : ''}{p.plan.endText ? 'Kapanış: “' + p.plan.endText + '”' : ''}
              </div>
            )}
          </div>

          <h2 className="h2">4 · Render</h2>
          {(p.renderStatus === 'kuyruk' || p.renderStatus === 'render') && <p className="card pad small" role="status" style={{ margin: 0 }}>Render alınıyor. Kısa videolarda genelde 1–3 dakika sürer; bu sayfa bitince kendiliğinden güncellenir.</p>}
          {p.renderStatus === 'hata' && <p className="err" role="alert" style={{ margin: '0 0 10px' }}>{p.renderError || 'Render başarısız.'}</p>}
          {p.outputUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
              <video src={p.outputUrl} controls playsInline style={{ width: '100%', maxWidth: 360, borderRadius: 16, background: '#000' }} />
              <a className="btn" href={p.outputUrl} target="_blank" rel="noreferrer" style={{ width: '100%', color: 'var(--moss)' }}>Ham ürünü aç / indir (MP4)</a>
            </div>
          )}
          {p.renderStatus !== 'kuyruk' && p.renderStatus !== 'render' && (
            <button className="btn primary" style={{ width: '100%', marginTop: 10 }} disabled={busy === 'render'} onClick={render}>
              <Icon name="film" size={18} color="#fff" />{p.outputUrl ? 'Yeniden render al' : 'Render al'}
            </button>
          )}
        </>
      )}

      {p.outputUrl && (
        <>
          <h2 className="h2">5 · Revize</h2>
          {!revOpen ? (
            <button className="btn" style={{ width: '100%' }} onClick={() => setRevOpen(true)}><Icon name="edit" size={18} />Revize iste (yeni versiyon açılır)</button>
          ) : (
            <form onSubmit={revise} className="card pad stack" style={{ gap: 12 }}>
              <div className="field">
                <label className="label" htmlFor="rl">Revize adı (isteğe bağlı)</label>
                <input id="rl" className="input" value={revLabel} onChange={(e) => setRevLabel(e.target.value)} placeholder="Örn. Berika" />
                <span className="tiny">Yeni versiyonun adı: {(siblings[0] || p).baseName || (siblings[0] || p).name} ({revLabel.trim() ? revLabel.trim() + ' ' : ''}Vol {Math.max(...siblings.map((x) => x.version || 1)) + 1})</span>
              </div>
              <div className="field">
                <label className="label" htmlFor="rn">Ne değişsin?</label>
                <textarea id="rn" className="textarea" value={revNote} onChange={(e) => setRevNote(e.target.value)} required placeholder="Örn. Berika’nın videosundaki gibi daha yumuşak geçişler, daha sakin müzik, yazılar daha az olsun." />
              </div>
              <div className="grid2"><button type="button" className="btn" onClick={() => setRevOpen(false)}>Vazgeç</button><button className="btn primary" type="submit">Revizeyi aç</button></div>
            </form>
          )}
        </>
      )}

      {err && <p className="err" role="alert" style={{ marginTop: 14 }}>{err}</p>}

      <div style={{ marginTop: 28 }}>
        {!confirmDel
          ? <button className="btn danger" style={{ width: '100%' }} onClick={() => setConfirmDel(true)}><Icon name="trash" size={18} />Bu versiyonu sil</button>
          : (
            <div className="card pad stack" style={{ gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>“{p.name}” silinsin mi? Diğer versiyonlar kalır.</span>
              <div className="grid2"><button className="btn" onClick={() => setConfirmDel(false)}>Vazgeç</button><button className="btn danger" onClick={async () => { await deleteProject(p.id); go('/edit'); }}>Sil</button></div>
            </div>
          )}
      </div>
    </div>
  );
}
