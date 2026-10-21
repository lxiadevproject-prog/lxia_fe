import http from '@/lib/http'
import {
  type LoginPayload,
  type LoginResponse,
  type ChangePasswordPayload,
  type UserProfile,
  type UserCreatePayload,
  type UserUpdatePayload,
  type UsersListResponse,
  normalizeUser,
} from '@/types/auth'

export class AuthService {
  /**
   * Inicia sesión con credenciales institucionales.
   * Retorna token y perfil de usuario normalizado.
   */
  async login(payload: LoginPayload): Promise<{ token: string; user: UserProfile }> {
    const res = await http.post<LoginResponse>('/api/v1/auth/login/', payload)
    if (!res || !res.token) {
      throw new Error('Respuesta de autenticación inválida del servidor.')
    }
    return {
      token: res.token,
      user: normalizeUser(res.user),
    }
  }

  /**
   * Cierra sesión e invalida el token activo en el backend.
   */
  async logout(): Promise<void> {
    await http.post('/api/v1/auth/logout/')
  }

  /**
   * Obtiene la información del usuario en sesión activa.
   */
  async getMe(): Promise<UserProfile> {
    const res = await http.get<any>('/api/v1/auth/me/')
    return normalizeUser(res)
  }

  /**
   * Cambia la contraseña del usuario en sesión.
   */
  async changePassword(payload: ChangePasswordPayload): Promise<{ detail: string }> {
    const res = await http.post<{ detail: string }>('/api/v1/auth/change-password/', payload)
    return res
  }

  /**
   * Lista usuarios con soporte para búsqueda, filtros y paginación.
   * Solo disponible para SUPERADMIN.
   */
  async getUsers(params?: {
    search?: string
    role?: string
    is_active?: boolean
    page?: number
  }): Promise<{ count: number; results: UserProfile[] }> {
    const res = await http.get<UsersListResponse | any[]>('/api/v1/auth/users/', { params })
    
    // Si la respuesta es directamente un array o un objeto paginado de DRF
    if (Array.isArray(res)) {
      return {
        count: res.length,
        results: res.map(normalizeUser),
      }
    }

    const results = (res?.results || []).map(normalizeUser)
    return {
      count: res?.count ?? results.length,
      results,
    }
  }

  /**
   * Obtiene el detalle de un usuario por su ID.
   */
  async getUser(id: number): Promise<UserProfile> {
    const res = await http.get<any>(`/api/v1/auth/users/${id}/`)
    return normalizeUser(res)
  }

  /**
   * Crea un nuevo usuario administrativo con rol RBAC asignado.
   */
  async createUser(payload: UserCreatePayload): Promise<UserProfile> {
    const res = await http.post<any>('/api/v1/auth/users/', payload)
    return normalizeUser(res)
  }

  /**
   * Actualiza datos de un usuario existente.
   */
  async updateUser(id: number, payload: UserUpdatePayload): Promise<UserProfile> {
    const res = await http.patch<any>(`/api/v1/auth/users/${id}/`, payload)
    return normalizeUser(res)
  }

  /**
   * Elimina un usuario del sistema (prohibido eliminarse a sí mismo).
   */
  async deleteUser(id: number): Promise<void> {
    await http.delete(`/api/v1/auth/users/${id}/`)
  }

  /**
   * Activa o desactiva la cuenta de un usuario.
   */
  async toggleUserStatus(id: number, isActive: boolean): Promise<UserProfile> {
    const res = await http.patch<any>(`/api/v1/auth/users/${id}/`, { is_active: isActive })
    return normalizeUser(res)
  }
}

export const authService = new AuthService()
export default authService
