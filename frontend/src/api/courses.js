import { client } from './client';
export const getCourses = () => client.get('/api/courses');
