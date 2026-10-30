import { installFakeFunctions } from '../test/fake/functions.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
installFakeFunctions({});
try { localStorage.setItem('moss-pending-name', 'Moss'); } catch (e) { /* önizleme */ }
const day = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const hist = (base, step) => Array.from({ length: 30 }, (_, i) => ({ d: day(29 - i), f: Math.round(base + i * step + Math.sin(i) * step * 2) }));
const IG = {
  'dsg-otomotiv': ['dsgotomotivcom', 8760, -1.2], 'agustos-doner': ['agustosdoner', 12400, 6], 'ekici-sanat': ['ekicisanat', 3150, 2.5],
  'bogazici-vip': ['gaziantepbogazicikoleji', 21800, 9], 'son-ders': ['sondersegitimkurumlari', 5420, 3]
};
(async () => {
  await createUserWithEmailAndPassword({}, 'hello@mossfilmagency.com', 'onizleme');
  for (const [id, [u, f, s]] of Object.entries(IG)) {
    const history = hist(f - 30 * s, s);
    await setDoc(doc({}, 'insta', id), { username: u, followers: history[29].f, mediaCount: 240, updated: day(0), error: '', history,
      recent: [1, 2, 3].map((k) => ({ id: u + k, type: k === 1 ? 'VIDEO' : 'IMAGE', at: day(k * 2) + 'T10:00:00', url: 'https://www.instagram.com/' + u + '/', caption: 'Örnek paylaşım ' + k, likes: 120 * k, comments: 8 * k, views: k === 1 ? 4300 : null })) });
  }
  await import('../src/main.jsx');
})();
