import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus } from 'lucide-react';
import { API_CONFIG, callGasApi } from '../../config';
import LoadingOverlay from '../../components/LoadingOverlay';
import Swal from 'sweetalert2';

const RoomCalendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await callGasApi(API_CONFIG.ROOM_URL, { action: 'GET_ROOM_DATA' });
      setIsLoading(false);

      if (res.status === 'success') {
        const mappedEvents = res.data.map(item => {
          if (!item || !item.date) return null;

          let formattedDate = item.date;
          if (typeof formattedDate === 'string') {
            if (formattedDate.includes('/')) {
              const dateParts = formattedDate.split('/');
              formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; 
            } else if (formattedDate.includes('T')) {
              formattedDate = formattedDate.split('T')[0];
            }
          }

          const roomName = item.room || 'Phòng họp';
          const isLargeRoom = roomName.includes('Lớn');

          // Validate start/end times and fall back to defaults if malformed
          let startTime = item.start || '08:00';
          if (!startTime.includes(':') || startTime.length < 5) {
            startTime = '08:00';
          }
          let endTime = item.end || '09:00';
          if (!endTime.includes(':') || endTime.length < 5) {
            endTime = '09:00';
          }

          return {
            id: item.rowId || String(Math.random()),
            title: `${roomName}: ${item.fullName || ''}`,
            start: `${formattedDate}T${startTime}:00`,
            end: `${formattedDate}T${endTime}:00`,
            extendedProps: {
              room: roomName,
              user: item.fullName || '',
              title: item.title || '',
              note: item.note || '',
              time: `${startTime} - ${endTime}`,
              rawDate: formattedDate,
              rawStart: startTime,
              rawEnd: endTime
            },
            // Color styles
            color: isLargeRoom ? '#D61F2F' : '#4b5563', // Red for Large, Slate for Small
            textColor: '#fff'
          };
        }).filter(Boolean);

        setEvents(mappedEvents);
      } else {
        Swal.fire('Lỗi', res.message || 'Lỗi tải lịch phòng họp!', 'error');
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      Swal.fire('Lỗi', 'Lỗi kết nối dữ liệu!', 'error');
    }
  };

  const handleEventClick = (info) => {
    const p = info.event.extendedProps;
    
    // Store variables to trigger globally accessible window functions for Swal compatibility
    const meetingData = {
      room: p.room, 
      fullName: p.user, 
      title: p.title, 
      note: p.note, 
      date: p.rawDate, 
      start: p.rawStart, 
      end: p.rawEnd
    };

    Swal.fire({
      title: `<span style="color:var(--tis-red); font-weight: 800;">${p.room}</span>`,
      html: `
        <div class="text-start mb-4" style="font-size: 0.95rem; line-height: 1.8; text-align: left; padding: 10px 15px;">
            <p style="margin-bottom: 8px;">👤 <strong>Người đặt:</strong> ${p.user}</p>
            <p style="margin-bottom: 8px;">⏰ <strong>Thời gian:</strong> ${p.time} ngày ${p.rawDate}</p>
            <p style="margin-bottom: 8px;">📝 <strong>Nội dung:</strong> ${p.title}</p>
            <p style="margin-bottom: 0;">📌 <strong>Ghi chú:</strong> ${p.note || 'Không có'}</p>
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: '📝 Sửa lịch',
      cancelButtonText: '❌ Hủy/Xóa lịch',
      confirmButtonColor: '#eab308',
      cancelButtonColor: '#D61F2F',
      showCloseButton: true,
      customClass: {
        popup: 'glass-panel',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Edit flow
        editMeeting(meetingData);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Delete flow
        deleteMeeting(p.room, p.rawDate, p.rawStart);
      }
    });
  };

  const editMeeting = (data) => {
    localStorage.setItem('edit_meeting_data', JSON.stringify({
      ...data,
      oldRoom: data.room,
      oldDate: data.date,
      oldStart: data.start
    }));
    navigate('/room');
  };

  const deleteMeeting = async (room, date, start) => {
    const confirmResult = await Swal.fire({
      title: 'Xóa lịch họp này?',
      text: "Bạn có chắc chắn muốn hủy lịch và giải phóng phòng họp này?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#D61F2F',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Đóng'
    });

    if (confirmResult.isConfirmed) {
      setIsLoading(true);
      try {
        const res = await callGasApi(API_CONFIG.ROOM_URL, {
          action: 'DELETE_ROOM',
          room: room,
          date: date,
          start: start
        });
        setIsLoading(false);

        if (res.status === 'success') {
          await Swal.fire('Thành công!', 'Lịch họp đã được giải phóng.', 'success');
          fetchEvents();
        } else {
          Swal.fire('Lỗi', res.message || 'Không thể xóa lịch họp lúc này.', 'error');
        }
      } catch (e) {
        setIsLoading(false);
        Swal.fire('Lỗi', 'Mất kết nối với máy chủ hệ thống TIS.', 'error');
      }
    }
  };

  return (
    <div className="fade-in">
      <LoadingOverlay active={isLoading} text="Đang tải lịch phòng họp..." showImage={true} />

      {/* Quick Navigation Headers */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link to="/room" className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '30px', fontSize: '0.85rem' }}>
          Đặt Phòng Mới
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
        {/* Legends */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#D61F2F' }}></span>
            <span>Phòng Lớn</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#4b5563' }}></span>
            <span>Phòng Nhỏ</span>
          </div>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth'}
          locale="vi"
          height="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth,timeGridWeek'
          }}
          buttonText={{
            today: 'Hôm nay',
            month: 'Tháng',
            week: 'Tuần',
            list: 'Lịch biểu'
          }}
          events={events}
          eventClick={handleEventClick}
        />
      </div>
    </div>
  );
};

export default RoomCalendar;
