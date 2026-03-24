import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { workouts as initialWorkouts } from '@/data'

export const useWorkoutsStore = defineStore('workouts', () => {
  const workouts = ref([...initialWorkouts])
  const searchQuery = ref('')
  const typeFilter = ref('all')

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

  return { workouts, searchQuery, typeFilter, filtered, toggleLike }
})
