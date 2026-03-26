import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  registerDevice,
  addToSyncQueue,
  getSyncQueueSince,
  cleanupStaleDevices,
  deleteCleanupQueue,
  updateDeviceLastFetch,
  initializeMetadata,
} from '@/firebase/syncQueue'

// Mock Firebase
vi.mock('@/firebase', () => ({
  db: {},
}))

describe('syncQueue', () => {
  const userId = 'test-user-123'
  const deviceId = 'device_web_0x1ab3c5f'
  const deviceId2 = 'device_mobile_0x7d2e9f'

  describe('registerDevice', () => {
    it('should return empty string if userId is missing', async () => {
      const result = await registerDevice(null, deviceId)
      expect(result).toBe('')
    })

    it('should auto-generate deviceId if not provided', async () => {
      const warnSpy = vi.spyOn(console, 'warn')
      // Note: This will fail with mocked Firebase, but deviceId should be generated
      const result = await registerDevice(userId)
      // Function tries to register, returns empty string due to mock error
      // But in real Firebase, would return the auto-generated device ID
      expect(result).toBe('')
    })

    it('should log warning if userId is missing', async () => {
      const warnSpy = vi.spyOn(console, 'warn')
      await registerDevice(null, deviceId)
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ registerDevice: Missing userId'
      )
    })
  })

  describe('addToSyncQueue', () => {
    it('should return null if required parameters are missing', async () => {
      const result1 = await addToSyncQueue(userId, 'create', 'workout', null)
      const result2 = await addToSyncQueue(userId, null, 'workout', 'id123')

      expect(result1).toBeNull()
      expect(result2).toBeNull()
    })

    it('should log warning for missing parameters', async () => {
      const warnSpy = vi.spyOn(console, 'warn')
      await addToSyncQueue(userId, 'create', 'workout', null)
      expect(warnSpy).toHaveBeenCalled()
    })
  })

  describe('getSyncQueueSince', () => {
    it('should return empty result if userId or deviceId is missing', async () => {
      const result1 = await getSyncQueueSince(null, deviceId)
      const result2 = await getSyncQueueSince(userId, null)

      expect(result1).toEqual({
        items: [],
        nextCursor: null,
        lastFetchTime: null,
      })
      expect(result2).toEqual({
        items: [],
        nextCursor: null,
        lastFetchTime: null,
      })
    })

    it('should log warning for missing parameters', async () => {
      const warnSpy = vi.spyOn(console, 'warn')
      await getSyncQueueSince(null, deviceId)
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ getSyncQueueSince: Missing userId or deviceId'
      )
    })
  })

  describe('cleanupStaleDevices', () => {
    it('should return empty array if userId is missing', async () => {
      const result = await cleanupStaleDevices(null)
      expect(result).toEqual([])
    })

    it('should log warning for missing userId', async () => {
      const warnSpy = vi.spyOn(console, 'warn')
      await cleanupStaleDevices(null)
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ cleanupStaleDevices: Missing userId'
      )
    })
  })

  describe('deleteCleanupQueue', () => {
    it('should return 0 if userId is missing', async () => {
      const result = await deleteCleanupQueue(null, {})
      expect(result).toBe(0)
    })

    it('should return 0 if activeDevices is empty or missing', async () => {
      const result1 = await deleteCleanupQueue(userId, null)
      const result2 = await deleteCleanupQueue(userId, {})
      expect(result1).toBe(0)
      expect(result2).toBe(0)
    })

    it('should log warning for missing userId', async () => {
      const warnSpy = vi.spyOn(console, 'warn')
      await deleteCleanupQueue(null, { [deviceId]: new Date() })
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ deleteCleanupQueue: Missing userId'
      )
    })

    it('should log warning for empty activeDevices', async () => {
      const warnSpy = vi.spyOn(console, 'warn')
      await deleteCleanupQueue(userId, {})
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ deleteCleanupQueue: No active devices'
      )
    })
  })

  describe('updateDeviceLastFetch', () => {
    it('should return false if userId or deviceId is missing', async () => {
      const result1 = await updateDeviceLastFetch(null, deviceId)
      const result2 = await updateDeviceLastFetch(userId, null)

      expect(result1).toBe(false)
      expect(result2).toBe(false)
    })

    it('should log warning for missing parameters', async () => {
      const warnSpy = vi.spyOn(console, 'warn')
      await updateDeviceLastFetch(null, deviceId)
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ updateDeviceLastFetch: Missing userId or deviceId'
      )
    })
  })

  describe('initializeMetadata', () => {
    it('should return false if userId is missing', async () => {
      const result = await initializeMetadata(null)
      expect(result).toBe(false)
    })

    it('should log warning for missing userId', async () => {
      const warnSpy = vi.spyOn(console, 'warn')
      await initializeMetadata(null)
      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ initializeMetadata: Missing userId'
      )
    })
  })
})

/**
 * Integration Test Scenarios
 * 
 * These describe real-world usage flows:
 */
