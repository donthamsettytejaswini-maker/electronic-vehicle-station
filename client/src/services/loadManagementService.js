import api from './api';

export const loadManagementService = {
  getStationLoad: async (stationId) => {
    const res = await api.get(`/stations/${stationId}/load`);
    return res.data;
  },
  updateSiteLimit: async (stationId, maxSitePowerKw) => {
    const res = await api.patch(`/admin/stations/${stationId}/load-limit`, { maxSitePowerKw });
    return res.data;
  },
  triggerRebalance: async (stationId) => {
    const res = await api.post(`/admin/stations/${stationId}/load-rebalance`);
    return res.data;
  },
};

export default loadManagementService;
