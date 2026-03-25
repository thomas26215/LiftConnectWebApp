import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchSessionsPaginated, mapSessionDoc } from '@/firebase/sessions'

export const useWorkoutsStore = defineStore('workouts', () => {
  const workouts = ref([])
  const searchQuery = ref('')
  const typeFilter = ref('all')
  const loading = ref(false)
  const error = ref(null)

  function sortWorkouts() {
    workouts.value = [...workouts.value].sort((a, b) => {
      const bt = b.createdAt?.getTime?.() || 0
      const at = a.createdAt?.getTime?.() || 0
      return bt - at
    })
  }

  function upsertWorkout(workout) {
    if (!workout?.id) return
    const index = workouts.value.findIndex(item => item.id === workout.id)
    if (index === -1) {
      workouts.value = [...workouts.value, workout]
      sortWorkouts()
      return
    }

    const existing = workouts.value[index]
    workouts.value[index] = {
      ...workout,
      liked: existing.liked ?? workout.liked,
      likes: existing.likes ?? workout.likes,
    }
    sortWorkouts()
  }

  function removeWorkoutById(id) {
    workouts.value = workouts.value.filter(item => item.id !== id)
  }

  function applyRealtimeSessionChange(change, source = 'sessions') {
    if (!change?.doc?.id) return
    const sessionId = `${source}:${change.doc.id}`

    if (change.type === 'removed') {
      removeWorkoutById(sessionId)
      return
    }

    upsertWorkout(mapSessionDoc(change.doc, source))
  }

  async function loadWorkouts(userId) {
    if (!userId) {
      workouts.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const { sessions } = await fetchSessionsPaginated({ userId })
      workouts.value = sessions
      sortWorkouts()
    } catch (e) {
      error.value = e
      workouts.value = []
    } finally {
      loading.value = false
    }
  }

  const filtered = computed(() => {
    return workouts.value.filter(w => {
      const matchesSearch = w.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesType = typeFilter.value === 'all' || w.type === typeFilter.value
      return matchesSearch && matchesType
    })
  })

  function toggleLike(id) {
    const w = workouts.value.find(w => w.id === id)
    if (w) w.likes += w.liked ? -1 : 1, w.liked = !w.liked
  }

  return {
    workouts,
    searchQuery,
    typeFilter,
    loading,
    error,
    filtered,
    loadWorkouts,
    applyRealtimeSessionChange,
    toggleLike,
  }
})
