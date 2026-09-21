import api from './api';

export const verifyQr = async (payload) => {
  const response = await api.post('/check-in/verify', payload);
  return response.data;
};

export const verifyBookingReference = async (reference) => {
  const response = await api.post('/check-in/reference', {
    bookingReference: reference,
  });
  return response.data;
};

export const completeCheckIn = async (bookingId, checkInMethod = 'qr') => {
  const response = await api.post(`/bookings/${bookingId}/check-in`, {
    checkInMethod,
  });
  return response.data;
};
