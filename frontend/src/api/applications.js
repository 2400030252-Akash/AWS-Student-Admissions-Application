import { client } from './client';
export const getApplications = (params = '') => client.get(`/api/applications${params}`);
export const getApplication = (id) => client.get(`/api/applications/${id}`);
export const getApplicationStats = () => client.get('/api/applications/stats');
export const createApplication = (data) => client.post('/api/applications', data);
export const updateApplication = (id, data) => client.put(`/api/applications/${id}`, data);
export const deleteApplication = (id) => client.del(`/api/applications/${id}`);