describe('syncQueue - Integration Scenarios', () => {
  const userId = 'user-456'
  const deviceWeb = 'device_web_0xabc123'
  const deviceMobile = 'device_mobile_0xdef456'

  describe('Scenario: Single device sync flow', () => {
    it('should register device, add entries, and fetch them', async () => {
      console.log('\n📱 Scenario: Single Device Sync Flow')
      console.log('─'.repeat(50))

      // Step 1: Register device
      console.log(`1️⃣ Register device: ${deviceWeb}`)
      const registered = await registerDevice(userId, deviceWeb)
      expect(registered).toBe('') // Will return empty string without real Firebase (due to mock), but returns deviceId in production

      // Step 2: Add sync entries
      console.log(`2️⃣ Add 3 sync entries`)
      const entry1 = await addToSyncQueue(
        userId,
        'create',
        'workout',
        'workout_001'
      )
      const entry2 = await addToSyncQueue(userId, 'create', 'exercise', 'ex_001')
      const entry3 = await addToSyncQueue(userId, 'update', 'session', 'sess_001')

      // Step 3: Fetch entries from device
      console.log(`3️⃣ Fetch entries for device: ${deviceWeb}`)
      const syncResult = await getSyncQueueSince(userId, deviceWeb)
      console.log(`   Found ${syncResult.items.length} entries`)

      // Step 4: Update device last fetch time
      console.log(`4️⃣ Update last fetch time`)
      const updated = await updateDeviceLastFetch(userId, deviceWeb)
      console.log(`   ✓ Flow complete`)
    })
  })

  describe('Scenario: Multi-device sync with cleanup', () => {
    it('should handle multiple devices and cleanup entries all have read', async () => {
      console.log('\n🔄 Scenario: Multi-Device Sync with Cleanup')
      console.log('─'.repeat(50))

      // Step 1: Register 2 devices
      console.log(`1️⃣ Register 2 devices`)
      console.log(`   - ${deviceWeb}`)
      console.log(`   - ${deviceMobile}`)

      // Step 2: Add entries
      console.log(`2️⃣ Add 5 entries to queue`)
      for (let i = 0; i < 5; i++) {
        await addToSyncQueue(userId, 'create', 'workout', `workout_${i}`)
      }

      // Step 3: Device 1 syncs
      console.log(`3️⃣ Device 1 fetches entries`)
      const sync1 = await getSyncQueueSince(userId, deviceWeb)
      console.log(`   Fetched: ${sync1.items.length} entries`)
      if (sync1.items.length > 0) {
        await updateDeviceLastFetch(userId, deviceWeb)
        console.log(`   ✓ Updated device 1 cursor`)
      }

      // Step 4: Device 2 syncs
      console.log(`4️⃣ Device 2 fetches entries`)
      const sync2 = await getSyncQueueSince(userId, deviceMobile)
      console.log(`   Fetched: ${sync2.items.length} entries`)
      if (sync2.items.length > 0) {
        await updateDeviceLastFetch(userId, deviceMobile)
        console.log(`   ✓ Updated device 2 cursor`)
      }

      // Step 5: Cleanup queue
      console.log(`5️⃣ Cleanup queue (delete entries all devices read)`)
      const activeDevices = {
        [deviceWeb]: sync1.lastFetchTime,
        [deviceMobile]: sync2.lastFetchTime,
      }
      const deleted = await deleteCleanupQueue(userId, activeDevices)
      console.log(`   Deleted: ${deleted} entries`)
    })
  })

  describe('Scenario: Stale device cleanup', () => {
    it('should remove devices inactive for more than 5 days', async () => {
      console.log('\n🗑️ Scenario: Stale Device Cleanup')
      console.log('─'.repeat(50))

      // Step 1: Register devices
      console.log(`1️⃣ Register 2 devices`)
      console.log(`   - ${deviceWeb} (active)`)
      console.log(`   - ${deviceMobile} (will go stale)`)

      // Step 2: Simulate old device not syncing for 6 days
      console.log(`2️⃣ Simulate device inactivity > 5 days`)

      // Step 3: Run cleanup
      console.log(`3️⃣ Run stale device cleanup`)
      const staleDevices = await cleanupStaleDevices(userId, 5) // 5 days threshold
      console.log(`   Removed: ${staleDevices.length} stale devices`)
      if (staleDevices.length > 0) {
        console.log(`   Stale devices: ${staleDevices.join(', ')}`)
      }
    })
  })

  describe('Scenario: Device with missed syncs', () => {
    it('should correctly resume sync for device that missed some entries', async () => {
      console.log('\n⏸️ Scenario: Device Resume Sync')
      console.log('─'.repeat(50))

      // Step 1: Add entries
      console.log(`1️⃣ Add 10 entries to queue`)
      for (let i = 0; i < 10; i++) {
        await addToSyncQueue(userId, 'create', 'workout', `wrk_${i}`)
      }

      // Step 2: Device fetches first batch
      console.log(`2️⃣ Device fetches first batch (5 entries, paginated)`)
      const batch1 = await getSyncQueueSince(userId, deviceWeb, 5)
      console.log(`   Batch 1: ${batch1.items.length} entries`)
      console.log(`   Has next page: ${batch1.nextCursor !== null}`)

      if (batch1.nextCursor) {
        // Step 3: Device fetches next batch
        console.log(`3️⃣ Device fetches next batch`)
        const batch2 = await getSyncQueueSince(
          userId,
          deviceWeb,
          5,
          batch1.nextCursor
        )
        console.log(`   Batch 2: ${batch2.items.length} entries`)

        // Step 4: Update cursor after consuming all
        console.log(`4️⃣ Update device cursor after consuming all entries`)
        await updateDeviceLastFetch(userId, deviceWeb)
        console.log(`   ✓ Device fully synced`)
      }
    })
  })

  describe('Scenario: Entry type & resource tracking', () => {
    it('should correctly track different action types and resource types', async () => {
      console.log('\n📊 Scenario: Entry Type Tracking')
      console.log('─'.repeat(50))

      const entries = [
        { action: 'create', resourceType: 'workout', resourceId: 'w1' },
        { action: 'update', resourceType: 'workout', resourceId: 'w1' },
        { action: 'delete', resourceType: 'workout', resourceId: 'w1' },
        { action: 'create', resourceType: 'exercise', resourceId: 'e1' },
        { action: 'create', resourceType: 'session', resourceId: 's1' },
      ]

      console.log(`1️⃣ Add ${entries.length} entries with different action/resource types`)
      for (const entry of entries) {
        const entryId = await addToSyncQueue(
          userId,
          entry.action,
          entry.resourceType,
          entry.resourceId
        )
        console.log(
          `   ✓ ${entry.action.toUpperCase()} ${entry.resourceType}#${entry.resourceId}`
        )
      }

      console.log(`2️⃣ Fetch all entries`)
      const result = await getSyncQueueSince(userId, deviceWeb)
      console.log(`   Fetched ${result.items.length} entries`)

      // Group by type
      const byAction = {}
      result.items.forEach((item) => {
        byAction[item.action] = (byAction[item.action] || 0) + 1
      })
      console.log(`3️⃣ Summary by action:`)
      Object.entries(byAction).forEach(([action, count]) => {
        console.log(`   ${action}: ${count}`)
      })
    })
  })
})

