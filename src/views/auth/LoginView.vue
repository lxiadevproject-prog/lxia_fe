<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">
          <span>LX</span>
        </div>
        <h2 class="login-title">Acceso Institucional</h2>
        <p class="login-subtitle">Gestión del Asistente Alexia, CMS y Analítica RAG</p>
      </div>

      <!-- Alerta de Error -->
      <div v-if="authStore.error" class="login-error-banner" role="alert">
        <AlertCircle :size="18" class="error-icon" />
        <span>{{ authStore.error }}</span>
      </div>

      <!-- Formulario de Inicio de Sesión -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username" class="form-label">Usuario institucional</label>
          <div class="input-wrapper">
            <User :size="18" class="input-icon" />
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              autocomplete="username"
              placeholder="Ej: admin o gestor_contenido"
              class="form-input"
              :disabled="authStore.loading"
            />
          </div>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label for="password" class="form-label">Contraseña</label>
          </div>
          <div class="input-wrapper">
            <Lock :size="18" class="input-icon" />
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              placeholder="••••••••••••"
              class="form-input"
              :disabled="authStore.loading"
            />
            <button
              type="button"
              class="btn-toggle-eye"
              :title="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="16" />
              <Eye v-else :size="16" />
            </button>
          </div>
        </div>

        <button type="submit" class="btn-submit" :disabled="authStore.loading">
          <span v-if="authStore.loading" class="spinner"></span>
          <span v-else class="btn-content">
            <span>Iniciar Sesión</span>
            <ArrowRight :size="18" />
          </span>
        </button>
      </form>

      <!-- Tarjeta rápida de prueba de credenciales -->
      <div class="demo-card">
        <div class="demo-header">
          <Sparkles :size="15" class="demo-icon" />
          <span class="demo-title">Acceso rápido para evaluación</span>
        </div>
        <p class="demo-desc">
          Credencial Superadmin precargada en el entorno local de desarrollo:
        </p>
        <button type="button" class="btn-demo-autofill" @click="fillSuperadmin">
          <span>Autocompletar como Superadmin (admin)</span>
        </button>
      </div>

      <div class="login-footer">
        <router-link to="/" class="back-link">
          &larr; Volver al Portal de Autocuidado
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { User, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles } from '@lucide/vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const showPassword = ref(false)
const form = reactive({
  username: '',
  password: '',
})

function fillSuperadmin() {
  form.username = 'admin'
  form.password = 'AdminPassword2026!'
}

async function handleLogin() {
  if (!form.username || !form.password) return
  const success = await authStore.login(form)
  if (success) {
    const redirectPath = (route.query.redirect as string) || '/admin'
    router.push(redirectPath)
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 15% 20%, #f3e8ff 0%, #f8fafc 55%, #e0e7ff 100%);
  padding: 1.5rem;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  padding: 2.75rem 2.25rem;
  border-radius: 24px;
  box-shadow: 0 20px 40px -15px rgba(124, 58, 237, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-logo {
  width: 56px;
  height: 56px;
  margin: 0 auto 1.25rem;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white;
  font-size: 1.5rem;
  font-weight: 800;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(124, 58, 237, 0.35);
}

.login-title {
  font-size: 1.55rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin-bottom: 0.35rem;
}

.login-subtitle {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.4;
}

.login-error-banner {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
}

.error-icon {
  flex-shrink: 0;
  color: #dc2626;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.95rem;
  color: #94a3b8;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 0.8rem 2.6rem 0.8rem 2.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  transition: all 0.2s ease;
}

.form-input:focus {
  background: #ffffff;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.btn-toggle-eye {
  position: absolute;
  right: 0.85rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 0.35rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.btn-toggle-eye:hover {
  color: #475569;
}

.btn-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white;
  border: none;
  padding: 0.9rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.4rem;
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3);
  transition: all 0.2s;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.demo-card {
  margin-top: 1.75rem;
  padding: 1.1rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
}

.demo-header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #7c3aed;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
}

.demo-desc {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.75rem;
  line-height: 1.35;
}

.btn-demo-autofill {
  width: 100%;
  padding: 0.55rem 0.85rem;
  background: #ede9fe;
  color: #6d28d9;
  border: 1px solid #ddd6fe;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-demo-autofill:hover {
  background: #e4d4ff;
  border-color: #c4b5fd;
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
}

.back-link {
  color: #64748b;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
  transition: color 0.15s;
}

.back-link:hover {
  color: #7c3aed;
}
</style>
