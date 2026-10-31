import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Nav, Logo, Icon, go } from '../components/ui.jsx';
import { SECTORS, TYPES, todayYmd, shortDate } from '../data.js';

export function packageProgress(firm, tasks) {
  const p = firm.package || {};
  const total = (p.gonderi || 0) + (p.reels || 0) + (p.hikaye || 0);
  const ym = todayYmd().slice(0, 7);
  const done = tasks.filter((t) => t.firmId === firm.id && t.done && (t.date || '').startsWith(ym) && ['gonderi', 'reels', 'hikaye'].includes(t.type)).length;
  return { total, done };
}

export default function Firmalar() {
  const { firms, tasks, addFirm } = useStore();
  const [q, setQ] = useState('');
  const [sec, setSec] = useState('Tümü');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [sector, setSector] = useState('Eğitim');
  const t0 = todayYmd();
  const norm = (s) => (s || '').toLocaleLowerCase('tr');

  const list = firms
    .filter((f) => (sec === 'Tümü' || f.sector === sec) && (!q || norm(f.name).includes(norm(q))))
    .sort((a, b) => (a.active === false) - (b.active === false));
  const usedSectors = ['Tümü'].concat(SECTORS.filter((s) => firms.some((f) => f.sector === s)));

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const id = await addFirm({ name: name.trim(), sector });
    setName(''); setAdding(false);
    go('/firma/' + id);
  };

  return (
    <div className="screen">
      <div className="topbar" style={{ marginTop: 10 }}>
        <h1 className="h1" style={{ margin: 0 }}>Firmalar</h1>
        <button className="btn sm" onClick={() => setAdding(!adding)} style={{ color: 'var(--moss)' }}><Icon name="plus" size={18} />Firma ekle</button>
      </div>

      <div className="grid2" style={{ marginTop: 16 }}>
        <a href="#/galeri" className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14 }}><Icon name="star" size={20} color="var(--moss)" />Galeri</a>
        <a href="#/performans" className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14 }}><Icon name="ig" size={20} color="var(--moss)" />Instagram</a>
      </div>

      {adding && (
        <form onSubmit={create} className="card pad stack" style={{ marginTop: 16, gap: 12 }}>
          <div className="field"><label className="label" htmlFor="fn">Firma adı</label><input id="fn" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></div>
          <div className="field"><label className="label" htmlFor="fs">Sektör</label>
            <select id="fs" className="select" value={sector} onChange={(e) => setSector(e.target.value)}>{SECTORS.map((s) => <option key={s}>{s}</option>)}</select>
          </div>
          <p className="tiny" style={{ margin: 0 }}>Logo, Instagram ve paket bilgisini firma sayfasından eklersin.</p>
          <button className="btn primary" type="submit">Ekle</button>
        </form>
      )}

      <div style={{ position: 'relative', margin: '16px 0 12px' }}>
        <label htmlFor="ara" className="sr">Firma ara</label>
        <span style={{ position: 'absolute', left: 14, top: 15 }}><Icon name="search" size={20} color="var(--muted)" /></span>
        <input id="ara" className="input" type="search" placeholder="Firma ara…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 44 }} />
      </div>
      <div className="chips">
        {usedSectors.map((s) => <button key={s} className="chip" aria-pressed={sec === s} onClick={() => setSec(s)}>{s}</button>)}
      </div>
      <p className="small" style={{ margin: '12px 0' }}>{list.length ? list.length + ' firma · ' + list.filter((f) => f.active !== false).length + ' aktif · ' + list.filter((f) => f.active === false).length + ' pasif' : 'Aramana uygun firma bulunamadı'}</p>

      <div className="stack">
        {list.map((f) => {
          const inactive = f.active === false;
          const next = tasks.filter((t) => t.firmId === f.id && !t.done && t.date >= t0).sort((a, b) => ((a.date + (a.time || '')) < (b.date + (b.time || '')) ? -1 : 1))[0];
          const waiting = tasks.filter((t) => t.firmId === f.id && t.stage === 4 && !t.done).length;
          const pr = packageProgress(f, tasks);
          return (
            <a key={f.id} href={'#/firma/' + f.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: inactive ? '#F0F1EE' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Logo firm={f} size={56} radius={14} />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: inactive ? 'var(--ink-2)' : 'var(--ink)' }}>{f.name}</span>
                  <span className="tiny">{f.sector}</span>
                </div>
                <Icon name="right" size={18} color="var(--muted)" />
              </div>
              {inactive ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="pill neutral">Pasif</span><span className="tiny">Sayfa aktif değil</span></div>
              ) : (
                <>
                  <span className="small" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>
                    {next ? <>Sıradaki iş: <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{next.title}</b> · {shortDate(next.date)}</> : 'Planlı iş yok'}
                  </span>
                  {pr.total > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="tiny" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-2)' }}><span>Aylık paket</span><b style={{ color: pr.done > pr.total ? 'var(--alert)' : 'var(--ink)' }}>{pr.done}/{pr.total} içerik{pr.done > pr.total ? ' · Paket aşıldı' : ''}</b></div>
                      <div className="bar" style={{ background: 'var(--moss-soft)' }} role="img" aria-label={'Bu ay ' + pr.total + ' içerikten ' + pr.done + ' tanesi tamamlandı'}><div style={{ width: Math.min(100, Math.round(pr.done / pr.total * 100)) + '%' }} /></div>
                    </div>
                  )}
                  {waiting > 0 && <span className="pill wait" style={{ alignSelf: 'flex-start' }}>Onay bekliyor · {waiting}</span>}
                </>
              )}
            </a>
          );
        })}
      </div>
      <Nav active="/firmalar" />
    </div>
  );
}
