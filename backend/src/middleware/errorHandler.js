import { errorResponse } from '../utils/response.js';
import config from '../config/index.js';
import { metrics } from './metrics.js';

export default (err, req, res, next) => {
  console.error('Error:', err);
  
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal Server Error';

  // Check for database errors and timeouts
  const isTimeout = err.code === 'ETIMEDOUT' || 
                    err.code === '57014' || 
                    (err.message && err.message.toLowerCase().includes('timeout'));

  if (isTimeout) {
    statusCode = 504;
    code = 'GATEWAY_TIMEOUT';
    message = 'Database query or connection timed out under load.';
    metrics.recordTimeout();
    metrics.recordDbError();
  } else if (err.code && (err.code.startsWith('28') || err.code.startsWith('08') || err.code === 'ECONNREFUSED')) {
    statusCode = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'Database service unavailable or connection failed.';
    metrics.recordDbError();
  } else if (err.code === '23505') {
    statusCode = 409;
    code = 'UNIQUE_VIOLATION';
    message = 'A record with this information already exists.';
  } else if (err.code === '23503') {
    statusCode = 400;
    code = 'FOREIGN_KEY_VIOLATION';
    message = 'Referenced record does not exist.';
  } else if (err.code === '23514') {
    statusCode = 400;
    code = 'CHECK_VIOLATION';
    message = 'Input data violates table constraint.';
  }

  if (config.env === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  return errorResponse(res, message, statusCode, code);
};