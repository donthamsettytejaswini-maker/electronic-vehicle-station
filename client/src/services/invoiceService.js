import api from './api';

export const getInvoiceForSession = async (sessionId) => {
  const response = await api.get(`/payments/invoice/${sessionId}`);
  return response.data;
};

export const getPaymentReceipt = async (paymentId) => {
  const response = await api.get(`/payments/${paymentId}/receipt`);
  return response.data;
};

export default {
  getInvoiceForSession,
  getPaymentReceipt,
};
