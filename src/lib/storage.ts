import type { UserProfile } from '@/types/auth'

const TOKEN_KEY = 'access_token'
const USER_KEY = 'user_profile'
const CHAT_SESSION_KEY = 'lxia_chat_session_id'

export class StorageService {
  // --- Token de Autenticación (LocalStorage) ---
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  }

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch (e) {
      console.error('Error guardando token en storage:', e)
    }
  }

  removeToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch (e) {
      console.error('Error eliminando token de storage:', e)
    }
  }

  // --- Perfil del Usuario (LocalStorage) ---
  getUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(USER_KEY)
      return data ? (JSON.parse(data) as UserProfile) : null
    } catch {
      return null
    }
  }

  setUser(user: UserProfile): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (e) {
      console.error('Error guardando perfil de usuario:', e)
    }
  }

  removeUser(): void {
    try {
      localStorage.removeItem(USER_KEY)
    } catch (e) {
      console.error('Error eliminando perfil de usuario:', e)
    }
  }

  // --- Sesión Anónima de Chat RAG (SessionStorage) ---
  getChatSessionId(): string | null {
    try {
      return sessionStorage.getItem(CHAT_SESSION_KEY)
    } catch {
      return null
    }
  }

  setChatSessionId(sessionId: string): void {
    try {
      sessionStorage.setItem(CHAT_SESSION_KEY, sessionId)
    } catch (e) {
      console.error('Error guardando session_id de chat:', e)
    }
  }

  clearChatSession(): void {
    try {
      sessionStorage.removeItem(CHAT_SESSION_KEY)
    } catch (e) {
      console.error('Error limpiando sesión de chat:', e)
    }
  }

  // Limpiar sesión de autenticación completa
  clearAuth(): void {
    this.removeToken()
    this.removeUser()
  }
}

export const storage = new StorageService()
export default storage
