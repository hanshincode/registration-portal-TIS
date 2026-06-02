import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Portal from './pages/Portal';
import CarForm from './pages/CarBooking/CarForm';
import CarCalendar from './pages/CarBooking/CarCalendar';
import CarList from './pages/CarBooking/CarList';
import RoomForm from './pages/RoomBooking/RoomForm';
import RoomCalendar from './pages/RoomBooking/RoomCalendar';
import LeaveBookingIndex from './pages/LeaveBooking';
import LeaveApprove from './pages/LeaveBooking/LeaveApprove';
import LeaveAuth from './pages/LeaveBooking/LeaveAuth';
import LoadingOverlay from './components/LoadingOverlay';
import { API_CONFIG, callGasApi } from './config';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAutoLogin();
  }, []);

  const checkAutoLogin = async () => {
    const savedEmail = localStorage.getItem('tis_email');
    const savedToken = localStorage.getItem('tis_token');

    if (savedEmail && savedToken) {
      try {
        const res = await callGasApi(API_CONFIG.LEAVE_URL, {
          action: 'AUTO_LOGIN',
          email: savedEmail,
          token: savedToken
        });

        if (res.status === 'success') {
          handleLoginSuccess(res, savedEmail);
        } else {
          localStorage.removeItem('tis_token');
          localStorage.removeItem('tis_user_data');
          setIsLoggedIn(false);
        }
      } catch (e) {
        console.error('Auto login error:', e);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
    setIsLoading(false);
  };

  const handleLoginSuccess = (data, email) => {
    setUserData(data);
    setUserEmail(email);
    setIsLoggedIn(true);
    localStorage.setItem('tis_email', email);
    localStorage.setItem('tis_user_data', JSON.stringify(data));
    if (data.token) {
      localStorage.setItem('tis_token', data.token);
    }
  };

  if (isLoading) {
    return <LoadingOverlay active={true} text="Đang đồng bộ phiên làm việc TIS..." showImage={true} />;
  }

  // Bỏ qua xác thực cho trang duyệt nhanh từ email của quản lý
  const isApprovePage = window.location.hash.includes('/leave/approve');

  if (!isLoggedIn && !isApprovePage) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark)' }}>
        <LeaveAuth onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Standalone Portal Selection */}
        <Route path="/" element={<Portal />} />
        
        {/* Standalone Leave Approval Page from Manager Emails */}
        <Route path="/leave/approve" element={<LeaveApprove />} />

        {/* Car Booking Section */}
        <Route path="/car" element={
          <Layout title="Đăng Ký Lịch Xe Công Tác">
            <CarForm />
          </Layout>
        } />
        <Route path="/car/calendar" element={
          <Layout title="Lịch Trình Xe TIS">
            <CarCalendar />
          </Layout>
        } />
        <Route path="/car/list" element={
          <Layout title="Danh Sách Lịch Công Tác">
            <CarList />
          </Layout>
        } />

        {/* Room Booking Section */}
        <Route path="/room" element={
          <Layout title="Đăng Ký Đặt Phòng Họp">
            <RoomForm />
          </Layout>
        } />
        <Route path="/room/calendar" element={
          <Layout title="Lịch Trình Đặt Phòng TIS">
            <RoomCalendar />
          </Layout>
        } />

        {/* Leave Booking Section */}
        <Route path="/leave" element={
          <Layout title="Đăng Ký Nghỉ Phép TIS">
            <LeaveBookingIndex />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
