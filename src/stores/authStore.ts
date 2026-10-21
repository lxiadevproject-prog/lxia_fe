import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import storage from '@/lib/storage'
import authService from '@/services/authService'
import type { UserProfile, LoginPayload, ChangePasswordPayload, UserUpdatePayload } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(storage.getToken())
  const user = ref<UserProfile | null>(storage.getUser())
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // --- Getters / Computadas ---
  const isAuthenticated = computed(() => !!token.value)
  const isSuperadmin = computed(
    () => user.value?.role === 'SUPERADMIN' || !!user.value?.is_superuser
  )
  const isContentManager = computed(
    () => user.value?.role === 'CONTENT_MANAGER' || isSuperadmin.value
  )
  const isResearcher = computed(
    () => user.value?.role === 'RESEARCHER' || isSuperadmin.value
  )
  const userRole = computed(() => user.value?.role || null)
  const userRoleDisplay = computed(() => user.value?.role_display || userRole.value || '')
  
  const displayName = computed(() => {
    if (!user.value) return ''
    if (user.value.first_name) {
      return `${user.value.first_name} ${user.value.last_name || ''}`.trim()
    }
    return user.value.username
  })

  // --- Acciones ---

  async function login(payload: LoginPayload): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const response = await authService.login(payload)
      token.value = response.token
      user.value = response.user
      storage.setToken(response.token)
      storage.setUser(response.user)
      return true
    } catch (err: any) {
      error.value = err.message || 'Error al iniciar sesión'
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchMe(): Promise<UserProfile | null> {
    if (!token.value) return null
    try {
      const profile = await authService.getMe()
      user.value = profile
      storage.setUser(profile)
      return profile
    } catch (err) {
      console.warn('Error al sincronizar perfil con backend:', err)
      return null
    }
  }

  async function logout(): Promise<void> {
    loading.value = true
    try {
      await authService.logout()
    } catch (err) {
      console.warn('Error al invalidar token en backend:', err)
    } finally {
      token.value = null
      user.value = null
      storage.clearAuth()
      loading.value = false
    }
  }

  async function changePassword(payload: ChangePasswordPayload): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await authService.changePassword(payload)
      return true
    } catch (err: any) {
      error.value = err.message || 'Error al cambiar la contraseña'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(payload: UserUpdatePayload): Promise<boolean> {
    if (!user.value?.id) return false
    loading.value = true
    error.value = null
    try {
      const updated = await authService.updateUser(user.value.id, payload)
      user.value = updated
      storage.setUser(updated)
      return true
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar perfil'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    isSuperadmin,
    isContentManager,
    isResearcher,
    userRole,
    userRoleDisplay,
    displayName,
    login,
    fetchMe,
    logout,
    changePassword,
    updateProfile,
  }
})
