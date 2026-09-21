import api from './api';

const pricingService = {
  getActiveTariff: async (params = {}) => {
    const response = await api.get('/pricing/active', { params });
    return response.data;
  },

  getAdminPricingRules: async () => {
    const response = await api.get('/pricing/admin');
    return response.data;
  },

  createPricingRule: async (data) => {
    const response = await api.post('/pricing/admin', data);
    return response.data;
  },

  updatePricingRule: async (id, data) => {
    const response = await api.put(`/pricing/admin/${id}`, data);
    return response.data;
  },

  updatePricingRuleStatus: async (id, active) => {
    const response = await api.patch(`/pricing/admin/${id}/status`, { active });
    return response.data;
  },

  deletePricingRule: async (id) => {
    const response = await api.delete(`/pricing/admin/${id}`);
    return response.data;
  },
};

export default pricingService;
