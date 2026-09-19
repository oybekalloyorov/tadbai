import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: '📊 Bosh sahifa', end: true },
  { to: '/transactions', label: '💰 Kirim-chiqim' },
  { to: '/loan-calculator', label: '🏦 Kredit kalkulyatori' },
  { to: '/tax-calculator', label: '🧾 Soliq kalkulyatori' },
  { to: '/business-plan', label: '📋 Biznes-reja' },
  { to: '/market-analysis', label: '📈 Bozor tahlili' },
  { to: '/chat', label: '🤖 AI maslahatchi' },
  { to: '/profile', label: '👤 Profil' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          Tad<span>bai</span>
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 18 }}
          >
            🛠️ Admin panel
          </NavLink>
        )}
        <div className="sidebar-footer">
          <div style={{ fontSize: 13, marginBottom: 10 }}>
            {user?.fullName}
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              {user?.email}
            </div>
          </div>
          <button className="secondary" onClick={handleLogout} style={{ width: '100%' }}>
            Chiqish
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}