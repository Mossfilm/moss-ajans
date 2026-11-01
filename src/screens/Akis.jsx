import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Nav, Fab, TaskRow, Logo, Icon, BellButton } from '../components/ui.jsx';
import { PostPreview } from '../components/Post.jsx';
import { Hero, Clapper, Reel, People } from '../components/Art.jsx';
import { todayYmd, ymd, addDays, dayLabel, DAYS, MONTHS, upcomingSpecialDays, firmsFor, shortDate, parseYmd } from '../data.js';

const byTime = (a, b) => ((a.date + (a.time || '99')) < (b.date + (b.time || '99')) ? -1 : 1);

export default function Akis() {
  const { tasks, firms, gallery, profile, user } = useStore();
  const [tab, setTab] = useState('bugun');
  const t0 = todayYmd();
  const end = ymd(addDays(new Date(), 6));
  const now = new Date();

  const today = tasks.filter((t) => t.date === t0).sort(byTime);
  const overdue = tasks.filter((t) => t.date && t.date < t0 && !t.done).sort(byTime);
  const week = tasks.filter((t) => t.date >= t0 && t.date <= end).sort(byTime);
  const waiting = tasks.filter((t) => t.stage === 4 && !t.done);
  const special = upcomingSpecialDays(40).filter((s) => firmsFor(s, firms).length > 0);

  const todayLeft = today.filter((t) => !t.done).length;
  const weekLeft = week.filter((t) => !t.done).length;
  const h = now.getHours();
  const hello = h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar';
  const who = ((profile && profile.name) || (user && user.email) || '').split(' ')[0].split('@')[0];
  const priority = [...overdue, ...today.filter((t) => !t.done), ...today.filter((t) => t.done)];
  const monday = addDays(now, -((now.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => ymd(addDays(monday, i)));
  const shootDays = new Set(tasks.filter((t) => t.type === 'cekim' && weekDays.includes(t.date)).map((t) => t.date));
  const shootCount = tasks.filter((t) => t.type === 'cekim' && weekDays.includes(t.date)).length;
  const jump = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  const groups = [];
  week.forEach((t) => {
    const g = groups.find((x) => x.date === t.date);
    if (g) g.items.push(t); else groups.push({ date: t.date, items: [t] });
  });

  const firmName = (id) => (firms.find((f) => f.id === id) || {}).name;
  const plannedFor = (date) => tasks.filter((t) => t.date === date).length;

  return (
    <div className="screen">
      <Hero />
      <div className="topbar" style={{ paddingTop: 34 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span className="eyebrow">{(DAYS[now.getDay()] + ', ' + now.getDate() + ' ' + MONTHS[now.getMonth()]).toLocaleUpperCase('tr-TR')}</span>
          <h1 className="h1" style={{ margin: 0 }}>{hello}{who ? ', ' + who.charAt(0).toLocaleUpperCase('tr-TR') + who.slice(1) : ''}.</h1>
        </div>
        <BellButton />
      </div>

      <div className="stats">
        <button className="stat" onClick={() => { setTab('bugun'); setTimeout(() => jump('oncelikli'), 0); }}><span className="ic"><Icon name="camera" size={16} /></span><Clapper className="wm" /><span className="k">Bugün</span><span className="v">{String(todayLeft).padStart(2, '0')}</span><span className="s">Planlanan iş</span></button>
        <button className={'stat' + (overdue.length ? ' late' : '')} onClick={() => { setTab('bugun'); setTimeout(() => jump('oncelikli'), 0); }}><span className="ic late"><Icon name="clock" size={16} /></span><Reel className="wm" /><span className="k">Geciken</span><span className="v">{String(overdue.length).padStart(2, '0')}</span><span className="s">İlgi bekliyor</span></button>
        <button className={'stat' + (waiting.length ? ' wait' : '')} onClick={() => { setTab('bugun'); setTimeout(() => jump('onayda'), 0); }}><span className="ic wait"><Icon name="users" size={16} /></span><People className="wm" /><span className="k">Onayda</span><span className="v">{String(waiting.length).padStart(2, '0')}</span><span className="s">Müşteride</span></button>
      </div>
      <div style={{ height: 16 }} />

      <div className="seg" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <button aria-pressed={tab === 'bugun'} onClick={() => setTab('bugun')}>Bugün</button>
        <button aria-pressed={tab === 'hafta'} onClick={() => setTab('hafta')}>Bu hafta</button>
      </div>

      {tab === 'bugun' && (
        <>
          <div className="row-h2" id="oncelikli"><h2 className="h2">Öncelikli işler</h2><a className="link" href={'#/takvim?date=' + t0}>Tümünü gör</a></div>
          {priority.length ? <div className="stack">{priority.map((t) => <TaskRow key={t.id} t={t} showDate={t.date !== t0} />)}</div>
            : <a href={'#/yeni?date=' + t0} className="card empty"><span className="empty-ic"><Icon name="check" size={28} /></span><b style={{ fontSize: 16, color: 'var(--ink)' }}>Bugün için iş yok</b><span style={{ marginTop: 6 }}>Eklemek için dokun.</span></a>}

          <a href="#/cekim-plani" className="dark-card" style={{ marginTop: 22, flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
            <Clapper className="wm" />
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span aria-hidden="true" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="camera" size={20} color="#fff" /></span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700 }}>Haftalık çekim planı</span><span className="sub">{shootCount ? 'Bu hafta ' + shootCount + ' çekim planlandı' : 'Stok ve özel günlere göre öneriler'}</span></span>
              <Icon name="right" size={18} color="#fff" />
            </span>
            <span className="week" aria-hidden="true">
              {weekDays.map((d) => <span key={d} className={(shootDays.has(d) ? 'has' : '') + (d === t0 ? ' today' : '')}>{DAYS[parseYmd(d).getDay()].slice(0, 3).toLocaleUpperCase('tr-TR')}<b>{parseYmd(d).getDate()}</b></span>)}
            </span>
          </a>

          {waiting.length > 0 && (
            <>
              <div className="row-h2" id="onayda"><h2 className="h2">Müşteri onayı bekleyenler</h2><a className="link" href="#/uretim">Üretim hattı</a></div>
              <div className="chips">
                {waiting.map((t) => {
                  const f = firms.find((x) => x.id === t.firmId);
                  return (
                    <a key={t.id} href={'#/is/' + t.id} className="card" style={{ flex: '0 0 210px', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="tiny"><Logo firm={f} size={22} />{f ? f.name : ''}</span>
                      <span style={{ fontSize: 15, lineHeight: '20px', fontWeight: 600 }}>{t.title}</span>
                      {t.revisions > 0 ? <span className="pill alert" style={{ alignSelf: 'flex-start' }}>{t.revisions}. revize</span>
                        : <span className="pill wait" style={{ alignSelf: 'flex-start' }}>Onay bekliyor</span>}
                    </a>
                  );
                })}
              </div>
            </>
          )}

          {special.length > 0 && (
            <>
              <div className="row-h2"><h2 className="h2">Yaklaşan özel günler</h2><a className="link" href="#/ozel-gunler">Tümü</a></div>
              <div className="card list">
                {special.slice(0, 4).map((s) => {
                  const d = parseYmd(s.date);
                  const n = plannedFor(s.date);
                  const days = Math.round((d - parseYmd(t0)) / 86400000);
                  return (
                    <a key={s.date + s.name} href={'#/ozel-gunler?date=' + s.date} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14 }}>
                      <div style={{ width: 48, flexShrink: 0, textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, lineHeight: '22px' }}>{d.getDate()}</div><div className="tiny">{shortDate(s.date).split(' ')[1]}</div></div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</span>
                        <span style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>{firmsFor(s, firms).slice(0, 6).map((f) => <Logo key={f.id} firm={f} size={18} radius={5} />)}<span className="tiny" style={{ marginLeft: 4 }}>{days === 0 ? 'bugün' : days + ' gün kaldı'}</span></span>
                        {s.idea && <span className="tiny" style={{ lineHeight: '16px' }}>{s.idea}</span>}
                      </div>
                      {n > 0 ? <span className="pill ok">{n} iş planlı</span> : <span className="pill alert">Plan yok</span>}
                    </a>
                  );
                })}
              </div>
            </>
          )}
          {gallery.length > 0 && (
            <>
              <div className="row-h2"><h2 className="h2">Galeriden son içerikler</h2><a className="link" href="#/galeri">Tümü ({gallery.length})</a></div>
              <div className="chips">
                {gallery.slice(0, 8).map((g) => {
                  const f = firms.find((x) => x.id === g.firmId);
                  return (
                    <a key={g.id} href={'#/galeri/' + g.id} style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 6, width: 120 }}>
                      {g.kind === 'video' ? <span className="card" style={{ width: 120, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="camera" /></span> : <PostPreview spec={g.spec || {}} firm={f} width={120} radius={12} />}
                      <span className="tiny" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Logo firm={f} size={16} radius={4} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f ? f.name : ''}</span></span>
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'hafta' && (
        groups.length === 0
          ? <div className="card empty"><span className="empty-ic"><Icon name="cal" size={28} /></span><b style={{ fontSize: 16, color: 'var(--ink)' }}>Bu hafta boş</b><span style={{ marginTop: 6 }}>Önümüzdeki 7 gün için planlı iş yok.</span></div>
          : groups.map((g) => (
            <div key={g.date}>
              <div className="row-h2"><h2 className="h2">{dayLabel(g.date)}</h2><span className="small">{g.items.filter((t) => !t.done).length} açık</span></div>
              <div className="stack">{g.items.map((t) => <TaskRow key={t.id} t={t} />)}</div>
            </div>
          ))
      )}

      {firms.length > 0 && tasks.length === 0 && (
        <p className="small" style={{ marginTop: 24 }}>İpucu: Sağ alttaki + ile ilk işini ekle. {firmName('bogazici-vip') ? 'Firmalar hazır yüklendi.' : ''}</p>
      )}

      <Fab to={'/yeni?date=' + t0} />
      <Nav active="/" />
    </div>
  );
}
