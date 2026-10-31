import { useEffect, useState } from 'react';
import { Hero, Camera } from '../components/Art.jsx';
import { brandOf } from '../components/Post.jsx';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useStore } from '../store.jsx';
import { Nav, Icon, Logo, back, go, Switch } from '../components/ui.jsx';
import { GalleryGrid } from './Galeri.jsx';
import { db } from '../firebase.js';
import { timeAgo } from '../data.js';

// Montaj durumu: taslak → sırada (Claude'u bekliyor) → işleniyor → hazır / hata
export const STATUS = {
  '': { label: 'Taslak', cls: 'pill neutral', icon: 'edit' },
  sirada: { label: 'Claude sırasında', cls: 'pill wait', icon: 'clock' },
  isleniyor: { label: 'Montajlanıyor', cls: 'pill wait', icon: 'film' },
  hazir: { label: 'Reels hazır', cls: 'pill ok', icon: 'check' },
  hata: { label: 'Yapılamadı', cls: 'pill alert', icon: 'shield' }
};
export const statusOf = (p) => STATUS[p.status || (p.outputUrl ? 'hazir' : '')] || STATUS[''];

const isLink = (u) => /^https?:\/\/\S+$/i.test((u || '').trim());
const linkLabel = (u) => {
  if (/drive\.google\.com|docs\.google\.com/.test(u)) return 'Google Drive';
  if (/wetransfer|we\.tl/.test(u)) return 'WeTransfer';
  if (/dropbox/.test(u)) return 'Dropbox';
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return 'Bağlantı'; }
};