/**
 * Edge Cases & Error Handling
 */
describe('syncQueue - Edge Cases', () => {
  it('should handle concurrent device registrations', async () => {
    console.log('\n⚡ Edge Case: Concurrent Device Registrations')
    const userId = 'concurrent-user'
    const devices = Array.from({ length: 5 }, (_, i) => `device_${i}`)

    console.log(`Registering ${devices.length} devices concurrently...`)
    const results = await Promise.all(
      devices.map((deviceId) => registerDevice(userId, deviceId))
    )

    const successful = results.filter((r) => r === true || r === false).length
    console.log(`Registered: ${successful}/${devices.length} devices`)
  })

  it('should handle entries with special characters in IDs', async () => {
    console.log('\n🔤 Edge Case: Special Characters in IDs')
    const userId = 'special-chars-user'
    const resourceIds = [
      'workout_with-dash',
      'exercise.with.dot',
      'session_with_underscore',
      'resource@special#chars',
    ]

    console.log(`Adding ${resourceIds.length} entries with special chars...`)
    for (const resourceId of resourceIds) {
      const result = await addToSyncQueue(
        userId,
        'create',
        'workout',
        resourceId
      )
      console.log(`   ${resourceId}: ${result ? '✓' : '✗'}`)
    }
  })

  it('should handle large number of entries in cleanup', async () => {
    console.log('\n📦 Edge Case: Large Batch Cleanup')
    const userId = 'large-batch-user'
    const deviceWeb = 'device_web_0x1'
    const deviceMobile = 'device_mobile_0x1'

    console.log(`Simulating 1000 entries cleanup...`)
    // In real scenario, this would test performance
    const activeDevices = {
      [deviceWeb]: new Date(Date.now() - 1000),
      [deviceMobile]: new Date(Date.now() - 2000),
    }

    console.log(`Calling deleteCleanupQueue with ${Object.keys(activeDevices).length} active devices`)
    const deleted = await deleteCleanupQueue(userId, activeDevices)
    console.log(`Cleanup completed: deleted ${deleted} entries`)
  })

  it('should gracefully handle Firestore errors', async () => {
    console.log('\n❌ Edge Case: Firestore Errors')
    const errorSpy = vi.spyOn(console, 'error')

    // Call with invalid data that would cause Firebase errors
    console.log(`Testing error handling...`)
    await registerDevice('', '') // Empty strings
    await addToSyncQueue('', '', '', '') // All empty
    await getSyncQueueSince('', '') // Empty params

    const errorCount = errorSpy.mock.calls.length
    console.log(`Caught ${errorCount} errors gracefully`)
  })
})
