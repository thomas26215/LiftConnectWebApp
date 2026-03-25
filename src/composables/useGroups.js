import { ref, computed } from 'vue'
import {
  fetchMyGroups,
  fetchDiscoverableGroups,
  fetchDiscoverableGroupsWithMembership,
  streamDiscoverableGroups,
  joinGroup,
  leaveGroup,
  isMemberOfGroup,
  createGroup,
  getGroup,
  getGroupWithMembership,
  streamGroup,
  SportGroup,
} from '@/firebase/groups'

/**
 * 🏋️ Composable pour la gestion des groupes
 */
export function useGroups() {
  // ─── État ───
  const myGroups = ref([])
  const discoverableGroups = ref([])
  const currentGroup = ref(null)
  const isLoadingMyGroups = ref(false)
  const isLoadingDiscoverable = ref(false)
  const isLoadingGroup = ref(false)
  const isJoiningGroup = ref(false)
  const isLeavingGroup = ref(false)
  const isCreatingGroup = ref(false)
  const error = ref(null)

  // ─── Realtime subscriptions ───
  let unsubscribeDiscoverable = null
  let unsubscribeGroup = null

  // ─── Methodes ───

  /**
   * Charger mes groupes
   */
  async function loadMyGroups(limit = 10) {
    isLoadingMyGroups.value = true
    error.value = null
    try {
      myGroups.value = await fetchMyGroups({ limit })
      return myGroups.value
    } catch (e) {
      error.value = e.message
      console.error('❌ loadMyGroups:', e)
      return []
    } finally {
      isLoadingMyGroups.value = false
    }
  }

  /**
   * Charger groupes découvrables (sans membership)
   */
  async function loadDiscoverableGroups(options = {}) {
    isLoadingDiscoverable.value = true
    error.value = null
    try {
      discoverableGroups.value = await fetchDiscoverableGroups(options)
      return discoverableGroups.value
    } catch (e) {
      error.value = e.message
      console.error('❌ loadDiscoverableGroups:', e)
      return []
    } finally {
      isLoadingDiscoverable.value = false
    }
  }

  /**
   * Charger groupes découvrables (AVEC membership)
   */
  async function loadDiscoverableGroupsWithMembership(options = {}) {
    isLoadingDiscoverable.value = true
    error.value = null
    try {
      discoverableGroups.value = await fetchDiscoverableGroupsWithMembership(options)
      return discoverableGroups.value
    } catch (e) {
      error.value = e.message
      console.error('❌ loadDiscoverableGroupsWithMembership:', e)
      return []
    } finally {
      isLoadingDiscoverable.value = false
    }
  }

  /**
   * Écouter groupes découvrables (realtime)
   */
  function watchDiscoverableGroups(limit = 20) {
    // Unsubscribe ancien listener s'il existe
    if (unsubscribeDiscoverable) {
      unsubscribeDiscoverable()
    }

    unsubscribeDiscoverable = streamDiscoverableGroups({ limit }, groups => {
      discoverableGroups.value = groups
    })

    // Retourner fonction pour unsubscribe
    return () => {
      if (unsubscribeDiscoverable) {
        unsubscribeDiscoverable()
        unsubscribeDiscoverable = null
      }
    }
  }

  /**
   * Charger un groupe par ID
   */
  async function loadGroup(groupId) {
    isLoadingGroup.value = true
    error.value = null
    try {
      currentGroup.value = await getGroup(groupId)
      return currentGroup.value
    } catch (e) {
      error.value = e.message
      console.error('❌ loadGroup:', e)
      return null
    } finally {
      isLoadingGroup.value = false
    }
  }

  /**
   * Charger un groupe avec membership
   */
  async function loadGroupWithMembership(groupId) {
    isLoadingGroup.value = true
    error.value = null
    try {
      currentGroup.value = await getGroupWithMembership(groupId)
      return currentGroup.value
    } catch (e) {
      error.value = e.message
      console.error('❌ loadGroupWithMembership:', e)
      return null
    } finally {
      isLoadingGroup.value = false
    }
  }

  /**
   * Écouter un groupe (realtime)
   */
  function watchGroup(groupId) {
    // Unsubscribe ancien listener s'il existe
    if (unsubscribeGroup) {
      unsubscribeGroup()
    }

    unsubscribeGroup = streamGroup(groupId, group => {
      currentGroup.value = group
    })

    // Retourner fonction pour unsubscribe
    return () => {
      if (unsubscribeGroup) {
        unsubscribeGroup()
        unsubscribeGroup = null
      }
    }
  }

  /**
   * Joindre un groupe
   */
  async function join(groupId) {
    isJoiningGroup.value = true
    error.value = null
    try {
      const success = await joinGroup(groupId)
      if (success) {
        // Mettre à jour currentGroup si c'est celui-ci
        if (currentGroup.value && currentGroup.value.id === groupId) {
          currentGroup.value.isMember = true
        }

        // Recharger mes groupes
        await loadMyGroups()
      }
      return success
    } catch (e) {
      error.value = e.message
      console.error('❌ join:', e)
      return false
    } finally {
      isJoiningGroup.value = false
    }
  }

  /**
   * Quitter un groupe
   */
  async function leave(groupId) {
    isLeavingGroup.value = true
    error.value = null
    try {
      const success = await leaveGroup(groupId)
      if (success) {
        // Mettre à jour currentGroup si c'est celui-ci
        if (currentGroup.value && currentGroup.value.id === groupId) {
          currentGroup.value.isMember = false
        }

        // Supprimer de mes groupes
        myGroups.value = myGroups.value.filter(g => g.id !== groupId)
      }
      return success
    } catch (e) {
      error.value = e.message
      console.error('❌ leave:', e)
      return false
    } finally {
      isLeavingGroup.value = false
    }
  }

  /**
   * Vérifier appartenance à un groupe
   */
  async function checkMembership(groupId) {
    try {
      return await isMemberOfGroup(groupId)
    } catch (e) {
      console.error('❌ checkMembership:', e)
      return false
    }
  }

  /**
   * Créer un groupe
   */
  async function createNewGroup(groupData) {
    isCreatingGroup.value = true
    error.value = null
    try {
      const group = new SportGroup(groupData)
      const groupId = await createGroup(group)

      if (groupId) {
        // Recharger mes groupes
        await loadMyGroups()
        return groupId
      }
      return null
    } catch (e) {
      error.value = e.message
      console.error('❌ createNewGroup:', e)
      return null
    } finally {
      isCreatingGroup.value = false
    }
  }

  /**
   * Nettoyer les listeners (à appeler lors du unmount)
   */
  function cleanup() {
    if (unsubscribeDiscoverable) {
      unsubscribeDiscoverable()
      unsubscribeDiscoverable = null
    }
    if (unsubscribeGroup) {
      unsubscribeGroup()
      unsubscribeGroup = null
    }
  }

  // ─── Computed ───

  /**
   * Nombre total de mes groupes
   */
  const myGroupsCount = computed(() => myGroups.value.length)

  /**
   * Vérifier si j'ai des groupes
   */
  const hasMyGroups = computed(() => myGroups.value.length > 0)

  /**
   * Vérifier si groupes découvrables disponibles
   */
  const hasDiscoverableGroups = computed(() => discoverableGroups.value.length > 0)

  /**
   * Est-ce que je suis membre du groupe actuel?
   */
  const isCurrentMember = computed(() => currentGroup.value?.isMember ?? false)

  /**
   * Voir si le groupe actuel charge
   */
  const isCurrentGroupLoading = computed(() => isLoadingGroup.value || !currentGroup.value)

  // ─── Return composable API ───

  return {
    // État
    myGroups,
    discoverableGroups,
    currentGroup,
    isLoadingMyGroups,
    isLoadingDiscoverable,
    isLoadingGroup,
    isJoiningGroup,
    isLeavingGroup,
    isCreatingGroup,
    error,

    // Methodes
    loadMyGroups,
    loadDiscoverableGroups,
    loadDiscoverableGroupsWithMembership,
    watchDiscoverableGroups,
    loadGroup,
    loadGroupWithMembership,
    watchGroup,
    join,
    leave,
    checkMembership,
    createNewGroup,
    cleanup,

    // Computed
    myGroupsCount,
    hasMyGroups,
    hasDiscoverableGroups,
    isCurrentMember,
    isCurrentGroupLoading,
  }
}
