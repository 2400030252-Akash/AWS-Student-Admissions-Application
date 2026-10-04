import { getMetrics as getServiceMetrics } from '../services/metricsService.js';
import { successResponse } from '../utils/response.js';

export const getMetrics = (req, res, next) => {
  try {
    const data = getServiceMetrics();
    return successResponse(res, data);
  } catch (error) {
    next(error);
  }
};
