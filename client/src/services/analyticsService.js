import api from './api';

const analyticsService = {
  // 1. Overview
  getOverview: async (params = {}) => {
    const response = await api.get('/admin/analytics/overview', { params });
    return response.data;
  },

  // 2. Revenue Analytics
  getRevenue: async (params = {}) => {
    const response = await api.get('/admin/analytics/revenue', { params });
    return response.data;
  },

  getDailyRevenue: async (params = {}) => {
    const response = await api.get('/admin/analytics/revenue/daily', { params });
    return response.data;
  },

  getMonthlyRevenue: async (params = {}) => {
    const response = await api.get('/admin/analytics/revenue/monthly', { params });
    return response.data;
  },

  getRevenueByStation: async (params = {}) => {
    const response = await api.get('/admin/analytics/revenue/by-station', { params });
    return response.data;
  },

  getRevenueByPaymentMethod: async (params = {}) => {
    const response = await api.get('/admin/analytics/revenue/by-payment-method', { params });
    return response.data;
  },

  // 3. Booking Analytics
  getBookingAnalytics: async (params = {}) => {
    const response = await api.get('/admin/analytics/bookings', { params });
    return response.data;
  },

  getDailyBookings: async (params = {}) => {
    const response = await api.get('/admin/analytics/bookings/daily', { params });
    return response.data;
  },

  getBookingsByStation: async (params = {}) => {
    const response = await api.get('/admin/analytics/bookings/by-station', { params });
    return response.data;
  },

  getBookingsByStatus: async (params = {}) => {
    const response = await api.get('/admin/analytics/bookings/by-status', { params });
    return response.data;
  },

  getPeakHours: async (params = {}) => {
    const response = await api.get('/admin/analytics/bookings/peak-hours', { params });
    return response.data;
  },

  // 4. Session Analytics
  getSessionAnalytics: async (params = {}) => {
    const response = await api.get('/admin/analytics/sessions', { params });
    return response.data;
  },

  getDailySessions: async (params = {}) => {
    const response = await api.get('/admin/analytics/sessions/daily', { params });
    return response.data;
  },

  getSessionsByStation: async (params = {}) => {
    const response = await api.get('/admin/analytics/sessions/by-station', { params });
    return response.data;
  },

  // 5. Energy Analytics
  getEnergyAnalytics: async (params = {}) => {
    const response = await api.get('/admin/analytics/energy', { params });
    return response.data;
  },

  getDailyEnergy: async (params = {}) => {
    const response = await api.get('/admin/analytics/energy/daily', { params });
    return response.data;
  },

  getMonthlyEnergy: async (params = {}) => {
    const response = await api.get('/admin/analytics/energy/monthly', { params });
    return response.data;
  },

  getEnergyByStation: async (params = {}) => {
    const response = await api.get('/admin/analytics/energy/by-station', { params });
    return response.data;
  },

  getEnergyByCharger: async (params = {}) => {
    const response = await api.get('/admin/analytics/energy/by-charger', { params });
    return response.data;
  },

  // 6. Charger Utilization
  getChargerAnalytics: async (params = {}) => {
    const response = await api.get('/admin/analytics/chargers', { params });
    return response.data;
  },

  // 7. Station Performance
  getStationPerformance: async (params = {}) => {
    const response = await api.get('/admin/analytics/stations', { params });
    return response.data;
  },

  // 8. Payment Analytics
  getPaymentAnalytics: async (params = {}) => {
    const response = await api.get('/admin/analytics/payments', { params });
    return response.data;
  },

  // 9. User Analytics
  getUserAnalytics: async (params = {}) => {
    const response = await api.get('/admin/analytics/users', { params });
    return response.data;
  },
};

export default analyticsService;
