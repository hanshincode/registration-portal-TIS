import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Compass, Users, MapPin, Calendar, Clock, Car, Plane, HelpCircle } from 'lucide-react';
import { API_CONFIG, callGasApi } from '../../config';
import LoadingOverlay from '../../components/LoadingOverlay';
import Swal from 'sweetalert2';

const CarList = () => {
  const [trips, setTrips] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setIsLoading(true);
    try {
      const res = await callGasApi(API_CONFIG.CAR_URL, { action: 'GET_DATA' });
      if (res.status === 'success') {
        setTrips(res.data);
      } else {
        Swal.fire('Lỗi', res.message || 'Không thể tải danh sách chuyến đi!', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Lỗi', 'Không thể kết nối đến máy chủ!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showCompanions = (companions) => {
    if (!companions) {
      return Swal.fire({
        title: 'Bạn đồng hành',
        text: 'Chuyến đi này không đăng ký người đi cùng.',
        icon: 'info',
        confirmButtonColor: 'var(--tis-red)'
      });
    }
    
    Swal.fire({
      title: 'Danh sách người đi cùng',
      html: `<div style="text-align: left; padding: 10px 20px; font-weight: 500;">
              🚙 ${companions.split(',').join('<br>🚙 ')}
             </div>`,
      icon: 'info',
      confirmButtonColor: 'var(--tis-red)'
    });
  };

  // Filter trips based on search query
  const filteredTrips = trips.filter(trip => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    return (
      (trip.fullName && trip.fullName.toLowerCase().includes(query)) ||
      (trip.dept && trip.dept.toLowerCase().includes(query)) ||
      (trip.destination && trip.destination.toLowerCase().includes(query)) ||
      (trip.transport && trip.transport.toLowerCase().includes(query)) ||
      (trip.carOwner && trip.carOwner.toLowerCase().includes(query))
    );
  });

  return (
    <div className="fade-in">
      <LoadingOverlay active={isLoading} text="Đang tải danh sách lịch trình..." showImage={true} />

      {/* Quick Navigation Headers */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link to="/car" className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '30px', fontSize: '0.85rem' }}>
          Đăng Ký Mới
        </Link>
        <Link to="/car/calendar" className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '30px', fontSize: '0.85rem' }}>
          Xem Lịch Xe
        </Link>
      </div>

      {/* Search Header */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
            />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '44px' }}
              placeholder="Tìm theo tên, phòng ban, điểm đến..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Tổng cộng: <strong>{filteredTrips.length}</strong> chuyến đi
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="premium-table-container glass-panel" style={{ padding: '4px' }}>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Người đi / Phòng ban</th>
              <th>Thời gian</th>
              <th>Điểm đến</th>
              <th>Phương tiện</th>
              <th style={{ textAlign: 'right' }}>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Không có chuyến công tác nào khớp với tìm kiếm.
                </td>
              </tr>
            ) : (
              filteredTrips.map((trip, idx) => (
                <tr key={trip.id || idx}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{trip.fullName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{trip.dept}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--tis-red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {trip.startTime}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {trip.startDate}
                    </div>
                    <span 
                      className="premium-badge badge-gray" 
                      style={{ fontSize: '0.75rem', padding: '1px 6px', marginTop: '6px' }}
                    >
                      {trip.days} ngày
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', maxWidth: '280px', fontSize: '0.9rem' }}>
                      <MapPin size={14} className="text-danger" style={{ marginTop: '3px', flexShrink: 0 }} />
                      <span style={{ wordBreak: 'break-word' }}>{trip.destination}</span>
                    </div>
                  </td>
                  <td>
                    {trip.transport === 'Ô tô' ? (
                      <div>
                        <span className="premium-badge badge-red">
                          <Car size={12} /> Ô tô
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                          {trip.carOwner}
                        </div>
                      </div>
                    ) : trip.transport === 'Máy bay' ? (
                      <span className="premium-badge badge-blue">
                        <Plane size={12} /> Máy bay
                      </span>
                    ) : (
                      <span className="premium-badge badge-gray">
                        {trip.transport}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => showCompanions(trip.companions)}
                      className="btn-secondary" 
                      style={{ padding: '8px 12px', borderRadius: '10px' }}
                      title="Xem người đi cùng"
                    >
                      <Users size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CarList;
