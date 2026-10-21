<template>
  <div class="profile-view">
    <div class="profile-header">
      <div class="avatar-big" :class="'avatar-' + authStore.user?.role?.toLowerCase()">
        {{ initials }}
      </div>
      <div class="header-info">
        <div class="title-row">
          <h2 class="user-fullname">{{ authStore.displayName || 'Usuario LXIA' }}</h2>
          <span class="role-pill" :class="'role-' + authStore.user?.role?.toLowerCase()">
            {{ authStore.userRoleDisplay || authStore.userRole }}
          </span>
        </div>
        <p class="user-username">@{{ authStore.user?.username }}</p>
      </div>
    </div>

    <!-- Pestañas de Perfil / Seguridad -->
    <div class="tabs-nav">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'info' }"
        @click="activeTab = 'info'"
      >
        <User :size="16" />
        <span>Datos Personales</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'password' }"
        @click="activeTab = 'password'"
      >
        <KeyRound :size="16" />
        <span>Cambiar Contraseña</span>
      </button>
    </div>

    <!-- PESTAÑA 1: Datos Personales -->
    <div v-if="activeTab === 'info'" class="tab-card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Información de la Cuenta</h3>
          <p class="card-desc">Actualiza tus nombres de presentación, institución y datos de contacto.</p>
        </div>
      </div>

      <div v-if="profileSuccessMsg" class="alert-banner alert-banner--success">
        <CheckCircle2 :size="18" />
        <span>{{ profileSuccessMsg }}</span>
      </div>

      <div v-if="profileErrorMsg" class="alert-banner alert-banner--error">
        <XCircle :size="18" />
        <span>{{ profileErrorMsg }}</span>
      </div>

      <form @submit.prevent="handleUpdateProfile" class="profile-form">
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Nombre de Usuario</label>
            <input
              :value="authStore.user?.username"
              type="text"
              disabled
              class="form-input form-input--disabled"
            />
            <span class="input-hint">El nombre de usuario institucional no puede ser modificado.</span>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Correo Electrónico</label>
            <input
              v-model="profileForm.email"
              type="email"
              placeholder="correo@ejemplo.org"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Nombres</label>
            <input
              v-model="profileForm.first_name"
              type="text"
              placeholder="Ej: Sofia"
              class="form-input"
            />
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Apellidos</label>
            <input
              v-model="profileForm.last_name"
              type="text"
              placeholder="Ej: Gómez"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Institución u Organización</label>
            <input
              v-model="profileForm.institution"
              type="text"
              placeholder="Ej: Red TransLúcidas / Hospital / Universidad"
              class="form-input"
            />
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Teléfono de Contacto</label>
            <input
              v-model="profileForm.phone"
              type="text"
              placeholder="Ej: +57 312 345 6789"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="profileLoading">
            <span v-if="profileLoading" class="spinner-small"></span>
            <span>{{ profileLoading ? 'Guardando...' : 'Guardar Cambios' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- PESTAÑA 2: Cambiar Contraseña -->
    <div v-if="activeTab === 'password'" class="tab-card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Seguridad y Acceso</h3>
          <p class="card-desc">Actualiza tu contraseña periódicamente para proteger los datos institucionales.</p>
        </div>
      </div>

      <div v-if="passwordSuccessMsg" class="alert-banner alert-banner--success">
        <CheckCircle2 :size="18" />
        <span>{{ passwordSuccessMsg }}</span>
      </div>

      <div v-if="passwordErrorMsg" class="alert-banner alert-banner--error">
        <XCircle :size="18" />
        <span>{{ passwordErrorMsg }}</span>
      </div>

      <form @submit.prevent="handleChangePassword" class="profile-form">
        <div class="form-group">
          <label class="form-label">Contraseña Actual *</label>
          <div class="input-with-toggle">
            <input
              v-model="passwordForm.old_password"
              :type="showOld ? 'text' : 'password'"
              required
              class="form-input"
              placeholder="••••••••••••"
            />
            <button type="button" class="btn-eye" @click="showOld = !showOld">
              <EyeOff v-if="showOld" :size="16" />
              <Eye v-else :size="16" />
            </button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Nueva Contraseña (mínimo 8 caracteres) *</label>
            <div class="input-with-toggle">
              <input
                v-model="passwordForm.new_password"
                :type="showNew ? 'text' : 'password'"
                required
                minlength="8"
                class="form-input"
                placeholder="Nueva clave segura"
              />
              <button type="button" class="btn-eye" @click="showNew = !showNew">
                <EyeOff v-if="showNew" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Confirmar Nueva Contraseña *</label>
            <div class="input-with-toggle">
              <input
                v-model="passwordForm.confirm_password"
                :type="showConfirm ? 'text' : 'password'"
                required
                minlength="8"
                class="form-input"
                placeholder="Repite la nueva clave"
              />
              <button type="button" class="btn-eye" @click="showConfirm = !showConfirm">
                <EyeOff v-if="showConfirm" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="passwordLoading">
            <span v-if="passwordLoading" class="spinner-small"></span>
            <span>{{ passwordLoading ? 'Actualizando...' : 'Actualizar Contraseña' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { User, KeyRound, CheckCircle2, XCircle, Eye, EyeOff } from '@lucide/vue'

const authStore = useAuthStore()

const activeTab = ref<'info' | 'password'>('info')

// Datos de perfil
const profileLoading = ref(false)
const profileSuccessMsg = ref('')
const profileErrorMsg = ref('')

const profileForm = reactive({
  first_name: authStore.user?.first_name || '',
  last_name: authStore.user?.last_name || '',
  email: authStore.user?.email || '',
  phone: authStore.user?.phone || '',
  institution: authStore.user?.institution || '',
})

// Sincronizar si cambia authStore.user
watch(
  () => authStore.user,
  (u) => {
    if (u) {
      profileForm.first_name = u.first_name || ''
      profileForm.last_name = u.last_name || ''
      profileForm.email = u.email || ''
      profileForm.phone = u.phone || ''
      profileForm.institution = u.institution || ''
    }
  },
  { immediate: true }
)

// Datos de cambio de contraseña
const passwordLoading = ref(false)
const passwordSuccessMsg = ref('')
const passwordErrorMsg = ref('')
const showOld = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const initials = computed(() => {
  const u = authStore.user
  if (!u) return 'LX'
  if (u.first_name && u.last_name) {
    return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase()
  }
  return u.username.slice(0, 2).toUpperCase()
})

async function handleUpdateProfile() {
  profileLoading.value = true
  profileSuccessMsg.value = ''
  profileErrorMsg.value = ''

  const success = await authStore.updateProfile(profileForm)
  if (success) {
    profileSuccessMsg.value = 'Información del perfil actualizada exitosamente.'
  } else {
    profileErrorMsg.value = authStore.error || 'Error al actualizar el perfil.'
  }
  profileLoading.value = false
}

async function handleChangePassword() {
  passwordSuccessMsg.value = ''
  passwordErrorMsg.value = ''

  if (passwordForm.new_password !== passwordForm.confirm_password) {
    passwordErrorMsg.value = 'La confirmación de la contraseña no coincide con la nueva contraseña.'
    return
  }

  if (passwordForm.new_password.length < 8) {
    passwordErrorMsg.value = 'La nueva contraseña debe contener al menos 8 caracteres.'
    return
  }

  passwordLoading.value = true
  const success = await authStore.changePassword(passwordForm)
  if (success) {
    passwordSuccessMsg.value = 'Contraseña actualizada correctamente.'
    passwordForm.old_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''
  } else {
    passwordErrorMsg.value = authStore.error || 'No fue posible cambiar la contraseña.'
  }
  passwordLoading.value = false
}
</script>

<style scoped>
.profile-view {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-header {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 1.75rem 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.avatar-big {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  flex-shrink: 0;
}

.avatar-superadmin { background: #ede9fe; color: #6d28d9; }
.avatar-content_manager { background: #e0f2fe; color: #0284c7; }
.avatar-researcher { background: #fef3c7; color: #b45309; }

.header-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.user-fullname {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
}

.role-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.role-superadmin { background: #ede9fe; color: #6d28d9; }
.role-content_manager { background: #e0f2fe; color: #0284c7; }
.role-researcher { background: #fef3c7; color: #b45309; }

.user-username {
  font-size: 0.9rem;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

/* Tabs */
.tabs-nav {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.25rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.15rem;
  background: transparent;
  border: none;
  font-size: 0.92rem;
  font-weight: 600;
  color: #64748b;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.tab-btn.active {
  color: #7c3aed;
  background: #ede9fe;
}

/* Card */
.tab-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-header {
  margin-bottom: 1.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.card-desc {
  font-size: 0.88rem;
  color: #64748b;
  margin-top: 0.2rem;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.form-input {
  padding: 0.75rem 0.95rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.92rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.2s;
}

.form-input:focus {
  background: white;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.form-input--disabled {
  background: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

.input-hint {
  font-size: 0.75rem;
  color: #94a3b8;
}

.input-with-toggle {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-toggle input {
  width: 100%;
  padding-right: 2.5rem;
}

.btn-eye {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #7c3aed;
  color: white;
  border: none;
  padding: 0.75rem 1.4rem;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #6d28d9;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.alert-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.15rem;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 500;
  margin-bottom: 1.25rem;
}

.alert-banner--success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}

.alert-banner--error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 1.15rem;
  }
}
</style>
