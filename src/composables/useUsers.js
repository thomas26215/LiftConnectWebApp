import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days === 1) return 'Il y a 1 jour'
  return `Il y a ${days} jours`
}

function formatMemberSince(timestamp) {
  if (!timestamp) return null
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

function formatTrainingTime(minutes) {
  if (minutes == null) return '—'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function useUsers() {
  const usersRef = collection(db, 'users')

  const users = ref([])
  const currentUser = ref(null)
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref(null)
  const hasMore = ref(true)
  const pageSize = ref(20)
  let lastDoc = null
  let currentOrder = { field: 'created_at', dir: 'desc' }

  const totalCount = computed(() => users.value.length)

  async function fetchUser(uid) {
    if (!uid) return null
    loading.value = true
    error.value = null

    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (!snap.exists()) return null

      const data = { ...snap.data(), id: snap.id }
      const enriched = await _enrichUser(data)
      currentUser.value = enriched
      return enriched
    } catch (e) {
      console.error('[useUsers] fetchUser error:', e)
      error.value = e
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchUsers(options = {}) {
    const {
      size = pageSize.value,
      orderField = 'created_at',
      orderDir = 'desc',
    } = options

    users.value = []
    lastDoc = null
    hasMore.value = true
    currentOrder = { field: orderField, dir: orderDir }
    loading.value = true
    error.value = null

    try {
      const q = query(usersRef, orderBy(orderField, orderDir), limit(size))
      const snap = await getDocs(q)
      await _appendPage(snap)
    } catch (e) {
      console.error('[useUsers] fetchUsers error:', e)
      error.value = e
    } finally {
      loading.value = false
    }
  }

  async function fetchNextPage(size = pageSize.value) {
    if (!hasMore.value || loading.value || loadingMore.value) return
    if (!lastDoc) return fetchUsers({ size })

    loadingMore.value = true
    error.value = null

    try {
      const q = query(
        usersRef,
        orderBy(currentOrder.field, currentOrder.dir),
        startAfter(lastDoc),
        limit(size)
      )
      const snap = await getDocs(q)
      await _appendPage(snap)
    } catch (e) {
      console.error('[useUsers] fetchNextPage error:', e)
      error.value = e
    } finally {
      loadingMore.value = false
    }
  }

  async function _appendPage(snap) {
    if (snap.empty) {
      hasMore.value = false
      return
    }

    lastDoc = snap.docs[snap.docs.length - 1]
    if (snap.docs.length < pageSize.value) hasMore.value = false

    const raw = snap.docs.map(d => ({ ...d.data(), id: d.id }))
    const enriched = await Promise.all(raw.map(_enrichUser))
    users.value = [...users.value, ...enriched]
  }

  async function refresh() {
    await fetchUsers({ orderField: currentOrder.field, orderDir: currentOrder.dir })
  }

  async function _enrichUser(userData) {
    const enriched = {
      ...userData,
      memberSince: formatMemberSince(userData.created_at),
      totalTrainingMinutes: null,
      totalTrainingFormatted: '—',
      totalSessions: null,
      streakDays: 0,
    }

    if (!userData.id) return enriched

    try {
      const statsSnap = await getDoc(doc(db, 'users', userData.id, 'stats', 'summary'))
      if (statsSnap.exists()) {
        const stats = statsSnap.data()
        enriched.totalTrainingMinutes = stats.totalTrainingMinutes ?? null
        enriched.totalTrainingFormatted = formatTrainingTime(stats.totalTrainingMinutes ?? null)
        enriched.totalSessions = stats.totalSessions ?? null
        enriched.streakDays = stats.streakDays ?? 0
      }
    } catch (e) {
      console.warn(`[useUsers] Stats introuvables pour uid=${userData.id}`, e)
    }

    return enriched
  }

  async function fetchUserStats(uid) {
    if (!uid) return null
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'stats', 'summary'))
      if (!snap.exists()) return null
      const stats = snap.data()
      return {
        ...stats,
        totalTrainingFormatted: formatTrainingTime(stats.totalTrainingMinutes ?? null),
      }
    } catch (e) {
      console.error('[useUsers] fetchUserStats error:', e)
      return null
    }
  }

  async function createUser(uid, payload) {
    const {
      first_name, last_name, email, gender, birthdate,
      height_cm, weight_kg, objective, experience_level,
      gymId = null, gymName = null, location = null,
      equipments = {}, username = null, photoURL = null,
    } = payload

    const docData = {
      first_name: first_name?.trim() ?? '',
      last_name: last_name?.trim() ?? '',
      email: email?.trim() ?? '',
      username: username?.trim() ?? null,
      gender: gender ?? null,
      birthdate: birthdate ?? null,
      height_cm: height_cm ?? null,
      weight_kg: weight_kg ?? null,
      objective: objective ?? null,
      experience_level: experience_level ?? 'Débutant',
      level: experience_level ?? 'Débutant',
      gymId,
      gymName,
      location,
      equipments,
      photoURL,
      public: true,
      fitness_profile_complete: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    }

    try {
      await setDoc(doc(db, 'users', uid), docData)
      return uid
    } catch (e) {
      console.error('[useUsers] createUser error:', e)
      throw e
    }
  }

  async function updateUser(uid, fields) {
    if (!uid) throw new Error('UID requis')
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...fields,
        updated_at: serverTimestamp(),
      })

      const idx = users.value.findIndex(u => u.id === uid)
      if (idx !== -1) {
        users.value[idx] = { ...users.value[idx], ...fields }
      }
      if (currentUser.value?.id === uid) {
        currentUser.value = { ...currentUser.value, ...fields }
      }
    } catch (e) {
      console.error('[useUsers] updateUser error:', e)
      throw e
    }
  }

  async function completeFitnessProfile(uid) {
    await updateUser(uid, { fitness_profile_complete: true })
  }

  async function setPublicVisibility(uid, isPublic) {
    await updateUser(uid, { public: isPublic })
  }

  async function updatePhotoURL(uid, photoURL) {
    await updateUser(uid, { photoURL })
  }

  async function updateUserStats(uid, statsFields) {
    if (!uid) throw new Error('UID requis')
    try {
      const ref = doc(db, 'users', uid, 'stats', 'summary')
      const snap = await getDoc(ref)
      if (snap.exists()) {
        await updateDoc(ref, { ...statsFields, updated_at: serverTimestamp() })
      } else {
        await setDoc(ref, { ...statsFields, updated_at: serverTimestamp() })
      }
    } catch (e) {
      console.error('[useUsers] updateUserStats error:', e)
      throw e
    }
  }

  async function deleteUser(uid) {
    if (!uid) throw new Error('UID requis')
    try {
      const subCollections = ['daily_quest', 'followers', 'following', 'groups', 'last_workouts', 'statistics']
      for (const sub of subCollections) {
        const snap = await getDocs(collection(db, 'users', uid, sub))
        await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
      }

      await deleteDoc(doc(db, 'users', uid, 'stats', 'summary')).catch(() => {})
      await deleteDoc(doc(db, 'users', uid))

      users.value = users.value.filter(u => u.id !== uid)
      if (currentUser.value?.id === uid) currentUser.value = null
    } catch (e) {
      console.error('[useUsers] deleteUser error:', e)
      throw e
    }
  }

  async function fetchUsersByGym(gymId) {
    try {
      const q = query(usersRef, where('gymId', '==', gymId), orderBy('created_at', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ ...d.data(), id: d.id, memberSince: formatMemberSince(d.data().created_at) }))
    } catch (e) {
      console.error('[useUsers] fetchUsersByGym error:', e)
      return []
    }
  }

  async function fetchUsersByLevel(level) {
    try {
      const q = query(usersRef, where('level', '==', level), orderBy('created_at', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ ...d.data(), id: d.id }))
    } catch (e) {
      console.error('[useUsers] fetchUsersByLevel error:', e)
      return []
    }
  }

  async function fetchPublicUsers() {
    try {
      const q = query(usersRef, where('public', '==', true), orderBy('created_at', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ ...d.data(), id: d.id }))
    } catch (e) {
      console.error('[useUsers] fetchPublicUsers error:', e)
      return []
    }
  }

  async function fetchUserByUsername(username) {
    try {
      const q = query(usersRef, where('username', '==', username), limit(1))
      const snap = await getDocs(q)
      if (snap.empty) return null
      const d = snap.docs[0]
      return { ...d.data(), id: d.id }
    } catch (e) {
      console.error('[useUsers] fetchUserByUsername error:', e)
      return null
    }
  }

  async function fetchFollowers(uid) {
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'followers'))
      return snap.docs.map(d => ({ ...d.data(), id: d.id }))
    } catch (e) {
      console.error('[useUsers] fetchFollowers error:', e)
      return []
    }
  }

  async function fetchFollowing(uid) {
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'following'))
      return snap.docs.map(d => ({ ...d.data(), id: d.id }))
    } catch (e) {
      console.error('[useUsers] fetchFollowing error:', e)
      return []
    }
  }

  async function fetchLastWorkouts(uid, maxResults = 10) {
    try {
      const q = query(
        collection(db, 'users', uid, 'last_workouts'),
        orderBy('date', 'desc'),
        limit(maxResults)
      )
      const snap = await getDocs(q)
      return snap.docs.map(d => ({
        ...d.data(),
        id: d.id,
        dateFormatted: formatDate(d.data().date),
      }))
    } catch (e) {
      console.error('[useUsers] fetchLastWorkouts error:', e)
      return []
    }
  }

  return {
    users,
    currentUser,
    loading,
    loadingMore,
    error,
    totalCount,
    hasMore,
    pageSize,

    fetchUser,
    fetchUsers,
    fetchNextPage,
    refresh,
    fetchUserStats,

    createUser,

    updateUser,
    completeFitnessProfile,
    setPublicVisibility,
    updatePhotoURL,
    updateUserStats,

    deleteUser,

    fetchUsersByGym,
    fetchUsersByLevel,
    fetchPublicUsers,
    fetchUserByUsername,

    fetchFollowers,
    fetchFollowing,
    fetchLastWorkouts,

    formatDate,
    formatMemberSince,
    formatTrainingTime,
  }
}
