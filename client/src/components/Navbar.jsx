import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname.startsWith(path) ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/gallery" className="navbar-brand">
        <span className="brand-icon">✦</span>
        Riddhi Enterprise Stock
      </Link>

      <div className="navbar-links">
        <Link to="/gallery" className={isActive('/gallery')}>
          🎨 Gallery
        </Link>
        <Link to="/my-orders" className={isActive('/my-orders')}>
          📦 My Orders
        </Link>
        {user.role === 'admin' && (
          <>
            <Link to="/admin/dashboard" className={isActive('/admin/dashboard')}>
              📊 Dashboard
            </Link>
            <Link to="/admin/designs" className={isActive('/admin/designs')}>
              🎭 Manage Designs
            </Link>
            <Link to="/admin/orders" className={isActive('/admin/orders')}>
              📋 All Orders
            </Link>
            <Link to="/admin/users" className={isActive('/admin/users')}>
              👥 Users
            </Link>
          </>
        )}
      </div>

      <div className="navbar-user">
        <div className="user-badge">
          <span className="user-avatar">
            {user.name?.charAt(0).toUpperCase()}
          </span>
          <span>{user.name}</span>
          {user.role === 'admin' && <span className="admin-badge">Admin</span>}
        </div>
        <button onClick={logout} className="btn btn-secondary btn-sm">
          Logout
        </button>
      </div>
    </nav>
  );
}
