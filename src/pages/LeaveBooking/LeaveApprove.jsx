import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, AlertTriangle, X, ShieldAlert, Sparkles, Umbrella } from 'lucide-react';
import { API_CONFIG, callGasApi } from '../../config';

const LeaveApprove = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [empName, setEmpName] = useState('');
  const [leaveDays, setLeaveDays] = useState('');
  const [leaveDates, setLeaveDates] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const id = searchParams.get('id');
  const action = searchParams.get('action');
  const boss = searchParams.get('boss');
  const urlDays = searchParams.get('days');
  const urlDates = searchParams.get('dates');

  useEffect(() => {
    processApproval();
  }, [id, action, boss]);

  const processApproval = async () => {
    if (!id || !action) {
      setStatus('error');
      setErrorMsg('Liên kết phê duyệt không hợp lệ.');
      return;
    }

    try {
      const res = await callGasApi(API_CONFIG.LEAVE_URL, {
        action: action, // 'APPROVE' or 'REJECT'
        id: id,
        boss: boss || 'Quản lý'
      });

      if (res.status === 'success') {
        setStatus('success');
        setEmpName(res.employeeName || 'nhân viên');
        setLeaveDays(res.days || urlDays || '');
        setLeaveDates(res.allDates || res.dates || urlDates || '');
      } else {
        setStatus('error');
        setErrorMsg(res.message || 'Không thể xử lý yêu cầu lúc này.');
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg('Lỗi kết nối đến máy chủ hệ thống TIS.');
    }
  };

  const handleClose = () => {
    window.close();
  };

  // Dedicated background wrapper for stand-alone styling matching original approve.html
  const wrapperStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f2f5 0%, #e2e8f0 100%)',
    padding: '20px',
    fontFamily: "'Roboto', sans-serif"
  };

  return (
    <div style={wrapperStyle}>
      <div 
        className="glass-panel scale-in" 
        style={{ 
          maxWidth: '420px', 
          width: '100%', 
          padding: '40px 30px', 
          textAlign: 'center',
          background: '#ffffff',
          color: '#0f172a',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.06)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.8)'
        }}
      >
        {status === 'loading' && (
          <div className="fade-in">
            <div className="spinner-border-premium mb-4" style={{ display: 'inline-block' }}></div>
            <h5 style={{ fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Đang kết nối hệ thống TIS...</h5>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Vui lòng đợi trong giây lát.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="fade-in">
            {action === 'APPROVE' ? (
              <>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#d1e7dd', color: '#198754',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto',
                  fontSize: '36px', boxShadow: '0 10px 20px rgba(25, 135, 84, 0.15)',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <Check size={40} />
                </div>
                <h4 style={{ fontWeight: 800, color: '#198754', marginBottom: '12px', fontSize: '1.4rem' }}>Phê Duyệt Thành Công!</h4>
                <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '20px' }}>
                  Đã <b>chấp thuận</b> đơn nghỉ phép của <strong style={{ color: '#0f172a' }}>{empName}</strong>.
                </p>
              </>
            ) : (
              <>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f8d7da', color: '#dc3545',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto',
                  fontSize: '36px', boxShadow: '0 10px 20px rgba(220, 53, 69, 0.15)',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <X size={40} />
                </div>
                <h4 style={{ fontWeight: 800, color: '#dc3545', marginBottom: '12px', fontSize: '1.4rem' }}>Đã Từ Chối Đơn</h4>
                <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '20px' }}>
                  Đã <b>từ chối</b> đơn nghỉ phép của <strong style={{ color: '#0f172a' }}>{empName}</strong>.
                </p>
              </>
            )}

            {(leaveDays || leaveDates) && (
              <div style={{
                backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1',
                borderRadius: '16px', padding: '16px', textAlign: 'left', margin: '20px 0 24px 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                  <Umbrella size={18} style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <small style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Tổng thời gian</small>
                    <strong style={{ color: '#0f172a', fontSize: '1.05rem' }}>{leaveDays ? `${leaveDays} ngày` : 'Không xác định'}</strong>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <Sparkles size={18} style={{ color: 'var(--tis-red)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <small style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Các ngày nghỉ cụ thể</small>
                    <span style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: 600, wordBreak: 'break-word', display: 'block', marginTop: '2px' }}>
                      {leaveDates || 'Không xác định'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={handleClose} 
              className="btn-primary" 
              style={{
                width: '100%', padding: '12px', borderRadius: '50px', background: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
                boxShadow: 'none', color: '#fff'
              }}
            >
              Đóng trang này
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="fade-in">
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f8d7da', color: '#dc3545',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto',
              fontSize: '36px', boxShadow: '0 10px 20px rgba(220, 53, 69, 0.15)',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertTriangle size={40} />
            </div>
            <h4 style={{ fontWeight: 800, color: '#dc3545', marginBottom: '12px', fontSize: '1.4rem' }}>Phê Duyệt Thất Bại!</h4>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '24px' }}>
              {errorMsg}
            </p>
            <button 
              onClick={handleClose} 
              className="btn-primary" 
              style={{
                width: '100%', padding: '12px', borderRadius: '50px', background: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
                boxShadow: 'none', color: '#fff'
              }}
            >
              Đóng trang này
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveApprove;
