import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Switch } from './ui.jsx';

const PREFS = [
  ['check', '“Yaptın mı?” kontrolü', 'İşin saatinden 30 dk sonra, yapılmadıysa sorar'],
  ['morning', 'Sabah özeti (08:00)', 'O günün işleri tek bildirimde'],
  ['shootDay', 'Çekim sabahı hazırlık (08:00)', 'Çekim listesindeki eksikleri söyler'],
  ['dayBefore', 'Yarınki işler (18:00)', 'Ertesi günün işlerini önceden hatırlatır'],
  ['special', 'Özel günler (09:00)', '3 hafta ve 1 hafta kala tasarım hatırlatması'],
  ['weekly', 'Haftalık çekim planı (pazartesi)', 'Bu haftanın çekim önerileri hazır olunca']
];

function b64ToUint8(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export default function PushSettings() {
  const { pushSub, savePush, removePush } = useStore();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const standalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
  const on = Boolean(pushSub && pushSub.sub);
  const prefs = { check: true, morning: true, shootDay: true, dayBefore: true, special: true, weekly: true, ...((pushSub && pushSub.prefs) || {}) };

  const enable = async () => {
    setMsg(''); setBusy(true);
    try {
      const r = await fetch('/.netlify/functions/push-anahtar');
      if (!r.ok) { setMsg('Telefon bildirimleri sunucuda henüz açılmadı. Kurulum tamamlanınca bu düğme çalışacak.'); setBusy(false); return; }
      const { key } = await r.json();
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setMsg('Bildirim izni verilmedi. Telefonun ayarlarından Moss için bildirimlere izin verebilirsin.'); setBusy(false); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(key) });
      await savePush({ sub: JSON.parse(JSON.stringify(sub)), prefs, device: navigator.userAgent.slice(0, 120) });
      setMsg('Bildirimler açıldı.');
    } catch (e) {
      setMsg('Bildirimler açılamadı: ' + (e.message || e));
    }
    setBusy(false);
  };
  const disable = async () => {
    setBusy(true);
    try { const reg = await navigator.serviceWorker.ready; const s = await reg.pushManager.getSubscription(); if (s) await s.unsubscribe(); } catch (e) { /* yok say */ }
    await removePush(); setMsg('Bildirimler kapatıldı.'); setBusy(false);
  };
  const toggle = (k) => savePush({ prefs: { ...prefs, [k]: !prefs[k] } });

  return (
    <>
      <h2 className="h2" style={{ marginTop: 28 }}>Telefon bildirimleri</h2>
      {!supported || (isIOS && !standalone) ? (
        <div className="card pad small" style={{ lineHeight: '19px' }}>
          {isIOS && !standalone
            ? 'iPhone’da bildirim alabilmek için uygulamayı Safari’de açıp Paylaş → “Ana Ekrana Ekle” ile kur, sonra ana ekrandaki Moss simgesinden açıp bu düğmeye bas (iOS 16.4 ve üzeri).'
            : 'Bu tarayıcı telefon bildirimlerini desteklemiyor.'}
        </div>
      ) : (
        <div className="card list">
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{on ? 'Bu telefonda açık' : 'Kapalı'}</span>
              <span className="tiny">Uygulama kapalıyken de hatırlatma gelir. 22:00–08:00 arası sessiz.</span>
            </span>
            <button className={'btn sm' + (on ? '' : ' primary')} disabled={busy} onClick={on ? disable : enable}>{busy ? 'Bekle…' : on ? 'Kapat' : 'Aç'}</button>
          </div>
          {on && PREFS.map(([k, l, h]) => <Switch key={k} on={prefs[k]} onToggle={() => toggle(k)} label={l} hint={h} />)}
        </div>
      )}
      {msg && <p className="small" role="status" style={{ marginTop: 8 }}>{msg}</p>}
    </>
  );
}
