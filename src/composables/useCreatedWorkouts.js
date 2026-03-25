import { ref, computed } from 'vue'
import { fetchWorkoutsPaginated, fetchWorkoutsCount } from '@/firebase/workouts'

export function useCreatedWorkouts() {
  const workouts = ref([])
  const search = ref('')
  const typeFilter = ref('all')
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref(null)
  const totalWorkouts = ref(0)
  const nextCursor = ref(null)
  const hasMore = ref(false)

  const PAGE_SIZE = 20

  async function loadWorkouts(userId) {
    if (!userId) {
      workouts.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const { workouts: data, nextCursor: cursor, hasMore: more } = await fetchWorkoutsPaginated({
        userId,
        pageSize: PAGE_SIZE,
      })

      workouts.value = data
      nextCursor.value = cursor
      hasMore.value = more

      // Charger le total
      const total = await fetchWorkoutsCount(userId)
      totalWorkouts.value = total
    } catch (e) {
      console.error('❌ loadWorkouts:', e)
      error.value = e.message
      workouts.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadMore(userId) {
    if (!userId || !hasMore.value || loadingMore.value) return

    loadingMore.value = true

    try {
      const { workouts: data, nextCursor: cursor, hasMore: more } = await fetchWorkoutsPaginated({
        userId,
        pageSize: PAGE_SIZE,
        lastVisible: nextCursor.value,
      })

      workouts.value = [...workouts.value, ...data]
      nextCursor.value = cursor
      hasMore.value = more
    } catch (e) {
      console.error('❌ loadMore:', e)
      error.value = e.message
    } finally {
      loadingMore.value = false
    }
  }

  const filteredWorkouts = computed(() => {
    return workouts.value.filter(w => {
      const matchesSearch = w.name.toLowerCase().includes(search.value.toLowerCase())
      const matchesType = typeFilter.value === 'all' || w.type === typeFilter.value
      return matchesSearch && matchesType
    })
  })

  return {
    workouts,
    search,
    typeFilter,
    loading,
    loadingMore,
    error,
    totalWorkouts,
    hasMore,
    filteredWorkouts,
    loadWorkouts,
    loadMore,
  }
}
