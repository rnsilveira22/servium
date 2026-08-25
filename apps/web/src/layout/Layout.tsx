import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV = [
  { to: '/', label: 'Painel' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/obrigacoes', label: 'Obrigacoes' },
  { to: '/ciclos', label: 'Ciclos' },
  { to: '/excecoes', label: 'Excecoes' },
  { to: '/auditoria', label: 'Auditoria' },
];

export function Layout() {
  const { sessao, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">ServiumAI</div>
        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end={n.to === '/'}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-role">{sessao?.papel === 'admin' ? 'Administrador' : 'Operador'}</span>
          <button onClick={handleLogout} className="btn btn-sm">Sair</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
