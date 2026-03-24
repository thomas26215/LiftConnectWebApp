import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, googleProvider } from '@/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(null)
  const loading = ref(true)   // true pendant que Firebase vérifie la session
  const error   = ref(null)

  const isLoggedIn  = computed(() => !!user.value)
  const displayName = computed(() => user.value?.displayName || user.value?.email?.split('@')[0] || 'Athlète')
  const initials    = computed(() => {
    const name = user.value?.displayName || user.value?.email || 'A'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  })

  // ── Écoute les changements de session Firebase ──────────────
  function init() {
    return new Promise(resolve => {
      onAuthStateChanged(auth, (firebaseUser) => {
        user.value    = firebaseUser
        loading.value = false
        resolve(firebaseUser)
      })
    })
  }

  // ── Inscription ──────────────────────────────────────────────
  async function register(email, password, name) {
    error.value = null
    try {
      const { user: u } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(u, { displayName: name })
      user.value = { ...u, displayName: name }
    } catch (e) {
      error.value = formatError(e.code)
      throw e
    }
  }

  // ── Connexion email/password ─────────────────────────────────
  async function login(email, password) {
    error.value = null
    try {
      const { user: u } = await signInWithEmailAndPassword(auth, email, password)
      user.value = u
    } catch (e) {
      error.value = formatError(e.code)
      throw e
    }
  }

  // ── Connexion Google ─────────────────────────────────────────
  async function loginWithGoogle() {
    error.value = null
    try {
      const { user: u } = await signInWithPopup(auth, googleProvider)
      user.value = u
    } catch (e) {
      error.value = formatError(e.code)
      throw e
    }
  }

  // ── Mot de passe oublié ──────────────────────────────────────
  async function resetPassword(email) {
    error.value = null
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (e) {
      error.value = formatError(e.code)
      throw e
    }
  }

  // ── Déconnexion ──────────────────────────────────────────────
  async function logout() {
    await signOut(auth)
    user.value = null
  }

  // ── Messages d'erreur FR ─────────────────────────────────────
  function formatError(code) {
    const map = {
      'auth/email-already-in-use':    'Cette adresse email est déjà utilisée.',
      'auth/invalid-email':           'Adresse email invalide.',
      'auth/weak-password':           'Le mot de passe doit contenir au moins 6 caractères.',
      'auth/user-not-found':          'Aucun compte trouvé avec cet email.',
      'auth/wrong-password':          'Mot de passe incorrect.',
      'auth/invalid-credential':      'Email ou mot de passe incorrect.',
      'auth/too-many-requests':       'Trop de tentatives. Réessaie plus tard.',
      'auth/popup-closed-by-user':    'Connexion Google annulée.',
      'auth/network-request-failed':  'Erreur réseau. Vérifie ta connexion.',
    }
    return map[code] || 'Une erreur est survenue. Réessaie.'
  }

  return {
    user, loading, error,
    isLoggedIn, displayName, initials,
    init, register, login, loginWithGoogle, resetPassword, logout,
  }
})
