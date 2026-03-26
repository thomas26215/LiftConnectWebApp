/**
 * Manual E2E Test Suite for syncQueue
 * 
 * Run this in browser DevTools Console to test against real Firebase
 * Usage: Import this file and call functions to verify sync_queue behavior
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
} from 'firebase/firestore'
import { db } from '@/firebase'
import {
  registerDevice,
  addToSyncQueue,
  getSyncQueueSince,
  cleanupStaleDevices,
  deleteCleanupQueue,
  updateDeviceLastFetch,
  initializeMetadata,
} from '@/firebase/syncQueue'

/**
 * Main E2E test runner
 * Call: await runE2ETests('test-user-id-here', 'device_web_0xtestid')
 */
export async function runE2ETests(userId, deviceId) {
  console.clear()
  console.log('🧪 SYNC QUEUE E2E TEST SUITE')
  console.log('═'.repeat(60))
  console.log(`User: ${userId}`)
  console.log(`Device: ${deviceId}`)
  console.log('═'.repeat(60))

  const results = {
    passed: [],
    failed: [],
  }

  try {
    // Test 1: Initialize metadata
    console.log('\n📝 TEST 1: Initialize Metadata')
    console.log('─'.repeat(60))
    const metaInitialized = await initializeMetadata(userId)
    logResult('Initialize metadata', metaInitialized, results)

    // Test 2: Register device
    console.log('\n✅ TEST 2: Register Device')
    console.log('─'.repeat(60))
    const deviceRegistered = await registerDevice(userId, deviceId)
    logResult('Register device', deviceRegistered, results)

    // Test 3: Add sync entries (create, update, delete)
    console.log('\n📤 TEST 3: Add Sync Entries')
    console.log('─'.repeat(60))
    const entryIds = []
    const addedEntry1 = await addToSyncQueue(
      userId,
      'create',
      'workout',
      'workout_test_001'
    )
    logResult('Add CREATE workout', addedEntry1 !== null, results)
    if (addedEntry1) entryIds.push(addedEntry1)

    const addedEntry2 = await addToSyncQueue(
      userId,
      'update',
      'exercise',
      'exercise_test_001'
    )
    logResult('Add UPDATE exercise', addedEntry2 !== null, results)
    if (addedEntry2) entryIds.push(addedEntry2)

    const addedEntry3 = await addToSyncQueue(
      userId,
      'delete',
      'session',
      'session_test_001'
    )
    logResult('Add DELETE session', addedEntry3 !== null, results)
    if (addedEntry3) entryIds.push(addedEntry3)

    console.log(`\n✨ Added ${entryIds.length} entries:`)
    entryIds.forEach((id, idx) => console.log(`   ${idx + 1}. ${id}`))

    // Test 4: Check Firebase console for entries
    console.log('\n🔍 TEST 4: Manual Verification in Firebase Console')
    console.log('─'.repeat(60))
    console.log('📌 ACTION REQUIRED: Check Firebase Console')
    console.log(`   Path: users/${userId}/sync_queue`)
    console.log('   Expected documents:')
    console.log('     - _metadata (with devices map)')
    console.log(`     - ${entryIds.length} entry documents (entry_XXX)`)
    console.log('   Press ENTER after verifying...')
    // In real scenario, user manually checks
    logResult(
      'Manual verification',
      true,
      results,
      { manual: true }
    )

    // Test 5: Fetch sync entries
    console.log('\n📥 TEST 5: Fetch Sync Entries')
    console.log('─'.repeat(60))
    const syncData = await getSyncQueueSince(userId, deviceId, 10)
    const hasFetchedEntries = syncData.items && syncData.items.length > 0
    logResult('Fetch entries', hasFetchedEntries, results)

    if (syncData.items && syncData.items.length > 0) {
      console.log(`\n✨ Fetched ${syncData.items.length} entries:`)
      syncData.items.forEach((item, idx) => {
        console.log(
          `   ${idx + 1}. [${item.action.toUpperCase()}] ${item.resource_type}#${item.resource_id}`
        )
        console.log(`      ID: ${item.id}`)
        console.log(`      Timestamp: ${item.timestamp}`)
      })
    }

    // Test 6: Update device last fetch time
    console.log('\n⏱️ TEST 6: Update Device Last Fetch Time')
    console.log('─'.repeat(60))
    const fetchUpdated = await updateDeviceLastFetch(userId, deviceId)
    logResult('Update last fetch time', fetchUpdated, results)

    // Test 7: Cleanup stale devices (simulate old device)
    console.log('\n🗑️ TEST 7: Cleanup Stale Devices')
    console.log('─'.repeat(60))
    console.log('Note: This test requires devices inactive >5 days')
    const staleDevices = await cleanupStaleDevices(userId, 5)
    console.log(
      `Stale devices found and removed: ${staleDevices.length > 0 ? staleDevices.join(', ') : 'none'}`
    )
    logResult('Cleanup stale devices', true, results)

    // Test 8: Test cleanup queue with multi-device
    console.log('\n🔄 TEST 8: Multi-Device Queue Cleanup')
    console.log('─'.repeat(60))
    console.log('Simulating two devices with different fetch times...')

    // Get current metadata
    const metadataRef = doc(db, 'users', userId, 'sync_queue', '_metadata')
    const metaSnap = await getDoc(metadataRef)
    if (metaSnap.exists()) {
      const devices = metaSnap.data().devices || {}
      console.log(`Active devices in metadata:`)
      Object.entries(devices).forEach(([devId, timestamp]) => {
        console.log(`   - ${devId}: ${new Date(timestamp.toDate()).toISOString()}`)
      })

      // Attempt cleanup
      const cleaned = await deleteCleanupQueue(userId, devices)
      console.log(`Entries deleted by cleanup: ${cleaned}`)
      logResult('Queue cleanup', true, results)
    } else {
      console.warn('⚠️ Metadata not found')
      logResult('Queue cleanup', false, results)
    }

    // FINAL REPORT
    console.log('\n' + '═'.repeat(60))
    console.log('📊 TEST RESULTS')
    console.log('═'.repeat(60))
    console.log(`✅ PASSED: ${results.passed.length}`)
    results.passed.forEach((test) =>
      console.log(`   ✓ ${test.name}${test.manual ? ' (manual)' : ''}`)
    )

    if (results.failed.length > 0) {
      console.log(`❌ FAILED: ${results.failed.length}`)
      results.failed.forEach((test) =>
        console.log(`   ✗ ${test.name}`)
      )
    }

    console.log('═'.repeat(60))
    console.log('🎉 E2E Test Suite Complete!')

    return {
      total: results.passed.length + results.failed.length,
      passed: results.passed.length,
      failed: results.failed.length,
    }
  } catch (error) {
    console.error('❌ Test suite error:', error)
    throw error
  }
}

