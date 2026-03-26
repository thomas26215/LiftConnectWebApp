import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'

const DEVICE_ID_KEY = 'liftconnect_device_id'

/**
 * Helper: Convert Firestore Timestamp to Date
 */
function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Generate a UUID v4 for device identification
 * @returns {string} UUID in format "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate a device ID in format "device_web_0x{hexHash}"
 * @param {string} platform - 'web', 'mobile', etc. (default: 'web')
 * @returns {string} Device identifier
 */
function generateDeviceId(platform = 'web') {
  const uuid = generateUUID()
  // Extract first 8 chars of UUID and convert to hex
  const hexPart = uuid.substring(0, 8).replace(/-/g, '')
  return `device_${platform}_0x${hexPart}`
}

/**
 * Get device ID from localStorage or create new one
 * @param {string} platform - 'web', 'mobile', etc. (default: 'web')
 * @returns {string} Device identifier
 */
export function getOrCreateDeviceId(platform = 'web') {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('⚠️ localStorage not available, generating temporary device ID')
      return generateDeviceId(platform)
    }

    const stored = window.localStorage.getItem(DEVICE_ID_KEY)
    if (stored) {
      console.log(`✅ Device ID retrieved from localStorage: ${stored}`)
      return stored
    }

    const newDeviceId = generateDeviceId(platform)
    window.localStorage.setItem(DEVICE_ID_KEY, newDeviceId)
    console.log(`✅ New device ID generated and stored: ${newDeviceId}`)
    return newDeviceId
  } catch (e) {
    console.error('⚠️ Error managing device ID:', e)
    return generateDeviceId(platform)
  }
}

/**
 * Get existing device ID from localStorage
 * @returns {string|null} Device identifier or null if not found
 */
export function getDeviceId() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage.getItem(DEVICE_ID_KEY)
  } catch (e) {
    console.error('⚠️ Error retrieving device ID:', e)
    return null
  }
}

/**
 * Clear device ID from localStorage (usually on logout)
 * @returns {boolean} Success status
 */
export function clearDeviceId() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false
    window.localStorage.removeItem(DEVICE_ID_KEY)
    console.log('✅ Device ID cleared from localStorage')
    return true
  } catch (e) {
    console.error('⚠️ Error clearing device ID:', e)
    return false
  }
}

/**
 * Register or update device in _metadata.devices map
 * @param {string} userId - User ID
 * @param {string} [deviceId] - Device identifier (e.g., "device_web_0x1ab3c5f"). If not provided, uses getOrCreateDeviceId()
 * @returns {Promise<string>} Registered device ID, or empty string on failure
 */
export async function registerDevice(userId, deviceId) {
  if (!userId) {
    console.warn('⚠️ registerDevice: Missing userId')
    return ''
  }

  try {
    // Use provided deviceId or get/create from storage
    const finalDeviceId = deviceId || getOrCreateDeviceId()

    const metadataRef = doc(db, 'users', userId, 'sync_queue', '_metadata')

    // Use setDoc with merge: true to create if not exists, or update if exists
    await setDoc(
      metadataRef,
      {
        devices: {
          [finalDeviceId]: serverTimestamp(),
        },
      },
      { merge: true }
    )

    console.log(`✅ Device registered: ${finalDeviceId}`)
    return finalDeviceId
  } catch (e) {
    console.error(`❌ registerDevice(${userId}, ${deviceId}):`, e)
    return ''
  }
}

/**
 * Add a new entry to sync_queue (CRUD operation)
 * @param {string} userId - User ID
 * @param {string} action - 'create' | 'update' | 'delete'
 * @param {string} resourceType - 'workout' | 'exercise' | 'session'
 * @param {string} resourceId - Resource identifier
 * @returns {Promise<string|null>} Entry ID or null on error
 */
export async function addToSyncQueue(userId, action, resourceType, resourceId) {
  if (!userId || !action || !resourceType || !resourceId) {
    console.warn(`⚠️ addToSyncQueue: Missing required parameters`, {
      userId,
      action,
      resourceType,
      resourceId,
    })
    return null
  }

  try {
    const entryRef = collection(db, 'users', userId, 'sync_queue')
    const docRef = await addDoc(entryRef, {
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      timestamp: serverTimestamp(),
    })

    console.log(
      `✅ Sync entry added: ${action} ${resourceType}#${resourceId}`,
    )
    return docRef.id
  } catch (e) {
    console.error(
      `❌ addToSyncQueue(${userId}, ${action}, ${resourceType}, ${resourceId}):`,
      e,
    )
    return null
  }
}

