import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, getDocs,
  serverTimestamp, query, orderBy, limit, increment, writeBatch
} from 'firebase/firestore';
import { auth, db } from './firebase.js';
import { SEED_FIRMS } from './data.js';
import { sampleTasks } from './seed.js';
import { runTransaction } from 'firebase/firestore';

async function seedOnce(user) {
  const flag = doc(db, 'meta', 'seed');
  const go = await runTransaction(db, async (tx) => {
    const s = await tx.get(flag);
    if (s.exists()) return false;
    tx.set(flag, { at: serverTimestamp(), by: user.uid });
    return true;
  });
  if (!go) return;
  const b = writeBatch(db);
  sampleTasks().forEach((t) => b.set(doc(collection(db, 'tasks')), { ...t, sample: true, createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  await b.commit();
}

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

const ms = (ts) => (ts && ts.toMillis ? ts.toMillis() : (typeof ts === 'number' ? ts : 0));

export function StoreProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = yükleniyor
  const [profile, setProfile] = useState(null);
  const [firms, setFirms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [ready, setReady] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [projects, setProjects] = useState([]);
  const [insta, setInsta] = useState({});
  const [pushSub, setPushSub] = useState(null);
  const [chat, setChat] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u || null)), []);

  useEffect(() => {
    if (!user) { setReady(false); setProfileLoaded(false); return; }
    const unsubs = [];
    let gotFirms = false, gotTasks = false;
    const mark = () => { if (gotFirms && gotTasks) setReady(true); };

    unsubs.push(onSnapshot(collection(db, 'firms'), async (snap) => {
      if (snap.empty && !snap.metadata.fromCache) {
        const b = writeBatch(db);
        SEED_FIRMS.forEach((f, i) => {
          const { id, ...rest } = f;
          b.set(doc(db, 'firms', id), { instagram: '', contact: '', phone: '', approver: '', notes: '', services: [], package: { gonderi: 0, reels: 0, hikaye: 0, cekim: 0 }, ...rest, order: i, igSeeded: true, createdAt: serverTimestamp() });
        });
        await b.commit();
        return;
      }
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sonradan eklenen hazır bilgileri (Instagram linkleri) mevcut firmalara bir kez işle
      list.forEach((f) => {
        const seed = SEED_FIRMS.find((x) => x.id === f.id);
        if (seed && seed.instagram && !f.igSeeded && !snap.metadata.fromCache) {
          updateDoc(doc(db, 'firms', f.id), { igSeeded: true, ...(f.instagram ? {} : { instagram: seed.instagram }) }).catch(() => {});
        }
      });
      setFirms(list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99)));
      gotFirms = true; mark();
    }));
    unsubs.push(onSnapshot(collection(db, 'tasks'), (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      gotTasks = true; mark();
    }));
    unsubs.push(onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }));
    unsubs.push(onSnapshot(query(collection(db, 'activity'), orderBy('at', 'desc'), limit(60)), (snap) => {
      setActivity(snap.docs.map((d) => ({ id: d.id, ...d.data(), atMs: ms(d.data().at) || Date.now() })));
    }));
    unsubs.push(onSnapshot(doc(db, 'users', user.uid), (snap) => { setProfile(snap.exists() ? snap.data() : null); setProfileLoaded(true); }));
    unsubs.push(onSnapshot(collection(db, 'gallery'), (snap) => {
      setGallery(snap.docs.map((d) => ({ id: d.id, ...d.data(), atMs: ms(d.data().at) || Date.now() })).sort((a, b) => b.atMs - a.atMs));
    }));
    unsubs.push(onSnapshot(collection(db, 'projects'), (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data(), atMs: ms(d.data().at) || Date.now() })).sort((a, b) => b.atMs - a.atMs));
    }));
    unsubs.push(onSnapshot(collection(db, 'insta'), (snap) => {
      const m = {}; snap.docs.forEach((d) => { m[d.id] = d.data(); }); setInsta(m);
    }));
    unsubs.push(onSnapshot(query(collection(db, 'chat'), orderBy('at', 'desc'), limit(80)), (snap) => {
      setChat(snap.docs.map((d) => ({ id: d.id, ...d.data(), atMs: ms(d.data().at) || Date.now() })).reverse());
    }));
    unsubs.push(onSnapshot(collection(db, 'jobs'), (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data(), atMs: ms(d.data().at) || Date.now() })).sort((a, b) => b.atMs - a.atMs));
    }));
    unsubs.push(onSnapshot(doc(db, 'pushSubs', user.uid), (snap) => setPushSub(snap.exists() ? snap.data() : null)));
    // İlk kurulumda bir kez: örnek işler (galeri boş başlar; içerik istendiğinde üretilir)
    seedOnce(user).catch(() => {});
    return () => unsubs.forEach((u) => u());
  }, [user]);

  const api = useMemo(() => {
    if (!user) return {};
    const me = () => ({ uid: user.uid, name: (profile && profile.name) || user.email });
    const log = (kind, text, extra = {}) =>
      addDoc(collection(db, 'activity'), { kind, text, by: user.uid, byName: me().name, at: serverTimestamp(), ...extra });
    const firmName = (id) => (firms.find((f) => f.id === id) || {}).name || '';

    return {
      me,
      saveProfile: (name) => setDoc(doc(db, 'users', user.uid), { name, email: user.email }, { merge: true }),

      addTask: async (t) => {
        const ref = await addDoc(collection(db, 'tasks'), {
          ...t, done: false, commentCount: 0, revisions: 0,
          createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        });
        log('task', firmName(t.firmId) + ' için yeni iş: ' + t.title, { taskId: ref.id, firmId: t.firmId, assignees: t.assignees || [] });
        return ref.id;
      },
      updateTask: (id, patch) => updateDoc(doc(db, 'tasks', id), { ...patch, updatedAt: serverTimestamp() }),
      toggleDone: (t) => {
        const done = !t.done;
        updateDoc(doc(db, 'tasks', t.id), { done, doneAt: done ? serverTimestamp() : null, doneBy: done ? user.uid : null, updatedAt: serverTimestamp() });
        if (done) log('done', firmName(t.firmId) + ' · ' + t.title + ' tamamlandı', { taskId: t.id, firmId: t.firmId });
      },
      setStage: (t, stage) => {
        updateDoc(doc(db, 'tasks', t.id), { stage, updatedAt: serverTimestamp() });
        if (stage === 4) log('approval', firmName(t.firmId) + ' · ' + t.title + ' müşteri onayına gönderildi', { taskId: t.id, firmId: t.firmId });
        if (stage === 5) log('approval', firmName(t.firmId) + ' · ' + t.title + ' onaylandı, yayına hazır', { taskId: t.id, firmId: t.firmId });
      },
      addRevision: (t, note) => {
        updateDoc(doc(db, 'tasks', t.id), { revisions: increment(1), stage: 3, updatedAt: serverTimestamp() });
        log('approval', firmName(t.firmId) + ' revize istedi: ' + t.title + (note ? ' · “' + note + '”' : ''), { taskId: t.id, firmId: t.firmId });
      },
      deleteTask: (id) => deleteDoc(doc(db, 'tasks', id)),

      addComment: async (t, text) => {
        await addDoc(collection(db, 'tasks', t.id, 'comments'), { text, by: user.uid, byName: me().name, at: serverTimestamp() });
        updateDoc(doc(db, 'tasks', t.id), { commentCount: increment(1) });
        log('comment', me().name + ', ' + firmName(t.firmId) + ' · ' + t.title + ' işine yorum yaptı: “' + text.slice(0, 80) + '”', { taskId: t.id, firmId: t.firmId });
      },

      addFirm: async (f) => {
        const ref = await addDoc(collection(db, 'firms'), {
          logo: '', instagram: '', contact: '', phone: '', approver: '', notes: '', services: [],
          package: { gonderi: 0, reels: 0, hikaye: 0, cekim: 0 }, active: true, order: 50, ...f, createdAt: serverTimestamp()
        });
        log('firm', 'Yeni firma eklendi: ' + f.name, { firmId: ref.id });
        return ref.id;
      },
      updateFirm: (id, patch) => updateDoc(doc(db, 'firms', id), patch),

      addIdea: (firmId, text) => addDoc(collection(db, 'firms', firmId, 'ideas'), { text, by: user.uid, byName: me().name, votes: [], at: serverTimestamp() }),
      toggleVote: (firmId, idea) => {
        const v = idea.votes || [];
        const next = v.includes(user.uid) ? v.filter((x) => x !== user.uid) : v.concat(user.uid);
        return updateDoc(doc(db, 'firms', firmId, 'ideas', idea.id), { votes: next });
      },
      deleteIdea: (firmId, id) => deleteDoc(doc(db, 'firms', firmId, 'ideas', id)),
      addMessage: async (firmId, text) => {
        await addDoc(collection(db, 'firms', firmId, 'messages'), { text, by: user.uid, byName: me().name, at: serverTimestamp() });
        log('comment', me().name + ', ' + firmName(firmId) + ' sohbetine yazdı: “' + text.slice(0, 80) + '”', { firmId });
      },
      addGallery: async (item) => {
        const ref = await addDoc(collection(db, 'gallery'), { status: 'taslak', source: 'ekip', ...item, by: user.uid, byName: me().name, at: serverTimestamp() });
        log('gallery', firmName(item.firmId) + ' galerisine yeni ' + (item.kind === 'video' ? 'video' : 'post') + ': ' + (item.title || ''), { firmId: item.firmId, galleryId: ref.id });
        return ref.id;
      },
      updateGallery: (id, patch) => updateDoc(doc(db, 'gallery', id), patch),
      deleteGallery: (id) => deleteDoc(doc(db, 'gallery', id)),
      addProject: async (p) => {
        const ref = await addDoc(collection(db, 'projects'), {
          files: [], sources: [], brief: '', opts: { length: 30, captions: true, music: '' }, plan: null, status: '', video: null, renderStatus: '', outputUrl: '', version: 1, rootId: '', parentId: '', revisionLabel: '', revisionNote: '',
          ...p, by: user.uid, byName: me().name, at: serverTimestamp()
        });
        if (!p.rootId) await updateDoc(ref, { rootId: ref.id });
        log('edit', firmName(p.firmId) + ' için yeni kurgu projesi: ' + p.name, { firmId: p.firmId, projectId: ref.id });
        return ref.id;
      },
      updateProject: (id, patch) => updateDoc(doc(db, 'projects', id), patch),
      deleteProject: (id) => deleteDoc(doc(db, 'projects', id)),
      reviseProject: async (prev, label, note, all) => {
        const root = all.find((x) => x.id === (prev.rootId || prev.id)) || prev;
        const version = Math.max(...all.filter((x) => (x.rootId || x.id) === root.id).map((x) => x.version || 1)) + 1;
        const tag = (label || '').trim();
        const base = prev.baseName || root.baseName || root.name;
        const name = base + ' (' + (tag ? tag + ' ' : '') + 'Vol ' + version + ')';
        const ref = await addDoc(collection(db, 'projects'), {
          name, baseName: base, firmId: prev.firmId, files: prev.files || [], sources: prev.sources || [], opts: prev.opts || { length: 30, captions: true, music: '' }, brief: prev.brief || '', plan: prev.plan || null,
          status: '', video: null, renderStatus: '', outputUrl: '', version, rootId: root.id, parentId: prev.id, revisionLabel: tag, revisionNote: note || '',
          by: user.uid, byName: me().name, at: serverTimestamp()
        });
        log('edit', 'Revize açıldı: ' + name, { firmId: prev.firmId, projectId: ref.id });
        return ref.id;
      },
      addChat: (m) => addDoc(collection(db, 'chat'), { by: user.uid, byName: me().name, ...m, at: serverTimestamp() }),
      clearChat: async () => {
        const snap = await getDocs(collection(db, 'chat'));
        const b = writeBatch(db);
        snap.docs.forEach((d) => b.delete(d.ref));
        await b.commit();
      },
      addJob: async (j) => {
        const ref = await addDoc(collection(db, 'jobs'), { status: 'bekliyor', firmId: '', text: '', ...j, by: user.uid, byName: me().name, at: serverTimestamp() });
        return ref.id;
      },
      cancelJob: (id) => deleteDoc(doc(db, 'jobs', id)),
      queueProject: async (p, patch = {}) => {
        await updateDoc(doc(db, 'projects', p.id), { ...patch, status: 'sirada', workerNote: '', queuedAt: serverTimestamp() });
        await addDoc(collection(db, 'jobs'), { kind: 'video', status: 'bekliyor', projectId: p.id, firmId: p.firmId, text: (patch.brief ?? p.brief) || '', by: user.uid, byName: me().name, at: serverTimestamp() });
        log('edit', 'Montaj sıraya alındı: ' + p.name, { firmId: p.firmId, projectId: p.id });
      },
      savePush: (data) => setDoc(doc(db, 'pushSubs', user.uid), { email: user.email, name: me().name, ...data }, { merge: true }),
      removePush: () => deleteDoc(doc(db, 'pushSubs', user.uid)),
      deleteSamples: async () => {
        const snap = await getDocs(collection(db, 'tasks'));
        const b = writeBatch(db);
        snap.docs.filter((d) => d.data().sample).forEach((d) => b.delete(d.ref));
        await b.commit();
      },
      exists: async () => (await getDocs(collection(db, 'firms'))).size
    };
  }, [user, profile, firms]);

  const value = { user, profile, profileLoaded, firms, tasks, users, activity, gallery, projects, insta, pushSub, chat, jobs, ready, ...api };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Bir alt koleksiyonu canlı dinlemek için
export function useSub(path, order = 'at') {
  const [items, setItems] = useState([]);
  const key = path.join('/');
  useEffect(() => {
    if (!db || path.some((p) => !p)) return undefined;
    return onSnapshot(query(collection(db, ...path), orderBy(order, 'asc')), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data(), atMs: ms(d.data().at) || Date.now() })));
    });
  }, [key]);
  return items;
}
