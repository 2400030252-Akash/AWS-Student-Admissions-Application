import * as queries from '../db/queries/applicationQueries.js';
import { pool } from '../config/database.js';
import { metrics } from '../middleware/metrics.js';

const generateApplicationNumber = () => {
  const dateStr = new Date().toISOString().replace(/-/g, '').slice(0, 8);
  const randomStr = Math.floor(10000 + Math.random() * 90000);
  return `APP-${dateStr}-${randomStr}`;
};

export const findApplications = async ({ status, course_id, limit, offset }) => {
  const start = Date.now();
  try {
    const applications = await queries.findApplications(pool, { status, course_id, limit, offset });
    const total = await queries.countApplications(pool, { status, course_id });
    metrics.recordDbQuery(Date.now() - start);
    return { applications, total };
  } catch (error) {
    metrics.recordDbError();
    throw error;
  }
};

export const getApplicationById = async (id) => {
  const start = Date.now();
  try {
    const application = await queries.getApplicationById(pool, id);
    if (!application) return null;
    const events = await queries.getApplicationEvents(pool, id);
    application.events = events;
    metrics.recordDbQuery(Date.now() - start);
    return application;
  } catch (error) {
    metrics.recordDbError();
    throw error;
  }
};

export const createApplication = async (data) => {
  const client = await pool.connect();
  const start = Date.now();
  try {
    await client.query('BEGIN');
    const application_number = generateApplicationNumber();
    const application = await queries.createApplication(client, {
      ...data,
      application_number
    });
    await queries.createApplicationEvent(client, {
      application_id: application.id,
      event_type: 'CREATED',
      new_status: 'PENDING',
      description: 'Application submitted'
    });
    await client.query('COMMIT');
    metrics.recordDbQuery(Date.now() - start);
    return application;
  } catch (error) {
    await client.query('ROLLBACK');
    metrics.recordDbError();
    throw error;
  } finally {
    client.release();
  }
};

export const updateApplication = async (id, data) => {
  const client = await pool.connect();
  const start = Date.now();
  try {
    await client.query('BEGIN');
    const oldApp = await queries.getApplicationById(client, id);
    if (!oldApp) {
      await client.query('ROLLBACK');
      return null;
    }

    const application = await queries.updateApplication(client, id, data);

    if (data.status && oldApp.status !== data.status) {
      await queries.createApplicationEvent(client, {
        application_id: id,
        event_type: 'STATUS_CHANGED',
        old_status: oldApp.status,
        new_status: data.status,
        description: `Status changed from ${oldApp.status} to ${data.status}`
      });
    }

    await client.query('COMMIT');
    metrics.recordDbQuery(Date.now() - start);
    return application;
  } catch (error) {
    await client.query('ROLLBACK');
    metrics.recordDbError();
    throw error;
  } finally {
    client.release();
  }
};

export const deleteApplication = async (id) => {
  const start = Date.now();
  try {
    const result = await queries.deleteApplication(pool, id);
    metrics.recordDbQuery(Date.now() - start);
    return result;
  } catch (error) {
    metrics.recordDbError();
    throw error;
  }
};

export const getStats = async () => {
  const start = Date.now();
  try {
    const overview = await queries.getStatsOverview(pool);
    const byCourse = await queries.getStatsByCourse(pool);
    const byStatus = await queries.getStatsByStatus(pool);
    const recentApplications = await queries.getRecentApplications(pool, 10);
    metrics.recordDbQuery(Date.now() - start);
    return {
      ...overview,
      byCourse,
      byStatus,
      recentApplications
    };
  } catch (error) {
    metrics.recordDbError();
    throw error;
  }
};