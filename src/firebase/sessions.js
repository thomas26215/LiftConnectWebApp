import {
  collection,
  collectionGroup,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore'
import { db } from '@/firebase'

function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

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

function formatFrenchDate(date) {
  if (!date) return 'Date inconnue'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function readExerciseCount(data) {
  const raw = data.exercises_count ?? data.exercise_count ?? data.exercisesCount ?? data.total_exercises
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : 0
}

function readDurationMinutes(data, startedAt, endedAt) {
  const raw = data.duration ?? data.duration_minutes ?? data.total_duration_minutes ?? data.training_minutes
  const numeric = Number(raw)
  if (Number.isFinite(numeric) && numeric >= 0) return numeric

  if (startedAt && endedAt) {
    const diff = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)
    return Number.isFinite(diff) && diff > 0 ? diff : 0
  }

  return 0
}

export function mapSessionDoc(sessionDoc, source = 'sessions') {
  const data = sessionDoc.data() || {}
  const startedAt = toDate(data.started_at || data.startedAt || data.date || data.created_at)
  const endedAt = toDate(data.ended_at || data.endedAt)
  const createdAt = startedAt || toDate(data.created_at) || toDate(data.updated_at)
  const type = inferType(data.type || data.name || data.session_name)

  return {
    id: `${source}:${sessionDoc.id}`,
    firestoreId: sessionDoc.id,
    source,
    name: data.name || data.session_name || 'Sans nom',
    type,
    duration: readDurationMinutes(data, startedAt, endedAt),
    exercises: readExerciseCount(data),
    date: formatFrenchDate(createdAt),
    public: data.is_public === true,
    likes: Number(data.likes ?? 0) || 0,
    liked: false,
    createdAt,
  }
}

export async function fetchSessionsPaginated({
  userId,
  searchText,
  pageSize = 20,
  lastVisible = null,
} = {}) {
  try {
    console.log(`📥 Fetching sessions from Firestore (paginated)... userId=${userId}`)

    const isSearching = Boolean(searchText && searchText.trim())

    let sessionsQuery

    if (userId) {
      // 📍 Si userId: récupère sessions/{userId}/sessions
      sessionsQuery = query(
        collection(db, 'sessions', userId, 'sessions')
      )
    } else {
      // 📍 Si pas userId: récupère via collectionGroup (toutes les sessions)
      sessionsQuery = query(
        collectionGroup(db, 'sessions'),
        where('authorUid', '>', '')  // ✅ remplace isNull: false
      )
    }

    // ✅ Applique le sort AVANT limit
    sessionsQuery = query(sessionsQuery, orderBy('created_at', 'desc'))

    // Mode recherche: fetch 100 max + filter client-side
    if (isSearching) {
      const snapshot = await getDocs(query(sessionsQuery, limit(100)))

      const q = searchText.toLowerCase().trim()
      const filtered = snapshot.docs
        .map(doc => {
          const data = (doc.data() ?? {})
          return {
            id: doc.id,
            firestoreId: doc.id,
            authorUid: data.authorUid ?? null,
            name: data.name ?? 'Sans nom',
            description: data.description,
            type: data.type,
            note: data.note,
            niveau: data.niveau,
            objectif: data.objectif,
            createdAt: toDate(data.created_at),
          }
        })
        .filter(session => {
          const name = (session.name ?? '').toLowerCase()
          const type = (session.type ?? '').toLowerCase()
          const desc = (session.description ?? '').toLowerCase()
          return name.includes(q) || type.includes(q) || desc.includes(q)
        })

      return { sessions: filtered, nextCursor: null }
    }

    // Mode pagination: limit + startAfter
    sessionsQuery = query(sessionsQuery, limit(pageSize))
    if (lastVisible) {
      sessionsQuery = query(sessionsQuery, startAfter(lastVisible))
    }

    const snapshot = await getDocs(sessionsQuery)

    const sessions = snapshot.docs.map(doc => {
      const data = (doc.data() ?? {})
      return {
        id: doc.id,
        firestoreId: doc.id,
        authorUid: data.authorUid ?? null,
        name: data.name ?? 'Sans nom',
        description: data.description,
        type: data.type,
        note: data.note,
        niveau: data.niveau,
        objectif: data.objectif,
        createdAt: toDate(data.created_at),
      }
    })

    // Retourne le dernier doc comme cursor si on a atteint la limite
    const nextCursor = snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null

    return { sessions, nextCursor }
  } catch (e) {
    console.error(`❌ Error fetching sessions: ${e}`)
    return { sessions: [], nextCursor: null }
  }
}

export async function fetchPublicSessionsPaginated({
  searchText,
  pageSize = 20,
  lastVisible = null,
} = {}) {
  const isSearching = Boolean(searchText && searchText.trim())

  let sessionsQuery = query(
    collectionGroup(db, 'sessions'),
    where('authorUid', '>', ''),
    orderBy('authorUid'),
    orderBy('created_at', 'desc')
  )

  if (!isSearching) {
    sessionsQuery = query(sessionsQuery, limit(pageSize))
    if (lastVisible) {
      sessionsQuery = query(sessionsQuery, startAfter(lastVisible))
    }
  } else {
    sessionsQuery = query(sessionsQuery, limit(100))
  }

  const snapshot = await getDocs(sessionsQuery)
  const mapped = snapshot.docs.map(sessionDoc => {
    const data = sessionDoc.data() || {}
    const createdAt = toDate(data.created_at)
    const type = inferType(data.type || data.name)

    return {
      id: sessionDoc.id,
      firestoreId: sessionDoc.id,
      name: data.name || 'Sans nom',
      type,
      duration: Number(data.duration ?? data.duration_minutes ?? 0) || 0,
      exercises: readExerciseCount(data),
      date: formatFrenchDate(createdAt),
      public: data.is_public === true,
      likes: Number(data.likes ?? 0) || 0,
      liked: false,
      createdAt,
    }
  })

  const filtered = !isSearching
    ? mapped
    : mapped.filter(session => {
      const q = searchText.toLowerCase().trim()
      const inName = session.name.toLowerCase().includes(q)
      const inType = session.type.toLowerCase().includes(q)
      return inName || inType
    })

  const nextCursor = !isSearching && snapshot.docs.length === pageSize
    ? snapshot.docs[snapshot.docs.length - 1]
    : null

  return {
    sessions: filtered,
    nextCursor,
  }
}
