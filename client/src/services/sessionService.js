import api from './api';

export const startSession = async (sessionData) => {
  const response = await api.post('/sessions/start', sessionData);
  return response.data;
};

export const getSessionById = async (id) => {
  const response = await api.get(`/sessions/${id}`);
  return response.data;
};

export const getActiveSession = async () => {
  const response = await api.get('/sessions/active');
  return response.data;
};

export const pauseSession = async (id) => {
  const response = await api.patch(`/sessions/${id}/pause`);
  return response.data;
};

export const resumeSession = async (id) => {
  const response = await api.patch(`/sessions/${id}/resume`);
  return response.data;
};

export const updateSession = async (id, data) => {
  const response = await api.patch(`/sessions/${id}/update`, data);
  return response.data;
};

export const completeSession = async (id) => {
  const response = await api.patch(`/sessions/${id}/complete`);
  return response.data;
};

export const stopSession = async (id, reason = 'Stopped by user') => {
  const response = await api.post(`/sessions/${id}/stop`, { reason });
  return response.data;
};

export const getSessionHistory = async (params = {}) => {
  const response = await api.get('/sessions/history', { params });
  return response.data;
};

export const getAllActiveSessions = async () => {
  const response = await api.get('/sessions/admin/active');
  return response.data;
};
