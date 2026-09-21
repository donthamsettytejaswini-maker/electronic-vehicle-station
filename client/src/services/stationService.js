import api from './api';

export const getStations = async (params = {}) => {
  const response = await api.get('/stations', { params });
  return response.data;
};

export const getStationById = async (id) => {
  const response = await api.get(`/stations/${id}`);
  return response.data;
};

export const createStation = async (data) => {
  const response = await api.post('/stations', data);
  return response.data;
};

export const updateStation = async (id, data) => {
  const response = await api.put(`/stations/${id}`, data);
  return response.data;
};

export const deleteStation = async (id) => {
  const response = await api.delete(`/stations/${id}`);
  return response.data;
};

export const updateStationStatus = async (id, status) => {
  const response = await api.patch(`/stations/${id}/status`, { status });
  return response.data;
};

const stationService = {
  getStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  updateStationStatus,
};

export default stationService;
