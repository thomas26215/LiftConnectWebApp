import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  increment,
  documentId,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { getAuth } from 'firebase/auth'

// ────────────────────────────────────────────────────────────
// 🏋️ SportGroup Model
// ────────────────────────────────────────────────────────────

export class SportGroup {
  constructor({
    id,
    name,
    sport,
    isPrivate,
    membersCount,
    location,
    description,
    iconKey,
    isMember = null,
    ownerUid = null,
  }) {
    this.id = id
    this.name = name
    this.sport = sport
    this.isPrivate = isPrivate
    this.membersCount = membersCount
    this.location = location
    this.description = description
    this.iconKey = iconKey
    this.isMember = isMember
    this.ownerUid = ownerUid
  }

  /**
   * ✅ Create from Firestore document
   */
  static fromFirestore(doc, { isMember = null } = {}) {
    const data = doc.data() || {}
    return new SportGroup({
      id: doc.id,
      name: data.name || '',
      sport: data.sport || '',
      isPrivate: data.isPrivate || false,
      membersCount: Math.max(0, Math.min(data.membersCount || 0, 9999)),
      location: data.location || '',
      description: data.description || '',
      iconKey: data.iconKey || 'groups',
      isMember,
      ownerUid: data.ownerUid || null,
    })
  }

  /**
   * ✅ Enrich group with membership status
   */
  static withMembership(group, isMember) {
    return new SportGroup({
      id: group.id,
      name: group.name,
      sport: group.sport,
      isPrivate: group.isPrivate,
      membersCount: group.membersCount,
      location: group.location,
      description: group.description,
      iconKey: group.iconKey,
      isMember,
      ownerUid: group.ownerUid,
    })
  }

  /**
   * ✅ Convert to Firestore format
   */
  toFirestore() {
    return {
      name: this.name,
      sport: this.sport,
      isPrivate: this.isPrivate,
      membersCount: this.membersCount,
      location: this.location,
      description: this.description,
      iconKey: this.iconKey,
      createdAt: serverTimestamp(),
    }
  }

  /**
   * ✅ UI getter
   */
  get isMemberBool() {
    return this.isMember ?? false
  }
}

// ────────────────────────────────────────────────────────────
// 🔥 Firebase Group Utils
// ────────────────────────────────────────────────────────────

const GROUPS_COLLECTION = 'groups'
const USER_GROUPS_SUBCOLLECTION = 'groups'

/**
 * 🔥 MES GROUPES (toujours isMember = true)
 * @param {number} limit - Nombre max de groupes à récupérer
 * @returns {Promise<SportGroup[]>}
 */
export async function fetchMyGroups({ limit: pageLimit = 10 } = {}) {
  const user = getAuth().currentUser
  if (!user) return []

  try {
    const userGroupsSnap = await getDocs(
      query(
        collection(db, 'users', user.uid, USER_GROUPS_SUBCOLLECTION),
        orderBy('joinedAt', 'desc'),
        limit(pageLimit),
      ),
    )

    if (userGroupsSnap.empty) return []

    const groupIds = userGroupsSnap.docs.map(d => d.id)
    const groupsSnap = await getDocs(
      query(
        collection(db, GROUPS_COLLECTION),
        where(documentId(), 'in', groupIds.slice(0, 10)),
      ),
    )

    return groupsSnap.docs.map(doc => SportGroup.fromFirestore(doc, { isMember: true }))
  } catch (e) {
    console.error('❌ fetchMyGroups:', e)
    return []
  }
}

/**
 * 🔥 DÉCOUVRIR (public groups, sans membership data)
 * @param {number} limit - Nombre max de groupes
 * @param {string} searchQuery - Texte de recherche optionnel
 * @param {boolean} onlyPublic - Seulement les groupes publics
 * @returns {Promise<SportGroup[]>}
 */
export async function fetchDiscoverableGroups({
  limit: pageLimit = 20,
  searchQuery = null,
  onlyPublic = true,
} = {}) {
  try {
    let q = query(
      collection(db, GROUPS_COLLECTION),
      orderBy('membersCount', 'desc'),
      limit(pageLimit),
    )

    // Apply filters
    const constraints = []
    if (onlyPublic) {
      constraints.push(where('isPrivate', '==', false))
    }

    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.trim().toLowerCase()
      constraints.push(where('name', '>=', searchTerm))
      constraints.push(where('name', '<=', searchTerm + '\uf8ff'))
    }

    if (constraints.length > 0) {
      q = query(collection(db, GROUPS_COLLECTION), ...constraints, orderBy('membersCount', 'desc'), limit(pageLimit))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => SportGroup.fromFirestore(doc))
  } catch (e) {
    console.error('❌ fetchDiscoverableGroups:', e)
    return []
  }
}

/**
 * 🔥 DÉCOUVRIR avec membership (✅ enrichi avec isMember)
 * @param {number} limit - Nombre max de groupes
 * @param {string} searchQuery - Texte de recherche optionnel
 * @param {boolean} onlyPublic - Seulement les groupes publics
 * @returns {Promise<SportGroup[]>}
 */
export async function fetchDiscoverableGroupsWithMembership({
  limit: pageLimit = 20,
  searchQuery = null,
  onlyPublic = true,
} = {}) {
  const groups = await fetchDiscoverableGroups({
    limit: pageLimit,
    searchQuery,
    onlyPublic,
  })

  if (groups.length === 0) return []

  const groupIds = groups.map(g => g.id)
  const membershipResults = await Promise.all(groupIds.map(id => isMemberOfGroup(id)))

  const membershipMap = Object.fromEntries(groupIds.map((id, i) => [id, membershipResults[i]]))

  return groups.map(group => SportGroup.withMembership(group, membershipMap[group.id] ?? false))
}

