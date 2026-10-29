import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Nav, Fab, TaskRow, Logo, Icon } from '../components/ui.jsx';
import { todayYmd, ymd, addDays, dayLabel, DAYS, MONTHS, upcomingSpecialDays, shortDate, parseYmd } from '../data.js';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';

const byTime = (a, b) => ((a.date + (a.time || '99')) < (b.date + (b.time || '99')) ? -1 : 1);

export default function Akis() {
  const { tasks, firms, profile } = useStore();
  const [tab, setTab] = useState('bugun');
  const t0 = todayYmd();
  const end = ymd(addDays(new Date(), 6));
  const now = new Date();

  const today = tasks.filter((t) => t.date === t0).sort(byTime);
  const overdue = tasks.filter((t) => t.date && t.date < t0 && !t.done).sort(byTime);
  const week = tasks.filter((t) => t.date >= t0 && t.date <= end).sort(byTime);
  const waiting = tasks.filter((t) => t.stage === 4 && !t.done);
  const special = upcomingSpecialDays(40);

  const todayLeft = today.filter((t) => !t.done).length;
  const weekLeft = week.filter((t) => !t.done).length;
  const headline = tab === 'bugun'
    ? (today.length === 0 ? 'Bugün planlı iş yok' : todayLeft === 0 ? 'Bugünlük her şey tamam' : 'Bugün ' + todayLeft + ' iş var')
    : 'Bu hafta ' + weekLeft + ' iş var';

  const groups = [];
  week.forEach((t) => {
    const g = groups.find((x) => x.date === t.date);
    if (g) g.items.push(t); else groups.push({ date: t.date, items: [t] });
  });

  const firmName = (id) => (firms.find((f) => f.id === id) || {}).name;
  const plannedFor = (date) => tasks.filter((t) => t.date === date).length;

  return (
    <div className="screen">
      <div className="topbar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="eyebrow">Moss Ajans</span>
          <span className="small">{DAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]}</span>
        </div>
        <button className="icon-btn" aria-label={'Çıkış yap (' + ((profile && profile.name) || '') + ')'} onClick={() => { if (confirm('Çıkış yapılsın mı?')) signOut(auth); }}>
          <Icon name="logout" size={20} />
        </button>
      </div>
      <h1 className="h1">{headline}</h1>

      <div className="seg" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <button aria-pressed={tab === 'bugun'} onClick={() => setTab('bugun')}>Bugün</button>
        <button aria-pressed={tab === 'hafta'} onClick={() => setTab('hafta')}>Bu hafta</button>
      </div>

      {tab === 'bugun' && (
        <>
          {overdue.length > 0 && (
            <>
              <div className="row-h2"><h2 className="h2" style={{ color: 'var(--alert-ink)' }}>Geciken işler</h2><span className="small">{overdue.length} iş</span></div>
              <div className="stack">{overdue.map((t) => <TaskRow key={t.id} t={t} showDate />)}</div>
            </>
          )}

          <div className="row-h2"><h2 className="h2">{dayLabel(t0)}</h2><span className="small">{todayLeft ? todayLeft + ' açık iş' : ''}</span></div>
          {today.length ? <div className="stack">{today.map((t) => <TaskRow key={t.id} t={t} />)}</div>
            : <a href={'#/yeni?date=' + t0} className="card empty" style={{ display: 'block' }}>Bugün için iş yok. Eklemek için dokun.</a>}

          {waiting.length > 0 && (
            <>
              <div className="row-h2"><h2 className="h2">Müşteri onayı bekleyen</h2><a className="link" href="#/uretim">Üretim hattı</a></div>
              <div className="chips">
                {waiting.map((t) => {
                  const f = firms.find((x) => x.id === t.firmId);
                  return (
                    <a key={t.id} href={'#/is/' + t.id} className="card" style={{ flex: '0 0 210px', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="tiny"><Logo firm={f} size={22} />{f ? f.name : ''}</span>
                      <span style={{ fontSize: 15, lineHeight: '20px', fontWeight: 600 }}>{t.title}</span>
                      {t.revisions > 0 ? <span className="pill alert" style={{ alignSelf: 'flex-start' }}>{t.revisions}. revize</span>
                        : <span className="pill neutral" style={{ alignSelf: 'flex-start' }}>Onay bekliyor</span>}
                    </a>
                  );
                })}
              </div>
            </>
          )}

          {special.length > 0 && (
            <>
              <h2 className="h2">Yaklaşan özel günler</h2>
              <div className="card list">
                {special.slice(0, 4).map((s) => {
                  const d = parseYmd(s.date);
                  const n = plannedFor(s.date);
                  const days = Math.round((d - parseYmd(t0)) / 86400000);
                  return (
                    <a key={s.date + s.name} href={'#/takvim?date=' + s.date} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14 }}>
                      <div style={{ width: 48, flexShrink: 0, textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700, lineHeight: '22px' }}>{d.getDate()}</div><div className="tiny">{shortDate(s.date).split(' ')[1]}</div></div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</span>
                        <span className="tiny">{(s.who ? s.who + ' · ' : '') + (days === 0 ? 'bugün' : days + ' gün kaldı')}</span>
                      </div>
                      {n > 0 ? <span className="pill ok">{n} iş planlı</span> : <span className="pill alert">Plan yok</span>}
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
          ? <div className="card empty" style={{ marginTop: 24 }}>Önümüzdeki 7 gün için planlı iş yok.</div>
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
