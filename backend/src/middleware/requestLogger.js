import { metrics } from './metrics.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  metrics.recordRequest();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.recordRequestDuration(duration);
    
    if (res.statusCode >= 400) {
      metrics.recordFailedRequest();
    } else {
      metrics.recordSuccessfulRequest();
    }
  });
  
  next();
};
