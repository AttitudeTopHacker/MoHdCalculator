import api from './authApi';

export const adminApi = {
  getUsers: (search = '') =>
    api.get(`/admin/users?search=${encodeURIComponent(search)}`),

  toggleUserSuspension: (id) =>
    api.put(`/admin/users/${id}/suspend`),

  deleteUser: (id) =>
    api.delete(`/admin/users/${id}`),

  addTeamMember: (data) =>
    api.post('/admin/team', data),

  deleteTeamMember: (id) =>
    api.delete(`/admin/team/${id}`),

  publicGetTeam: () =>
    api.get('/public/team'),
};
