import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, User, Power, LayoutGrid, FileText, Send, Clock, AlertCircle, XCircle } from 'lucide-react';
import { API_CONFIG, callGasApi } from '../../config';
import LoadingOverlay from '../../components/LoadingOverlay';
import Swal from 'sweetalert2';

const LeaveForm = ({ userData, userEmail, onLogout, onViewDashboard }) => {
  const navigate = useNavigate();
  
  // Form states
  const [selectedDates, setSelectedDates] = useState([]);
  const [dateSessions, setDateSessions] = useState({});
  const [reason, setReason] = useState('');
  const [leaveDays, setLeaveDays] = useState(0);
  const [leaveType, setLeaveType] = useState('');
  const [leaveTypeClass, setLeaveTypeClass] = useState('form-control');
  const [calcMsg, setCalcMsg] = useState('');
  
  // History list states
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Đang tải dữ liệu...');
  const [balanceOverride, setBalanceOverride] = useState(null);

  const balance = balanceOverride?.email === userEmail ? balanceOverride.balance : (parseFloat(userData.balance) || 0);
  const isManager = ['admin', 'manager', 'quản lý'].includes((userData.role || '').toLowerCase());

  useEffect(() => {
    loadHistory();
  }, [userEmail]);

  // Recalculate whenever days or balance changes
  useEffect(() => {
    calculateLeave(leaveDays);
  }, [leaveDays, balance]);

  const loadHistory = async () => {
    setIsLoading(true);
    setLoadingText('Đang tải lịch sử đăng ký...');
    try {
      const res = await callGasApi(API_CONFIG.LEAVE_URL, {
        action: 'GET_LIST',
        email: userEmail
      });
      if (res.data) {
        setHistoryList(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateVN = (dateStr) => {
    if (!dateStr) return '';
    const p = dateStr.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : dateStr;
  };

  const normalizeStatus = (status) => String(status || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase();

  const parseDisplayDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = String(dateStr).split(' ')[0].split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!day || month < 0 || !year) return null;

    return new Date(year, month, day);
  };

  const isLeavePast = (item) => {
    const start = parseDisplayDate(item.start);
    if (!start) return true;

    const days = Math.max(1, Math.ceil(parseFloat(item.days) || 1));
    const end = new Date(start);
    end.setDate(start.getDate() + days - 1);
    end.setHours(23, 59, 59, 999);

    return new Date() > end;
  };

  const canCancelLeave = (item) => normalizeStatus(item.status) === 'da duyet' && !isLeavePast(item);

  const toggleDateClick = (info) => {
    const dateStr = info.dateStr;
    let updated = [...selectedDates];
    const idx = updated.indexOf(dateStr);
    const newSessions = { ...dateSessions };

    if (idx > -1) {
      updated.splice(idx, 1);
      delete newSessions[dateStr];
    } else {
      updated.push(dateStr);
      newSessions[dateStr] = 'Cả ngày';
    }
    updated.sort();
    setSelectedDates(updated);
    setDateSessions(newSessions);

    // Calculate total days
    const total = Object.values(newSessions).reduce((sum, s) => sum + (s === 'Cả ngày' ? 1.0 : 0.5), 0);
    setLeaveDays(total);
  };

  const handleDateSessionChange = (date, val) => {
    const updated = { ...dateSessions, [date]: val };
    setDateSessions(updated);
    const total = Object.values(updated).reduce((sum, s) => sum + (s === 'Cả ngày' ? 1.0 : 0.5), 0);
    setLeaveDays(total);
  };

  const calculateLeave = (days) => {
    if (days <= 0) {
      setLeaveType('');
      setCalcMsg('');
      setLeaveTypeClass('form-control');
      return;
    }

    if (balance >= days) {
      setLeaveType('Phép năm');
      setLeaveTypeClass('form-control text-success fw-bold');
      setCalcMsg('');
    } else if (balance <= 0) {
      setLeaveType(`Nghỉ không lương (${days} ngày)`);
      setLeaveTypeClass('form-control text-danger fw-bold');
      setCalcMsg('Hết phép. Tính nghỉ không lương.');
    } else {
      const unpaid = days - balance;
      setLeaveType(`${balance} Phép năm + ${unpaid} Không lương`);
      setLeaveTypeClass('form-control text-warning fw-bold');
      setCalcMsg('Thiếu phép. Hệ thống sẽ tự tách đơn.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (leaveDays <= 0 || selectedDates.length === 0) {
      return Swal.fire('Thông báo', 'Vui lòng chọn ít nhất một ngày nghỉ trên lịch phía dưới!', 'warning');
    }

    const formattedDates = selectedDates.map(d => formatDateVN(d)).join(', ');

    const confirm = await Swal.fire({
      title: 'Gửi yêu cầu nghỉ?',
      html: `<div style="text-align: left; padding: 10px 20px;">
              <b>Bạn đang đăng ký nghỉ: ${leaveDays} ngày</b><br>
              Các ngày đã chọn: <br>
              <span class="text-danger small" style="word-break: break-word;">${formattedDates}</span>
             </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Gửi đơn',
      cancelButtonText: 'Hủy',
      confirmButtonColor: 'var(--tis-red)',
      cancelButtonColor: '#64748b',
    });

    if (!confirm.isConfirmed) return;

    setIsLoading(true);
    setLoadingText('Đang gửi đơn lên hệ thống...');

    const getSessionString = () => {
      const halfDays = selectedDates.filter(d => dateSessions[d] && dateSessions[d] !== 'Cả ngày');
      if (halfDays.length === 0) return 'Cả ngày';
      
      return selectedDates
        .map(d => {
          const sess = dateSessions[d];
          if (sess === 'Cả ngày') return null;
          
          const parts = d.split('-');
          const dayStr = `${parts[2]}/${parts[1]}`;
          if (sess === 'Buổi Sáng') return `${dayStr} (Sáng)`;
          if (sess === 'Buổi Chiều') return `${dayStr} (Chiều)`;
          return null;
        })
        .filter(Boolean)
        .join(', ');
    };

    const finalSession = getSessionString();

    const payload = {
      action: 'SUBMIT',
      fullName: userData.name,
      email: userEmail,
      dept: userData.dept,
      manager: userData.manager,
      startDate: selectedDates[0],
      days: leaveDays,
      type: leaveType,
      reason: reason || 'Không có',
      session: finalSession,
      allDates: selectedDates.join(', ')
    };

    try {
      const res = await callGasApi(API_CONFIG.LEAVE_URL, payload);
      setIsLoading(false);

      if (res.status !== 'success') {
        return Swal.fire('Lỗi', res.message || 'Không thể gửi đơn nghỉ phép.', 'error');
      }
      
      await Swal.fire({
        title: 'Thành công!',
        html: `Đã gửi đơn nghỉ phép chờ duyệt đến quản lý:<br><strong>${userData.manager}</strong>`,
        icon: 'success',
        confirmButtonColor: 'var(--tis-red)'
      });

      // Reset form
      setSelectedDates([]);
      setDateSessions({});
      setReason('');
      setLeaveDays(0);
      setLeaveType('');
      loadHistory();
      
    } catch (err) {
      setIsLoading(false);
      Swal.fire('Lỗi kết nối', 'Vui lòng thử lại sau', 'error');
    }
  };

  const handleCancelLeave = async (item) => {
    if (!canCancelLeave(item)) {
      return Swal.fire('Không thể hủy', 'Chỉ đơn đã duyệt và chưa qua ngày nghỉ mới được phép hủy.', 'warning');
    }

    const result = await Swal.fire({
      title: 'Hủy lịch nghỉ phép?',
      input: 'textarea',
      inputLabel: 'Lý do hủy',
      inputPlaceholder: 'Nhập lý do hủy nếu có...',
      inputAttributes: {
        maxlength: 500
      },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--tis-red)',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Đồng ý hủy',
      cancelButtonText: 'Đóng'
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    setLoadingText('Đang hủy lịch nghỉ phép...');

    try {
      const res = await callGasApi(API_CONFIG.LEAVE_URL, {
        action: 'CANCEL_LEAVE',
        id: item.id,
        email: userEmail,
        cancelReason: result.value || ''
      });

      if (res.status === 'success') {
        if (res.balance !== undefined && res.balance !== null) {
          const updatedUserData = { ...userData, balance: res.balance };
          setBalanceOverride({ email: userEmail, balance: parseFloat(res.balance) || 0 });
          localStorage.setItem('tis_user_data', JSON.stringify(updatedUserData));
        }
        await Swal.fire('Thành công', res.message || 'Đã hủy lịch nghỉ phép.', 'success');
        loadHistory();
      } else {
        Swal.fire('Lỗi', res.message || 'Không thể hủy lịch nghỉ phép.', 'error');
      }
    } catch (err) {
      Swal.fire('Lỗi kết nối', 'Vui lòng thử lại sau', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert selectedDates list to FullCalendar background events for visual coloring
  const calendarSelectionEvents = selectedDates.map(date => ({
    start: date,
    display: 'background',
    backgroundColor: 'rgba(214, 31, 47, 0.25)',
    allDay: true
  }));

  return (
    <div className="leave-booking-grid fade-in">
      <LoadingOverlay active={isLoading} text={loadingText} />

      {/* Column Left: Booking Form */}
      <div>
        {/* Create form card */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '16px' }}>
          <h5 style={{ fontWeight: 800, color: 'var(--tis-red)', textTransform: 'uppercase', marginBottom: '20px', borderBottom: '1px solid rgba(15, 23, 42, 0.06)', paddingBottom: '10px' }}>
            Tạo Đơn Mới
          </h5>

          <form onSubmit={handleSubmit}>
            {/* Day Selector Calendar */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Chọn các ngày nghỉ trên lịch</span>
                <span className="premium-badge badge-gray" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                  Đã chọn: {selectedDates.length} ngày
                </span>
              </label>

              <div className="calendar-datepicker" style={{
                background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.06)',
                borderRadius: '12px', padding: '8px', overflow: 'hidden'
              }}>
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale="vi"
                  height="auto"
                  headerToolbar={{
                    left: 'prev,next',
                    center: 'title',
                    right: ''
                  }}
                  events={calendarSelectionEvents}
                  dateClick={toggleDateClick}
                />
              </div>
              <small style={{ color: 'var(--text-muted)', fontStyle: 'italic', display: 'block', marginTop: '6px', fontSize: '0.75rem' }}>
                💡 Click vào các ngày trên lịch để đánh dấu chọn ngày nghỉ.
              </small>
            </div>

            {/* Session details for selected dates (allows fractional days like 1.5, 2.5) */}
            {selectedDates.length > 0 && (
              <div className="fade-in" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Chi tiết buổi nghỉ từng ngày</span>
                  <span className="premium-badge badge-gray" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                    Tổng cộng: {leaveDays} ngày
                  </span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedDates.map(date => {
                    const formattedDate = formatDateVN(date);
                    const currentSession = dateSessions[date] || 'Cả ngày';
                    
                    return (
                      <div 
                        key={date}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          background: 'rgba(15, 23, 42, 0.02)',
                          border: '1px solid rgba(15, 23, 42, 0.06)',
                          padding: '8px 12px',
                          borderRadius: '10px'
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                          📅 {formattedDate}
                        </span>
                        
                        <select
                          className="form-select"
                          style={{ 
                            width: 'auto', 
                            padding: '4px 10px', 
                            fontSize: '0.8rem', 
                            borderRadius: '6px',
                            background: currentSession !== 'Cả ngày' ? 'rgba(234, 179, 8, 0.05)' : 'white',
                            borderColor: currentSession !== 'Cả ngày' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(15, 23, 42, 0.12)',
                            color: currentSession !== 'Cả ngày' ? '#ca8a04' : 'var(--text-main)',
                            fontWeight: '600'
                          }}
                          value={currentSession}
                          onChange={(e) => handleDateSessionChange(date, e.target.value)}
                        >
                          <option value="Cả ngày">Cả ngày (1.0 ngày)</option>
                          <option value="Buổi Sáng">Buổi Sáng (0.5 ngày)</option>
                          <option value="Buổi Chiều">Buổi Chiều (0.5 ngày)</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Leave type display */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">Phân loại nghỉ</label>
              <input 
                type="text" 
                className={leaveTypeClass} 
                style={{ background: 'rgba(255,255,255,0.02)' }}
                value={leaveType}
                placeholder="Tính toán tự động..."
                readOnly
              />
              {calcMsg && (
                <div style={{ color: 'var(--tis-red)', fontSize: '0.8rem', fontStyle: 'italic', marginTop: '4px' }}>
                  ⚠️ {calcMsg}
                </div>
              )}
            </div>

            {/* Reason field */}
            <div style={{ marginBottom: '28px' }}>
              <label className="form-label">Lý do xin nghỉ</label>
              <textarea 
                className="form-control" 
                rows="2" 
                placeholder="Nhập lý do..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
              <button type="submit" className="btn-primary" style={{ padding: '12px 28px', borderRadius: '12px' }}>
                <Send size={16} style={{ marginRight: '6px' }} /> GỬI YÊU CẦU
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Column Right: Personal Info & History Table */}
      <div>
        {/* Profile Info panel */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h5 style={{ fontWeight: 800, color: 'var(--text-main)' }}>{userData.name}</h5>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{userData.dept}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {isManager && (
                <button 
                  onClick={onViewDashboard} 
                  className="btn-secondary" 
                  style={{ 
                    padding: '8px 16px', 
                    color: 'var(--tis-red)', 
                    border: '1px solid rgba(214,31,47,0.2)',
                    fontSize: '0.8rem',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '700'
                  }}
                  title="Vào lịch quản lý nhân sự"
                >
                  <LayoutGrid size={14} />
                  <span>Lịch Quản Lý</span>
                </button>
              )}
            </div>
          </div>

          <div style={{
            marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(15, 23, 42, 0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Phép năm khả dụng:</span>
            <span className="premium-badge badge-green" style={{ fontSize: '1rem', padding: '6px 16px' }}>
              {balance} ngày
            </span>
          </div>
        </div>

        <h5 style={{ fontWeight: 800, color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} /> Lịch sử đăng ký của bạn
        </h5>

        <div className="glass-panel" style={{ padding: '10px', borderRadius: '18px' }}>
          {historyList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              Chưa có lịch sử đăng ký nghỉ phép.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historyList.map((item, idx) => {
                const badgeClass =
                  item.status === 'Đã duyệt' ? 'badge-green' :
                  item.status === 'Chờ duyệt' ? 'badge-yellow' : 'badge-red';

                return (
                  <div
                    key={item.id || idx}
                    style={{
                      background: 'rgba(255,255,255,0.72)',
                      border: '1px solid rgba(15, 23, 42, 0.06)',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      boxShadow: '0 6px 16px rgba(15, 23, 42, 0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>{item.start}</div>
                      <span className={`premium-badge ${badgeClass}`} style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap' }}>
                        {item.status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', alignItems: 'start' }}>
                      <span className="premium-badge badge-gray" style={{ fontSize: '0.75rem', padding: '3px 8px', whiteSpace: 'nowrap' }}>
                        {item.days} ngày
                      </span>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                        {item.type}
                      </div>
                    </div>

                    {canCancelLeave(item) && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <button
                          type="button"
                          onClick={() => handleCancelLeave(item)}
                          className="btn-secondary"
                          style={{ padding: '7px 12px', borderRadius: '10px', color: 'var(--tis-red)', fontSize: '0.78rem', fontWeight: 800 }}
                          title="Hủy lịch nghỉ phép"
                        >
                          <XCircle size={14} />
                          <span>Hủy lịch</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveForm;