/**
 * 🔥 STREAM (realtime, sans membership pour perf)
 * @param {number} limit - Nombre max de groupes
 * @param {Function} onUpdate - Callback avec array de groupes
 * @returns {Function} Unsubscribe function
 */
export function streamDiscoverableGroups({ limit: pageLimit = 20 } = {}, onUpdate) {
  const q = query(
    collection(db, GROUPS_COLLECTION),
    where('isPrivate', '==', false),
    orderBy('membersCount', 'desc'),
    limit(pageLimit),
  )

  return onSnapshot(q, snapshot => {
    const groups = snapshot.docs.map(doc => SportGroup.fromFirestore(doc))
    onUpdate(groups)
  })
}

/**
 * 🔥 JOINDRE un groupe
 * @param {string} groupId - ID du groupe
 * @returns {Promise<boolean>}
 */
export async function joinGroup(groupId) {
  const user = getAuth().currentUser
  if (!user) return false

  try {
    await runTransaction(db, async transaction => {
      const userGroupRef = doc(db, 'users', user.uid, USER_GROUPS_SUBCOLLECTION, groupId)
      const existingDoc = await transaction.get(userGroupRef)

      if (existingDoc.exists()) return // Already member

      transaction.set(userGroupRef, {
        joinedAt: serverTimestamp(),
        role: 'member',
      })

      const groupRef = doc(db, GROUPS_COLLECTION, groupId)
      transaction.update(groupRef, { membersCount: increment(1) })
    })
    return true
  } catch (e) {
    console.error(`❌ joinGroup ${groupId}:`, e)
    return false
  }
}

/**
 * 🔥 QUITTER un groupe
 * @param {string} groupId - ID du groupe
 * @returns {Promise<boolean>}
 */
export async function leaveGroup(groupId) {
  const user = getAuth().currentUser
  if (!user) return false

  try {
    await runTransaction(db, async transaction => {
      const groupRef = doc(db, GROUPS_COLLECTION, groupId)
      transaction.update(groupRef, { membersCount: increment(-1) })

      const userGroupRef = doc(db, 'users', user.uid, USER_GROUPS_SUBCOLLECTION, groupId)
      transaction.delete(userGroupRef)
    })
    return true
  } catch (e) {
    console.error(`❌ leaveGroup ${groupId}:`, e)
    return false
  }
}

/**
 * 🔥 Vérifier appartenance à un groupe
 * @param {string} groupId - ID du groupe
 * @returns {Promise<boolean>}
 */
export async function isMemberOfGroup(groupId) {
  const user = getAuth().currentUser
  if (!user) return false

  try {
    const docSnap = await getDoc(
      doc(db, 'users', user.uid, USER_GROUPS_SUBCOLLECTION, groupId),
    )
    return docSnap.exists()
  } catch (e) {
    console.error(`❌ isMemberOfGroup ${groupId}:`, e)
    return false
  }
}

/**
 * 🔥 CRÉER un groupe (✅ auto-join créateur avec role=owner)
 * @param {SportGroup} group - Groupe à créer
 * @returns {Promise<string|null>} ID du groupe créé ou null
 */
export async function createGroup(group) {
  const user = getAuth().currentUser
  if (!user) return null

  try {
    const docRef = await addDoc(collection(db, GROUPS_COLLECTION), {
      ...group.toFirestore(),
      ownerUid: user.uid, // ✅ Créateur identifié
    })

    // ✅ Auto-join créateur (role=owner)
    await runTransaction(db, async transaction => {
      const userGroupRef = doc(db, 'users', user.uid, USER_GROUPS_SUBCOLLECTION, docRef.id)
      const existingDoc = await transaction.get(userGroupRef)

      if (existingDoc.exists()) return // Already member (safety)

      transaction.set(userGroupRef, {
        joinedAt: serverTimestamp(),
        role: 'owner',
      })
    })

    console.log(`✅ Groupe créé: ${docRef.id} (créateur auto-joint)`)
    return docRef.id
  } catch (e) {
    console.error('❌ createGroup:', e)
    return null
  }
}

/**
 * 🔥 Obtenir un groupe par ID
 * @param {string} groupId - ID du groupe
 * @returns {Promise<SportGroup|null>}
 */
export async function getGroup(groupId) {
  try {
    const docSnap = await getDoc(doc(db, GROUPS_COLLECTION, groupId))
    if (!docSnap.exists()) return null
    return SportGroup.fromFirestore(docSnap)
  } catch (e) {
    console.error(`❌ getGroup ${groupId}:`, e)
    return null
  }
}

/**
 * 🔥 Obtenir un groupe avec membership
 * @param {string} groupId - ID du groupe
 * @returns {Promise<SportGroup|null>}
 */
export async function getGroupWithMembership(groupId) {
  const group = await getGroup(groupId)
  if (!group) return null

  const isMember = await isMemberOfGroup(groupId)
  return SportGroup.withMembership(group, isMember)
}

/**
 * 🔥 STREAM un groupe spécifique (realtime)
 * @param {string} groupId - ID du groupe
 * @param {Function} onUpdate - Callback avec SportGroup
 * @returns {Function} Unsubscribe function
 */
export function streamGroup(groupId, onUpdate) {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId)

  return onSnapshot(groupRef, snapshot => {
    if (!snapshot.exists()) {
      onUpdate(null)
      return
    }
    const group = SportGroup.fromFirestore(snapshot)
    onUpdate(group)
  })
}
