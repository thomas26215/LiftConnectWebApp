import { defineStore } from 'pinia'
import { ref } from 'vue'
import { feedPosts as initial } from '@/data'

export const useFeedStore = defineStore('feed', () => {
  const posts = ref(initial.map(p => ({ ...p })))

  function toggleLike(id) {
    const p = posts.value.find(p => p.id === id)
    if (!p) return
    p.liked = !p.liked
    p.likes += p.liked ? 1 : -1
  }

  return { posts, toggleLike }
})
