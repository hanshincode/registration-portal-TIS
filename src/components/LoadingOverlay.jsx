import React from 'react';

const LoadingOverlay = ({ active, text = 'Đang xử lý...', showImage = false }) => {
  if (!active) return null;

  return (
    <div 
      className="fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className={`glass-panel loading-overlay-panel scale-in ${showImage ? 'has-image' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
          <div className="spinner-border-premium" style={{ marginBottom: '16px' }}></div>
          <div style={{ color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '700', lineHeight: '1.5' }}>
            {text}
          </div>
        </div>
        
        {showImage && (
          <div className="d-none d-md-block" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <img 
              src="/loading.png" 
              alt="TIS Loading" 
              style={{ maxHeight: '150px', width: 'auto', borderRadius: '12px' }} 
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
