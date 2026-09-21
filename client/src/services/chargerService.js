import api from './api';

export const getChargersByStation = async (stationId) => {
  const response = await api.get(`/stations/${stationId}/chargers`);
  return response.data;
};

export const getChargerById = async (id) => {
  const response = await api.get(`/chargers/${id}`);
  return response.data;
};

export const createCharger = async (stationId, data) => {
  const response = await api.post(`/stations/${stationId}/chargers`, data);
  return response.data;
};

export const updateCharger = async (id, data) => {
  const response = await api.put(`/chargers/${id}`, data);
  return response.data;
};

export const updateChargerStatus = async (id, status) => {
  const response = await api.patch(`/chargers/${id}/status`, { status });
  return response.data;
};

export const deleteCharger = async (id) => {
  const response = await api.delete(`/chargers/${id}`);
  return response.data;
};

const chargerService = {
  getChargersByStation,
  getChargerById,
  createCharger,
  updateCharger,
  updateChargerStatus,
  deleteCharger,
};

export default chargerService;
