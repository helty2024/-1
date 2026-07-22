import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getCurrentAdmin, loginAdmin, type AdminUser } from '../api/auth'

const TOKEN_KEY = 'admin_access_token'
const USER_KEY = 'admin_user'

function readStoredUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminUser
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) ?? '')
  const user = ref<AdminUser | null>(readStoredUser())
  const isAuthenticated = computed(() => Boolean(token.value))

  async function login(username: string, password: string) {
    const result = await loginAdmin({ username, password })
    token.value = result.accessToken
    user.value = result.user
    localStorage.setItem(TOKEN_KEY, result.accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(result.user))
  }

  async function refreshUser() {
    if (!token.value) return
    user.value = await getCurrentAdmin()
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, user, isAuthenticated, login, refreshUser, logout }
})
