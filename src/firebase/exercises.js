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

function normalizeMuscle(value) {
  const raw = String(value || '').trim()
  return raw || 'Non renseigné'
}

export async function fetchExercisesPaginated({
  userId,
  searchText,
  pageSize = 20,
  lastVisible = null,
} = {}) {
  if (!userId) return { exercises: [], nextCursor: null }

  const isSearching = Boolean(searchText && searchText.trim())
  const fetchSize = isSearching ? 100 : Math.max(40, pageSize)

  // 📦 Merge 2 sources: new nested + old flat (backward compat)
  const [nestedSnap, flatSnap] = await Promise.all([
    getDocs(query(
      collection(db, 'exercises', userId, 'exercises'),
      orderBy('created_at', 'desc'),
      limit(fetchSize)
    )).catch(() => ({ docs: [] })),
    getDocs(query(
      collection(db, 'exercises'),
      where('author_uid', '==', userId),
      orderBy('created_at', 'desc'),
      limit(fetchSize)
    )).catch(() => ({ docs: [] })),
  ])

  const mapped = [
    ...nestedSnap.docs.map(exerciseDoc => {
      const data = exerciseDoc.data() || {}
      const type = inferType(data.type || data.name)
      return {
        id: exerciseDoc.id,
        name: data.name || 'Sans nom',
        muscle: normalizeMuscle(data.equipement || data.muscle || data.type),
        type,
        icon: '🏋️',
        uses: Number(data.performed_count ?? data.uses ?? 0) || 0,
        description: data.description || '',
        isPublic: data.is_public === true,
      }
    }),
    ...flatSnap.docs.map(exerciseDoc => {
      const data = exerciseDoc.data() || {}
      const type = inferType(data.type || data.name)
      return {
        id: exerciseDoc.id,
        name: data.name || 'Sans nom',
        muscle: normalizeMuscle(data.equipement || data.muscle || data.type),
        type,
        icon: '🏋️',
        uses: Number(data.performed_count ?? data.uses ?? 0) || 0,
        description: data.description || '',
        isPublic: data.is_public === true,
      }
    }),
  ]

  // Dedup by id
  const uniqueBySource = new Map()
  mapped.forEach(exercise => {
    uniqueBySource.set(exercise.id, exercise)
  })

  const deduped = Array.from(uniqueBySource.values()).sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const filtered = !isSearching
    ? deduped
    : deduped.filter(exercise => {
      const q = searchText.toLowerCase().trim()
      const inName = exercise.name.toLowerCase().includes(q)
      const inType = exercise.type.toLowerCase().includes(q)
      const inDesc = exercise.description.toLowerCase().includes(q)
      return inName || inType || inDesc
    })

  const nextCursor = null

  return {
    exercises: filtered.slice(0, pageSize),
    nextCursor,
    hasMore: false,
  }
}

export async function fetchExercisesCount(userId) {
  if (!userId) return 0

  try {
    // 📍 Compter seulement depuis nested collection (les flat exercises sont legacy)
    const nestedSnap = await getCountFromServer(query(
      collection(db, 'exercises', userId, 'exercises')
    ))

    return nestedSnap.data().count || 0
  } catch (e) {
    console.warn('⚠️ Error fetching exercises count:', e)
    return 0
  }
}
