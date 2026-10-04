import { pool } from '../config/database.js';
import config from '../config/index.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getHealth = async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    
    return successResponse(res, {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: config.env,
      poolInfo: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        environment: config.env
      }
    });
  }
};
