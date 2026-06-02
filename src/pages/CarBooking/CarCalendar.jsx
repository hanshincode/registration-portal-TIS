import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, Trash2, Edit, X, Compass, User, Clock, ShieldAlert } from 'lucide-react';
import { API_CONFIG, callGasApi } from '../../config';
import LoadingOverlay from '../../components/LoadingOverlay';
import Swal from 'sweetalert2';

const CarCalendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal details state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const res = await callGasApi(API_CONFIG.CAR_URL, { action: 'GET_DATA' });
      if (res.status === 'success') {
        const mappedEvents = transformDataToEvents(res.data);
        setEvents(mappedEvents);
      } else {
        Swal.fire('Lỗi', res.message || 'Không thể tải dữ liệu!', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Lỗi', 'Không thể kết nối đến máy chủ!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const transformDataToEvents = (data) => {
    return data.map(item => {
      // item.startDate is "dd/MM/yyyy"
      const parts = item.startDate.split('/');
      if (parts.length !== 3) return null;
      const isoStart = `${parts[2]}-${parts[1]}-${parts[0]}`;
      
      const startObj = new Date(isoStart);
      const endObj = new Date(isoStart);
      const duration = parseFloat(item.days) || 1;
      endObj.setDate(startObj.getDate() + duration);
      const isoEnd = endObj.toISOString().split('T')[0];

      let color = '#64748b'; // Gray for Khác
      if (item.transport === 'Ô tô') color = '#D61F2F'; // TIS Red
      if (item.transport === 'Máy bay') color = '#3b82f6'; // Blue

      const vehicleInfo = item.transport === 'Ô tô' ? (item.carOwner || 'Ô tô') : item.transport;

      return {
        id: item.id.toString(),
        title: `${item.fullName} - ${vehicleInfo}`,
        start: isoStart + 'T' + item.startTime,
        end: isoEnd,
        borderColor: color,
        backgroundColor: color + '15', // 15% opacity background
        textColor: color, // Solid color for high contrast in light theme
        extendedProps: item // store full data inside event
      };
    }).filter(Boolean);
  };

  const handleEventClick = (info) => {
    setSelectedEvent(info.event.extendedProps);
    setShowModal(true);
  };

  const confirmCancel = async (id) => {
    const result = await Swal.fire({
      title: 'Hủy chuyến đi này?',
      text: 'Bạn có chắc chắn muốn HỦY chuyến đi đã đăng ký này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--tis-red)',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Đồng ý hủy',
      cancelButtonText: 'Đóng'
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      setShowModal(false);
      
      try {
        const res = await callGasApi(API_CONFIG.CAR_URL, { action: 'CANCEL_TRIP', id: id });
        if (res.status === 'success') {
          await Swal.fire('Thành công', 'Đã hủy chuyến công tác thành công!', 'success');
          loadCalendarData();
        } else {
          Swal.fire('Lỗi', res.message || 'Không thể hủy chuyến!', 'error');
        }
      } catch (e) {
        Swal.fire('Lỗi', 'Không thể kết nối đến máy chủ!', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const editTrip = (data) => {
    const result = window.confirm("Hệ thống sẽ chuyển sang trang Đăng ký để bạn sửa thông tin. Bấm OK để tiếp tục.");
    if (!result) return;
    
    // Save state to localstorage for editing
    data.oldId = data.id; // reference to delete after submission
    localStorage.setItem('editTripData', JSON.stringify(data));
    setShowModal(false);
    navigate('/car');
  };

  return (
    <div className="fade-in">
      <LoadingOverlay active={isLoading} text="Đang tải lịch trình xe..." showImage={true} />

      {/* Quick Navigation Headers */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link to="/car" className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '30px', fontSize: '0.85rem' }}>
          Đăng Ký Mới
        </Link>
        <Link to="/car/list" className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '30px', fontSize: '0.85rem' }}>
          Danh Sách Chuyến
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth'}
          locale="vi"
          height="auto"
          stickyHeaderDates={true}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: window.innerWidth < 768 ? '' : 'dayGridMonth,listMonth'
          }}
          buttonText={{
            today: 'Hôm nay',
            month: 'Tháng',
            list: 'Lịch biểu'
          }}
          events={events}
          eventClick={handleEventClick}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
        />
      </div>

      {/* Event Details Modal */}
      {showModal && selectedEvent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div 
            className="glass-panel scale-in" 
            style={{ 
              width: '90%', 
              maxWidth: '480px', 
              padding: '24px', 
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.15)',
              borderRadius: '24px'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              color: 'var(--text-main)', marginBottom: '20px'
            }}>
              <h5 style={{ fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', color: 'var(--tis-red)' }}>
                <Compass size={20} /> Chi Tiết Chuyến Đi
              </h5>
              <button 
                onClick={() => setShowModal(false)}
                style={{ 
                  background: 'rgba(15, 23, 42, 0.05)', border: 'none', color: '#475569', 
                  cursor: 'pointer', outline: 'none', width: '32px', height: '32px', 
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(214, 31, 47, 0.1)'; e.currentTarget.style.color = 'var(--tis-red)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.05)'; e.currentTarget.style.color = '#475569'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ color: 'var(--text-main)', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span className={`premium-badge ${
                  selectedEvent.transport === 'Ô tô' ? 'badge-red' : 
                  selectedEvent.transport === 'Máy bay' ? 'badge-blue' : 'badge-gray'
                }`} style={{ fontSize: '0.8rem', padding: '4px 14px', marginBottom: '10px' }}>
                  {selectedEvent.transport}
                </span>
                <h4 style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.25rem', lineHeight: '1.4', wordBreak: 'break-word' }}>
                  {selectedEvent.destination}
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Người đi</label>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      <User size={14} className="text-danger" /> {selectedEvent.fullName}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phòng ban</label>
                    <div style={{ fontWeight: 700, marginTop: '4px', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      {selectedEvent.dept}
                    </div>
                  </div>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid rgba(15, 23, 42, 0.06)' }} />

                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thời gian di chuyển</label>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap', color: 'var(--text-main)' }}>
                    <Clock size={14} className="text-danger" /> 
                    <span>{selectedEvent.startTime} ngày {selectedEvent.startDate}</span>
                    <span className="premium-badge badge-gray" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                      {selectedEvent.days} ngày
                    </span>
                  </div>
                </div>

                {selectedEvent.transport === 'Ô tô' && (
                  <div style={{
                    backgroundColor: 'rgba(214, 31, 47, 0.04)', border: '1px solid rgba(214, 31, 47, 0.12)',
                    borderRadius: '12px', padding: '12px 16px'
                  }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--tis-red)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Xe sử dụng</label>
                    <div style={{ fontWeight: 800, marginTop: '2px', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      🚙 {selectedEvent.carOwner}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Người đi cùng</label>
                  <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.85rem' }}>
                    {selectedEvent.companions || 'Không có'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap',
              paddingTop: '16px', borderTop: '1px solid rgba(15, 23, 42, 0.06)'
            }}>
              <button 
                onClick={() => confirmCancel(selectedEvent.id)}
                className="btn-danger" 
                style={{ 
                  padding: '10px 18px', fontSize: '0.85rem', borderRadius: '30px', fontWeight: '700',
                  background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444',
                  boxShadow: 'none', transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.color = '#ef4444'; }}
              >
                <Trash2 size={14} /> Hủy chuyến
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => editTrip(selectedEvent)}
                  className="btn-primary" 
                  style={{
                    padding: '10px 18px', fontSize: '0.85rem', borderRadius: '30px', fontWeight: '700',
                    background: 'rgba(202, 138, 4, 0.08)', border: '1px solid rgba(202, 138, 4, 0.2)', color: '#b45309',
                    boxShadow: 'none', transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#d97706'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(202, 138, 4, 0.08)'; e.currentTarget.style.color = '#b45309'; }}
                >
                  <Edit size={14} /> Sửa lịch
                </button>
                <button 
                  onClick={() => setShowModal(false)}
                  className="btn-secondary" 
                  style={{ 
                    padding: '10px 18px', fontSize: '0.85rem', borderRadius: '30px', fontWeight: '700',
                    background: '#0f172a', border: 'none', color: '#fff', transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1e293b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarCalendar;
