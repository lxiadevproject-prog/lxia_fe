<template>
  <div class="article-detail-view">
    <!-- Estado de Carga -->
    <div v-if="loading" class="state-container">
      <div class="spinner"></div>
      <p>Cargando contenido del artículo...</p>
    </div>

    <!-- Error / No Encontrado -->
    <div v-else-if="!article" class="state-container">
      <AlertTriangle :size="48" class="error-icon" />
      <h2 class="state-title">Artículo no encontrado</h2>
      <p class="state-desc">El artículo solicitado no existe o no se encuentra publicado.</p>
      <router-link to="/articulos" class="btn-primary">
        &larr; Volver a las guías
      </router-link>
    </div>

    <!-- Contenido del Artículo -->
    <article v-else class="article-container">
      <!-- Barra superior de navegación y categoría -->
      <div class="top-nav-bar">
        <router-link to="/articulos" class="btn-back">
          <ArrowLeft :size="16" />
          <span>Volver al catálogo de guías</span>
        </router-link>

        <span class="category-pill">
          {{ categoryName }}
        </span>
      </div>

      <!-- Título Principal -->
      <h1 class="article-title">{{ article.title }}</h1>

      <!-- Resumen Destacado (Lead) -->
      <div class="article-summary-lead">
        {{ article.summary }}
      </div>

      <!-- Metadatos de Publicación -->
      <div class="article-meta-bar">
        <div class="meta-item">
          <User :size="15" />
          <span>{{ article.author_name || 'Equipo TransLúcidas' }}</span>
        </div>
        <span class="meta-sep">•</span>
        <div class="meta-item">
          <Calendar :size="15" />
          <span>{{ formattedDate }}</span>
        </div>
        <span class="meta-sep">•</span>
        <div class="meta-item">
          <Clock :size="15" />
          <span>{{ article.reading_time_minutes }} min de lectura</span>
        </div>
        <span class="meta-sep">•</span>
        <div class="meta-item">
          <Eye :size="15" />
          <span>{{ article.views_count }} lecturas</span>
        </div>

        <button class="btn-share" :title="copied ? '¡Enlace copiado!' : 'Copiar enlace del artículo'" @click="copyLink">
          <Check v-if="copied" :size="15" class="icon-copied" />
          <Share2 v-else :size="15" />
          <span>{{ copied ? 'Copiado' : 'Compartir' }}</span>
        </button>
      </div>

      <!-- Imagen Destacada si existe -->
      <div v-if="article.featured_image" class="featured-image-wrapper">
        <img :src="article.featured_image" :alt="article.title" class="featured-image" />
      </div>

      <!-- Cuerpo del Artículo -->
      <div class="article-content" v-html="parsedBody"></div>

      <!-- Llamado de Acción / Chat con Alexia sobre este tema -->
      <div class="alexia-cta-box">
        <div class="cta-icon">
          <Sparkles :size="24" />
        </div>
        <div class="cta-content">
          <h4 class="cta-title">¿Tienes preguntas adicionales sobre este tema?</h4>
          <p class="cta-desc">
            Consulta a nuestra asistente virtual Alexia para recibir orientación afirmativa, confidencial y fundamentada.
          </p>
        </div>
        <router-link to="/chat" class="btn-ask-alexia">
          <span>Preguntar a Alexia</span>
          <ArrowRight :size="16" />
        </router-link>
      </div>

      <!-- Recordatorio de Atención en Crisis -->
      <div class="crisis-reminder-box">
        <ShieldAlert :size="20" class="crisis-icon" />
        <div class="crisis-text">
          <strong>Línea de Ayuda y Soporte Inmediato:</strong>
          <span> Si estás atravesando una emergencia emocional o requieres auxilio urgente, marca sin costo al <strong>106</strong> o al <strong>123</strong>.</span>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import contentService from '@/services/contentService'
import type { Article } from '@/types/content'
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Eye,
  Share2,
  Check,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
} from '@lucide/vue'

const route = useRoute()
const article = ref<Article | null>(null)
const loading = ref(true)
const copied = ref(false)

const categoryName = computed(() => {
  if (!article.value) return 'Autocuidado'
  if (typeof article.value.category === 'object' && article.value.category !== null) {
    return article.value.category.name
  }
  return article.value.category_name || 'Autocuidado'
})

const formattedDate = computed(() => {
  if (!article.value?.published_at) return 'Reciente'
  try {
    return new Date(article.value.published_at).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return 'Reciente'
  }
})

