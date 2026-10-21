export type Role = 'SUPERADMIN' | 'CONTENT_MANAGER' | 'RESEARCHER'

export interface BackendUserProfileData {
  role: Role
  role_display?: string
  phone?: string | null
  institution?: string | null
  created_at?: string
  updated_at?: string
}

export interface UserProfile {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  is_active: boolean
  is_superuser?: boolean
  groups?: string[]
  profile?: BackendUserProfileData
  // Campos aplanados/normalizados para acceso ergonómico en plantillas
  role: Role
  role_display: string
  phone?: string
  institution?: string
  created_at?: string
  updated_at?: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: any
  detail?: string
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
  confirm_password: string
}

export interface UserCreatePayload {
  username: string
  email: string
  password: string
  role: Role
  first_name?: string
  last_name?: string
  phone?: string
  institution?: string
}

export interface UserUpdatePayload {
  email?: string
  role?: Role
  is_active?: boolean
  first_name?: string
  last_name?: string
  phone?: string
  institution?: string
}

export interface UsersListResponse {
  count: number
  next: string | null
  previous: string | null
  results: UserProfile[]
}

/**
 * Normaliza la respuesta del backend (UserSerializer + UserProfileSerializer)
 * para garantizar que `user.role`, `user.role_display`, `user.phone`, etc.,
 * estén disponibles directamente tanto en la raíz como en el objeto `profile`.
 */
export function normalizeUser(raw: any): UserProfile {
  if (!raw) {
    return {
      id: 0,
      username: '',
      email: '',
      is_active: false,
      role: 'CONTENT_MANAGER',
      role_display: 'Gestor de Contenido',
    }
  }

  const profile = raw.profile || {}
  const groups: string[] = raw.groups || []

  // Determinar rol
  let role: Role = profile.role
  if (!role) {
    if (groups.includes('SUPERADMIN') || raw.is_superuser) {
      role = 'SUPERADMIN'
    } else if (groups.includes('RESEARCHER')) {
      role = 'RESEARCHER'
    } else {
      role = 'CONTENT_MANAGER'
    }
  }

  const roleDisplayMap: Record<Role, string> = {
    SUPERADMIN: 'Superadministrador',
    CONTENT_MANAGER: 'Gestor de Contenido',
    RESEARCHER: 'Investigador / Científico',
  }

  return {
    id: raw.id,
    username: raw.username,
    email: raw.email || '',
    first_name: raw.first_name || '',
    last_name: raw.last_name || '',
    is_active: raw.is_active ?? true,
    is_superuser: raw.is_superuser ?? (role === 'SUPERADMIN'),
    groups: groups,
    profile: profile,
    role: role,
    role_display: profile.role_display || roleDisplayMap[role] || role,
    phone: profile.phone || '',
    institution: profile.institution || '',
    created_at: profile.created_at || raw.date_joined || '',
    updated_at: profile.updated_at || '',
  }
}
