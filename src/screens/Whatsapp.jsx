import { useMemo, useState } from 'react';
import { useStore } from '../store.jsx';
import { Icon, Logo, back, go } from '../components/ui.jsx';
import { PostPreview, sharePost, FORMATS } from '../components/Post.jsx';
import { Hero } from '../components/Art.jsx';
import { askGemini, QuotaError } from '../ai.js';
import { todayYmd, upcomingSpecialDays } from '../data.js';

// WhatsApp grubundan gelen isteği posta çevirir: Paylaş → Moss (ya da yapıştır) → post hazırla → WhatsApp'ta gönder.
// Ücretsizdir; WhatsApp'a otomatik bağlanmaz (numara güvenliği için gönderimi ekip yapar).

const norm = (s) => (s || '').toLocaleLowerCase('tr').replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['ve', 'akademi', 'akademisi', 'eğitim', 'kurumları', 'vip', 'the']);

export function guessFirm(text, firms) {
  const t = norm(text);
  let best = null; let score = 0;
  firms.filter((f) => f.active !== false).forEach((f) => {
    let s = 0;
    if (f.whatsappGroup && t.includes(norm(f.whatsappGroup))) s += 10;
    if (t.includes(norm(f.name))) s += 6;
    norm(f.name).split(' ').filter((w) => w.length > 2 && !STOP.has(w)).forEach((w) => { if (t.includes(w)) s += 2; });
    if (s > score) { score = s; best = f; }
  });
  return best;
}

