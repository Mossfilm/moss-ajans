import { useEffect, useState } from 'react';
import { TYPES, shortDate } from '../data.js';
import { useStore } from '../store.jsx';

// ---- Basit hash yönlendirme ----
export function useRoute() {
  const get = () => {
    const h = window.location.hash.replace(/^#/, '') || '/';
    const [path, qs] = h.split('?');
    return { path, parts: path.split('/').filter(Boolean), q: new URLSearchParams(qs || '') };
  };
  const [r, setR] = useState(get);
  useEffect(() => {
    const on = () => { setR(get()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}
export const go = (to) => { window.location.hash = to; };
export const back = (fallback = '/') => {
  if (window.history.length > 1) window.history.back(); else go(fallback);
};

// ---- İkonlar ----
const P = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  cal: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  flow: <><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="11" rx="1.5" /><rect x="17" y="4" width="4" height="7" rx="1.5" /></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  right: <path d="M9 6l6 6-6 6" />,
  left: <path d="M15 6l-6 6 6 6" />,
  send: <path d="M5 12h14M13 6l6 6-6 6" />,
  msg: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  sparkle: <><path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8z" /><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z" /></>,
  up: <path d="M6 15l6-6 6 6" />,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M14 6l4 4" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  camera: <><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3" /></>,
  shield: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  logout: <><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" /></>,
  film: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 3v18M17 3v18M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
  music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  ig: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></>
};
export function Icon({ name, size = 22, color = 'currentColor', width = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}

export function Logo({ firm, size = 22, radius = 6 }) {
  if (firm && firm.logo) {
    return <img className="logo" src={firm.logo} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: radius }} />;
  }
  const initials = ((firm && firm.name) || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toLocaleUpperCase('tr');
  return <span className="logo-fallback" aria-hidden="true" style={{ width: size, height: size, borderRadius: radius, fontSize: Math.max(10, size * 0.36) }}>{initials}</span>;
}

export function TypePill({ type }) {
  const t = TYPES[type] || TYPES.diger;
  return <span className="pill" style={{ background: t.bg, color: t.fg }}>{t.label}</span>;
}

export function Check({ on }) {
  return <span className={'box' + (on ? ' on' : '')}>{on && <Icon name="check" size={14} color="#fff" width={3} />}</span>;
}

export function TaskRow({ t, showDate = false }) {
  const { firms, users, toggleDone } = useStore();
  const firm = firms.find((f) => f.id === t.firmId);
  const who = assigneeLabel(t, users);
  return (
    <div className="task">
      <button className="check" onClick={() => toggleDone(t)} aria-label={t.done ? 'Yapılmadı olarak işaretle' : 'Yapıldı olarak işaretle'}>
        <Check on={t.done} />
      </button>
      <a className="body" href={'#/is/' + t.id}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="meta">
            <Logo firm={firm} size={22} />
            <span><b style={{ color: 'var(--ink)', fontWeight: 600 }}>{showDate ? shortDate(t.date) + ' ' : ''}{t.time || 'Saat yok'}</b> · {firm ? firm.name : 'Firma yok'}</span>
          </div>
          <div className={'title' + (t.done ? ' done' : '')}>{t.title}</div>
          <div className="tags">
            <TypePill type={t.type} />
            {who && <span className="tiny">{who}</span>}
            {t.commentCount > 0 && <span className="tiny" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="msg" size={14} />{t.commentCount}</span>}
          </div>
        </div>
        <Icon name="right" size={18} color="#7C857E" />
      </a>
    </div>
  );
}

export function assigneeLabel(t, users) {
  const a = t.assignees || [];
  if (!a.length) return '';
  if (a.includes('all')) return 'Tüm ekip';
  return a.map((id) => (users.find((u) => u.id === id) || {}).name).filter(Boolean).join(', ');
}

export function BellButton() {
  const { activity, user } = useStore();
  const seen = Number(localStorage.getItem('moss-seen-' + (user && user.uid)) || 0);
  const unread = activity.filter((a) => a.atMs > seen && a.by !== (user && user.uid)).length;
  return (
    <a className="icon-btn" href="#/bildirimler" aria-label={'Bildirimler' + (unread ? ', ' + unread + ' okunmamış' : '')}>
      <Icon name="bell" />
      {unread > 0 && <span className="badge" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
    </a>
  );
}

export function useUnread() {
  const { activity, user } = useStore();
  const seen = Number(localStorage.getItem('moss-seen-' + (user && user.uid)) || 0);
  return activity.filter((a) => a.atMs > seen && a.by !== (user && user.uid)).length;
}

export function Nav({ active }) {
  const unread = useUnread();
  const items = [
    ['/', 'home', 'Akış'], ['/takvim', 'cal', 'Takvim'], ['/uretim', 'flow', 'Üretim'],
    ['/firmalar', 'building', 'Firmalar'], ['/edit', 'film', 'Edit'], ['/asistan', 'sparkle', 'Asistan']
  ];
  return (
    <nav className="nav" aria-label="Ana menü">
      <div className="inner">
        {items.map(([to, icon, label]) => (
          <a key={to} href={'#' + to} aria-current={active === to ? 'page' : undefined} style={{ position: 'relative' }}>
            <Icon name={icon} size={24} />{label}
            {false && unread > 0 && <span className="badge" style={{ top: 0, right: 'calc(50% - 22px)' }} aria-label={unread + ' okunmamış'}>{unread > 9 ? '9+' : unread}</span>}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function Fab({ to = '/yeni' }) {
  return <a className="fab" href={'#' + to} aria-label="Yeni iş ekle"><Icon name="plus" size={26} color="#fff" width={2.4} /></a>;
}

export function Switch({ on, onToggle, label, hint }) {
  return (
    <button type="button" role="switch" aria-checked={on ? 'true' : 'false'} className="switch" onClick={onToggle}>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span>
        {hint && <span className="tiny">{hint}</span>}
      </span>
      <span className="track" aria-hidden="true"><span className="knob" /></span>
    </button>
  );
}

export function initials(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toLocaleUpperCase('tr');
}
