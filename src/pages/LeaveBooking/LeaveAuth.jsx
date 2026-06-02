import React, { useState } from 'react';
import { Mail, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { API_CONFIG, callGasApi } from '../../config';
import LoadingOverlay from '../../components/LoadingOverlay';
import Swal from 'sweetalert2';

const LeaveAuth = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      return Swal.fire('Lỗi', 'Vui lòng nhập email hợp lệ!', 'warning');
    }

    setIsLoading(true);
    try {
      const res = await callGasApi(API_CONFIG.LEAVE_URL, {
        action: 'REQUEST_OTP',
        email: email.trim()
      });

      if (res.status === 'success') {
        setStep('otp');
        Swal.fire('Đã gửi mã', 'Vui lòng kiểm tra mã OTP trong hòm thư email của bạn.', 'success');
      } else {
        Swal.fire('Lỗi', res.message || 'Email không tồn tại trong hệ thống TIS.', 'error');
      }
    } catch (err) {
      Swal.fire('Lỗi', 'Không thể kết nối mạng!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      return Swal.fire('Lỗi', 'Vui lòng nhập mã OTP hợp lệ!', 'warning');
    }

    setIsLoading(true);
    try {
      const res = await callGasApi(API_CONFIG.LEAVE_URL, {
        action: 'VERIFY_OTP',
        email: email.trim(),
        otp: otp.trim()
      });

      if (res.status === 'success') {
        localStorage.setItem('tis_email', email.trim());
        if (res.token) {
          localStorage.setItem('tis_token', res.token);
        }
        onLoginSuccess(res, email.trim());
      } else {
        Swal.fire('Lỗi', res.message || 'Mã OTP không chính xác!', 'error');
      }
    } catch (err) {
      Swal.fire('Lỗi', 'Không thể kết nối mạng!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="leave-auth-shell">
      <LoadingOverlay active={isLoading} text="Đang xử lý đăng nhập..." />

      <div className="glass-panel scale-in leave-auth-card">
        <img 
          src="/logo.png" 
          alt="TIS Logo" 
          style={{ maxHeight: '60px', marginBottom: '28px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} 
          onError={(e) => e.target.style.display = 'none'}
        />

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp}>
            <h4 style={{ fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>ĐĂNG NHẬP</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Nhập email công ty để nhận mã xác thực OTP truy cập.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', marginBottom: '20px' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="form-control" 
                style={{ paddingLeft: '44px' }}
                placeholder="email@tisbroker.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-100" style={{ padding: '12px', borderRadius: '12px' }}>
              TIẾP TỤC <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(214,31,47,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--tis-red)'
            }}>
              <ShieldCheck size={32} />
            </div>

            <h4 style={{ fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>XÁC THỰC OTP</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Mã xác thực gồm 6 chữ số đã được gửi về hòm thư <br />
              <strong style={{ color: 'var(--text-main)' }}>{email}</strong>
            </p>

            <div style={{ marginBottom: '24px' }}>
              <input 
                type="text" 
                className="form-control" 
                style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '4px' }}
                placeholder="000000" 
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-100" style={{ padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>
              XÁC MINH & ĐĂNG NHẬP
            </button>

            <button 
              type="button" 
              onClick={() => setStep('email')}
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}
            >
              <ArrowLeft size={14} /> Quay lại
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LeaveAuth;
