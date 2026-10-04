import { client } from './client';
export const getStudents = (params = '') => client.get(`/api/students${params}`);
export const getStudent = (id) => client.get(`/api/students/${id}`);
export const createStudent = (data) => client.post('/api/students', data);
export const updateStudent = (id, data) => client.put(`/api/students/${id}`, data);
export const deleteStudent = (id) => client.del(`/api/students/${id}`);
