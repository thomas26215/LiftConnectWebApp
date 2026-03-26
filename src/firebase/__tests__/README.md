# Sync Queue Testing Guide

## 📋 Overview

Two test suites are provided for the Firebase sync queue:

1. **Unit Tests** (`syncQueue.test.js`) — Automated tests with Vitest
2. **E2E Tests** (`syncQueue.e2e.js`) — Manual integration tests in browser

---

## 🧪 Unit Tests (Vitest)

### Setup

```bash
npm install -D vitest
```

### Run Tests

```bash
# Run once
npm run test src/firebase/__tests__/syncQueue.test.js

# Watch mode
npm run test:watch src/firebase/__tests__/syncQueue.test.js

# Coverage
npm run test:coverage src/firebase/__tests__/syncQueue.test.js
```

### What's Tested

#### Parameter Validation
- Missing userId / deviceId handling
- Missing action / resource type handling
- Return values for error cases

#### Integration Scenarios
1. **Single Device Sync Flow**
   - Register device
   - Add entries (CRUD operations)
   - Fetch entries
   - Update last fetch time

2. **Multi-Device Sync with Cleanup**
   - Register 2 devices
   - Add entries
   - Each device fetches entries
   - Cleanup entries all devices have read

3. **Stale Device Cleanup**
   - Simulate device inactivity >5 days
   - Auto-remove from metadata
   - Delete queue entries

4. **Resume Sync (Pagination)**
   - Add large batch of entries
   - Fetch with pagination
   - Continue fetching with cursor

5. **Entry Type Tracking**
   - Track different action types (create/update/delete)
   - Track different resource types (workout/exercise/session)

#### Edge Cases
- Concurrent device registrations
- Special characters in IDs
- Large batch cleanup
- Firestore error handling

---

## 🌐 E2E Tests (Browser)

### Quick Start

Open browser DevTools Console and run:

```javascript
import { runE2ETests } from '@/firebase/__tests__/syncQueue.e2e'

// Replace with real user ID and device ID
await runE2ETests('your-user-id', 'device_web_0xyourdevid')
```

### Available Functions

#### 1. **runE2ETests(userId, deviceId)**

Runs complete sync queue test suite against Firebase.

```javascript
const result = await runE2ETests('user-123', 'device_web_0xabc')

// Returns:
// {
//   total: 8,
//   passed: 8,
//   failed: 0
// }
```

**Tests included:**
- Initialize metadata
- Register device
- Add entries (create, update, delete)
- Fetch entries
- Update last fetch time
- Cleanup stale devices
- Multi-device queue cleanup

#### 2. **checkSyncQueueState(userId)**

Check current state of sync queue in Firebase.

```javascript
import { checkSyncQueueState } from '@/firebase/__tests__/syncQueue.e2e'

const state = await checkSyncQueueState('user-123')

// Returns:
// {
//   deviceCount: 2,
//   entryCount: 15
// }

// Console output shows:
// - All registered devices with last fetch times
// - All queue entries with details
```

Output example:
```
🔍 SYNC QUEUE STATE CHECK
════════════════════════════════════════════════════════════

📋 Metadata:
Registered devices:
   - device_web_0xabc
     Last fetch: 2026-03-26T10:30:00.000Z
     Age: 5 minutes ago
   - device_mobile_0xdef
     Last fetch: 2026-03-26T10:25:00.000Z
     Age: 10 minutes ago

📦 Queue entries (15):
   entry_001:
     Action: create
     Resource: workout#workout_123
     Timestamp: 2026-03-26T10:15:00.000Z
   ...
```

#### 3. **cleanupTestData(userId)**

Delete all sync queue data for a user (useful for cleanup after testing).

```javascript
import { cleanupTestData } from '@/firebase/__tests__/syncQueue.e2e'

const deleted = await cleanupTestData('user-123')
// Returns: 18 (number of documents deleted)
```

---

## 📝 Manual Testing Workflow

### Scenario: Test Single Device Sync

1. **Initialize**
   ```javascript
   import { runE2ETests } from '@/firebase/__tests__/syncQueue.e2e'
   const result = await runE2ETests('YOUR_USER_ID', 'device_web_0xtest123')
   ```

2. **Verify in Firebase Console**
   - Open Firestore → `users` → `YOUR_USER_ID` → `sync_queue`
   - Should see:
     - `_metadata` document with devices map
     - 3 entry documents (CREATE workout, UPDATE exercise, DELETE session)

3. **Check state**
   ```javascript
   import { checkSyncQueueState } from '@/firebase/__tests__/syncQueue.e2e'
   await checkSyncQueueState('YOUR_USER_ID')
   ```

### Scenario: Test Multi-Device Cleanup

1. **Prepare test environment**
   ```javascript
   // Cleanup old test data
   import { cleanupTestData } from '@/firebase/__tests__/syncQueue.e2e'
   await cleanupTestData('test-multi-device')
   ```