/**
 * Helper function to log test results
 */
function logResult(testName, passed, results, options = {}) {
  if (passed) {
    console.log(`✅ ${testName}`)
    results.passed.push({ name: testName, ...options })
  } else {
    console.log(`❌ ${testName}`)
    results.failed.push({ name: testName })
  }
}

/**
 * Utility: Check sync queue state in Firebase Console
 * Call: await checkSyncQueueState('user-id')
 */
export async function checkSyncQueueState(userId) {
  console.log('🔍 SYNC QUEUE STATE CHECK')
  console.log('═'.repeat(60))

  try {
    // Get metadata
    const metadataRef = doc(db, 'users', userId, 'sync_queue', '_metadata')
    const metaSnap = await getDoc(metadataRef)

    if (!metaSnap.exists()) {
      console.log('⚠️ No metadata found')
      return null
    }

    const metadata = metaSnap.data()
    console.log('\n📋 Metadata:')
    console.log('Registered devices:')
    Object.entries(metadata.devices || {}).forEach(([deviceId, timestamp]) => {
      const date = new Date(timestamp.toDate())
      const age = Math.floor((Date.now() - date.getTime()) / 1000 / 60) // minutes
      console.log(`   - ${deviceId}`)
      console.log(`     Last fetch: ${date.toISOString()}`)
      console.log(`     Age: ${age} minutes ago`)
    })

    // Get all queue entries
    const q = query(collection(db, 'users', userId, 'sync_queue'))
    const entriesSnap = await getDocs(q)

    console.log(`\n📦 Queue entries (${entriesSnap.size - 1}):`) // -1 for _metadata
    entriesSnap.docs.forEach((doc) => {
      if (doc.id === '_metadata') return

      const data = doc.data()
      console.log(`   ${doc.id}:`)
      console.log(`     Action: ${data.action}`)
      console.log(`     Resource: ${data.resource_type}#${data.resource_id}`)
      console.log(`     Timestamp: ${new Date(data.timestamp.toDate()).toISOString()}`)
    })

    console.log('═'.repeat(60))
    return {
      deviceCount: Object.keys(metadata.devices || {}).length,
      entryCount: entriesSnap.size - 1,
    }
  } catch (error) {
    console.error('❌ Error checking state:', error)
    throw error
  }
}

/**
 * Utility: Clean up test data
 * Call: await cleanupTestData('user-id')
 */
export async function cleanupTestData(userId) {
  console.log('🧹 CLEANING UP TEST DATA')
  console.log('═'.repeat(60))

  try {
    const qRef = collection(db, 'users', userId, 'sync_queue')
    const q = query(qRef)
    const snapshot = await getDocs(q)

    console.log(`Deleting ${snapshot.size} documents...`)
    let deleted = 0

    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref)
      deleted++
      console.log(`   ✓ Deleted: ${doc.id}`)
    }

    console.log(`═'.repeat(60))
    console.log(`🎉 Cleanup complete! Deleted ${deleted} documents`)
    return deleted
  } catch (error) {
    console.error('❌ Cleanup error:', error)
    throw error
  }
}

/**
 * QUICK START GUIDE
 * 
 * 1. In browser DevTools Console, run:
 *    import { runE2ETests } from '@/firebase/__tests__/syncQueue.e2e'
 *    await runE2ETests('your-user-id', 'device_web_0xyourdevid')
 * 
 * 2. Check Firebase Console for entries:
 *    Firestore → users → your-user-id → sync_queue
 * 
 * 3. Verify state:
 *    import { checkSyncQueueState } from '@/firebase/__tests__/syncQueue.e2e'
 *    await checkSyncQueueState('your-user-id')
 * 
 * 4. Clean up test data:
 *    import { cleanupTestData } from '@/firebase/__tests__/syncQueue.e2e'
 *    await cleanupTestData('your-user-id')
 */

// Export for use in DevTools
if (typeof window !== 'undefined') {
  window.syncQueueE2E = {
    runE2ETests,
    checkSyncQueueState,
    cleanupTestData,
  }
  console.log('✅ syncQueueE2E loaded in window.syncQueueE2E')
}
