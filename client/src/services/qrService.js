import api from './api';

export const generateBookingQr = async (bookingId) => {
  const response = await api.post(`/bookings/${bookingId}/qr`);
  return response.data;
};

export const getQrStatus = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}/qr/status`);
  return response.data;
};
