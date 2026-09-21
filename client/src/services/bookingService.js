import api from './api';

export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

export const getUserBookings = async (params = {}) => {
  const response = await api.get('/bookings', { params });
  return response.data;
};

export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

export const cancelBooking = async (id) => {
  const response = await api.patch(`/bookings/${id}/cancel`);
  return response.data;
};

export const getAllBookings = async (params = {}) => {
  const response = await api.get('/bookings/admin/all', { params });
  return response.data;
};

export const getAvailableSlots = async (chargerId, date) => {
  const response = await api.get('/bookings/slots', {
    params: { chargerId, date },
  });
  return response.data;
};
