import api from './api';

export const fleetService = {
  getMyOrganization: async () => {
    const res = await api.get('/fleet/my-org');
    return res.data;
  },
  createOrganization: async (data) => {
    const res = await api.post('/fleet/organizations', data);
    return res.data;
  },
  addMember: async (orgId, data) => {
    const res = await api.post(`/fleet/organizations/${orgId}/members`, data);
    return res.data;
  },
  updateMemberLimit: async (orgId, memberId, data) => {
    const res = await api.patch(`/fleet/organizations/${orgId}/members/${memberId}`, data);
    return res.data;
  },
  removeMember: async (orgId, memberId) => {
    const res = await api.delete(`/fleet/organizations/${orgId}/members/${memberId}`);
    return res.data;
  },
  getFleetReport: async (orgId) => {
    const res = await api.get(`/fleet/organizations/${orgId}/report`);
    return res.data;
  },
};

export default fleetService;