// WhatsApp'tan kopyalanan "[14:30, 01.11.2026] Melike Hanım: ..." biçimini ayıklar
function parse(text) {
  const lines = (text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const people = new Set();
  const body = lines.map((l) => {
    const m = l.match(/^\[?[\d.:/, ]+\]?\s*-?\s*([^:]{2,40}):\s*(.*)$/);
    if (m) { people.add(m[1].trim()); return m[2]; }
    return l;
  }).join('\n');
  return { body, people: [...people] };
}

export default function Whatsapp({ q }) {
  const { firms, tasks, config, addGallery, addJob, addChat, gallery } = useStore();
  const [text, setText] = useState(q.get('text') || '');
  const parsed = useMemo(() => parse(text), [text]);
  const guess = useMemo(() => guessFirm(text, firms), [text, firms]);
  const [firmId, setFirmId] = useState('');
  const [format, setFormat] = useState('kare');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [resultId, setResultId] = useState('');
  const [queued, setQueued] = useState(false);
  const [sent, setSent] = useState('');
  const active = firms.filter((f) => f.active !== false);
  const firm = firms.find((f) => f.id === (firmId || (guess && guess.id)));
  const item = gallery.find((g) => g.id === resultId);

  const prepare = async () => {
    if (!firm || !parsed.body.trim()) return;
    setErr(''); setBusy('hazirla'); setQueued(false); setSent('');
    const ask = 'WhatsApp grubundan müşteri isteği geldi. Firma: ' + firm.name + ' (id: ' + firm.id + ').'
      + (parsed.people.length ? ' Yazan: ' + parsed.people.join(', ') + '.' : '')
      + '\nİstek: "' + parsed.body.trim() + '"\n'
      + 'Bu firma için TEK bir Instagram postu hazırla (create_post, format: ' + format + '). Bilmediğin sonuç, isim, rakam, tarih gibi bilgileri uydurma; [SONUÇ], [İSİM] gibi yer tutucu bırak. Paylaşım metnini de yaz.';
    try {
      if (!config.geminiKey) throw new Error('anahtar yok');
      const t0 = todayYmd();
      const r = await askGemini({
        key: config.geminiKey, model: config.geminiModel || 'gemini-flash-latest',
        messages: [{ role: 'user', text: ask }],
        context: {
          today: t0, focusFirm: firm.name + ' (' + firm.id + ')',
          firms: [{ id: firm.id, name: firm.name, sector: firm.sector, active: true, notes: (firm.notes || '').slice(0, 300) }],
          tasks: tasks.filter((t) => t.firmId === firm.id && !t.done && t.date >= t0).slice(0, 10).map((t) => ({ title: t.title, type: t.type, date: t.date })),
          special: upcomingSpecialDays(30)
        }
      });
      const a = (r.actions || []).find((x) => x.action === 'create_post');
      if (!a) throw new Error('post yok');
      const { action, firmId: _f, title, caption, tags, date, time, ...rest } = a;
      const spec = { ...rest, format, template: ['anma', 'kutlama', 'duyuru', 'urun', 'alinti'].includes(rest.template) ? rest.template : 'duyuru' };
      const id = await addGallery({ firmId: firm.id, kind: 'post', title: title || 'WhatsApp isteği', caption: caption || '', tags: tags || '', date: date || '', time: time || '', source: 'whatsapp', request: parsed.body.trim().slice(0, 500), spec });
      setResultId(id);
    } catch (e) {
      // Anlık asistan yoksa / kota dolduysa: Claude'un saatlik sırasına
      const id = await addJob({ kind: 'post', firmId: firm.id, text: 'WhatsApp isteği (' + firm.name + '): ' + parsed.body.trim() + ' · Format: ' + format });
      await addChat({ role: 'assistant', via: 'sistem', jobId: id, text: firm.name + ' WhatsApp isteği ' + (e instanceof QuotaError ? '(anlık asistanın kotası doldu) ' : '') + 'Claude’un sırasına alındı; post en geç yaklaşık 1 saat içinde galeride olacak.' });
      setQueued(true);
    }
    setBusy('');
  };

  const send = async () => {
    if (!item) return;
    setErr(''); setBusy('gonder');
    try {
      const caption = (item.caption || '') + (item.tags ? '\n\n' + item.tags : '');
      const how = await sharePost(item.spec || {}, firm, caption, (firm ? firm.id : 'post') + '-whatsapp');
      setSent(how === 'shared' ? 'Paylaşım menüsü açıldı: WhatsApp → ' + (firm && firm.whatsappGroup ? '“' + firm.whatsappGroup + '”' : 'müşteri grubu') + ' seç. Metin panoya da kopyalandı.' : 'Görsel indirildi ve WhatsApp açıldı. Görseli gruba ekle; metin panoya kopyalandı.');
    } catch (e) {
      if (e && e.name !== 'AbortError') setErr('Gönderilemedi: ' + (e.message || e));
    }
    setBusy('');
  };

  return (
    <div className="screen no-nav">
      <Hero color="#25D366" Art={WaGlyph} />
      <button className="back" onClick={() => back('/asistan')}><Icon name="left" size={20} />Geri</button>
      <h1 className="h1" style={{ marginTop: 8, marginBottom: 6 }}>WhatsApp isteği</h1>
      <p className="small" style={{ margin: '0 0 16px', fontSize: 13 }}>Müşterinin gruptaki mesajını buraya getir; postu hazırlayalım, sen bakıp tek dokunuşla gruba gönder.</p>

      <label className="label" htmlFor="wtext">Gelen mesaj</label>
      <textarea id="wtext" className="textarea" style={{ marginTop: 7 }} value={text} onChange={(e) => { setText(e.target.value); setResultId(''); setQueued(false); }}
        placeholder="Örn. Melike Hanım: MSÜ sonuçları açıklandı, Yunus Emre Bey bununla ilgili post alabilir miyiz?" />
      {parsed.people.length > 0 && <p className="tiny" style={{ marginTop: 6 }}>Yazan: {parsed.people.join(', ')}</p>}

      <h2 className="h2 hi"><span className="h-ic"><Icon name="building" size={14} /></span>Firma{guess && !firmId ? <span className="pill ok" style={{ marginLeft: 6 }}>Otomatik bulundu</span> : null}</h2>
      <div className="chips">
        {[...active].sort((x, y) => (firm && y.id === firm.id) - (firm && x.id === firm.id)).map((f) => (
          <button key={f.id} type="button" className="chip" aria-pressed={firm && firm.id === f.id} onClick={() => { setFirmId(f.id); setResultId(''); }} style={{ paddingLeft: 8 }}>
            <Logo firm={f} size={20} radius={5} />{f.name}
          </button>
        ))}
      </div>

      <h2 className="h2 hi"><span className="h-ic"><Icon name="star" size={14} /></span>Biçim</h2>
      <div className="chips wrap">
        {Object.entries(FORMATS).map(([k, v]) => <button key={k} type="button" className="chip" aria-pressed={format === k} onClick={() => { setFormat(k); setResultId(''); }}>{v.label}</button>)}
      </div>

      <button className="btn primary" style={{ width: '100%', marginTop: 18 }} disabled={!firm || !parsed.body.trim() || busy === 'hazirla'} onClick={prepare}>
        <Icon name="sparkle" size={18} color="#fff" />{busy === 'hazirla' ? 'Post hazırlanıyor…' : item ? 'Yeniden hazırla' : 'Postu hazırla'}
      </button>
      {!firm && text.trim() && <p className="tiny" style={{ marginTop: 6 }}>Firmayı seç.</p>}

      {queued && (
        <div className="card pad" role="status" style={{ marginTop: 16, background: 'var(--wait-soft)', borderColor: 'transparent' }}>
          <b style={{ color: 'var(--wait)' }}>Claude’un sırasında.</b> <span className="small" style={{ color: 'var(--wait)' }}>Post en geç yaklaşık 1 saat içinde {firm ? firm.name : 'firmanın'} galerisinde olacak; oradan “WhatsApp’ta gönder” ile gruba atabilirsin.</span>
        </div>
      )}

      {item && (
        <>
          <h2 className="h2 hi"><span className="h-ic"><Icon name="check" size={14} /></span>Hazır: kontrol et</h2>
          <div style={{ display: 'flex', justifyContent: 'center' }}><PostPreview spec={item.spec || {}} firm={firm} width={Math.min(340, window.innerWidth - 32)} /></div>
          {item.caption && <p className="card pad" style={{ margin: '12px 0 0', fontSize: 14, lineHeight: '21px', whiteSpace: 'pre-wrap' }}>{item.caption}{item.tags ? '\n\n' + item.tags : ''}</p>}
          {/\[[A-ZÇĞİÖŞÜ ]+\]/.test(JSON.stringify(item.spec || {}) + (item.caption || '')) && <p className="small" style={{ color: 'var(--wait)', fontWeight: 600, marginTop: 8 }}>Köşeli parantezli yerleri ([SONUÇ] gibi) göndermeden önce düzenle.</p>}
          <button className="btn primary" style={{ width: '100%', marginTop: 14, background: 'linear-gradient(180deg,#2BB75A,#1E9447)', borderColor: '#1E9447' }} disabled={busy === 'gonder'} onClick={send}>
            <WaGlyph width={20} height={20} style={{ color: '#fff' }} />{busy === 'gonder' ? 'Hazırlanıyor…' : 'WhatsApp’ta gönder'}
          </button>
          {sent && <p className="small" role="status" style={{ marginTop: 8 }}>{sent}</p>}
          <div className="grid2" style={{ marginTop: 10 }}>
            <button className="btn" onClick={() => go('/galeri/' + item.id)}><Icon name="edit" size={16} />Düzenle</button>
            <button className="btn" onClick={async () => { await addJob({ kind: 'post', galleryId: item.id, firmId: item.firmId, text: 'WhatsApp isteği için özgün tasarım: ' + parsed.body.trim() }); go('/galeri/' + item.id); }}><Icon name="sparkle" size={16} />Özel tasarım</button>
          </div>
        </>
      )}
      {err && <p className="err" role="alert" style={{ marginTop: 10 }}>{err}</p>}

      <details className="card pad small" style={{ marginTop: 24 }}>
        <summary style={{ fontWeight: 600, color: 'var(--ink)', cursor: 'pointer' }}>WhatsApp’tan buraya nasıl getiririm?</summary>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: '21px' }}>
          <li><b>Android:</b> Mesaja basılı tut → ⋮ → Paylaş → <b>Moss</b> (uygulama ana ekrana ekliyse listede çıkar). Mesaj bu ekrana kendiliğinden gelir.</li>
          <li><b>iPhone:</b> Mesaja basılı tut → Kopyala → Moss’ta bu ekranı aç → yapıştır.</li>
          <li>Firma, mesajdaki isimden ya da firma sayfasındaki <b>WhatsApp grup adı</b>ndan otomatik bulunur.</li>
        </ul>
      </details>
    </div>
  );
}

export function WaGlyph(p) {
  return (
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="M60 14a46 46 0 0 0-39.6 69.4L14 106l23.4-6.2A46 46 0 1 0 60 14z" />
      <path d="M44 42c2-4 6-4 8 0l3 7c1 2 0 4-2 6l-2 2c3 7 9 13 16 16l2-2c2-2 4-3 6-2l7 3c4 2 4 6 0 8-6 4-14 3-24-4s-17-16-18-24c0-4 1-7 4-10z" />
    </svg>
  );
}
