import api from './api';

export const createPayment = async (data) => {
  const response = await api.post('/payments/create', data);
  return response.data;
};

export const verifyMockPayment = async (paymentId, data = { action: 'success' }) => {
  const response = await api.post(`/payments/${paymentId}/verify`, data);
  return response.data;
};

export const verifyPayment = async (paymentId, data = {}) => {
  const response = await api.post(`/payments/${paymentId}/verify`, data);
  return response.data;
};

export const getPaymentById = async (id) => {
  const response = await api.get(`/payments/${id}`);
  return response.data;
};

export const getPaymentByReference = async (paymentReference) => {
  const response = await api.get(`/payments/reference/${paymentReference}`);
  return response.data;
};

export const getMyPayments = async (params = {}) => {
  const response = await api.get('/payments/my-payments', { params });
  return response.data;
};

export const cancelPayment = async (id) => {
  const response = await api.post(`/payments/${id}/cancel`);
  return response.data;
};

export const requestRefund = async (id, data) => {
  const response = await api.post(`/payments/${id}/refund`, data);
  return response.data;
};

export const getAdminPayments = async (params = {}) => {
  const response = await api.get('/payments/admin/all', { params });
  return response.data;
};

export const getAdminRevenue = async (params = {}) => {
  const response = await api.get('/payments/admin/revenue', { params });
  return response.data;
};

export const createStripeCheckout = async (data) => {
  const response = await api.post('/payments/stripe/create-checkout', data);
  return response.data;
};

export default {
  createPayment,
  verifyMockPayment,
  verifyPayment,
  getPaymentById,
  getPaymentByReference,
  getMyPayments,
  cancelPayment,
  requestRefund,
  getAdminPayments,
  getAdminRevenue,
  createStripeCheckout,
};
