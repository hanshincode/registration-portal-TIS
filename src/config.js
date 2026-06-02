export const API_CONFIG = {
  CAR_URL: import.meta.env.VITE_CAR_URL || '',
  ROOM_URL: import.meta.env.VITE_ROOM_URL || '',
  LEAVE_URL: import.meta.env.VITE_LEAVE_URL || ''
};

// Helper to make POST requests to Google Apps Script (handles simple text/plain to avoid CORS OPTIONS preflight)
export const callGasApi = async (url, payload) => {
  if (!url) {
    console.error('API Error: API URL is empty or undefined. Please configure environment variables.');
    return { status: 'error', message: 'Lỗi: Chưa cấu hình đường dẫn API hệ thống trên Hosting!' };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    return { status: 'error', message: 'Lỗi kết nối máy chủ hệ thống!' };
  }
};
