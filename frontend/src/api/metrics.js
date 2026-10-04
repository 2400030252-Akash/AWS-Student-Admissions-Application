import { client } from './client';
export const getMetrics = () => client.get('/api/metrics');