// Claude'un bitirdiği video, ücretsiz veritabanında ~900 KB'lık parçalar halinde durur; burada birleştirilip oynatılır.
function useVideo(p) {
  const [url, setUrl] = useState('');
  const [state, setState] = useState('');
  const key = p && p.video ? p.id + ':' + (p.video.parts || 0) + ':' + (p.video.at || '') : '';
  useEffect(() => {
    if (!key) { setUrl(''); return undefined; }
    let alive = true; let made = '';
    setState('yukleniyor');
    getDocs(query(collection(db, 'videoParcalar'), where('projectId', '==', p.id))).then((snap) => {
      const parts = snap.docs.map((d) => d.data()).sort((a, b) => a.i - b.i);
      if (!parts.length) { if (alive) setState('yok'); return; }
      const bytes = parts.map((x) => Uint8Array.from(atob(x.d), (c) => c.charCodeAt(0)));
      made = URL.createObjectURL(new Blob(bytes, { type: p.video.mime || 'video/mp4' }));
      if (alive) { setUrl(made); setState(''); }
    }).catch(() => alive && setState('hata'));
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
  }, [key]);
  return { url, state };
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
      <p className="small" style={{ margin: '8px 0 14px', lineHeight: '19px' }}>Ham videoların Drive linkini ekle, montajı anlat; Claude en iyi anları seçip altyazı ve müzikle reels yapsın. Sıraya aldığın montaj en geç yaklaşık 1 saatte hazır olur. Her revize ayrı bir versiyon olarak saklanır.</p>
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
                      <span className="tiny">{f ? f.name : ''} · {(latest.sources || []).length} video · {timeAgo(latest.atMs)}</span>
                      <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><span className={st.cls} style={{ gap: 4 }}><Icon name={st.icon} size={12} />{st.label}</span>{list.length > 1 && <span className="pill neutral">{list.length} versiyon</span>}</span>
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
  const { projects, firms, updateProject, reviseProject, deleteProject, queueProject } = useStore();
  const p = projects.find((x) => x.id === id);
  const [link, setLink] = useState('');
  const [linkErr, setLinkErr] = useState('');
  const [brief, setBrief] = useState(null);
  const [revLabel, setRevLabel] = useState('');
  const [revNote, setRevNote] = useState('');
  const [revOpen, setRevOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const vid = useVideo(p);
  if (!p) return <div className="screen no-nav"><button className="back" onClick={() => back('/edit')}><Icon name="left" size={20} />Edit</button><p className="small">Proje bulunamadı ya da silindi.</p></div>;

  const firm = firms.find((f) => f.id === p.firmId);
  const sources = p.sources || [];
  const opts = { length: 30, captions: true, music: '', ...(p.opts || {}) };
  const siblings = projects.filter((x) => (x.rootId || x.id) === (p.rootId || p.id)).sort((a, b) => (a.version || 1) - (b.version || 1));
  const st = statusOf(p);
  const text = brief === null ? (p.brief || '') : brief;
  const locked = p.status === 'sirada' || p.status === 'isleniyor';
  const setOpt = (k, v) => updateProject(p.id, { opts: { ...opts, [k]: v } });

  const addLink = (e) => {
    e.preventDefault();
    const u = link.trim();
    if (!isLink(u)) { setLinkErr('Geçerli bir link yapıştır (https:// ile başlamalı).'); return; }
    setLinkErr('');
    updateProject(p.id, { sources: sources.concat({ id: 's' + Date.now().toString(36), url: u, label: linkLabel(u) }) });
    setLink('');
  };
  const queue = async () => {
    setBusy(true);
    await queueProject(p, { brief: text });
    setBusy(false);
  };
  const revise = async (e) => {
    e.preventDefault();
    if (!revNote.trim()) return;
    const nid = await reviseProject(p, revLabel, revNote.trim(), projects);
    setRevOpen(false); setRevLabel(''); setRevNote('');
    go('/edit/' + nid);
  };

  const srcById = Object.fromEntries(sources.map((f, i) => [f.id, { ...f, n: i + 1 }]));
  const total = p.plan ? (p.plan.clips || []).reduce((a, c) => a + (c.length || 0), 0) : 0;

  return (
    <div className="screen no-nav">
      <Hero tall color={brandOf(firm).edge} Art={Camera} />
      <button className="back" onClick={() => back('/edit')}><Icon name="left" size={20} />Edit</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <a href={firm ? '#/firma/' + firm.id : '#/firmalar'} className="pill ok" style={{ gap: 6, padding: '4px 10px 4px 4px' }}><Logo firm={firm} size={22} />{firm ? firm.name : ''}</a>
        <span className="pill neutral">v{p.version || 1}</span>
        <span className={st.cls} style={{ gap: 4 }}><Icon name={st.icon} size={12} />{st.label}</span>
      </div>
      <h1 style={{ fontFamily: 'var(--display)', fontSize: 22, lineHeight: '28px', fontWeight: 700, margin: '12px 0 6px' }}>{p.name}</h1>
      {p.revisionNote && <p className="small" style={{ margin: '0 0 6px' }}>Revize isteği: “{p.revisionNote}”</p>}

      {siblings.length > 1 && (
        <>
          <h2 className="h2 hi"><span className="h-ic"><Icon name="film" size={14} /></span>Versiyonlar</h2>
          <div className="chips">
            {siblings.map((v) => <a key={v.id} href={'#/edit/' + v.id} className="chip" aria-pressed={v.id === p.id}>v{v.version || 1}{v.revisionLabel ? ' · ' + v.revisionLabel : ''}</a>)}
          </div>
        </>
      )}

      {(p.status === 'sirada' || p.status === 'isleniyor') && (
        <div className="card pad" role="status" style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', background: 'var(--wait-soft)', borderColor: 'transparent' }}>
          <span className="row-ic" style={{ background: '#fff', color: 'var(--wait)' }}><Icon name={p.status === 'sirada' ? 'clock' : 'film'} size={16} /></span>
          <span className="small" style={{ color: 'var(--wait)', fontWeight: 600 }}>{p.status === 'sirada' ? 'Claude’un sırasında. En geç yaklaşık 1 saat içinde montajlanır; bitince bildirim gelir.' : 'Claude şu an montajlıyor. Birkaç dakika içinde burada olacak.'}</span>
        </div>
      )}
      {p.status === 'hata' && <p className="err" role="alert" style={{ marginTop: 14 }}>Montaj yapılamadı: {p.workerNote || 'bilinmeyen hata'}. Linkleri ve paylaşım iznini kontrol edip tekrar sıraya al.</p>}

      {p.video && (
        <>
          <h2 className="h2 hi"><span className="h-ic"><Icon name="check" size={14} /></span>Reels hazır</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            {vid.url ? <video src={vid.url} controls playsInline style={{ width: '100%', maxWidth: 360, borderRadius: 16, background: '#000', boxShadow: 'var(--sh2)' }} />
              : <div className="card empty" style={{ width: '100%' }}>{vid.state === 'hata' ? 'Video yüklenemedi.' : 'Video yükleniyor…'}</div>}
            {vid.url && <a className="btn primary" href={vid.url} download={(p.name || 'reels').replace(/[^\wğüşöçıİĞÜŞÖÇ() -]+/g, '') + '.mp4'} style={{ width: '100%' }}><Icon name="upload" size={18} color="#fff" />Telefona indir (MP4)</a>}
            <span className="tiny">{[p.video.duration ? Math.round(p.video.duration) + ' sn' : '', p.video.size ? (p.video.size / 1048576).toFixed(1) + ' MB' : '', p.video.note || ''].filter(Boolean).join(' · ')}</span>
          </div>
        </>
      )}

      <div className="row-h2"><h2 className="h2 hi"><span className="h-ic"><Icon name="camera" size={14} /></span>1 · Ham videolar</h2><span className="small">{sources.length} link</span></div>
      <div className="card list">
        {sources.map((f, i) => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
            <span className="row-ic"><b style={{ fontSize: 12 }}>{i + 1}</b></span>
            <a href={f.url} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{f.label || 'Bağlantı'}</span>
              <span className="tiny" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.url}</span>
            </a>
            {!locked && <button aria-label={(i + 1) + '. linki çıkar'} onClick={() => updateProject(p.id, { sources: sources.filter((x) => x.id !== f.id) })} style={{ width: 44, height: 44, border: 0, background: 'transparent' }}><Icon name="trash" size={18} color="var(--muted)" /></button>}
          </div>
        ))}
        {!locked && (
          <form onSubmit={addLink} style={{ display: 'flex', gap: 8, padding: 12 }}>
            <label htmlFor="lnk" className="sr">Video linki</label>
            <input id="lnk" className="input" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Google Drive linkini yapıştır" />
            <button className="btn primary" type="submit" style={{ flexShrink: 0 }}>Ekle</button>
          </form>
        )}
      </div>
      {linkErr && <p className="err" role="alert" style={{ marginTop: 8 }}>{linkErr}</p>}
      <details className="card pad small" style={{ marginTop: 10 }}>
        <summary style={{ fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}>Videoyu Drive’a nasıl yüklerim?</summary>
        <ol style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: '21px' }}>
          <li>Telefonda Google Drive’ı aç, + → Yükle ile videoları seç (Wi‑Fi’de yükle).</li>
          <li>Videonun yanındaki ⋮ → Paylaş → Genel erişim: “Bağlantıya sahip olan herkes”.</li>
          <li>“Bağlantıyı kopyala” de ve buraya yapıştır. Her video için ayrı link ekle.</li>
        </ol>
      </details>

      <h2 className="h2 hi"><span className="h-ic"><Icon name="msg" size={14} /></span>2 · Montajı anlat</h2>
      <label htmlFor="tarif" className="sr">Montaj tarifi</label>
      <textarea id="tarif" className="textarea" style={{ minHeight: 130 }} value={text} disabled={locked} onChange={(e) => setBrief(e.target.value)} onBlur={() => brief !== null && updateProject(p.id, { brief: text })}
        placeholder="Örn. Enerjik bir tanıtım reels’i. En iştah açıcı anlar, hızlı kesmeler, sonda logo ve ‘Hemen sipariş ver’ yazısı." />
      <div className="card list" style={{ marginTop: 10 }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>Süre</span>
          {[15, 30, 45, 60].map((n) => <button key={n} type="button" className="chip" disabled={locked} aria-pressed={opts.length === n} onClick={() => setOpt('length', n)}>{n} sn</button>)}
        </div>
        <Switch on={opts.captions} onToggle={() => !locked && setOpt('captions', !opts.captions)} label="Altyazı ekle" hint="Konuşmalar otomatik Türkçe altyazıya çevrilir" />
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="muz" style={{ fontSize: 14, fontWeight: 600 }}>Müzik (isteğe bağlı)</label>
          <input id="muz" className="input" disabled={locked} defaultValue={opts.music} onBlur={(e) => e.target.value !== opts.music && setOpt('music', e.target.value.trim())} placeholder="Telifsiz müziğin Drive linki" />
          <span className="tiny">Boş bırakırsan videonun kendi sesi kalır. Instagram’da paylaşırken uygulamanın kendi müziğini de ekleyebilirsin.</span>
        </div>
      </div>
      {!locked && (
        <button className="btn primary" style={{ width: '100%', marginTop: 12 }} disabled={busy || !sources.length} onClick={queue}>
          <Icon name="sparkle" size={18} color="#fff" />{p.video ? 'Montajı yeniden yaptır' : 'Montajı Claude’a gönder'}
        </button>
      )}
      {!sources.length && <p className="tiny" style={{ marginTop: 6 }}>Önce en az bir video linki ekle.</p>}

      {p.plan && (
        <>
          <div className="row-h2"><h2 className="h2 hi"><span className="h-ic"><Icon name="flow" size={14} /></span>Claude’un montaj planı</h2><span className="small">~{Math.round(total)} sn</span></div>
          {p.plan.summary && <p className="card pad note" style={{ margin: 0, fontSize: 15, lineHeight: '22px' }}>{p.plan.summary}</p>}
          <div className="card list" style={{ marginTop: 10 }}>
            {(p.plan.clips || []).map((c, i) => {
              const f = srcById[c.sourceId] || null;
              return (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', alignItems: 'flex-start' }}>
                  <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 8, background: 'var(--moss-soft)', color: 'var(--moss)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{f ? f.n + '. video' : 'Video'}{c.what ? ' · ' + c.what : ''}</span>
                    <span className="tiny">{c.trim}–{(Number(c.trim) + Number(c.length)).toFixed(1)} sn · {c.length} sn</span>
                    {c.text && <span style={{ fontSize: 13, fontWeight: 600 }}>“{c.text}”</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {p.video && (
        <>
          <h2 className="h2 hi"><span className="h-ic"><Icon name="edit" size={14} /></span>Revize</h2>
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
                <textarea id="rn" className="textarea" value={revNote} onChange={(e) => setRevNote(e.target.value)} required placeholder="Örn. Daha yumuşak geçişler, daha sakin müzik, yazılar daha az olsun." />
              </div>
              <div className="grid2"><button type="button" className="btn" onClick={() => setRevOpen(false)}>Vazgeç</button><button className="btn primary" type="submit">Revizeyi aç</button></div>
            </form>
          )}
        </>
      )}

      <div style={{ marginTop: 28 }}>
        {!confirmDel
          ? <button className="btn danger" style={{ width: '100%' }} onClick={() => setConfirmDel(true)}><Icon name="trash" size={18} color="#fff" />Bu versiyonu sil</button>
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
