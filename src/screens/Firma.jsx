import { useState } from 'react';
import { useStore, useSub } from '../store.jsx';
import { Nav, Logo, Icon, TaskRow, back, Switch, initials } from '../components/ui.jsx';
import { SECTORS, todayYmd, timeAgo } from '../data.js';
import { packageProgress } from './Firmalar.jsx';
import { GalleryGrid } from './Galeri.jsx';
import { useAsk } from '../components/Dialog.jsx';
import { deltaOf } from './Performans.jsx';

function Info({ firm }) {
  const { updateFirm, tasks, insta } = useStore();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState(null);
  const start = () => { setF({ ...firm, services: (firm.services || []).join(', '), package: { gonderi: 0, reels: 0, hikaye: 0, cekim: 0, ...(firm.package || {}) } }); setEdit(true); };
  const save = async (e) => {
    e.preventDefault();
    await updateFirm(firm.id, {
      name: f.name.trim(), sector: f.sector, instagram: (f.instagram || '').trim(), contact: f.contact || '', phone: f.phone || '',
      approver: f.approver || '', notes: f.notes || '', active: f.active !== false,
      services: f.services.split(',').map((s) => s.trim()).filter(Boolean),
      package: Object.fromEntries(Object.entries(f.package).map(([k, v]) => [k, Number(v) || 0]))
    });
    setEdit(false);
  };
  const pr = packageProgress(firm, tasks);
  const ym = todayYmd().slice(0, 7);
  const count = (type) => tasks.filter((t) => t.firmId === firm.id && t.done && t.type === type && (t.date || '').startsWith(ym)).length;
  const pk = firm.package || {};

  if (edit) {
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    const setP = (k) => (e) => setF({ ...f, package: { ...f.package, [k]: e.target.value } });
    return (
      <form onSubmit={save} className="stack" style={{ gap: 14, marginTop: 20 }}>
        <div className="field"><label className="label" htmlFor="n">Firma adı</label><input id="n" className="input" value={f.name} onChange={set('name')} required /></div>
        <div className="field"><label className="label" htmlFor="s">Sektör</label><select id="s" className="select" value={f.sector} onChange={set('sector')}>{SECTORS.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="card"><Switch on={f.active !== false} onToggle={() => setF({ ...f, active: f.active === false })} label="Sayfa aktif" hint="Kapalıysa takvim ve listelerde pasif görünür" /></div>
        <div className="field"><label className="label" htmlFor="ig">Instagram linki</label><input id="ig" className="input" value={f.instagram || ''} onChange={set('instagram')} placeholder="https://instagram.com/…" inputMode="url" /></div>
        <div className="field"><label className="label" htmlFor="sv">Verdiğimiz hizmetler (virgülle)</label><input id="sv" className="input" value={f.services} onChange={set('services')} placeholder="Sosyal medya yönetimi, Video prodüksiyon" /></div>
        <div className="label">Aylık paket</div>
        <div className="grid2">
          {[['gonderi', 'Gönderi'], ['reels', 'Reels'], ['hikaye', 'Hikâye'], ['cekim', 'Çekim günü']].map(([k, l]) => (
            <div key={k} className="field"><label className="tiny" htmlFor={'p' + k}>{l}</label><input id={'p' + k} className="input" type="number" min="0" inputMode="numeric" value={f.package[k]} onChange={setP(k)} /></div>
          ))}
        </div>
        <div className="field"><label className="label" htmlFor="c">Yetkili kişi</label><input id="c" className="input" value={f.contact || ''} onChange={set('contact')} /></div>
        <div className="field"><label className="label" htmlFor="ph">Telefon</label><input id="ph" className="input" type="tel" value={f.phone || ''} onChange={set('phone')} /></div>
        <div className="field"><label className="label" htmlFor="ap">Onay veren kişi</label><input id="ap" className="input" value={f.approver || ''} onChange={set('approver')} /></div>
        <div className="field"><label className="label" htmlFor="nt">Notlar</label><textarea id="nt" className="textarea" value={f.notes || ''} onChange={set('notes')} placeholder="Marka renkleri, dikkat edilecekler…" /></div>
        <div className="grid2"><button type="button" className="btn" onClick={() => setEdit(false)}>Vazgeç</button><button className="btn primary" type="submit">Kaydet</button></div>
      </form>
    );
  }

  const Row = ({ label, value, href }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '14px 16px', fontSize: 14 }}>
      <span style={{ color: 'var(--ink-2)' }}>{label}</span>
      {href && value ? <a href={href} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: 'var(--moss)', textAlign: 'right', wordBreak: 'break-all' }}>{value}</a>
        : <span style={{ fontWeight: 600, textAlign: 'right', color: value ? 'var(--ink)' : 'var(--muted)' }}>{value || 'Eklenmedi'}</span>}
    </div>
  );

  const ig = insta[firm.id];
  const d30 = deltaOf(ig, 30);
  return (
    <>
      {firm.active === false && <div className="pill neutral" style={{ marginTop: 20 }}>Sayfa aktif değil</div>}
      {ig && ig.followers !== undefined && (
        <a href="#/performans" className="card" style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, padding: 16, minHeight: 112, alignContent: 'space-between', fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}><Icon name="ig" size={16} />Instagram</span><span className="link">Performansı gör</span></span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="tiny">Takipçi</span><b style={{ fontSize: 18 }}>{ig.followers.toLocaleString('tr-TR')}</b></span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="tiny">30 gün</span><b style={{ fontSize: 18, color: d30 ? (d30.n >= 0 ? 'var(--moss)' : 'var(--alert-ink)') : 'var(--muted)' }}>{d30 ? (d30.n >= 0 ? '+' : '−') + Math.abs(d30.n).toLocaleString('tr-TR') : '—'}</b></span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span className="tiny">Son izlenme</span><b style={{ fontSize: 18 }}>{ig.recent && ig.recent[0] && ig.recent[0].views != null ? ig.recent[0].views.toLocaleString('tr-TR') : '—'}</b></span>
        </a>
      )}
      {(firm.services || []).length > 0 && (
        <>
          <h2 className="h2">Verdiğimiz hizmetler</h2>
          <div className="chips wrap">{firm.services.map((s) => <span key={s} className="card" style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600, borderRadius: 10 }}>{s}</span>)}</div>
        </>
      )}
      <div className="row-h2"><h2 className="h2">Bu ayın paketi</h2>{pr.total > 0 && <span className="small">{pr.done}/{pr.total} içerik</span>}</div>
      {pr.total === 0 && !(pk.cekim > 0) ? <div className="card pad small">Paket girilmedi. “Bilgileri düzenle”den ekleyebilirsin.</div> : (
        <div className="card pad stack" style={{ gap: 14 }}>
          {[['gonderi', 'Gönderi'], ['reels', 'Reels'], ['hikaye', 'Hikâye'], ['cekim', 'Çekim günü']].filter(([k]) => pk[k] > 0).map(([k, l]) => {
            const d = count(k);
            return (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span>{l}</span><b>{d}/{pk[k]}</b></div>
                <div className="bar" style={{ background: 'var(--moss-soft)' }} role="img" aria-label={l + ': ' + pk[k] + ' hedeften ' + d + ' tamamlandı'}><div style={{ width: Math.min(100, Math.round(d / pk[k] * 100)) + '%' }} /></div>
              </div>
            );
          })}
        </div>
      )}
      <h2 className="h2">Bilgiler</h2>
      <div className="card list">
        <Row label="Sektör" value={firm.sector} />
        <Row label="Instagram" value={firm.instagram ? firm.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '') : ''} href={firm.instagram} />
        <Row label="Yetkili kişi" value={firm.contact} />
        <Row label="Telefon" value={firm.phone} href={firm.phone ? 'tel:' + firm.phone.replace(/\s/g, '') : ''} />
        <Row label="Onay veren" value={firm.approver} />
      </div>
      {firm.notes && <><h2 className="h2">Notlar</h2><p className="card pad" style={{ margin: 0, fontSize: 15, lineHeight: '22px', whiteSpace: 'pre-wrap' }}>{firm.notes}</p></>}
      <button className="btn" style={{ width: '100%', marginTop: 14, color: 'var(--moss)' }} onClick={start}><Icon name="edit" size={18} />Bilgileri düzenle</button>
    </>
  );
}

