import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { Calendar, Search, Filter, Power, User, ArrowLeft, RefreshCw, Smile } from 'lucide-react';
import { API_CONFIG, callGasApi } from '../../config';
import LoadingOverlay from '../../components/LoadingOverlay';
import Swal from 'sweetalert2';

const LeaveDashboard = ({ userEmail, onLogout, onViewForm }) => {
  const [allHistory, setAllHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [todayOff, setTodayOff] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'calendar'
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [availableMonths, setAvailableMonths] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [userEmail]);

  // Apply filters
  useEffect(() => {
    let result = [...allHistory];

    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter(item => 
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.dept && item.dept.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    if (monthFilter !== 'all') {
      result = result.filter(item => item.start && item.start.includes(monthFilter));
    }

    setFilteredHistory(result);
  }, [searchText, statusFilter, monthFilter, allHistory]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await callGasApi(API_CONFIG.LEAVE_URL, {
        action: 'GET_ALL_HISTORY',
        email: userEmail
      });

      if (res.status === 'success') {
        const sorted = sortHistoryByDate(res.data);
        setAllHistory(sorted);
        setFilteredHistory(sorted);
        
        extractMonths(sorted);
        calculateTodayOff(sorted);
        transformToCalendarEvents(sorted);
      } else {
        Swal.fire('Lỗi', res.message || 'Không thể tải lịch sử phép toàn công ty', 'error');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Lỗi', 'Không thể kết nối máy chủ', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const sortHistoryByDate = (data) => {
    return [...data].sort((a, b) => {
      const parseDate = (dateStr) => {
        if (!dateStr) return new Date(0);
        const parts = dateStr.split(' ')[0].split('/'); 
        return parts.length === 3 ? new Date(parts[2], parts[1] - 1, parts[0]) : new Date(0);
      };
      return parseDate(b.start) - parseDate(a.start);
    });
  };

  const extractMonths = (data) => {
    const months = new Set();
    data.forEach(item => {
      if (item.start) {
        const parts = item.start.split(' ')[0].split('/');
        if (parts.length >= 2) {
          months.add(`${parts[1]}/${parts[2]}`);
        }
      }
    });

    const sortedMonths = Array.from(months).sort((a, b) => {
      const [mA, yA] = a.split('/'); 
      const [mB, yB] = b.split('/');
      return new Date(yB, mB - 1) - new Date(yA, mA - 1);
    });

    setAvailableMonths(sortedMonths);
  };

  const calculateTodayOff = (data) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const offList = data.filter(item => {
      if (item.status === 'Từ chối' || !item.start) return false;

      const dateOnlyStr = item.start.split(' ')[0]; 
      const p = dateOnlyStr.split('/');
      if (p.length !== 3) return false;

      const startDate = new Date(p[2], p[1] - 1, p[0]);
      startDate.setHours(0, 0, 0, 0);
      const days = parseFloat(item.days) || 1;
      const duration = Math.ceil(days);
      const endDate = new Date(startDate.getTime());
      endDate.setDate(startDate.getDate() + duration - 1);
      
      return currentDate >= startDate && currentDate <= endDate;
    });

    setTodayOff(offList);
  };

  const getCalendarDates = (dateStr, days) => {
    let p = dateStr.split(' ')[0].split('/');
    if (p.length !== 3) return null;
    let startISO = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;

    let endISO = null;
    if (days > 1) {
      let start = new Date(p[2], p[1] - 1, p[0]);
      let end = new Date(start);
      end.setDate(end.getDate() + Math.ceil(days));
      endISO = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    }
    return { start: startISO, end: endISO };
  };

  const transformToCalendarEvents = (data) => {
    const events = [];
    data.forEach(item => {
      if (item.status !== 'Từ chối') {
        const calDates = getCalendarDates(item.start, parseFloat(item.days));
        if (calDates) {
          events.push({
            title: `${item.name} (${item.days} ngày)`,
            start: calDates.start,
            end: calDates.end,
            extendedProps: item,
            color: item.status === 'Đã duyệt' ? '#10b981' : '#facc15', // Green for approved, Yellow for pending
            textColor: item.status === 'Đã duyệt' ? '#fff' : '#0f172a'
          });
        }
      }
    });
    setCalendarEvents(events);
  };

  const handleEventClick = (info) => {
    const p = info.event.extendedProps;
    const badgeColor = p.status === 'Đã duyệt' ? 'badge-green' : 'badge-yellow';
    
    Swal.fire({
      title: `<span class="text-danger fw-bold">${p.name}</span>`,
      html: `
        <div class="text-start mt-3" style="font-size: 0.95rem; line-height: 1.8; text-align: left; padding: 10px 15px;">
            <p style="margin-bottom: 6px;">💼 <strong>Phòng ban:</strong> ${p.dept}</p>
            <p style="margin-bottom: 6px;">🌴 <strong>Loại đơn:</strong> ${p.type} (${p.days} ngày)</p>
            <p style="margin-bottom: 6px;">📅 <strong>Ngày nghỉ:</strong> ${p.start}</p>
            <p style="margin-bottom: 6px;">💬 <strong>Lý do nghỉ:</strong> "${p.reason || 'Không có'}"</p>
            <p style="margin-bottom: 0;">✅ <strong>Trạng thái:</strong> <span class="premium-badge ${badgeColor}" style="font-size: 0.75rem; padding: 2px 8px">${p.status}</span></p>
        </div>
      `,
      confirmButtonColor: 'var(--tis-red)'
    });
  };

  return (
    <div className="fade-in">
      <LoadingOverlay active={isLoading} text="Đang tải dữ liệu dashboard phép..." showImage={true} />

      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h4 style={{ fontWeight: 800, color: 'var(--text-main)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Quản Lý Lịch Nghỉ Phép TIS
        </h4>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={loadDashboardData} className="btn-secondary" style={{ padding: '8px 12px' }} title="Tải lại dữ liệu">
            <RefreshCw size={16} />
          </button>
          <button onClick={onViewForm} className="btn-secondary">
            <ArrowLeft size={16} /> Tạo Đơn Cá Nhân
          </button>
          <button onClick={onLogout} className="btn-secondary" style={{ color: 'var(--tis-red)', border: '1px solid rgba(214, 31, 47, 0.2)' }}>
            <Power size={16} /> Thoát
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-panel" style={{ padding: '8px', borderRadius: '16px', display: 'inline-flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            background: activeTab === 'list' ? 'var(--tis-red)' : 'transparent',
            border: 'none', color: activeTab === 'list' ? '#fff' : 'var(--text-muted)', padding: '10px 20px', borderRadius: '10px',
            fontWeight: 700, cursor: 'pointer', transition: 'var(--transition-smooth)'
          }}
        >
          Danh Sách Đơn
        </button>
        
        <button
          onClick={() => setActiveTab('calendar')}
          style={{
            background: activeTab === 'calendar' ? 'var(--tis-red)' : 'transparent',
            border: 'none', color: activeTab === 'calendar' ? '#fff' : 'var(--text-muted)', padding: '10px 20px', borderRadius: '10px',
            fontWeight: 700, cursor: 'pointer', transition: 'var(--transition-smooth)'
          }}
        >
          Lịch Tổng Thể
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="fade-in">
          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'center' }}>
              
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ paddingLeft: '38px', paddingRight: '12px' }}
                  placeholder="Tìm nhân viên..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <div>
                <select className="form-select" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                  <option value="all">📅 Tất cả thời gian</option>
                  {availableMonths.map(m => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              </div>

              <div>
                <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">⏳ Tất cả trạng thái</option>
                  <option value="Chờ duyệt">⏳ Chờ duyệt</option>
                  <option value="Đã duyệt">✅ Đã duyệt</option>
                  <option value="Từ chối">❌ Từ chối</option>
                </select>
              </div>

            </div>
          </div>

          {/* Data table */}
          <div className="premium-table-container glass-panel" style={{ padding: '4px' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Ngày nghỉ</th>
                  <th>Nhân viên</th>
                  <th>Lý do</th>
                  <th style={{ textAlign: 'right', width: '140px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Không tìm thấy bản ghi nghỉ phép nào.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item, idx) => {
                    const badgeClass = 
                      item.status === 'Đã duyệt' ? 'badge-green' :
                      item.status === 'Chờ duyệt' ? 'badge-yellow' : 'badge-red';

                    return (
                      <tr key={item.id || idx}>
                        <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.start}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{item.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.dept}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.type} ({item.days} ngày)</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                            "{item.reason || 'Không có'}"
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`premium-badge ${badgeClass}`} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Who is off today grid */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h6 style={{ fontWeight: 800, color: 'var(--tis-red)', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '1px solid rgba(15, 23, 42, 0.06)', paddingBottom: '8px' }}>
              🌴 Nghỉ Hôm Nay
            </h6>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {todayOff.length === 0 ? (
                <div style={{
                  width: '100%', padding: '24px', borderRadius: '12px', border: '1px dashed rgba(15, 23, 42, 0.1)',
                  textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                }}>
                  <Smile size={32} color="#facc15" />
                  <span style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                    Hôm nay không có ai nghỉ. Mọi người đều đi làm đầy đủ!
                  </span>
                </div>
              ) : (
                todayOff.map((item, idx) => {
                  const badgeClass = item.status === 'Đã duyệt' ? 'badge-green' : 'badge-yellow';
                  
                  return (
                    <div 
                      key={item.id || idx}
                      style={{
                        minWidth: '220px', flex: 1, padding: '16px', borderRadius: '12px',
                        background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.06)',
                        borderLeft: `4px solid ${item.status === 'Đã duyệt' ? '#10b981' : '#facc15'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{item.start}</span>
                        <span className={`premium-badge ${badgeClass}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{item.status}</span>
                      </div>
                      <h6 style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '4px' }}>{item.name}</h6>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {item.type} ({item.days} ngày)
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Master calendar */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h6 style={{ fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px', borderBottom: '1px solid rgba(15, 23, 42, 0.06)', paddingBottom: '8px' }}>
              📅 Lịch Tổng Thể
            </h6>
            
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
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
              events={calendarEvents}
              eventClick={handleEventClick}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveDashboard;
