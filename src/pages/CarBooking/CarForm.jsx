import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Navigation, Plus, Trash2, Send, CheckCircle2, ChevronRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { API_CONFIG, callGasApi } from '../../config';
import LoadingOverlay from '../../components/LoadingOverlay';
import Swal from 'sweetalert2';

const CarForm = () => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('tis_user_data') || '{}');
  
  // State variables
  const [fullName, setFullName] = useState(userData.name || '');
  const [department, setDepartment] = useState(userData.dept || '');
  const [transport, setTransport] = useState('');
  const [carOwnerSelect, setCarOwnerSelect] = useState('');
  const [carOwnerInput, setCarOwnerInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [days, setDays] = useState(1);
  const [destinations, setDestinations] = useState(['']);
  const [companions, setCompanions] = useState('');
  
  const [bookingType, setBookingType] = useState('self');
  const [behalfName, setBehalfName] = useState('');
  
  const [km, setKm] = useState(0);
  const [duration, setDuration] = useState('Chưa tính');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Đang xử lý...');
  
  // Conflict checking status
  const [scheduleStatus, setScheduleStatus] = useState({ type: '', message: '' });
  const [isBlocked, setIsBlocked] = useState(false);
  const [oldTripIdToDelete, setOldTripIdToDelete] = useState(null);
  
  // Success overlay state
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [mapUrl, setMapUrl] = useState('');
  
  const [suggestions, setSuggestions] = useState([]);
  const [activeInputIndex, setActiveInputIndex] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimeout = useRef(null);
  const latestQueries = useRef({});

  // Synchronize fullName when bookingType or behalfName changes
  useEffect(() => {
    if (bookingType === 'self') {
      setFullName(userData.name || '');
    } else {
      setFullName(behalfName);
    }
  }, [bookingType, behalfName, userData.name]);

  // Monthly statistics states and effects
  const [personalStats, setPersonalStats] = useState({ trips: 0, km: 0 });
  const [allTrips, setAllTrips] = useState([]);

  // Fetch all trips for statistics on load
  useEffect(() => {
    const fetchTripsForStats = async () => {
      try {
        const res = await callGasApi(API_CONFIG.CAR_URL, { action: 'GET_DATA' });
        if (res.status === 'success') {
          setAllTrips(res.data || []);
        }
      } catch (err) {
        console.error('Error fetching trips for stats:', err);
      }
    };
    fetchTripsForStats();
  }, []);

  const getRecentStatsWindow = () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return { previousMonthStart, currentMonthStart, nextMonthStart };
  };

  const formatStatsRange = () => {
    const { previousMonthStart, currentMonthStart } = getRecentStatsWindow();
    const monthLabel = (date) => `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    return `${monthLabel(previousMonthStart)} - ${monthLabel(currentMonthStart)}`;
  };

  // Compute personal stats for the previous month and current month.
  useEffect(() => {
    const loggedInName = userData.name || '';
    if (!loggedInName || allTrips.length === 0) {
      setPersonalStats({ trips: 0, km: 0 });
      return;
    }

    const { previousMonthStart, nextMonthStart } = getRecentStatsWindow();

    const userTripsInRange = allTrips.filter(trip => {
      const nameMatch = trip.fullName && trip.fullName.trim().toLowerCase() === loggedInName.trim().toLowerCase();
      if (!nameMatch) return false;

      if (!trip.startDate) return false;
      const parts = trip.startDate.split('/');
      if (parts.length !== 3) return false;
      const tripDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));

      return tripDate >= previousMonthStart && tripDate < nextMonthStart;
    });

    let totalKm = 0;
    userTripsInRange.forEach(trip => {
      const parsedKm = parseFloat(trip.km) || 0;
      totalKm += parsedKm;
    });

    setPersonalStats({
      trips: userTripsInRange.length,
      km: Math.round(totalKm * 10) / 10
    });
  }, [userData.name, allTrips]);

  const formatPhotonAddress = (properties) => {
    const parts = [];
    
    if (properties.name) {
      parts.push(properties.name);
    }
    
    let streetAddress = '';
    if (properties.housenumber) {
      streetAddress += properties.housenumber + ' ';
    }
    if (properties.street) {
      streetAddress += properties.street;
    }
    if (streetAddress && properties.name !== properties.street) {
      parts.push(streetAddress.trim());
    }
    
    if (properties.locality) {
      parts.push(properties.locality);
    }
    
    if (properties.district) {
      parts.push(properties.district);
    }
    
    if (properties.city) {
      parts.push(properties.city);
    } else if (properties.state) {
      parts.push(properties.state);
    }
    
    if (properties.country) {
      parts.push(properties.country);
    } else {
      parts.push("Việt Nam");
    }
    
    const uniqueParts = [];
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed && !uniqueParts.includes(trimmed)) {
        uniqueParts.push(trimmed);
      }
    }
    
    return uniqueParts.join(', ');
  };

  const triggerSuggestions = (query, index) => {
    clearTimeout(suggestTimeout.current);
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    latestQueries.current[index] = query;

    suggestTimeout.current = setTimeout(async () => {
      const trimmedQuery = query.trim();
      
      // 1. Try Photon first
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmedQuery)}&limit=10&lon=106.660172&lat=10.762622`;
        const response = await fetch(photonUrl);
        if (response.ok) {
          const data = await response.json();
          // Check if this request is still the latest one for this index
          if (latestQueries.current[index] !== query) return;

          if (data && data.features) {
            const filtered = data.features
              .filter(f => f.properties && (f.properties.countrycode === 'VN' || f.properties.country === 'Việt Nam'))
              .slice(0, 5)
              .map(f => ({
                display_name: formatPhotonAddress(f.properties)
              }));
            
            if (filtered.length > 0) {
              setSuggestions(filtered);
              setActiveInputIndex(index);
              setShowSuggestions(true);
              return;
            }
          }
        }
      } catch (photonErr) {
        console.warn('Photon API failed, falling back to Nominatim:', photonErr);
      }

      // Check if this request is still the latest one for this index
      if (latestQueries.current[index] !== query) return;

      // 2. Fallback to Nominatim
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedQuery)}&limit=5&countrycodes=vn&accept-language=vi`
        );
        if (response.ok) {
          const data = await response.json();
          // Check if this request is still the latest one for this index
          if (latestQueries.current[index] !== query) return;

          setSuggestions(data);
          setActiveInputIndex(index);
          setShowSuggestions(true);
        }
      } catch (nominatimErr) {
        console.error('Nominatim API fallback also failed:', nominatimErr);
      }
    }, 300); // 300ms debounce
  };

  const selectSuggestion = (index, value) => {
    const updated = [...destinations];
    updated[index] = value;
    setDestinations(updated);
    setShowSuggestions(false);
  };
  
  // Ref for timer
  const checkTimeout = useRef(null);

  // Load editing data if available
  useEffect(() => {
    // Set min date to 3 days ago (allowing past booking up to 3 days)
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 3);
    let minDateStr = minDate.toISOString().split('T')[0];

    const editDataJson = localStorage.getItem('editTripData');
    if (editDataJson) {
      try {
        const data = JSON.parse(editDataJson);
        console.log("Loading edit data:", data);

        setOldTripIdToDelete(data.oldId || null);
        const loadedName = data.fullName || '';
        if (loadedName && loadedName !== userData.name) {
          setBookingType('behalf');
          setBehalfName(loadedName);
        } else {
          setBookingType('self');
          setBehalfName('');
        }
        setFullName(loadedName);
        setDepartment(data.dept || '');
        
        // Inline helper to convert format safely during mount
        const getIsoDate = (dateStr) => {
          if (!dateStr) return '';
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          return dateStr;
        };

        const editDateFormatted = getIsoDate(data.startDate);
        setStartDate(editDateFormatted || '');
        
        // If edit date is older than 3 days ago, allow it so it doesn't get blocked
        if (editDateFormatted && editDateFormatted < minDateStr) {
          minDateStr = editDateFormatted;
        }

        setStartTime(data.startTime || '');
        setDays(parseFloat(data.days) || 1);
        setCompanions(data.companions || '');
        setKm(data.km || 0);
        setDuration(data.duration || 'Chưa tính');
        setTransport(data.transport || '');

        if (data.destination) {
          const dests = data.destination.split(' -> ');
          setDestinations(dests);
          
          // Render map on edit load
          const origin = "71 Hoàng Văn Thái, Tân Phú, Quận 7, Thành phố Hồ Chí Minh";
          const destinationsQuery = dests.map(d => encodeURIComponent(d.trim())).join('+to:');
          const url = `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${destinationsQuery}&output=embed`;
          setMapUrl(url);
        }

        if (data.transport === 'Ô tô') {
          const standardOwners = ['Xe anh Phong', 'Xe anh Minh', 'Xe anh Tài'];
          if (standardOwners.includes(data.carOwner)) {
            setCarOwnerSelect(data.carOwner);
          } else {
            setCarOwnerSelect('Khác');
            setCarOwnerInput(data.carOwner);
          }
        }

        localStorage.removeItem('editTripData');
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: `Đang sửa lịch trình của: ${data.fullName}`,
          showConfirmButton: false,
          timer: 3000
        });

      } catch (e) {
        console.error("Error parsing edit data:", e);
      }
    }

    const dateInput = document.getElementById('startDate');
    if (dateInput) {
      dateInput.setAttribute('min', minDateStr);
    }
  }, []);

  // Watch fields that trigger schedule checking
  useEffect(() => {
    if (startDate && startTime && days && transport) {
      clearTimeout(checkTimeout.current);
      checkTimeout.current = setTimeout(checkSchedule, 500);
    }
  }, [startDate, startTime, days, transport, carOwnerSelect, carOwnerInput]);

  const convertDateFormat = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const getCarOwnerValue = () => {
    if (transport !== 'Ô tô') return '';
    if (carOwnerSelect === 'Khác') return carOwnerInput.trim();
    return carOwnerSelect;
  };

  // Check schedule conflict
  const checkSchedule = async () => {
    const carVal = getCarOwnerValue();
    if (transport === 'Ô tô' && carVal.length < 2) return;

    setScheduleStatus({ type: 'info', message: 'Đang kiểm tra lịch xe...' });
    
    const res = await callGasApi(API_CONFIG.CAR_URL, {
      action: 'CHECK_AVAILABILITY',
      date: startDate,
      time: startTime,
      days: days.toString(),
      transport: transport,
      carOwner: carVal
    });

    if (res.status === 'BLOCKED') {
      setIsBlocked(true);
      setScheduleStatus({
        type: 'danger',
        message: `⛔ KHÔNG THỂ ĐĂNG KÝ\n${res.message}`
      });
    } else if (res.status === 'WARNING') {
      setIsBlocked(false);
      setScheduleStatus({
        type: 'warning',
        message: `⚠️ CẢNH BÁO TRÙNG\n${res.message}`
      });
    } else {
      setIsBlocked(false);
      setScheduleStatus({ type: 'success', message: '✔ Lịch trống!' });
      setTimeout(() => {
        setScheduleStatus(prev => prev.type === 'success' ? { type: '', message: '' } : prev);
      }, 3000);
    }
  };

  // Handlers for destinations
  const handleDestChange = (index, value) => {
    const updated = [...destinations];
    updated[index] = value;
    setDestinations(updated);
  };

  const addDestination = () => {
    setDestinations([...destinations, '']);
  };

  const removeDestination = (index) => {
    if (destinations.length > 1) {
      const updated = destinations.filter((_, i) => i !== index);
      setDestinations(updated);
    }
  };

  const adjustDays = (val) => {
    setDays(prev => Math.max(0.5, prev + val));
  };

  // Google Maps Distance calculation
  const measureDistance = async () => {
    const validDests = destinations.filter(d => d.trim() !== '');
    if (validDests.length === 0) {
      return Swal.fire('Thông báo', 'Vui lòng nhập ít nhất một điểm đến!', 'warning');
    }

    setIsLoading(true);
    setLoadingText('Đang tính khoảng cách đường đi...');
    
    const res = await callGasApi(API_CONFIG.CAR_URL, {
      action: 'CALCULATE_DISTANCE',
      destinations: validDests
    });
    
    setIsLoading(false);

    if (res.status === 'success') {
      setKm(res.km);
      setDuration(res.duration);
      
      // Update map route
      const origin = "71 Hoàng Văn Thái, Tân Phú, Quận 7, Thành phố Hồ Chí Minh";
      const destinationsQuery = validDests.map(d => encodeURIComponent(d.trim())).join('+to:');
      const url = `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${destinationsQuery}&output=embed`;
      setMapUrl(url);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Đo thành công: ${res.km} km`,
        showConfirmButton: false,
        timer: 3000
      });
    } else {
      Swal.fire('Lỗi', res.message || 'Lỗi Google Maps!', 'error');
    }
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBlocked) {
      return Swal.fire('Lịch trùng', '⛔ Trùng lịch xe! Vui lòng chọn lịch khác hoặc thương lượng.', 'error');
    }
    if (!km || km === 0) {
      return Swal.fire('Chưa đo km', "⚠️ Vui lòng bấm 'Tính Tổng KM' trước khi gửi đăng ký!", 'warning');
    }

    setIsLoading(true);
    setLoadingText('Đang gửi đăng ký lên hệ thống TIS...');

    const finalDestinationString = destinations.filter(d => d.trim() !== '').join(' -> ');

    const payload = {
      action: 'SUBMIT_FORM',
      fullName,
      department,
      startDate,
      startTime,
      days: days.toString(),
      destination: finalDestinationString,
      km: km.toString(),
      duration: duration,
      transport,
      carOwner: getCarOwnerValue(),
      companions
    };

    const res = await callGasApi(API_CONFIG.CAR_URL, payload);

    if (res.status === 'success') {
      // If we are editing, delete the old trip
      if (oldTripIdToDelete) {
        setLoadingText('Đang cập nhật thay đổi (xóa lịch cũ)...');
        await callGasApi(API_CONFIG.CAR_URL, { action: 'CANCEL_TRIP', id: oldTripIdToDelete });
      }
      
      setIsLoading(false);
      setShowSuccess(true);
      
      // Countdown redirect
      let count = 3;
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          navigate('/car/calendar');
        }
      }, 1000);

    } else {
      setIsLoading(false);
      Swal.fire('Lỗi', res.message || 'Đăng ký thất bại!', 'error');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <LoadingOverlay active={isLoading} text={loadingText} />

      {/* Success Modal */}
      {showSuccess && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(248, 250, 252, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel scale-in" style={{
            padding: '48px 40px',
            maxWidth: '440px',
            width: '90%',
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
            borderRadius: '28px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* Animated Success Rings Icon */}
            <div className="success-pulse-container">
              <CheckCircle2 size={36} color="#ffffff" strokeWidth={2.5} />
            </div>

            <h3 style={{
              fontSize: '1.9rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '12px'
            }}>
              Đăng ký thành công!
            </h3>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '1rem', fontWeight: 500 }}>
              Chúc bạn thượng lộ bình an 🚗✈️
            </p>
            
            <div style={{
              background: 'rgba(15, 23, 42, 0.03)',
              border: '1px solid rgba(15, 23, 42, 0.06)',
              borderRadius: '30px',
              padding: '8px 24px',
              display: 'inline-block',
              marginBottom: '28px',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              fontWeight: 500
            }}>
              Tự động chuyển trang sau <strong style={{ color: 'var(--tis-red)', fontWeight: 700 }}>{countdown}</strong> giây
            </div>
            <br />
            
            <button 
              onClick={() => navigate('/car/calendar')} 
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, var(--tis-red) 0%, #b81826 100%)',
                padding: '14px 36px',
                borderRadius: '30px',
                fontSize: '0.95rem',
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(214, 31, 47, 0.25)',
                transition: 'var(--transition-smooth)'
              }}
            >
              Xem Lịch Ngay <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Quick Navigation Headers */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <Link to="/car/calendar" className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '30px', fontSize: '0.85rem' }}>
          Xem Lịch Xe
        </Link>
        <Link to="/car/list" className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '30px', fontSize: '0.85rem' }}>
          Danh Sách Chuyến
        </Link>
      </div>

      <div className="car-booking-container">
        {/* Left Column: Form */}
        <div className="glass-panel car-form-col" style={{ padding: '32px' }}>
        
        {oldTripIdToDelete && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', color: '#facc15'
          }}>
            <AlertTriangle size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Đang ở chế độ chỉnh sửa lịch trình</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Personal Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              
              {/* Segmented control for booking type */}
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Đăng ký đi xe cho ai? <span style={{ color: 'var(--tis-red)' }}>*</span></label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setBookingType('self')}
                    style={{
                      flex: 1,
                      minWidth: '150px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      background: bookingType === 'self' ? 'linear-gradient(135deg, var(--tis-red) 0%, #b81826 100%)' : 'rgba(15, 23, 42, 0.02)',
                      color: bookingType === 'self' ? '#ffffff' : 'var(--text-main)',
                      border: bookingType === 'self' ? 'none' : '1px solid rgba(15, 23, 42, 0.08)',
                      boxShadow: bookingType === 'self' ? '0 4px 12px rgba(214, 31, 47, 0.15)' : 'none',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    🙋‍♂️ Đăng ký cho bản thân
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingType('behalf')}
                    style={{
                      flex: 1,
                      minWidth: '150px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      background: bookingType === 'behalf' ? 'linear-gradient(135deg, var(--tis-red) 0%, #b81826 100%)' : 'rgba(15, 23, 42, 0.02)',
                      color: bookingType === 'behalf' ? '#ffffff' : 'var(--text-main)',
                      border: bookingType === 'behalf' ? 'none' : '1px solid rgba(15, 23, 42, 0.08)',
                      boxShadow: bookingType === 'behalf' ? '0 4px 12px rgba(214, 31, 47, 0.15)' : 'none',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    🤝 Đăng ký hộ người khác
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Người đăng ký (Cố định)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ background: 'rgba(15, 23, 42, 0.03)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                  value={userData.name || ''}
                  readOnly 
                />
              </div>

              {bookingType === 'self' ? (
                <div>
                  <label className="form-label">Phòng ban <span style={{ color: 'var(--tis-red)' }}>*</span></label>
                  <select 
                    className="form-select" 
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  >
                    <option value="" disabled>Chọn phòng ban...</option>
                    <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                    <option value="Hàng Hải">Hàng Hải</option>
                    <option value="Phi Hàng Hải">Phi Hàng Hải</option>
                    <option value="Bảo Hiểm Sức Khỏe">Bảo Hiểm Sức Khỏe</option>
                    <option value="Phát Triển Kinh Doanh">Phát Triển Kinh Doanh</option>
                    <option value="Hỗ Trợ Kinh Doanh">Hỗ Trợ Kinh Doanh</option>
                    <option value="Kế Toán Tổng Hợp">Kế Toán Tổng Hợp</option>
                    <option value="Bồi Thường">Bồi Thường</option>
                    <option value="IT">IT</option>
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="form-label">Họ tên người được đăng ký hộ<span style={{ color: 'var(--tis-red)' }}>*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Nhập họ tên đồng nghiệp..." 
                      value={behalfName}
                      onChange={(e) => setBehalfName(e.target.value)}
                      required 
                    />
                  </div>
                  <div>
                    <label className="form-label">Phòng ban người được đăng ký hộ<span style={{ color: 'var(--tis-red)' }}>*</span></label>
                    <select 
                      className="form-select" 
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    >
                      <option value="" disabled>Chọn phòng ban...</option>
                      <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                      <option value="Hàng Hải">Hàng Hải</option>
                      <option value="Phi Hàng Hải">Phi Hàng Hải</option>
                      <option value="Bảo Hiểm Sức Khỏe">Bảo Hiểm Sức Khỏe</option>
                      <option value="Phát Triển Kinh Doanh">Phát Triển Kinh Doanh</option>
                      <option value="Hỗ Trợ Kinh Doanh">Hỗ Trợ Kinh Doanh</option>
                      <option value="Kế Toán Tổng Hợp">Kế Toán Tổng Hợp</option>
                      <option value="Bồi Thường">Bồi Thường</option>
                      <option value="IT">IT</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Section 2: Transport */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label className="form-label">Phương tiện <span style={{ color: 'var(--tis-red)' }}>*</span></label>
                <select 
                  className="form-select" 
                  value={transport}
                  onChange={(e) => {
                    setTransport(e.target.value);
                    setCarOwnerSelect('');
                    setCarOwnerInput('');
                  }}
                  required
                >
                  <option value="" disabled>Chọn phương tiện...</option>
                  <option value="Ô tô">Ô tô</option>
                  <option value="Máy bay">Máy bay</option>
                  <option value="Khác">Khác (Taxi, Grab...)</option>
                </select>
              </div>

              {transport === 'Ô tô' && (
                <div>
                  <label className="form-label">Xe của ai? <span style={{ color: 'var(--tis-red)' }}>*</span></label>
                  <select 
                    className="form-select" 
                    value={carOwnerSelect}
                    onChange={(e) => {
                      setCarOwnerSelect(e.target.value);
                      if (e.target.value !== 'Khác') setCarOwnerInput('');
                    }}
                    required
                  >
                    <option value="" disabled>Chọn xe...</option>
                    <option value="Xe anh Phong">Xe anh Phong</option>
                    <option value="Xe anh Minh">Xe anh Minh</option>
                    <option value="Xe anh Tài">Xe anh Tài</option>
                    <option value="Khác">Khác (Nhập tay...)</option>
                  </select>
                  {carOwnerSelect === 'Khác' && (
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ marginTop: '8px' }}
                      placeholder="Nhập tên xe hoặc tài xế..."
                      value={carOwnerInput}
                      onChange={(e) => setCarOwnerInput(e.target.value)}
                      required
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid rgba(15, 23, 42, 0.08)', margin: '24px 0' }} />

          {/* Section 3: Time */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label className="form-label"><Calendar size={14} style={{ marginRight: '4px' }} /> Ngày đi <span style={{ color: 'var(--tis-red)' }}>*</span></label>
              <input 
                type="date" 
                id="startDate"
                className="form-control" 
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (val) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selected = new Date(val);
                    selected.setHours(0, 0, 0, 0);
                    if (selected < today) {
                      Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'warning',
                        title: 'Bạn đang đăng ký ngày cho quá khứ!',
                        text: 'Tối đa ngược 3 ngày (áp dụng cho trường hợp quên đăng ký).',
                        showConfirmButton: false,
                        timer: 5000
                      });
                    }
                  }
                }}
                required 
              />
              {(() => {
                if (startDate) {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const selected = new Date(startDate);
                  selected.setHours(0, 0, 0, 0);
                  if (selected < today) {
                    return (
                      <div style={{ color: 'var(--tis-red)', fontSize: '0.75rem', marginTop: '6px', fontWeight: '600' }}>
                        ⚠️ Bạn đang book ngày cho quá khứ!
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>

            <div>
              <label className="form-label"><Clock size={14} style={{ marginRight: '4px' }} /> Giờ đi <span style={{ color: 'var(--tis-red)' }}>*</span></label>
              <select 
                className="form-select" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required 
              >
                <option value="" disabled>Chọn giờ đi...</option>
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
              <label className="form-label">Số ngày đi</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ padding: '8px 16px', borderRadius: '8px 0 0 8px', borderRight: 'none' }}
                  onClick={() => adjustDays(-0.5)}
                >
                  -
                </button>
                <input 
                  type="number" 
                  className="form-control text-center" 
                  style={{ borderRadius: 0, textAlign: 'center', padding: '8px 5px' }}
                  value={days}
                  readOnly
                  min="0.5" 
                  step="0.5" 
                  required 
                />
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ padding: '8px 16px', borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
                  onClick={() => adjustDays(0.5)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Alert check conflict */}
          {scheduleStatus.message && (
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
                  scheduleStatus.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' :
                  scheduleStatus.type === 'warning' ? 'rgba(234, 179, 8, 0.1)' :
                  scheduleStatus.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                borderColor: 
                  scheduleStatus.type === 'danger' ? 'rgba(239, 68, 68, 0.3)' :
                  scheduleStatus.type === 'warning' ? 'rgba(234, 179, 8, 0.3)' :
                  scheduleStatus.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                color: 
                  scheduleStatus.type === 'danger' ? '#ef4444' :
                  scheduleStatus.type === 'warning' ? '#facc15' :
                  scheduleStatus.type === 'success' ? '#4ade80' : '#60a5fa',
              }}
            >
              {scheduleStatus.type === 'danger' && <AlertCircle size={16} />}
              {scheduleStatus.type === 'warning' && <AlertTriangle size={16} />}
              <span style={{ whiteSpace: 'pre-line' }}>{scheduleStatus.message}</span>
            </div>
          )}

          {/* Section 4: Destinations Route */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.02)',
            border: '1px solid rgba(15, 23, 42, 0.06)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <label className="form-label" style={{ color: 'var(--tis-red)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
              <MapPin size={16} /> Lộ trình công tác (Vui lòng nhập địa chỉ cụ thể)
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {destinations.map((dest, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    width: '32px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(15, 23, 42, 0.04)', borderRadius: '8px', color: 'var(--text-muted)', fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>
                  
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={index === 0 ? "Điểm đến đầu tiên..." : "Điểm đến tiếp theo..."}
                      value={dest}
                      onChange={(e) => {
                        handleDestChange(index, e.target.value);
                        triggerSuggestions(e.target.value, index);
                      }}
                      onFocus={() => {
                        setActiveInputIndex(index);
                        if (dest.trim().length >= 2) {
                          triggerSuggestions(dest, index);
                        }
                      }}
                      onBlur={() => {
                        // Using a small timeout to allow click register, but using onMouseDown is the primary solution
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      required
                    />

                    {/* Floating Dropdown Autocomplete */}
                    {showSuggestions && activeInputIndex === index && suggestions.length > 0 && (
                      <div className="glass-panel" style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: '100%',
                        zIndex: 1000,
                        marginTop: '4px',
                        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        background: '#ffffff',
                        border: '1px solid rgba(15, 23, 42, 0.1)',
                        borderRadius: '12px',
                        padding: '6px 0'
                      }}>
                        {suggestions.map((sug, idx) => {
                          const parts = sug.display_name.split(',');
                          const primaryText = parts[0] ? parts[0].trim() : '';
                          const secondaryText = parts.slice(1).join(',').trim();
                          
                          return (
                            <div 
                              key={idx}
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevents input blur and allows instant click register
                                selectSuggestion(index, sug.display_name);
                              }}
                              style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(15, 23, 42, 0.04)' : 'none',
                                transition: 'background 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                textAlign: 'left'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.04)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(214, 31, 47, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--tis-red)',
                                flexShrink: 0
                              }}>
                                <MapPin size={14} />
                              </div>
                              <div style={{ overflow: 'hidden', flex: 1 }}>
                                <div style={{
                                  fontSize: '0.85rem',
                                  fontWeight: '700',
                                  color: 'var(--text-main)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {primaryText}
                                </div>
                                {secondaryText && (
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    marginTop: '1px'
                                  }}>
                                    {secondaryText}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {index > 0 && (
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ padding: '10px 12px', color: '#ef4444' }}
                      onClick={() => removeDestination(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ padding: '8px 16px', fontSize: '0.85rem' }} 
                onClick={addDestination}
              >
                <Plus size={16} style={{ marginRight: '4px' }} /> Thêm điểm đến
              </button>
              
              <button 
                type="button" 
                className="btn-primary" 
                style={{ 
                  padding: '8px 16px', fontSize: '0.85rem',
                  background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                  boxShadow: 'none', border: '1px solid rgba(15, 23, 42, 0.08)'
                }}
                onClick={measureDistance}
              >
                <Navigation size={14} style={{ marginRight: '4px' }} /> Tính Tổng KM
              </button>
            </div>
          </div>

          {/* Section 5: KM & Duration Display */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px',
            backgroundColor: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.06)',
            borderRadius: '16px', overflow: 'hidden', marginBottom: '24px'
          }}>
            <div style={{ padding: '16px', textAlign: 'center', borderRight: '1px solid rgba(15, 23, 42, 0.06)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>
                Quãng đường dự kiến
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tis-red)' }}>
                {km} km
              </div>
            </div>
            
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>
                Thời gian dự kiến
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
                {duration}
              </div>
            </div>
          </div>

          {/* Section 6: Companions */}
          <div style={{ marginBottom: '32px' }}>
            <label className="form-label"><Users size={14} style={{ marginRight: '4px' }} /> Đi công tác với ai (nếu có)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Nhập tên những người cùng đi..." 
              value={companions}
              onChange={(e) => setCompanions(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ padding: '14px 32px', borderRadius: '12px' }}
              disabled={isBlocked}
            >
              <Send size={18} /> GỬI ĐĂNG KÝ
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Google Maps Route Sketch & User Stats */}
      <div className="glass-panel car-map-col" style={{ gap: '20px' }}>
        
        {/* User Stats Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.02)',
          border: '1px solid rgba(15, 23, 42, 0.06)',
          borderRadius: '16px',
          padding: '16px 20px',
          width: '100%'
        }}>
          <h6 style={{
            fontWeight: 800,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            📊 Thống kê đi xe của bạn ({formatStatsRange()})
          </h6>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid rgba(15, 23, 42, 0.06)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                Tổng chuyến đi
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tis-red)' }}>
                {personalStats.trips} chuyến
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid rgba(15, 23, 42, 0.06)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                Tổng quãng đường
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
                {personalStats.km} km
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          <h5 style={{ fontWeight: 800, color: 'var(--tis-red)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            🗺️ Bản Đồ Lộ Trình
          </h5>
          {!mapUrl ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed rgba(15, 23, 42, 0.1)',
              borderRadius: '16px',
              padding: '40px 20px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.01)',
              minHeight: '260px'
            }}>
              <span style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗺️</span>
              <h6 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', fontSize: '0.9rem' }}>Chưa có lộ trình phát họa</h6>
              <p style={{ fontSize: '0.75rem', maxWidth: '280px', margin: 0 }}>
                Vui lòng điền các điểm đến và bấm <strong>"Tính Tổng KM"</strong> để hiển thị bản đồ trực quan.
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(15, 23, 42, 0.1)', position: 'relative' }}>
              <iframe
                title="Bản đồ lộ trình"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '260px', display: 'block' }}
                src={mapUrl}
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
};

export default CarForm;
