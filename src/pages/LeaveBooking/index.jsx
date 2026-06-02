import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LeaveForm from './LeaveForm';
import LeaveDashboard from './LeaveDashboard';

const LeaveBookingIndex = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'dashboard'
  
  const userData = JSON.parse(localStorage.getItem('tis_user_data') || '{}');
  const userEmail = localStorage.getItem('tis_email') || '';

  useEffect(() => {
    // Nếu có tham số view=dashboard trong URL và người dùng có quyền quản lý, hiển thị dashboard
    const isDashboardView = searchParams.get('view') === 'dashboard';
    const isManager = ['admin', 'manager', 'quản lý'].includes((userData.role || '').toLowerCase());
    
    if (isDashboardView && isManager) {
      setViewMode('dashboard');
    } else {
      setViewMode('form');
    }
  }, [searchParams, userData.role]);

  const handleLogout = () => {
    localStorage.removeItem('tis_token');
    localStorage.removeItem('tis_email');
    localStorage.removeItem('tis_user_data');
    window.location.href = '/';
    window.location.reload();
  };

  const isManager = ['admin', 'manager', 'quản lý'].includes((userData.role || '').toLowerCase());

  if (viewMode === 'dashboard' && isManager) {
    return (
      <LeaveDashboard 
        userEmail={userEmail} 
        onLogout={handleLogout} 
        onViewForm={() => setViewMode('form')} 
      />
    );
  }

  return (
    <LeaveForm 
      userData={userData} 
      userEmail={userEmail} 
      onLogout={handleLogout} 
      onViewDashboard={() => setViewMode('dashboard')} 
    />
  );
};

export default LeaveBookingIndex;
