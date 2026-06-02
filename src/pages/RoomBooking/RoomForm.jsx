import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, BookOpen, User, StickyNote, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';
import { API_CONFIG, callGasApi } from '../../config';
import LoadingOverlay from '../../components/LoadingOverlay';
import Swal from 'sweetalert2';

const RoomForm = () => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('tis_user_data') || '{}');
  
  // State variables
  const [selectedRoom, setSelectedRoom] = useState('');
  const [activeSide, setActiveSide] = useState('none'); // 'left', 'right', or 'none'
  const [fullName, setFullName] = useState(userData.name || '');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [meetingNote, setMeetingNote] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [oldMeetingData, setOldMeetingData] = useState({});
  const [conflictMsg, setConflictMsg] = useState('');

  const checkTimeout = useRef(null);

  useEffect(() => {
    // Set date input min attribute to today
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('meetingDate');
    if (dateInput) dateInput.setAttribute('min', todayStr);

    // Auto-fill edit mode
    const editDataRaw = localStorage.getItem('edit_meeting_data');
    if (editDataRaw) {
      try {
        const data = JSON.parse(editDataRaw);
        setIsEditMode(true);
        setOldMeetingData({ room: data.oldRoom, date: data.oldDate, start: data.oldStart });

        setFullName(data.fullName || '');
        setMeetingTitle(data.title || '');
        setMeetingNote(data.note || '');
        
        if (data.date && data.date.includes('/')) {
          const p = data.date.split('/');
          setMeetingDate(`${p[2]}-${p[1]}-${p[0]}`);
        } else {
          setMeetingDate(data.date || '');
        }
        
        setStartTime(data.start || '');
        setEndTime(data.end || '');
        setSelectedRoom(data.room || '');
        setActiveSide(data.room && data.room.includes('Lớn') ? 'left' : 'right');

        localStorage.removeItem('edit_meeting_data');
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Chế độ chỉnh sửa lịch họp',
          showConfirmButton: false,
          timer: 3000
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  // Trigger check availability
  useEffect(() => {
    if (selectedRoom && meetingDate && startTime && endTime) {
      clearTimeout(checkTimeout.current);
      checkTimeout.current = setTimeout(checkAvailability, 500);
    }
  }, [selectedRoom, meetingDate, startTime, endTime]);

  const checkAvailability = async () => {
    if (startTime >= endTime) {
      setConflictMsg('⚠️ Giờ kết thúc phải sau giờ bắt đầu!');
      setIsBlocked(true);
      return;
    }

    setConflictMsg('Đang kiểm tra trùng lịch...');
    setIsBlocked(true);

    try {
      const res = await callGasApi(API_CONFIG.ROOM_URL, {
        action: 'CHECK_ROOM',
        room: selectedRoom,
        date: meetingDate,
        start: startTime,
        end: endTime
      });

      if (res.status === 'CONFLICT') {
        setIsBlocked(true);
        // Clean out HTML tags for safe React display
        const cleanMsg = res.message.replace(/<b>/g, '').replace(/<\/b>/g, '');
        setConflictMsg(`⛔ TRÙNG LỊCH!\n${cleanMsg}`);
      } else {
        setIsBlocked(false);
        setConflictMsg('✔ Phòng trống, bạn có thể đặt!');
        setTimeout(() => {
          setConflictMsg(prev => prev === '✔ Phòng trống, bạn có thể đặt!' ? '' : prev);
        }, 3000);
      }
    } catch (e) {
      setConflictMsg('Lỗi kết nối máy chủ.');
      setIsBlocked(true);
    }
  };

  const handleSelectRoom = (roomName, side) => {
    setSelectedRoom(roomName);
    setActiveSide(side);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) {
      return Swal.fire('Thiếu thông tin', 'Vui lòng chọn một phòng họp!', 'warning');
    }
    if (isBlocked && !isEditMode) {
      return Swal.fire('Trùng lịch', 'Vui lòng chọn khung giờ khác vì lịch đã bị trùng!', 'error');
    }

    setIsLoading(true);

    const payload = {
      action: isEditMode ? 'UPDATE_ROOM' : 'BOOK_ROOM',
      room: selectedRoom,
      fullName,
      title: meetingTitle || 'Chưa cập nhật nội dung',
      date: meetingDate,
      start: startTime,
      end: endTime,
      note: meetingNote
    };

    if (isEditMode) {
      payload.oldRoom = oldMeetingData.room;
      payload.oldDate = oldMeetingData.date;
      payload.oldStart = oldMeetingData.start;
    }

    try {
      const res = await callGasApi(API_CONFIG.ROOM_URL, payload);
      setIsLoading(false);
      
      if (res.status === 'success') {
        await Swal.fire(
          'Thành công!',
          isEditMode ? 'Đã cập nhật lịch họp thành công!' : 'Đã chốt đặt phòng họp thành công!',
          'success'
        );
        navigate('/room/calendar');
      } else {
        Swal.fire('Lỗi', res.message || 'Có lỗi xảy ra', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      Swal.fire('Lỗi', 'Không thể kết nối máy chủ.', 'error');
    }
  };

  // Background style helpers
  const bgHalfBaseStyle = {
    flex: 1,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)',
    opacity: 0.15,
    filter: 'blur(8px) grayscale(40%)'
  };

  const bgLeftClass = activeSide === 'left' 
    ? { ...bgHalfBaseStyle, flex: 1.8, opacity: 0.5, filter: 'blur(0px) grayscale(0%)' }
    : activeSide === 'right'
    ? { ...bgHalfBaseStyle, flex: 0.2, opacity: 0.05, filter: 'blur(12px) grayscale(80%)' }
    : bgHalfBaseStyle;

  const bgRightClass = activeSide === 'right' 
    ? { ...bgHalfBaseStyle, flex: 1.8, opacity: 0.5, filter: 'blur(0px) grayscale(0%)' }
    : activeSide === 'left'
    ? { ...bgHalfBaseStyle, flex: 0.2, opacity: 0.05, filter: 'blur(12px) grayscale(80%)' }
    : bgHalfBaseStyle;

  return (
    <div className="fade-in" style={{ position: 'relative', minHeight: '80vh', padding: '10px 0' }}>
      <LoadingOverlay active={isLoading} text="Đang xử lý đặt phòng..." />

      {/* Embedded Backgrounds for Room Section */}
      <div style={{
        display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
        zIndex: -1, backgroundColor: '#f1f5f9', pointerEvents: 'none'
      }}>
        <div style={{ ...bgLeftClass, backgroundImage: "url('/vp2.jpg')" }}></div>
        <div style={{ ...bgRightClass, backgroundImage: "url('/vp1.jpg')" }}></div>
      </div>
      
      {/* Light overlay screen overlay */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 0%, rgba(248, 250, 252, 0.75) 100%)',
        zIndex: -1, pointerEvents: 'none'
      }}></div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
        <Link to="/room/calendar" className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '30px', fontSize: '0.85rem' }}>
          Xem Lịch Phòng Họp
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '650px', width: '100%', padding: '36px', background: 'var(--bg-card)' }}>
          
          <h4 style={{ textTransform: 'uppercase', fontWeight: 800, textAlign: 'center', marginBottom: '24px', letterSpacing: '0.5px' }}>
            {isEditMode ? 'Cập Nhật Lịch Họp' : 'Đăng Ký Đặt Phòng Họp'}
          </h4>

          <form onSubmit={handleSubmit}>
            {/* Room Selection Cards */}
            <div style={{ marginBottom: '28px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', marginBottom: '12px' }}>
                <BookOpen size={16} className="text-danger" /> Chọn phòng họp <span style={{ color: 'var(--tis-red)' }}>*</span>
              </label>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* Large Room Card */}
                <div 
                  onClick={() => handleSelectRoom('Phòng Lớn', 'left')}
                  style={{
                    flex: 1, minWidth: '180px', borderRadius: '16px', padding: '24px 16px', cursor: 'pointer', textAlign: 'center',
                    transition: 'var(--transition-smooth)',
                    background: selectedRoom === 'Phòng Lớn' ? 'rgba(214, 31, 47, 0.08)' : 'rgba(15, 23, 42, 0.02)',
                    border: selectedRoom === 'Phòng Lớn' ? '2px solid var(--tis-red)' : '2px solid rgba(15, 23, 42, 0.08)',
                    transform: selectedRoom === 'Phòng Lớn' ? 'translateY(-2px)' : 'none',
                    boxShadow: selectedRoom === 'Phòng Lớn' ? '0 10px 20px rgba(214, 31, 47, 0.15)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRoom !== 'Phòng Lớn') {
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.04)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRoom !== 'Phòng Lớn') {
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.02)';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <div style={{ fontSize: '2rem', color: selectedRoom === 'Phòng Lớn' ? 'var(--tis-red)' : 'var(--text-muted)', marginBottom: '8px' }}>
                    🏫
                  </div>
                  <h6 style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem', marginBottom: '4px' }}>Phòng Lớn</h6>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>👥 12-15 người</div>
                </div>

                {/* Small Room Card */}
                <div 
                  onClick={() => handleSelectRoom('Phòng Nhỏ', 'right')}
                  style={{
                    flex: 1, minWidth: '180px', borderRadius: '16px', padding: '24px 16px', cursor: 'pointer', textAlign: 'center',
                    transition: 'var(--transition-smooth)',
                    background: selectedRoom === 'Phòng Nhỏ' ? 'rgba(214, 31, 47, 0.08)' : 'rgba(15, 23, 42, 0.02)',
                    border: selectedRoom === 'Phòng Nhỏ' ? '2px solid var(--tis-red)' : '2px solid rgba(15, 23, 42, 0.08)',
                    transform: selectedRoom === 'Phòng Nhỏ' ? 'translateY(-2px)' : 'none',
                    boxShadow: selectedRoom === 'Phòng Nhỏ' ? '0 10px 20px rgba(214, 31, 47, 0.15)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRoom !== 'Phòng Nhỏ') {
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.04)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRoom !== 'Phòng Nhỏ') {
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.02)';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <div style={{ fontSize: '2rem', color: selectedRoom === 'Phòng Nhỏ' ? 'var(--tis-red)' : 'var(--text-muted)', marginBottom: '8px' }}>
                    💻
                  </div>
                  <h6 style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem', marginBottom: '4px' }}>Phòng Nhỏ</h6>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>👥 4-6 người</div>
                </div>
              </div>
            </div>

            {/* Bookers & meeting details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label className="form-label">Người đặt <span style={{ color: 'var(--tis-red)' }}>*</span></label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="VD: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>

              <div>
                <label className="form-label">Nội dung cuộc họp</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="VD: Họp báo cáo tuần"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                />
              </div>
            </div>

            {/* Time slot picker */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.02)',
              border: '1px solid rgba(15, 23, 42, 0.06)',
              borderRadius: '16px',
              padding: '24px 20px',
              marginBottom: '24px'
            }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', marginBottom: '16px' }}>
                <Clock size={16} className="text-danger" /> Thời gian sử dụng phòng
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Ngày họp <span style={{ color: 'var(--tis-red)' }}>*</span></label>
                  <input 
                    type="date" 
                    id="meetingDate"
                    className="form-control"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Từ giờ <span style={{ color: 'var(--tis-red)' }}>*</span></label>
                  <select 
                    className="form-select"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  >
                    <option value="" disabled>Chọn giờ...</option>
                    {(() => {
                      const slots = [];
                      for (let h = 0; h <= 23; h++) {
                        const hh = h.toString().padStart(2, '0');
                        slots.push(`${hh}:00`, `${hh}:15`, `${hh}:30`, `${hh}:45`);
                      }
                      if (startTime && !slots.includes(startTime)) {
                        slots.push(startTime);
                        slots.sort();
                      }
                      return slots.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ));
                    })()}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Đến giờ <span style={{ color: 'var(--tis-red)' }}>*</span></label>
                  <select 
                    className="form-select"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  >
                    <option value="" disabled>Chọn giờ...</option>
                    {(() => {
                      const slots = [];
                      for (let h = 0; h <= 23; h++) {
                        const hh = h.toString().padStart(2, '0');
                        slots.push(`${hh}:00`, `${hh}:15`, `${hh}:30`, `${hh}:45`);
                      }
                      if (endTime && !slots.includes(endTime)) {
                        slots.push(endTime);
                        slots.sort();
                      }
                      return slots.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ));
                    })()}
                  </select>
                </div>
              </div>
            </div>

            {/* Note text field */}
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label"><StickyNote size={14} style={{ marginRight: '4px' }} /> Ghi chú thêm</label>
              <textarea 
                className="form-control" 
                rows="2" 
                placeholder="VD: Cần chuẩn bị thêm 5 ghế, nước suối..."
                value={meetingNote}
                onChange={(e) => setMeetingNote(e.target.value)}
              />
            </div>

            {/* Dynamic availability checker display */}
            {conflictMsg && (
              <div 
                className="fade-in"
                style={{
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid',
                  backgroundColor: 
                    conflictMsg.includes('⛔') || conflictMsg.includes('⚠️') ? 'rgba(239, 68, 68, 0.1)' :
                    conflictMsg.includes('✔') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                  borderColor: 
                    conflictMsg.includes('⛔') || conflictMsg.includes('⚠️') ? 'rgba(239, 68, 68, 0.3)' :
                    conflictMsg.includes('✔') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                  color: 
                    conflictMsg.includes('⛔') || conflictMsg.includes('⚠️') ? '#ef4444' :
                    conflictMsg.includes('✔') ? '#4ade80' : '#60a5fa',
                }}
              >
                {conflictMsg.includes('⛔') && <AlertTriangle size={16} />}
                <span style={{ whiteSpace: 'pre-line' }}>{conflictMsg}</span>
              </div>
            )}

            {/* Submit button */}
            <button 
              type="submit" 
              className={isEditMode ? 'btn-primary' : 'btn-primary'}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                background: isEditMode ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' : undefined,
                boxShadow: isEditMode ? '0 8px 20px rgba(234, 179, 8, 0.25)' : undefined
              }}
              disabled={isBlocked && !isEditMode}
            >
              {isEditMode ? 'CẬP NHẬT LỊCH' : 'CHỐT ĐẶT PHÒNG'} <ArrowRight size={16} style={{ marginLeft: '4px' }} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomForm;