2. **Run E2E tests**
   ```javascript
   import { runE2ETests } from '@/firebase/__tests__/syncQueue.e2e'
   
   // Simulate 2 different devices
   await runE2ETests('test-multi-device', 'device_web_main')
   await runE2ETests('test-multi-device', 'device_mobile_main')
   ```

3. **Check cleanup behavior**
   - Both devices should be registered in `_metadata.devices`
   - Entries should be retained (not all devices have synced yet to same point)

4. **Verify state progression**
   ```javascript
   import { checkSyncQueueState } from '@/firebase/__tests__/syncQueue.e2e'
   
   // Check state before cleanup
   const before = await checkSyncQueueState('test-multi-device')
   console.log(`Entries before cleanup: ${before.entryCount}`)
   
   // After cleanup would be triggered internally
   const after = await checkSyncQueueState('test-multi-device')
   console.log(`Entries after cleanup: ${after.entryCount}`)
   ```

---

## 🔍 Debugging Tips

### Check Firestore Rules Error

If E2E tests fail with permission errors:

1. Open Firebase Console → Firestore → Rules
2. Verify rules include sync_queue:
   ```
   match /users/{userId}/sync_queue/{document=**} {
     allow read, write: if request.auth.uid == userId;
   }
   ```

### Check Device Registration

In DevTools Console:

```javascript
import { checkSyncQueueState } from '@/firebase/__tests__/syncQueue.e2e'
await checkSyncQueueState('YOUR_USER_ID')

// Look for registered devices
// If empty, registerDevice() may be failing
```

### Monitor Firestore Bandwidth

Open DevTools → Network → Filter "firestore":

1. When runE2ETests() executes, should see:
   - `query` for _metadata (getDoc)
   - `commit` for registerDevice (updateDoc)
   - `commit` for addToSyncQueue (addDoc) × 3
   - `query` for getSyncQueueSince (getDocs)
   - `commit` for updateDeviceLastFetch (updateDoc)
   - etc.

### Test with Real User

To test with actual logged-in user:

```javascript
import { useAuthStore } from '@/stores/auth'
import { runE2ETests } from '@/firebase/__tests__/syncQueue.e2e'

const auth = useAuthStore()
if (auth.currentUser?.uid) {
  await runE2ETests(auth.currentUser.uid, 'device_web_0xmydevice')
}
```

---

## ✅ Test Checklist

Before considering implementation complete:

- [ ] Unit tests pass: `npm run test`
- [ ] E2E tests run without errors (check browser console)
- [ ] Firebase Console shows correct documents in sync_queue
- [ ] Device registration visible in _metadata.devices
- [ ] Entries have correct action/resource_type/resource_id
- [ ] Multi-device scenario creates entries for all devices
- [ ] Cleanup removes stale devices
- [ ] Test data can be cleaned up without errors

---

## 📊 Test Results Example

```
🧪 SYNC QUEUE E2E TEST SUITE
════════════════════════════════════════════════════════════
User: test-user-123
Device: device_web_0xabc123
════════════════════════════════════════════════════════════

📝 TEST 1: Initialize Metadata
────────────────────────────────────────────────────────────
✅ Initialize metadata

✅ TEST 2: Register Device
────────────────────────────────────────────────────────────
✅ Register device

📤 TEST 3: Add Sync Entries
────────────────────────────────────────────────────────────
✅ Add CREATE workout
✅ Add UPDATE exercise
✅ Add DELETE session

✨ Added 3 entries:
   1. entry_abc123
   2. entry_def456
   3. entry_ghi789

📥 TEST 5: Fetch Sync Entries
────────────────────────────────────────────────────────────
✅ Fetch entries

✨ Fetched 3 entries:
   1. [CREATE] workout#workout_test_001
      ID: entry_abc123
      Timestamp: 2026-03-26T10:30:45.123Z
   2. [UPDATE] exercise#exercise_test_001
      ID: entry_def456
      Timestamp: 2026-03-26T10:30:46.456Z
   3. [DELETE] session#session_test_001
      ID: entry_ghi789
      Timestamp: 2026-03-26T10:30:47.789Z

⏱️ TEST 6: Update Device Last Fetch Time
────────────────────────────────────────────────────────────
✅ Update last fetch time

════════════════════════════════════════════════════════════
📊 TEST RESULTS
════════════════════════════════════════════════════════════
✅ PASSED: 8
   ✓ Initialize metadata
   ✓ Register device
   ✓ Add CREATE workout
   ✓ Add UPDATE exercise
   ✓ Add DELETE session
   ✓ Fetch entries
   ✓ Update last fetch time
   ✓ Queue cleanup

🎉 E2E Test Suite Complete!
```

---

## 🚀 Next Steps

After tests pass:

1. Implement `src/services/deviceService.js` (UUID generation)
2. Implement `src/services/syncService.js` (polling logic)
3. Wrap CRUD operations in firebase modules
4. Update auth store with sync initialization
5. Create UI indicator for sync status
