<template>
  <div class="auth-page">
    <div class="auth-bg">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="bg-grid"></div>
    </div>

    <div class="auth-card">
      <div class="auth-logo">
        <div class="logo-mark">💪</div>
        <span class="logo-text">Lift<em>Connect</em></span>
      </div>

      <!-- Success state -->
      <template v-if="sent">
        <div class="success-icon">📬</div>
        <h1 class="auth-title">Email envoyé !</h1>
        <p class="auth-sub">
          Vérifie ta boîte mail à <strong>{{ email }}</strong>.
          Le lien est valable 1 heure.
        </p>
        <RouterLink to="/login" class="btn-auth" style="display:flex;justify-content:center;margin-top:8px">
          Retour à la connexion
        </RouterLink>
      </template>

      <!-- Form state -->
      <template v-else>
        <h1 class="auth-title">Mot de passe oublié</h1>
        <p class="auth-sub">Entre ton email et on t'envoie un lien de réinitialisation.</p>

        <div v-if="authStore.error" class="auth-error">{{ authStore.error }}</div>

        <form class="auth-form" @submit.prevent="handleReset">
          <div class="field">
            <label>Email</label>
            <input v-model="email" type="email" placeholder="ton@email.com" required autocomplete="email" />
          </div>
          <button type="submit" class="btn-auth" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Envoyer le lien</span>
          </button>
        </form>

        <p class="auth-footer">
          <RouterLink to="/login">← Retour à la connexion</RouterLink>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const email   = ref('')
const loading = ref(false)
const sent    = ref(false)

async function handleReset() {
  loading.value = true
  try {
    await authStore.resetPassword(email.value)
    sent.value = true
  } catch {
    // error set in store
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import '@/assets/auth.css';

.success-icon { font-size: 3rem; text-align: center; margin-bottom: 8px; }
</style>
