import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Car, Building2, CalendarDays, ChevronDown } from 'lucide-react';

const Layout = ({ children, title = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const userData = JSON.parse(localStorage.getItem('tis_user_data') || '{}');

  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('tis_token');
    localStorage.removeItem('tis_email');
    localStorage.removeItem('tis_user_data');
    window.location.href = '/';
    window.location.reload();
  };

  const menuItems = [
    { name: 'Trang chủ', path: '/', icon: <Home size={18} /> },
    { name: 'Đăng Ký Xe', path: '/car', icon: <Car size={18} /> },
    { name: 'Phòng Họp', path: '/room', icon: <Building2 size={18} /> },
    { name: 'Nghỉ Phép', path: '/leave', icon: <CalendarDays size={18} /> },
  ];

  const currentItem = menuItems.find((item) => 
    item.path === '/' 
      ? location.pathname === '/' 
      : location.pathname.startsWith(item.path)
  ) || menuItems[0];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Premium Header */}
      <header className="portal-header">
        <div 
          onClick={() => navigate('/')} 
          className="header-logo"
        >
          <img 
            src="/logo.png" 
            alt="TIS Logo" 
            style={{ height: '36px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} 
            onError={(e) => e.target.style.display = 'none'}
          />
          <span 
            className="fw-bold brand-text" 
            style={{ 
              fontSize: '1.2rem', 
              color: 'var(--text-main)', 
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}
          >
            TIS Internal
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="header-nav">
          {menuItems.map((item) => {
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);

            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                style={{
                  background: isActive ? 'rgba(214, 31, 47, 0.15)' : 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: isActive ? 'var(--tis-red)' : 'var(--text-muted)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'var(--transition-smooth)',
                  border: isActive ? '1px solid rgba(214, 31, 47, 0.2)' : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.color = 'var(--text-main)';
                    e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.color = 'var(--text-muted)';
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                {item.icon}
                <span className="nav-text">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Dropdown Nav */}
        <div className="mobile-nav-container" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="mobile-nav-trigger"
          >
            <span className="mobile-nav-trigger-content">
              {currentItem.icon}
              <span>{currentItem.name}</span>
            </span>
            <ChevronDown size={16} className={`chevron-icon ${isOpen ? 'open' : ''}`} />
          </button>
          
          {isOpen && (
            <div className="mobile-nav-dropdown glass-panel fade-in">
              {menuItems.map((item) => {
                const isActive = item.path === '/' 
                  ? location.pathname === '/' 
                  : location.pathname.startsWith(item.path);
                  
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.path);
                      setIsOpen(false);
                    }}
                    className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Profile Info (Aligned to the far right) */}
        {userData.name && (
          <div className="header-user">
            <span className="user-name-text">👤 {userData.name}</span>
            <span style={{ color: 'rgba(15, 23, 42, 0.15)' }}>|</span>
            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--tis-red)',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--tis-red-hover)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--tis-red)'}
            >
              Đăng xuất
            </button>
          </div>
        )}
      </header>

      {/* Main Body */}
      <main className="portal-main">
        {title && !isHome && (
          <div 
            className="fade-in" 
            style={{ 
              maxWidth: '1200px', 
              width: '100%', 
              margin: '0 auto 16px auto',
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <h4 style={{ 
              textTransform: 'uppercase', 
              fontWeight: 800, 
              fontSize: '1.4rem', 
              letterSpacing: '0.5px',
              color: 'var(--text-main)'
            }}>
              {title}
            </h4>
          </div>
        )}

        <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', flex: 1 }}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer 
        style={{ 
          textAlign: 'center', 
          padding: '24px', 
          color: 'var(--text-muted)', 
          fontSize: '0.8rem',
          borderTop: '1px solid rgba(255,255,255,0.03)'
        }}
      >
        &copy; 2026 TIS Insurance Broker. Internal System.
      </footer>
    </div>
  );
};

export default Layout;
