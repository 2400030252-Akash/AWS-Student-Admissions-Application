import { metrics } from '../middleware/metrics.js';

export const getMetrics = () => {
  return metrics.getMetrics();
};
