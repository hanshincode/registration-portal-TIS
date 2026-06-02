import React from 'react';
import { useNavigate } from 'react-router-dom';

// Custom hand-crafted SVG icons with premium color gradients and drop shadows
const CarIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 8px rgba(214, 31, 47, 0.25))' }}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11 2 11.3 2 11.6V16c0 .6.4 1 1 1h2" stroke="url(#carRedGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7.5" cy="17.5" r="2.5" stroke="url(#carRedGrad)" strokeWidth="2"/>
    <circle cx="16.5" cy="17.5" r="2.5" stroke="url(#carRedGrad)" strokeWidth="2"/>
    <path d="M13 10V7.5" stroke="url(#carRedGrad)" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="carRedGrad" x1="2" y1="7" x2="22" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF416C" />
        <stop offset="100%" stopColor="#D61F2F" />
      </linearGradient>
    </defs>
  </svg>
);

const RoomIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 8px rgba(16, 185, 129, 0.25))' }}>
    <path d="M3 21h18M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6" stroke="url(#roomGreenGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 9h6M9 13h6" stroke="url(#roomGreenGrad)" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="roomGreenGrad" x1="3" y1="5" x2="21" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
);

const LeaveIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.25))' }}>
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="url(#leaveBlueGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 2v4M8 2v4M3 10h18" stroke="url(#leaveBlueGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 14h.01M12 14h.01M17 14h.01M7 18h.01M12 18h.01M17 18h.01" stroke="url(#leaveBlueGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="leaveBlueGrad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
  </svg>
);

const Portal = () => {
  const navigate = useNavigate();

  const options = [
    {
      title: 'Đăng Ký Xe Đi Công Tác',
      description: 'Đăng ký lịch trình sử dụng xe đi công tác công ty và đo quãng đường tự động.',
      path: '/car',
      icon: <CarIcon />,
      themeColor: '#D61F2F',
      bgGlow: 'rgba(214, 31, 47, 0.04)',
    },
    {
      title: 'Đặt Phòng Họp Công Ty',
      description: 'Đặt chỗ trước cho các phòng họp (Lớn / Nhỏ) và kiểm tra trùng lịch tức thời.',
      path: '/room',
      icon: <RoomIcon />,
      themeColor: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.04)',
    },
    {
      title: 'Đăng Ký Xin Nghỉ Phép',
      description: 'Tạo đơn xin nghỉ phép, xác thực OTP email, kiểm tra số ngày phép còn lại.',
      path: '/leave',
      icon: <LeaveIcon />,
      themeColor: '#3b82f6',
      bgGlow: 'rgba(59, 130, 246, 0.04)',
    },
  ];

  return (
    <div 
      className="fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '40px 20px',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="glass-panel scale-in portal-card" 
        style={{ 
          textAlign: 'center',
          border: '1px solid rgba(15, 23, 42, 0.08)'
        }}
      >
        <img 
          src="/logo.png" 
          alt="TIS Logo" 
          className="scale-in"
          style={{ 
            maxHeight: '64px', 
            marginBottom: '24px', 
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))',
            animationDelay: '150ms',
            animationFillMode: 'both'
          }}
          onError={(e) => e.target.style.display = 'none'}
        />
        <h3 
          className="fw-bold slide-up" 
          style={{ 
            fontSize: '1.6rem', 
            marginBottom: '8px', 
            color: 'var(--text-main)',
            animationDelay: '250ms',
            animationFillMode: 'both'
          }}
        >
          Cổng Đăng Ký Online
        </h3>
        <p 
          className="slide-up" 
          style={{ 
            color: 'var(--text-muted)', 
            marginBottom: '36px', 
            fontSize: '0.95rem',
            animationDelay: '350ms',
            animationFillMode: 'both'
          }}
        >
          Xin chào! Bạn muốn thực hiện đăng ký nào dưới đây?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {options.map((opt, idx) => (
            <button
              key={opt.title}
              onClick={() => navigate(opt.path)}
              className="slide-up"
              style={{
                display: 'flex',
                alignItems: 'center',
                textAlign: 'left',
                padding: '20px',
                borderRadius: '16px',
                background: 'rgba(15, 23, 42, 0.02)',
                border: '1px solid rgba(15, 23, 42, 0.08)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth), transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                outline: 'none',
                width: '100%',
                animationDelay: `${450 + idx * 120}ms`,
                animationFillMode: 'both'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                e.currentTarget.style.borderColor = opt.themeColor;
                e.currentTarget.style.backgroundColor = opt.bgGlow;
                e.currentTarget.style.boxShadow = `0 10px 20px -5px ${opt.bgGlow.replace('0.04', '0.12')}`;
                e.currentTarget.querySelector('.icon-container').style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)';
                e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.querySelector('.icon-container').style.transform = 'none';
              }}
            >
              <div 
                className="icon-container"
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '20px',
                  transition: 'var(--transition-smooth)',
                  flexShrink: 0
                }}
              >
                {opt.icon}
              </div>
              
              <div style={{ flex: 1 }}>
                <h5 style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {opt.title}
                </h5>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  {opt.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Portal;
