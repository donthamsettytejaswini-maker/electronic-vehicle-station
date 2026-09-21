import api from './api';

const reviewService = {
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  getStationReviews: async (stationId, params = {}) => {
    const response = await api.get(`/stations/${stationId}/reviews`, { params });
    return response.data;
  },

  updateReview: async (id, reviewData) => {
    const response = await api.put(`/reviews/${id}`, reviewData);
    return response.data;
  },

  deleteReview: async (id) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },

  getAdminReviews: async (params = {}) => {
    const response = await api.get('/admin/reviews', { params });
    return response.data;
  },

  updateReviewStatus: async (id, status) => {
    const response = await api.patch(`/admin/reviews/${id}/status`, { status });
    return response.data;
  },
};

export default reviewService;