function Ideas({ firm }) {
  const { addIdea, toggleVote, deleteIdea, user } = useStore();
  const ask = useAsk();
  const ideas = useSub(['firms', firm.id, 'ideas']);
  const [text, setText] = useState('');
  const sorted = ideas.slice().sort((a, b) => (b.votes || []).length - (a.votes || []).length);
  const submit = (e) => { e.preventDefault(); if (text.trim()) { addIdea(firm.id, text.trim()); setText(''); } };
  return (
    <>
      <p className="small" style={{ margin: '20px 0 14px' }}>Ekibin fikirleri. Beğenilenleri işe çevirip üretim hattına al.</p>
      <div className="stack">
        {sorted.length === 0 && <div className="card empty">Henüz fikir yok.</div>}
        {sorted.map((i) => {
          const on = (i.votes || []).includes(user.uid);
          return (
            <div key={i.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px 12px 16px' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 15, lineHeight: '21px', fontWeight: 600 }}>{i.text}</span>
                <span className="tiny">{i.byName}</span>
                <span style={{ display: 'flex', gap: 14 }}>
                  <a className="link" href={'#/yeni?firma=' + firm.id + '&stage=0&title=' + encodeURIComponent(i.text)}>İşe çevir</a>
                  {i.by === user.uid && <button className="link" style={{ color: 'var(--alert-ink)' }} onClick={async () => { if (await ask({ title: 'Fikir silinsin mi?', message: '“' + i.text + '”', confirmText: 'Sil', danger: true })) deleteIdea(firm.id, i.id); }}>Sil</button>}
                </span>
              </div>
              <button aria-pressed={on} aria-label={'Oy ver, şu an ' + (i.votes || []).length + ' oy'} onClick={() => toggleVote(firm.id, i)}
                style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 14, border: '1.5px solid ' + (on ? 'var(--moss)' : 'var(--field)'), background: on ? 'var(--moss)' : '#fff', color: on ? '#fff' : 'var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>
                <Icon name="up" size={16} width={2.4} />{(i.votes || []).length}
              </button>
            </div>
          );
        })}
      </div>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <label htmlFor="fk" className="sr">Yeni fikir</label>
        <input id="fk" className="input" placeholder="Yeni fikir yaz…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn primary" type="submit" style={{ height: 48 }}>Ekle</button>
      </form>
    </>
  );
}

export function Thread({ items, onSend, placeholder, emptyText }) {
  const [text, setText] = useState('');
  const submit = (e) => { e.preventDefault(); if (text.trim()) { onSend(text.trim()); setText(''); } };
  return (
    <>
      <div className="stack" style={{ gap: 14 }}>
        {items.length === 0 && <div className="card empty">{emptyText}</div>}
        {items.map((m) => (
          <div key={m.id} style={{ display: 'flex', gap: 10 }}>
            <span className="avatar" aria-hidden="true">{initials(m.byName)}</span>
            <div className="bubble">
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}><b style={{ fontSize: 14 }}>{m.byName}</b><span className="tiny">{timeAgo(m.atMs)}</span></div>
              <p>{m.text}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <label htmlFor="thr" className="sr">{placeholder}</label>
        <input id="thr" className="input" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" aria-label="Gönder" className="btn primary" style={{ width: 48, height: 48, padding: 0, flexShrink: 0 }}><Icon name="send" color="#fff" /></button>
      </form>
    </>
  );
}

function Chat({ firm }) {
  const { addMessage } = useStore();
  const msgs = useSub(['firms', firm.id, 'messages']);
  return (
    <>
      <p className="small" style={{ margin: '20px 0 14px' }}>Firma geneli konuşmalar ve kararlar. Tek bir işe ait konuşmalar o işin sayfasında.</p>
      <Thread items={msgs} onSend={(t) => addMessage(firm.id, t)} placeholder="Mesaj yaz…" emptyText="Henüz mesaj yok." />
    </>
  );
}

export default function Firma({ id }) {
  const { firms, tasks, gallery } = useStore();
  const [tab, setTab] = useState('genel');
  const firm = firms.find((f) => f.id === id);
  if (!firm) return <div className="screen"><button className="back" onClick={() => back('/firmalar')}><Icon name="left" size={20} />Firmalar</button><p className="small">Firma bulunamadı.</p><Nav active="/firmalar" /></div>;

  const t0 = todayYmd();
  const ft = tasks.filter((t) => t.firmId === id);
  const upcoming = ft.filter((t) => !t.done).sort((a, b) => ((a.date || '9') + (a.time || '') < (b.date || '9') + (b.time || '') ? -1 : 1));
  const done = ft.filter((t) => t.done).sort((a, b) => ((a.date || '') > (b.date || '') ? -1 : 1)).slice(0, 15);
  const sameBrand = firm.brand ? firms.filter((f) => f.brand === firm.brand && f.id !== firm.id) : [];
  const tabs = [['genel', 'Genel'], ['isler', 'İşler'], ['galeri', 'Galeri'], ['fikir', 'Fikirler'], ['sohbet', 'Sohbet']];
  const fg = gallery.filter((g) => g.firmId === id);

  return (
    <div className="screen">
      <button className="back" onClick={() => back('/firmalar')}><Icon name="left" size={20} />Firmalar</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '10px 0 16px' }}>
        <Logo firm={firm} size={80} radius={18} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 20, lineHeight: '26px', fontWeight: 700 }}>{firm.name}</h1>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="small" style={{ fontSize: 13 }}>{firm.sector} · {upcoming.length} açık iş</span>
            {firm.active === false ? <span className="pill neutral">Pasif</span> : <span className="pill ok">Aktif</span>}
          </span>
          {firm.instagram && <a className="tiny" href={firm.instagram} target="_blank" rel="noreferrer" style={{ color: 'var(--moss)', fontWeight: 600 }}>{firm.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/[/?].*$/, '')}</a>}
        </div>
      </div>
      <div className="tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === 'genel' && (
        <>
          <Info firm={firm} />
          {sameBrand.length > 0 && (
            <>
              <h2 className="h2">Aynı marka</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {sameBrand.map((f) => <a key={f.id} href={'#/firma/' + f.id} className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: 10, fontSize: 14, fontWeight: 600 }}><Logo firm={f} size={32} radius={8} />{f.name}</a>)}
              </div>
            </>
          )}
        </>
      )}
      {tab === 'isler' && (
        <>
          <div className="row-h2"><h2 className="h2">Açık işler</h2><a className="link" href={'#/yeni?firma=' + id}>+ İş ekle</a></div>
          <div className="stack">{upcoming.length ? upcoming.map((t) => <TaskRow key={t.id} t={t} showDate />) : <div className="card empty">Açık iş yok.</div>}</div>
          {done.length > 0 && <><h2 className="h2">Yapılanlar</h2><div className="stack">{done.map((t) => <TaskRow key={t.id} t={t} showDate />)}</div></>}
          {upcoming.some((t) => t.date && t.date < t0) && <p className="tiny" style={{ marginTop: 10 }}>Tarihi geçmiş açık işler en üstte.</p>}
        </>
      )}
      {tab === 'galeri' && (
        <>
          <a href={'#/asistan?firma=' + id} className="dark-card" style={{ marginTop: 20, marginBottom: 14 }}>
            <span aria-hidden="true" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="sparkle" size={20} color="#fff" /></span>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 15, fontWeight: 600 }}>Asistandan post ya da video iste</span><span className="sub">Hazırlananlar bu galeriye düşer</span></span>
            <Icon name="right" size={18} color="#fff" />
          </a>
          <GalleryGrid items={fg} firms={firms} />
        </>
      )}
      {tab === 'fikir' && <Ideas firm={firm} />}
      {tab === 'sohbet' && <Chat firm={firm} />}
      <Nav active="/firmalar" />
    </div>
  );
}