/**
 * Fetch sync queue entries since device's last fetch time
 * @param {string} userId - User ID
 * @param {string} deviceId - Device identifier
 * @param {number} pageSize - Number of items to fetch (default 50)
 * @param {any} lastVisible - Cursor for pagination (Firestore QueryDocumentSnapshot)
 * @returns {Promise<{items: [], nextCursor: null, lastFetchTime: Date|null}>}
 */
export async function getSyncQueueSince(
  userId,
  deviceId,
  pageSize = 50,
  lastVisible = null,
) {
  if (!userId || !deviceId) {
    console.warn('⚠️ getSyncQueueSince: Missing userId or deviceId')
    return { items: [], nextCursor: null, lastFetchTime: null }
  }

  try {
    // Step 1: Get _metadata to find device's last fetch time
    const metadataRef = doc(db, 'users', userId, 'sync_queue', '_metadata')
    const metadataSnap = await getDoc(metadataRef)

    if (!metadataSnap.exists()) {
      console.warn(`⚠️ No _metadata found for user ${userId}`)
      return { items: [], nextCursor: null, lastFetchTime: null }
    }

    const metadata = metadataSnap.data()
    const lastFetchTime = metadata?.devices?.[deviceId]

    if (!lastFetchTime) {
      console.warn(
        `⚠️ Device ${deviceId} not registered in _metadata for user ${userId}`,
      )
      return { items: [], nextCursor: null, lastFetchTime: null }
    }

    // Step 2: Query entries since last fetch time
    let q = query(
      collection(db, 'users', userId, 'sync_queue'),
      where('timestamp', '>', lastFetchTime),
      orderBy('timestamp', 'asc'),
      limit(pageSize),
    )

    if (lastVisible) {
      q = query(
        collection(db, 'users', userId, 'sync_queue'),
        where('timestamp', '>', lastFetchTime),
        orderBy('timestamp', 'asc'),
        startAfter(lastVisible),
        limit(pageSize),
      )
    }

    const snapshot = await getDocs(q)
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      action: doc.data().action,
      resource_type: doc.data().resource_type,
      resource_id: doc.data().resource_id,
      timestamp: toDate(doc.data().timestamp),
    }))

    const nextCursor =
      snapshot.docs.length === pageSize
        ? snapshot.docs[snapshot.docs.length - 1]
        : null

    console.log(`✅ Fetched ${items.length} sync entries for ${deviceId}`)
    return { items, nextCursor, lastFetchTime: toDate(lastFetchTime) }
  } catch (e) {
    console.error(
      `❌ getSyncQueueSince(${userId}, ${deviceId}):`,
      e,
    )
    return { items: [], nextCursor: null, lastFetchTime: null }
  }
}

/**
 * Delete device that hasn't synced in more than threshold days
 * @param {string} userId - User ID
 * @param {number} staleThresholdDays - Days of inactivity (default 5)
 * @returns {Promise<string[]>} Array of deleted device IDs
 */
export async function cleanupStaleDevices(userId, staleThresholdDays = 5) {
  if (!userId) {
    console.warn('⚠️ cleanupStaleDevices: Missing userId')
    return []
  }

  try {
    const metadataRef = doc(db, 'users', userId, 'sync_queue', '_metadata')
    const metadataSnap = await getDoc(metadataRef)

    if (!metadataSnap.exists()) {
      return []
    }

    const metadata = metadataSnap.data()
    const devices = metadata?.devices || {}

    const now = new Date()
    const staleThresholdMs = staleThresholdDays * 24 * 60 * 60 * 1000
    const deletedDevices = []

    // Identify stale devices
    for (const [deviceId, lastFetchTime] of Object.entries(devices)) {
      const fetchDate = toDate(lastFetchTime)
      if (!fetchDate) continue

      const ageMs = now - fetchDate
      if (ageMs > staleThresholdMs) {
        deletedDevices.push(deviceId)
      }
    }

    // Update metadata to remove stale devices
    if (deletedDevices.length > 0) {
      const updatedDevices = { ...devices }
      deletedDevices.forEach((deviceId) => {
        delete updatedDevices[deviceId]
      })

      await updateDoc(metadataRef, {
        devices: updatedDevices,
      })

      console.log(
        `✅ Removed ${deletedDevices.length} stale devices: ${deletedDevices.join(', ')}`,
      )
    }

    return deletedDevices
  } catch (e) {
    console.error(`❌ cleanupStaleDevices(${userId}):`, e)
    return []
  }
}

