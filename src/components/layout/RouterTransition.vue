<template>
  <div class="router-view-container">
    <router-view v-slot="{ Component }">
      <transition name="page-transition" mode="out-in">
        <component :is="Component" :key="$route.fullPath" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.router-view-container {
  width: 100%;
  height: 100%;
}

.page-transition-enter-active {
  animation: fade-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-transition-leave-active {
  animation: fade-up 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse;
}
</style>
