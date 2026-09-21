import api from './api';

export const ocppService = {
  getStatus: async () => {
    const res = await api.get('/ocpp/status');
    return res.data;
  },
  simulateBootNotification: async (chargerId, payload) => {
    const res = await api.post(`/ocpp/chargers/${chargerId}/boot-notification`, payload);
    return res.data;
  },
  simulateHeartbeat: async (chargerId) => {
    const res = await api.post(`/ocpp/chargers/${chargerId}/heartbeat`);
    return res.data;
  },
  simulateStatusNotification: async (chargerId, payload) => {
    const res = await api.post(`/ocpp/chargers/${chargerId}/status-notification`, payload);
    return res.data;
  },
  simulateMeterValues: async (chargerId, payload) => {
    const res = await api.post(`/ocpp/chargers/${chargerId}/meter-values`, payload);
    return res.data;
  },
  triggerRemoteStart: async (chargerId, payload) => {
    const res = await api.post(`/ocpp/chargers/${chargerId}/remote-start`, payload);
    return res.data;
  },
  triggerRemoteStop: async (chargerId, payload) => {
    const res = await api.post(`/ocpp/chargers/${chargerId}/remote-stop`, payload);
    return res.data;
  },
};

export default ocppService;
