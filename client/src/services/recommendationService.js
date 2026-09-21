import api from './api';

const recommendationService = {
  getRecommendations: async (params = {}) => {
    const response = await api.get('/recommendations/stations', { params });
    return response.data;
  },
};

export default recommendationService;
