import { useStore } from '../store.jsx';
import { Icon, Logo, back } from '../components/ui.jsx';

export default function Performans() {
  const { firms } = useStore();
  const active = firms.filter((f) => f.active !== false);
  const linked = active.filter((f) => f.instagram);
  return (
    <div className="screen no-nav">
      <button className="back" onClick={() => back('/firmalar')}><Icon name="left" size={20} />Firmalar</button>
      <h1 className="h1" style={{ margin: '8px 0 6px' }}>Instagram performansı</h1>
      <p className="small" style={{ margin: 0, lineHeight: '19px' }}>Takipçi, değişim ve izlenme sayaçları Meta bağlantısı kurulunca burada her sabah güncellenecek. Şimdilik firmaların hesap linklerini topluyoruz.</p>

      <div className="card pad" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon name="ig" size={28} color="var(--moss)" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{linked.length}/{active.length} firmanın linki girildi</div>
          <div className="bar" style={{ marginTop: 8 }}><div style={{ width: (active.length ? Math.round(linked.length / active.length * 100) : 0) + '%' }} /></div>
        </div>
      </div>

      <h2 className="h2">Firmalar</h2>
      <div className="card list">
        {active.map((f) => (
          <a key={f.id} href={f.instagram ? f.instagram : '#/firma/' + f.id} target={f.instagram ? '_blank' : undefined} rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
            <Logo firm={f} size={36} radius={10} />
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{f.name}</span>
              <span className="tiny" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.instagram ? f.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '') : 'Link yok · eklemek için dokun'}</span>
            </span>
            <span className={f.instagram ? 'pill neutral' : 'pill alert'}>{f.instagram ? 'Bağlantı bekliyor' : 'Link eksik'}</span>
          </a>
        ))}
      </div>
      {firms.some((f) => f.active === false) && <p className="tiny" style={{ marginTop: 10 }}>Aktif olmayan sayfalar listede gösterilmez.</p>}
    </div>
  );
}
