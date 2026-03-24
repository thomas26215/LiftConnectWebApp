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

      <h1 class="auth-title">Crée ton compte</h1>
      <p class="auth-sub">Rejoins des milliers d'athlètes sur LiftConnect.</p>

      <div v-if="authStore.error" class="auth-error">{{ authStore.error }}</div>

      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="field">
          <label>Prénom &amp; Nom</label>
          <input v-model="name" type="text" placeholder="Thomas Venouil" required autocomplete="name" />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="ton@email.com" required autocomplete="email" />
        </div>
        <div class="field">
          <label>Mot de passe</label>
          <div class="input-wrap">
            <input
              v-model="password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="6 caractères minimum"
              required
              minlength="6"
              autocomplete="new-password"
            />
            <button type="button" class="pwd-toggle" @click="showPwd = !showPwd">
              {{ showPwd ? '🙈' : '👁' }}
            </button>
          </div>
        </div>
        <div class="field">
          <label>Confirmer le mot de passe</label>
          <input
            v-model="confirm"
            :type="showPwd ? 'text' : 'password'"
            placeholder="••••••••"
            required
            autocomplete="new-password"
          />
          <span v-if="confirm && password !== confirm" class="field-error">Les mots de passe ne correspondent pas.</span>
        </div>

        <button type="submit" class="btn-auth" :disabled="loading || (confirm && password !== confirm)">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Créer mon compte</span>
        </button>
      </form>

      <div class="divider"><span>ou</span></div>

      <button class="btn-google" :disabled="loading" @click="handleGoogle">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continuer avec Google
      </button>

      <p class="auth-footer">
        Déjà un compte ?
        <RouterLink to="/login">Se connecter</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router    = useRouter()

const name     = ref('')
const email    = ref('')
const password = ref('')
const confirm  = ref('')
const showPwd  = ref(false)
const loading  = ref(false)

async function handleRegister() {
  if (password.value !== confirm.value) return
  loading.value = true
  try {
    await authStore.register(email.value, password.value, name.value)
    router.push('/dashboard')
  } catch {
    // error already set in store
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  loading.value = true
  try {
    await authStore.loginWithGoogle()
    router.push('/dashboard')
  } catch {
    // error already set in store
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import '@/assets/auth.css';
</style>
