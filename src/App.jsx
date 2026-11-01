import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { isConfigured } from './firebase.js';
import { StoreProvider, useStore } from './store.jsx';
import { DialogProvider } from './components/Dialog.jsx';
import { useRoute, UndoToast } from './components/ui.jsx';
import Login from './screens/Login.jsx';
import Akis from './screens/Akis.jsx';
import Takvim from './screens/Takvim.jsx';
import Uretim from './screens/Uretim.jsx';
import Firmalar from './screens/Firmalar.jsx';
import Firma from './screens/Firma.jsx';
import Is from './screens/Is.jsx';
import IsForm from './screens/IsForm.jsx';
import Bildirimler from './screens/Bildirimler.jsx';
import Galeri, { GaleriItem } from './screens/Galeri.jsx';
import Asistan from './screens/Asistan.jsx';
import CekimPlani from './screens/CekimPlani.jsx';
import Performans from './screens/Performans.jsx';
import Edit, { EditProje } from './screens/Edit.jsx';
import Whatsapp from './screens/Whatsapp.jsx';

// WhatsApp'tan 'Paylaş → Moss' ile gelen metni WhatsApp isteği ekranına yönlendir (PWA share_target)
(() => {
  const sp = new URLSearchParams(window.location.search);
  const shared = [sp.get('title'), sp.get('text'), sp.get('url')].filter(Boolean).join('\n').trim();
  if (shared) {
    window.history.replaceState(null, '', window.location.pathname + '#/whatsapp?text=' + encodeURIComponent(shared));
  }
})();

function UpdateToast() {
  const { needRefresh: [need], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) { if (reg) setInterval(() => reg.update(), 60 * 60 * 1000); }
  });
  if (!need) return null;
  return (
    <div className="toast" role="status">
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Yeni sürüm hazır.</span>
      <button onClick={() => updateServiceWorker(true)}>Yenile</button>
    </div>
  );
}

function NameGate({ children }) {
  const { user, profile, profileLoaded, saveProfile, ready } = useStore();
  const [name, setName] = useState(localStorage.getItem('moss-pending-name') || '');
  useEffect(() => {
    const pending = localStorage.getItem('moss-pending-name');
    if (user && ready && !profile && pending) { saveProfile(pending); localStorage.removeItem('moss-pending-name'); }
  }, [user, ready, profile]);
  if (!ready || !profileLoaded) return <div className="center-screen"><p className="small" role="status">Yükleniyor…</p></div>;
  if (!profile) {
    return (
      <form className="center-screen" onSubmit={(e) => { e.preventDefault(); if (name.trim()) saveProfile(name.trim()); }}>
        <h1 className="h1">Hoş geldin</h1>
        <div className="field">
          <label className="label" htmlFor="adim">Ekip arkadaşlarının göreceği adın</label>
          <input id="adim" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <button className="btn primary" style={{ marginTop: 16 }} type="submit">Devam</button>
      </form>
    );
  }
  return children;
}

function Router() {
  const r = useRoute();
  const [a, b] = r.parts;
  if (!a) return <Akis />;
  if (a === 'takvim') return <Takvim />;
  if (a === 'uretim') return <Uretim />;
  if (a === 'firmalar') return <Firmalar />;
  if (a === 'firma' && b) return <Firma id={b} />;
  if (a === 'is' && b) return <Is id={b} />;
  if (a === 'yeni') return <IsForm q={r.q} />;
  if (a === 'duzenle' && b) return <IsForm id={b} q={r.q} />;
  if (a === 'bildirimler') return <Bildirimler />;
  if (a === 'galeri' && b) return <GaleriItem id={b} />;
  if (a === 'galeri') return <Galeri />;
  if (a === 'asistan') return <Asistan />;
  if (a === 'cekim-plani') return <CekimPlani />;
  if (a === 'performans') return <Performans />;
  if (a === 'edit' && b) return <EditProje id={b} />;
  if (a === 'edit') return <Edit />;
  if (a === 'whatsapp') return <Whatsapp q={r.q} />;
  return <Akis />;
}

function Gate() {
  const { user } = useStore();
  if (user === undefined) return <div className="center-screen"><p className="small" role="status">Yükleniyor…</p></div>;
  if (!user) return <Login />;
  return <NameGate><Router /></NameGate>;
}

export default function App() {
  if (!isConfigured) {
    return (
      <div className="center-screen">
        <h1 className="h1">Kurulum bekleniyor</h1>
        <p className="small">Firebase ayarları henüz eklenmedi. <code>src/firebase-config.js</code> dosyasını doldurun.</p>
      </div>
    );
  }
  return (
    <StoreProvider>
      <UpdateToast />
      <UndoToast />
      <DialogProvider><div className="app"><Gate /></div></DialogProvider>
    </StoreProvider>
  );
}
