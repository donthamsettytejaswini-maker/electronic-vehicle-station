import api from './api';

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

const reportService = {
  getReportSummary: async (params = {}) => {
    const response = await api.get('/admin/reports/summary', { params });
    return response.data;
  },

  getBookingsReport: async (params = {}) => {
    const response = await api.get('/admin/reports/bookings', { params });
    return response.data;
  },

  exportBookingsCSV: async (params = {}) => {
    const response = await api.get('/admin/reports/bookings', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    const filename = `bookings-report-${new Date().toISOString().substring(0, 10)}.csv`;
    downloadBlob(new Blob([response.data], { type: 'text/csv' }), filename);
  },

  getSessionsReport: async (params = {}) => {
    const response = await api.get('/admin/reports/sessions', { params });
    return response.data;
  },

  exportSessionsCSV: async (params = {}) => {
    const response = await api.get('/admin/reports/sessions', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    const filename = `sessions-report-${new Date().toISOString().substring(0, 10)}.csv`;
    downloadBlob(new Blob([response.data], { type: 'text/csv' }), filename);
  },

  getPaymentsReport: async (params = {}) => {
    const response = await api.get('/admin/reports/payments', { params });
    return response.data;
  },

  exportPaymentsCSV: async (params = {}) => {
    const response = await api.get('/admin/reports/payments', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    const filename = `payments-report-${new Date().toISOString().substring(0, 10)}.csv`;
    downloadBlob(new Blob([response.data], { type: 'text/csv' }), filename);
  },

  getEnergyReport: async (params = {}) => {
    const response = await api.get('/admin/reports/energy', { params });
    return response.data;
  },

  exportEnergyCSV: async (params = {}) => {
    const response = await api.get('/admin/reports/energy', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    const filename = `energy-report-${new Date().toISOString().substring(0, 10)}.csv`;
    downloadBlob(new Blob([response.data], { type: 'text/csv' }), filename);
  },
};

export default reportService;
