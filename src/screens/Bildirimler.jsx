import { useEffect, useState } from 'react';
import { useStore } from '../store.jsx';
import { Nav, Icon, Logo, back } from '../components/ui.jsx';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';
import { timeAgo } from '../data.js';

const KIND = {
  task: { label: 'Yeni iş', icon: 'plus', bg: '#E3EADB', fg: '#2F4A2C' },
  done: { label: 'Tamamlandı', icon: 'check', bg: '#E3EADB', fg: '#2F4A2C' },
  comment: { label: 'Yorum', icon: 'msg', bg: '#DCE7F3', fg: '#1F4770' },
  approval: { label: 'Müşteri onayı', icon: 'shield', bg: '#ECE2F2', fg: '#5A2F73' },
  firm: { label: 'Firma', icon: 'building', bg: '#F6E3CF', fg: '#7A3E0C' },
  gallery: { label: 'Galeri', icon: 'star', bg: '#E3EADB', fg: '#2F4A2C' }
};

export default function Bildirimler() {
  const { activity, user, firms, tasks, deleteSamples, profile } = useStore();
  const samples = tasks.filter((t) => t.sample).length;
  const key = 'moss-seen-' + user.uid;
  const [seen] = useState(() => Number(localStorage.getItem(key) || 0));
  useEffect(() => {
    const newest = activity.reduce((m, a) => Math.max(m, a.atMs || 0), 0);
    if (newest) localStorage.setItem(key, String(Math.max(newest, Number(localStorage.getItem(key) || 0))));
  }, [activity]);

  return (
    <div className="screen">
      <button className="back" onClick={() => back('/')}><Icon name="left" size={20} />Geri</button>
      <h1 className="h1" style={{ marginTop: 6 }}>Bildirimler</h1>
      <div className="stack">
        {activity.length === 0 && <div className="card empty">Henüz hareket yok. Ekipten biri iş eklediğinde, yorum yazdığında ya da bir işi bitirdiğinde burada görünecek.</div>}
        {activity.map((a) => {
          const k = KIND[a.kind] || KIND.task;
          const unread = a.atMs > seen && a.by !== user.uid;
          const firm = firms.find((f) => f.id === a.firmId);
          const href = a.taskId ? '#/is/' + a.taskId : a.galleryId ? '#/galeri/' + a.galleryId : a.firmId ? '#/firma/' + a.firmId : '#/';
          return (
            <a key={a.id} href={href} className="card" style={{ display: 'flex', gap: 12, padding: 14, background: unread ? 'var(--surface)' : 'var(--surface-2)' }}>
              {firm ? <Logo firm={firm} size={40} radius={12} />
                : <span aria-hidden="true" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: k.bg, color: k.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={k.icon} size={20} /></span>}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span className="tiny" style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{k.label} · {a.byName} · {timeAgo(a.atMs)}</span>
                <span style={{ fontSize: 15, lineHeight: '21px', fontWeight: unread ? 600 : 400 }}>{a.text}</span>
              </div>
              {unread && <span role="img" aria-label="Okunmadı" style={{ width: 10, height: 10, marginTop: 6, flexShrink: 0, borderRadius: 5, background: 'var(--alert)' }} />}
            </a>
          );
        })}
      </div>

      <h2 className="h2" style={{ marginTop: 28 }}>Telefon bildirimleri</h2>
      <div className="card pad small" style={{ lineHeight: '19px' }}>
        “Yaptın mı?”, çekim sabahı, içerik stoğu ve özel gün hatırlatmaları bir sonraki güncellemede telefonuna düşmeye başlayacak.
        Şimdilik ekipteki tüm hareketleri bu ekranda görüyorsun.
      </div>
      <h2 className="h2" style={{ marginTop: 28 }}>Hesap</h2>
      <div className="card list">
        {samples > 0 && (
          <button className="switch" onClick={() => { if (confirm(samples + ' örnek iş silinsin mi? Kendi eklediğiniz işler silinmez.')) deleteSamples(); }}>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 15, fontWeight: 600, color: 'var(--alert-ink)' }}>Örnek işleri sil ({samples})</span><span className="tiny">Uygulamayı tanımanız için eklenen örnek işler</span></span>
          </button>
        )}
        <button className="switch" onClick={() => { if (confirm('Çıkış yapılsın mı?')) signOut(auth); }}>
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 15, fontWeight: 600 }}>Çıkış yap</span><span className="tiny">{(profile && profile.name) || ''} · {user.email}</span></span>
          <Icon name="logout" size={20} />
        </button>
      </div>
      <Nav active="/bildirimler" />
    </div>
  );
}