const parsedBody = computed(() => {
  if (!article.value?.body) return ''
  const raw = article.value.body

  // Formateador limpio de Markdown liviano
  return raw
    .split('\n\n')
    .map((paragraph) => {
      let trimmed = paragraph.trim()
      if (!trimmed) return ''

      // Títulos Markdown H3 / H4
      if (trimmed.startsWith('### ')) {
        return `<h3 class="content-h3">${trimmed.substring(4)}</h3>`
      }
      if (trimmed.startsWith('## ')) {
        return `<h2 class="content-h2">${trimmed.substring(3)}</h2>`
      }
      // Listas
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed
          .split('\n')
          .map((item) => `<li>${item.replace(/^[-*]\s+/, '')}</li>`)
          .join('')
        return `<ul class="content-list">${items}</ul>`
      }
      // Párrafos regulares con negritas
      const withBold = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return `<p class="content-p">${withBold}</p>`
    })
    .join('')
})

async function fetchArticleDetail() {
  const slug = route.params.slug as string
  if (!slug) return

  loading.value = true
  try {
    // Al consultar este endpoint, el backend automáticamente incrementa el contador views_count
    const res = await contentService.getPublicArticleDetail(slug)
    article.value = res
  } catch (err) {
    console.error('Error cargando detalle del artículo:', err)
  } finally {
    loading.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2500)
  } catch {
    // fallback
  }
}

onMounted(() => {
  fetchArticleDetail()
})
</script>

<style scoped>
.article-detail-view {
  max-width: 820px;
  margin: 0 auto;
  padding-bottom: 4rem;
}

.article-container {
  background: white;
  padding: 3rem 2.75rem;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.04);
}

.top-nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.15s;
}

.btn-back:hover {
  color: #7c3aed;
}

.category-pill {
  font-size: 0.75rem;
  font-weight: 700;
  color: #7c3aed;
  background: #ede9fe;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  text-transform: uppercase;
}

.article-title {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
  color: #0f172a;
  letter-spacing: -0.025em;
  margin-bottom: 1.25rem;
}

.article-summary-lead {
  font-size: 1.2rem;
  line-height: 1.6;
  color: #475569;
  font-weight: 500;
  margin-bottom: 1.75rem;
  padding-left: 1.25rem;
  border-left: 4px solid #7c3aed;
  background: #faf5ff;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  padding-right: 1rem;
  border-radius: 0 12px 12px 0;
}

.article-meta-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.88rem;
  color: #64748b;
  padding-bottom: 1.75rem;
  margin-bottom: 2.25rem;
  border-bottom: 1px solid #f1f5f9;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.meta-sep {
  color: #cbd5e1;
}

.btn-share {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-share:hover {
  background: #ede9fe;
  color: #7c3aed;
  border-color: #c4b5fd;
}

.icon-copied {
  color: #15803d;
}

.featured-image-wrapper {
  margin-bottom: 2.5rem;
  border-radius: 16px;
  overflow: hidden;
}

.featured-image {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
}

/* Article Content Styling */
.article-content {
  font-size: 1.1rem;
  line-height: 1.85;
  color: #334155;
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
}

:deep(.content-h2) {
  font-size: 1.55rem;
  font-weight: 800;
  color: #0f172a;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

:deep(.content-h3) {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e293b;
  margin-top: 1.25rem;
  margin-bottom: 0.35rem;
}

:deep(.content-p) {
  margin: 0;
}

:deep(.content-list) {
  margin: 0;
  padding-left: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

:deep(.content-list li) {
  line-height: 1.7;
}

/* Alexia CTA */
.alexia-cta-box {
  margin-top: 3rem;
  background: linear-gradient(135deg, #f5f3ff, #ede9fe);
  border: 1px solid #ddd6fe;
  border-radius: 18px;
  padding: 1.75rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.cta-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #7c3aed;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cta-content {
  flex: 1;
  min-width: 240px;
}

.cta-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.cta-desc {
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.45;
}

.btn-ask-alexia {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #7c3aed;
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s;
}

.btn-ask-alexia:hover {
  background: #6d28d9;
}

/* Crisis Reminder */
.crisis-reminder-box {
  margin-top: 1.5rem;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #9f1239;
  font-size: 0.88rem;
}

.crisis-icon {
  flex-shrink: 0;
  color: #be123c;
}

/* States */
.state-container {
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.state-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
}

.state-desc {
  font-size: 0.95rem;
  color: #64748b;
  max-width: 400px;
}

.error-icon {
  color: #f59e0b;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  background: #7c3aed;
  color: white;
  padding: 0.75rem 1.4rem;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.92rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .article-container {
    padding: 2rem 1.5rem;
  }
  .article-title {
    font-size: 1.85rem;
  }
}
</style>
