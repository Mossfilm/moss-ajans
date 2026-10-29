import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase.js';
import { ALLOWED_EMAILS } from '../firebase-config.js';

const MSG = {
  'auth/invalid-credential': 'E-posta ya da şifre hatalı.',
  'auth/wrong-password': 'Şifre hatalı.',
  'auth/user-not-found': 'Bu e-postayla hesap yok. “İlk kez giriyorum” seçeneğini kullan.',
  'auth/email-already-in-use': 'Bu e-postayla zaten hesap var. Giriş yap seçeneğini kullan.',
  'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
  'auth/invalid-email': 'E-posta adresi geçersiz.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.'
};

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setInfo('');
    const em = email.trim().toLowerCase();
    if (mode === 'register' && !ALLOWED_EMAILS.includes(em)) {
      setErr('Bu e-posta ekip listesinde yok. Yöneticiden eklenmesini iste.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, em, pass);
      else {
        await createUserWithEmailAndPassword(auth, em, pass);
        localStorage.setItem('moss-pending-name', name.trim());
      }
    } catch (x) {
      setErr(MSG[x.code] || 'Bir sorun oluştu: ' + x.code);
    }
    setBusy(false);
  };

  const reset = async () => {
    setErr(''); setInfo('');
    if (!email) { setErr('Önce e-posta adresini yaz.'); return; }
    try { await sendPasswordResetEmail(auth, email.trim().toLowerCase()); setInfo('Şifre sıfırlama bağlantısı e-postana gönderildi.'); }
    catch (x) { setErr(MSG[x.code] || 'Bir sorun oluştu: ' + x.code); }
  };

  return (
    <div className="center-screen">
      <img src="/icons/icon-192.png" alt="" width="64" height="64" style={{ borderRadius: 18 }} />
      <h1 className="h1" style={{ marginTop: 20 }}>Moss Ajans</h1>
      <p className="small" style={{ margin: '-8px 0 20px' }}>Ekip iş takip uygulaması</p>
      <div className="seg" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 18 }}>
        <button type="button" aria-pressed={mode === 'login'} onClick={() => setMode('login')}>Giriş yap</button>
        <button type="button" aria-pressed={mode === 'register'} onClick={() => setMode('register')}>İlk kez giriyorum</button>
      </div>
      <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
        {mode === 'register' && (
          <div className="field">
            <label className="label" htmlFor="ad">Adın</label>
            <input id="ad" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="Örn. Ahmet" />
          </div>
        )}
        <div className="field">
          <label className="label" htmlFor="ep">E-posta</label>
          <input id="ep" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" inputMode="email" />
        </div>
        <div className="field">
          <label className="label" htmlFor="sf">{mode === 'register' ? 'Şifre belirle' : 'Şifre'}</label>
          <input id="sf" className="input" type="password" value={pass} onChange={(e) => setPass(e.target.value)} required minLength={6} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
        </div>
        {err && <p className="err" role="alert" style={{ margin: 0 }}>{err}</p>}
        {info && <p className="small" role="status" style={{ margin: 0, color: 'var(--moss)' }}>{info}</p>}
        <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Bekle…' : mode === 'login' ? 'Giriş yap' : 'Hesabımı oluştur'}</button>
        {mode === 'login' && <button type="button" className="link" style={{ alignSelf: 'center', height: 44 }} onClick={reset}>Şifremi unuttum</button>}
      </form>
    </div>
  );
}
