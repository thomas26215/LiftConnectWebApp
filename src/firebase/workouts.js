import { collection, getCountFromServer, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore'
import { db } from '@/firebase'

function inferType(raw) {
  const text = String(raw || '').toLowerCase()
  if (!text) return 'full'
  if (text.includes('push') || text.includes('pector') || text.includes('triceps')) return 'push'
  if (text.includes('pull') || text.includes('dos') || text.includes('biceps')) return 'pull'
  if (text.includes('leg') || text.includes('jambe') || text.includes('quadri') || text.includes('ischio')) return 'legs'
  if (text.includes('upper') || text.includes('épaule')) return 'upper'
  if (text.includes('full')) return 'full'
  return 'full'
}

export async function fetchWorkoutsPaginated({
  userId,
  searchText,
  pageSize = 20,
  lastVisible = null,
} = {}) {
  if (!userId) return { workouts: [], nextCursor: null }

  const isSearching = Boolean(searchText && searchText.trim())
  const fetchSize = isSearching ? 100 : Math.max(40, pageSize)

  // 📦 Merge 2 sources: new nested + old flat (backward compat)
  const [nestedSnap, flatSnap] = await Promise.all([
    getDocs(query(
      collection(db, 'workouts', userId, 'workouts'),
      orderBy('created_at', 'desc'),
      limit(fetchSize)
    )).catch(() => ({ docs: [] })),
    getDocs(query(
      collection(db, 'workouts'),
      where('author_uid', '==', userId),
      orderBy('created_at', 'desc'),
      limit(fetchSize)
    )).catch(() => ({ docs: [] })),
  ])

  const mapped = [
    ...nestedSnap.docs.map(workoutDoc => {
      const data = workoutDoc.data() || {}
      const type = data.type || inferType(data.name)

      return {
        id: workoutDoc.id,
        name: data.name || 'Sans nom',
        type,
        icon: '💪',
        uses: Number(data.performed_count ?? data.uses ?? 0) || 0,
        description: data.description || '',
        exerciseCount: Number(data.exercise_count ?? 0) || 0,
        duration: Number(data.duration ?? 0) || 0,
        isPublic: data.is_public === true,
        createdAt: data.created_at?.toDate?.() || new Date(),
      }
    }),
    ...flatSnap.docs.map(workoutDoc => {
      const data = workoutDoc.data() || {}
      const type = data.type || inferType(data.name)

      return {
        id: workoutDoc.id,
        name: data.name || 'Sans nom',
        type,
        icon: '💪',
        uses: Number(data.performed_count ?? data.uses ?? 0) || 0,
        description: data.description || '',
        exerciseCount: Number(data.exercise_count ?? 0) || 0,
        duration: Number(data.duration ?? 0) || 0,
        isPublic: data.is_public === true,
        createdAt: data.created_at?.toDate?.() || new Date(),
      }
    }),
  ]

  // Dedup by id
  const uniqueBySource = new Map()
  mapped.forEach(workout => {
    uniqueBySource.set(workout.id, workout)
  })

  const deduped = Array.from(uniqueBySource.values()).sort((a, b) => {
    const bt = b.createdAt?.getTime?.() || 0
    const at = a.createdAt?.getTime?.() || 0
    return bt - at
  })

  const filtered = !isSearching
    ? deduped
    : deduped.filter(workout => {
      const q = searchText.toLowerCase().trim()
      const inName = workout.name.toLowerCase().includes(q)
      const inType = workout.type.toLowerCase().includes(q)
      const inDesc = workout.description.toLowerCase().includes(q)
      return inName || inType || inDesc
    })

  const nextCursor = null

  return {
    workouts: filtered.slice(0, pageSize),
    nextCursor,
    hasMore: false,
  }
}

export async function fetchWorkoutsCount(userId) {
  if (!userId) return 0

  try {
    // 📍 Compter seulement depuis nested collection (les flat workouts sont legacy)
    const nestedSnap = await getCountFromServer(query(
      collection(db, 'workouts', userId, 'workouts')
    ))

    return nestedSnap.data().count || 0
  } catch (e) {
    console.warn('⚠️ Error fetching workouts count:', e)
    return 0
  }
}
