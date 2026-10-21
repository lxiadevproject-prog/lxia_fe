<template>
  <div class="public-layout">
    <!-- Navbar Pública -->
    <header class="public-header">
      <div class="header-container">
        <router-link to="/" class="brand-link">
          <div class="brand-badge">LXIA</div>
          <div class="brand-text">
            <span class="brand-title">TransLúcidas</span>
            <span class="brand-subtitle">Portal de Autocuidado & Alexia</span>
          </div>
        </router-link>

        <nav class="nav-links">
          <router-link to="/" class="nav-item">Inicio</router-link>
          <router-link to="/articulos" class="nav-item">Guías de Autocuidado</router-link>
          <router-link to="/recursos" class="nav-item">Recursos</router-link>
          <router-link to="/chat" class="nav-item nav-item--highlight">
            <MessageSquare class="icon-inline" :size="16" />
            Chat con Alexia
          </router-link>
          <router-link to="/alexia" class="nav-item nav-item--avatar">
            <Sparkles class="icon-inline" :size="16" />
            Avatar Interactivo
          </router-link>
        </nav>

        <div class="header-actions">
          <template v-if="authStore.isAuthenticated">
            <router-link to="/admin" class="btn-admin-portal">
              <Shield :size="16" />
              <span>Panel de Gestión</span>
              <span class="role-pill">{{ authStore.userRole }}</span>
            </router-link>
          </template>
          <template v-else>
            <router-link to="/login" class="btn-login">
              <LogIn :size="16" />
              <span>Acceso Equipo</span>
            </router-link>
          </template>
        </div>
      </div>
    </header>

    <!-- Contenido Dinámico de la Página -->
    <main class="public-main">
      <router-view />
    </main>

    <!-- Footer Ciudadano & Emergencias -->
    <footer class="public-footer">
      <div class="footer-container">
        <div class="footer-col">
          <div class="footer-brand">
            <span class="footer-brand-title">LXIA • TransLúcidas</span>
            <p class="footer-brand-desc">
              Plataforma de información integral, acompañamiento psicosocial y asistente conversacional afirmativo
              para personas con identidades y expresiones de género diversas en Colombia.
            </p>
          </div>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">Canales Institucionales 24/7 (Colombia)</h4>
          <ul class="emergency-list">
            <li><strong>Línea 106:</strong> Apoyo emocional y prevención del suicidio.</li>
            <li><strong>Línea 123:</strong> Emergencias nacionales de salud y seguridad.</li>
            <li><strong>Línea Púrpura (018000 112 137):</strong> Violencia basada en género.</li>
            <li><strong>Línea Diversa:</strong> Red Comunitaria Trans y apoyo integral.</li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">Transparencia y Ética</h4>
          <p class="footer-disclaimer">
            Alexia es un asistente conversacional basado en inteligencia artificial y no reemplaza la atención médica,
            psicológica ni el asesoramiento jurídico profesional.
          </p>
          <p class="footer-copy">© 2026 Proyecto TransLúcidas. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { MessageSquare, Sparkles, LogIn, Shield } from 'lucide-vue-next'

const authStore = useAuthStore()
</script>

<style scoped>
.public-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8fafc;
  color: #1e293b;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header */
.public-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e2e8f0;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
}

.brand-badge {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white;
  font-weight: 800;
  font-size: 1.1rem;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.25);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-weight: 700;
  font-size: 1.05rem;
  color: #0f172a;
}

.brand-subtitle {
  font-size: 0.72rem;
  color: #64748b;
}

/* Nav */
.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-item {
  text-decoration: none;
  color: #475569;
  font-size: 0.92rem;
  font-weight: 500;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: #7c3aed;
  background-color: #f5f3ff;
}

.nav-item--highlight {
  color: #7c3aed;
  background-color: #ede9fe;
  font-weight: 600;
}

.nav-item--avatar {
  color: #0284c7;
  background-color: #e0f2fe;
  font-weight: 600;
}

/* Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-login {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #f1f5f9;
  color: #334155;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-login:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-admin-portal {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.role-pill {
  font-size: 0.68rem;
  background: rgba(255, 255, 255, 0.25);
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  text-transform: uppercase;
}

/* Main */
.public-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* Footer */
.public-footer {
  background: #0f172a;
  color: #94a3b8;
  padding: 3rem 1.5rem 2rem;
  border-top: 1px solid #1e293b;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2.5rem;
}

.footer-heading {
  color: #f8fafc;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.85rem;
}

.footer-brand-title {
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
}

.footer-brand-desc,
.footer-disclaimer {
  font-size: 0.85rem;
  line-height: 1.55;
  margin-top: 0.5rem;
}

.emergency-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.emergency-list strong {
  color: #cbd5e1;
}

.footer-copy {
  margin-top: 1rem;
  font-size: 0.78rem;
  color: #64748b;
}

@media (max-width: 850px) {
  .nav-links {
    display: none; /* En móvil se puede añadir menú hamburguesa */
  }
}
</style>