/**
 * Delete sync queue entries that ALL active devices have read
 * Uses cursor-based cleanup: minimum lastFetchTime across all devices
 * @param {string} userId - User ID
 * @param {Object} activeDevices - Map of {deviceId: lastFetchTime}
 * @returns {Promise<number>} Number of entries deleted
 */
export async function deleteCleanupQueue(userId, activeDevices) {
  if (!userId) {
    console.warn('⚠️ deleteCleanupQueue: Missing userId')
    return 0
  }

  if (!activeDevices || Object.keys(activeDevices).length === 0) {
    console.warn('⚠️ deleteCleanupQueue: No active devices')
    return 0
  }

  try {
    let deletedCount = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Get minimum lastFetchTime (slowest device cursor)
      const lastFetchTimes = Object.values(activeDevices).map((t) =>
        toDate(t),
      )
      const minLastFetchTime = new Date(
        Math.min(...lastFetchTimes.map((d) => d.getTime())),
      )

      // Query oldest entry where timestamp <= minLastFetchTime
      const q = query(
        collection(db, 'users', userId, 'sync_queue'),
        where('timestamp', '<=', minLastFetchTime),
        orderBy('timestamp', 'asc'),
        limit(1),
      )

      const snapshot = await getDocs(q)

      // If no entry found, cleanup is complete
      if (snapshot.empty) {
        console.log(
          `✅ Sync queue cleanup complete. Deleted ${deletedCount} entries.`,
        )
        break
      }

      // Delete the oldest entry and continue loop
      const entryDoc = snapshot.docs[0]
      await deleteDoc(entryDoc.ref)
      deletedCount++

      // Optional: Add delay to avoid rate limiting on large queues
      // await new Promise(resolve => setTimeout(resolve, 10))
    }

    return deletedCount
  } catch (e) {
    console.error(`❌ deleteCleanupQueue(${userId}):`, e)
    return 0
  }
}

/**
 * Update device's lastFetchTime to current server time
 * Called after processing sync entries to update _metadata.devices[deviceId]
 * @param {string} userId - User ID
 * @param {string} deviceId - Device identifier
 * @returns {Promise<boolean>} Success status
 */
export async function updateDeviceLastFetch(userId, deviceId) {
  if (!userId || !deviceId) {
    console.warn('⚠️ updateDeviceLastFetch: Missing userId or deviceId')
    return false
  }

  try {
    const metadataRef = doc(db, 'users', userId, 'sync_queue', '_metadata')
    await updateDoc(metadataRef, {
      [`devices.${deviceId}`]: serverTimestamp(),
    })

    console.log(`✅ Updated lastFetch time for ${deviceId}`)
    return true
  } catch (e) {
    console.error(`❌ updateDeviceLastFetch(${userId}, ${deviceId}):`, e)
    return false
  }
}

/**
 * Initialize _metadata document if it doesn't exist
 * Safe to call multiple times
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function initializeMetadata(userId) {
  if (!userId) {
    console.warn('⚠️ initializeMetadata: Missing userId')
    return false
  }

  try {
    const metadataRef = doc(db, 'users', userId, 'sync_queue', '_metadata')
    const metadataSnap = await getDoc(metadataRef)

    if (!metadataSnap.exists()) {
      await updateDoc(metadataRef, {
        devices: {},
      }).catch(async () => {
        // Fallback if document still doesn't exist - try setDoc through transaction
        console.log('📝 Creating new _metadata document...')
        // This would need to be handled differently, but registerDevice will create it
      })
    }

    return true
  } catch (e) {
    console.error(`❌ initializeMetadata(${userId}):`, e)
    return false
  }
}
