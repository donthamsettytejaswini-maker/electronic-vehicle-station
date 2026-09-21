import api from './api';

const predictionService = {
  getStationDemand: async (stationId, date) => {
    const response = await api.get(`/stations/${stationId}/demand`, {
      params: date ? { date } : {},
    });
    return response.data;
  },

  getAdminNetworkDemand: async (date) => {
    const response = await api.get('/admin/predictions/demand', {
      params: date ? { date } : {},
    });
    return response.data;
  },
};

export default predictionService;
