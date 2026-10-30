import { createContext, useContext, useEffect, useRef, useState } from 'react';

// Uygulama içi onay / not penceresi (telefonun sistem pencereleri yerine).
// Kullanım: const ask = useAsk(); const ok = await ask({ title, message, confirmText, danger });
//           const note = await ask({ title, input: true, placeholder });  // iptalde null
const Ctx = createContext(null);
export const useAsk = () => useContext(Ctx);

export function DialogProvider({ children }) {
  const [req, setReq] = useState(null);
  const [val, setVal] = useState('');
  const inputRef = useRef(null);
  const btnRef = useRef(null);

  const ask = (opts) => new Promise((resolve) => { setVal(opts.defaultValue || ''); setReq({ ...opts, resolve }); });
  const close = (result) => { if (req) req.resolve(result); setReq(null); };

  useEffect(() => {
    if (!req) return undefined;
    const t = setTimeout(() => { (req.input ? inputRef.current : btnRef.current)?.focus(); }, 30);
    const onKey = (e) => { if (e.key === 'Escape') close(req.input ? null : false); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [req]);

  return (
    <Ctx.Provider value={ask}>
      {children}
      {req && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(22,32,26,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) close(req.input ? null : false); }}>
          <form role="dialog" aria-modal="true" aria-labelledby="dlg-title"
            onSubmit={(e) => { e.preventDefault(); close(req.input ? val.trim() : true); }}
            style={{ width: '100%', maxWidth: 560, background: 'var(--surface)', borderRadius: '22px 22px 0 0', padding: '22px 20px calc(18px + var(--safe-b))', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 -10px 30px rgba(0,0,0,0.18)' }}>
            <span aria-hidden="true" style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, background: 'var(--track)' }} />
            <h2 id="dlg-title" style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 22, lineHeight: '27px', fontWeight: 700 }}>{req.title}</h2>
            {req.message && <p style={{ margin: 0, fontSize: 15, lineHeight: '22px', color: 'var(--ink-2)' }}>{req.message}</p>}
            {req.input && (
              <>
                <label htmlFor="dlg-input" className="sr">{req.title}</label>
                <textarea id="dlg-input" ref={inputRef} className="textarea" value={val} onChange={(e) => setVal(e.target.value)} placeholder={req.placeholder || ''} />
              </>
            )}
            <div className="grid2">
              <button type="button" className="btn" onClick={() => close(req.input ? null : false)}>{req.cancelText || 'Vazgeç'}</button>
              <button ref={btnRef} type="submit" className={'btn ' + (req.danger ? 'danger' : 'primary')} style={req.danger ? { background: 'var(--alert)', borderColor: 'var(--alert)', color: '#fff' } : undefined}>{req.confirmText || 'Tamam'}</button>
            </div>
          </form>
        </div>
      )}
    </Ctx.Provider>
  );
}
