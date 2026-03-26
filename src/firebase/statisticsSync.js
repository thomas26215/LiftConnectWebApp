/**
 * Statistics Sync Queue Wrapper
 * Wraps all statistics CRUD operations to auto-create sync_queue entries
 * 
 * Logs all changes (create/update/delete) for session statistics
 */

import { addToSyncQueue } from '@/firebase/syncQueue'

/**
 * Wrap a statistics create operation to log to sync_queue
 * @param {string} userId - User ID
 * @param {string} sessionId - Statistics session ID
 * @param {string} metricType - 'statistic' | 'tracked_metric' | 'exercise_set'
 * @param {string} metricId - ID of the metric (optional for statistic)
 */
export async function logStatisticCreate(userId, sessionId, metricType, metricId = null) {
  const resourceId = metricId ? `${sessionId}/${metricId}` : sessionId

  await addToSyncQueue(userId, 'create', metricType, resourceId)
}

/**
 * Wrap a statistics update operation to log to sync_queue
 * @param {string} userId - User ID
 * @param {string} sessionId - Statistics session ID
 * @param {string} metricType - 'statistic' | 'tracked_metric' | 'exercise_set'
 * @param {string} metricId - ID of the metric (optional for statistic)
 */
export async function logStatisticUpdate(userId, sessionId, metricType, metricId = null) {
  const resourceId = metricId ? `${sessionId}/${metricId}` : sessionId

  await addToSyncQueue(userId, 'update', metricType, resourceId)
}

/**
 * Wrap a statistics delete operation to log to sync_queue
 * @param {string} userId - User ID
 * @param {string} sessionId - Statistics session ID
 * @param {string} metricType - 'statistic' | 'tracked_metric' | 'exercise_set'
 * @param {string} metricId - ID of the metric (optional for statistic)
 */
export async function logStatisticDelete(userId, sessionId, metricType, metricId = null) {
  const resourceId = metricId ? `${sessionId}/${metricId}` : sessionId

  await addToSyncQueue(userId, 'delete', metricType, resourceId)
}

/**
 * Log cascade delete for session (deletes all nested metrics and sets)
 * Used when deleting entire session
 * @param {string} userId - User ID
 * @param {string} sessionId - Statistics session ID
 */
export async function logStatisticCascadeDelete(userId, sessionId) {
  // Log the session delete as cascade
  await addToSyncQueue(userId, 'delete', 'statistic', sessionId, {
    cascade: true,
    reason: 'session_deleted_with_all_metrics',
  })
}

/**
 * Export helpers for use in composables
 */
export const statisticsSync = {
  logStatisticCreate,
  logStatisticUpdate,
  logStatisticDelete,
  logStatisticCascadeDelete,
}

export default statisticsSync
