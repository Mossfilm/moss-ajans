import { createRoot } from 'react-dom/client';
import { PostPreview } from '../src/components/Post.jsx';
import { anmaPosts } from '../src/seed.js';
import { SEED_FIRMS } from '../src/data.js';
import '../src/styles.css';

const posts = anmaPosts();
function App() {
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 16px 64px' }}>
      <span className="eyebrow">Moss Ajans · Galeri</span>
      <h1 className="h1" style={{ marginTop: 8 }}>10 Kasım Atatürk’ü Anma Günü</h1>
      <p className="small" style={{ maxWidth: 640, lineHeight: '20px' }}>9 aktif firma için hazırlanan postlar. Uygulamada her firmanın galerisine taslak olarak eklenir; oradan PNG (1080×1080) indirilir ve paylaşım metni kopyalanır.</p>
      <div className="card pad" style={{ margin: '18px 0 26px', maxWidth: 640 }}>
        <div className="tiny" style={{ fontWeight: 600, marginBottom: 6 }}>Ortak paylaşım metni</div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: '22px' }}>{posts[0].caption}</p>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: '#1F4770', fontWeight: 500 }}>{posts[0].tags}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {posts.map((p) => {
          const f = SEED_FIRMS.find((x) => x.id === p.firmId);
          const firm = { ...f, logo: f.logo.replace(/^\//, '') };
          return (
            <figure key={p.firmId} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <PostPreview spec={p.spec} firm={firm} width={340} />
              <figcaption style={{ fontSize: 14, fontWeight: 600 }}>{firm.name}</figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
createRoot(document.getElementById('root')).render(<App />);
