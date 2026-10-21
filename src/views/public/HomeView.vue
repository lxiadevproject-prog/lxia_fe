<template>
  <div class="home-view">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-badge">
        <Sparkles :size="16" />
        <span>Espacio Seguro, Afirmativo e Informado • Colombia</span>
      </div>
      <h1 class="hero-title">
        Bienvenidx a <span class="text-gradient">LXIA TransLúcidas</span>
      </h1>
      <p class="hero-description">
        Tu portal integral de autocuidado, orientación en derechos, acompañamiento psicosocial y acceso al asistente virtual
        conversacional Alexia para personas con identidades y expresiones de género diversas.
      </p>

      <div class="hero-actions">
        <router-link to="/chat" class="btn-primary">
          <MessageSquare :size="18" />
          <span>Conversar con Alexia</span>
        </router-link>
        <router-link to="/articulos" class="btn-secondary">
          <BookOpen :size="18" />
          <span>Explorar Guías de Autocuidado</span>
        </router-link>
        <router-link to="/alexia" class="btn-ghost">
          <Sparkles :size="18" />
          <span>Avatar Interactivo</span>
        </router-link>
      </div>
    </section>

    <!-- Tarjeta de Atención Prioritaria / Líneas de Ayuda -->
    <section class="crisis-card">
      <div class="crisis-badge">
        <ShieldAlert :size="18" />
        <span>Líneas Gratuitas de Orientación y Apoyo en Crisis 24/7</span>
      </div>
      <div class="crisis-grid">
        <div class="crisis-item">
          <strong>Línea 106</strong>
          <span>Escucha y apoyo en salud mental y crisis emocional</span>
        </div>
        <div class="crisis-item">
          <strong>Línea 123</strong>
          <span>Emergencias nacionales y atención prioritaria inmediata</span>
        </div>
        <div class="crisis-item">
          <strong>Línea Púrpura 018000 112 137</strong>
          <span>Mujeres y personas diversas en situación de riesgo o violencias</span>
        </div>
      </div>
    </section>

    <!-- Categorías Temáticas -->
    <section class="categories-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Ejes Temáticos de Autocuidado</h2>
          <p class="section-subtitle">Explora artículos y recursos estructurados según tus necesidades</p>
        </div>
        <router-link to="/articulos" class="see-all-link">
          <span>Ver todas las guías</span>
          <ArrowRight :size="16" />
        </router-link>
      </div>

      <div v-if="loadingCategories" class="loading-state">
        <div class="spinner"></div>
      </div>
      <div v-else-if="categories.length === 0" class="empty-state">
        No hay categorías registradas en este momento.
      </div>
      <div v-else class="categories-grid">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="category-card"
          @click="goToCategory(cat.slug)"
        >
          <div class="cat-icon-wrapper">
            <Heart v-if="cat.slug.includes('salud') || cat.icon === 'heart'" :size="24" />
            <Shield v-else-if="cat.slug.includes('derecho') || cat.icon === 'shield'" :size="24" />
            <Users v-else-if="cat.slug.includes('comunid') || cat.icon === 'users'" :size="24" />
            <BookOpen v-else :size="24" />
          </div>
          <h3 class="cat-title">{{ cat.name }}</h3>
          <p class="cat-desc">{{ cat.description || 'Guías e información afirmativa' }}</p>
          <span class="cat-action">Explorar categoría &rarr;</span>
        </div>
      </div>
    </section>

    <!-- Artículos Recientes -->
    <section class="recent-articles-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Guías y Artículos Recientes</h2>
          <p class="section-subtitle">Lecturas claras, concisas y optimizadas para cualquier dispositivo</p>
        </div>
        <router-link to="/articulos" class="see-all-link">
          <span>Ver biblioteca completa</span>
          <ArrowRight :size="16" />
        </router-link>
      </div>

      <div v-if="loadingArticles" class="loading-state">
        <div class="spinner"></div>
      </div>
      <div v-else-if="articles.length === 0" class="empty-state">
        Aún no hay artículos publicados.
      </div>
      <div v-else class="articles-grid">
        <article v-for="a in articles" :key="a.id" class="article-card">
          <div class="card-meta-top">
            <span class="category-pill">{{ a.category_name || 'Autocuidado' }}</span>
            <span class="read-time">{{ a.reading_time_minutes }} min lectura</span>
          </div>

          <h3 class="article-title">
            <router-link :to="'/articulos/' + a.slug">{{ a.title }}</router-link>
          </h3>
          <p class="article-summary">{{ a.summary }}</p>

          <div class="article-footer">
            <span class="views-indicator">
              <Eye :size="14" />
              <span>{{ a.views_count }} lecturas</span>
            </span>
            <router-link :to="'/articulos/' + a.slug" class="link-read">
              <span>Leer</span>
              <ArrowRight :size="14" />
            </router-link>
          </div>
        </article>
      </div>
    </section>

    <!-- Recursos Destacados -->
    <section v-if="resources.length > 0" class="featured-resources-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Recursos y Documentos Destacados</h2>
          <p class="section-subtitle">Descarga guías, infografías y formatos de utilidad directa</p>
        </div>
        <router-link to="/recursos" class="see-all-link">
          <span>Ver todos los recursos</span>
          <ArrowRight :size="16" />
        </router-link>
      </div>

      <div class="resources-grid">
        <div v-for="r in resources" :key="r.id" class="resource-card">
          <div class="resource-type-badge">
            <FileText v-if="r.resource_type === 'PDF'" :size="14" />
            <ExternalLink v-else-if="r.resource_type === 'EXTERNAL_LINK'" :size="14" />
            <Headphones v-else-if="r.resource_type === 'AUDIO'" :size="14" />
            <Sparkles v-else :size="14" />
            <span>{{ r.resource_type_display || r.resource_type }}</span>
          </div>

          <h3 class="resource-title">{{ r.title }}</h3>
          <p class="resource-desc">{{ r.description }}</p>

          <div class="resource-footer">
            <span class="downloads-info">{{ r.download_count }} descargas</span>
            <a
              :href="r.file || r.external_url || '#'"
              target="_blank"
              class="btn-download"
              @click="handleDownload(r.id)"
            >
              <Download :size="14" />
              <span>Acceder</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import contentService from '@/services/contentService'
import type { Category, Article, Resource } from '@/types/content'
import {
  Sparkles,
  MessageSquare,
  BookOpen,
  Heart,
  Shield,
  ShieldAlert,
  Users,
  ArrowRight,
  Eye,
  FileText,
  ExternalLink,
  Headphones,
  Download,
} from '@lucide/vue'

const router = useRouter()

const categories = ref<Category[]>([])
const articles = ref<Article[]>([])
const resources = ref<Resource[]>([])

const loadingCategories = ref(true)
const loadingArticles = ref(true)

function goToCategory(slug: string) {
  router.push({ path: '/articulos', query: { categoria: slug } })
}

async function loadData() {
  try {
    const [cats, artsRes, resRes] = await Promise.all([
      contentService.getCategories(),
      contentService.getPublicArticles({ ordering: '-published_at' }),
      contentService.getResources({ is_featured: true }),
    ])
    categories.value = cats.filter((c) => c.is_active).slice(0, 4)
    articles.value = artsRes.results.slice(0, 3)
    resources.value = resRes.results.slice(0, 3)
  } catch (err) {
    console.error('Error cargando contenidos iniciales en home:', err)
  } finally {
    loadingCategories.value = false
    loadingArticles.value = false
  }
}

async function handleDownload(id: number) {
  try {
    await contentService.trackDownload(id)
  } catch (e) {
    // silencioso
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 3.5rem;
  padding: 1rem 0 3rem;
}

/* Hero */
.hero-section {
  text-align: center;
  max-width: 840px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #ede9fe;
  color: #6d28d9;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: 2.9rem;
  font-weight: 800;
  line-height: 1.15;
  color: #0f172a;
  letter-spacing: -0.025em;
  margin-bottom: 1.25rem;
}

.text-gradient {
  background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-description {
  font-size: 1.15rem;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 2.25rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white;
  padding: 0.85rem 1.65rem;
  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
  font-size: 1rem;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.45);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 0.85rem 1.65rem;
  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.15s;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #f3e8ff;
  color: #7c3aed;
  border: 1px solid #ddd6fe;
  padding: 0.85rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  text-decoration: none;
  font-size: 1rem;
  transition: all 0.15s;
}

.btn-ghost:hover {
  background: #ede9fe;
}

/* Crisis Card */
.crisis-card {
  background: linear-gradient(135deg, #fff1f2, #ffe4e6);
  border: 1px solid #fecdd3;
  border-radius: 20px;
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.crisis-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #be123c;
  font-weight: 700;
  font-size: 0.92rem;
}

.crisis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}

.crisis-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.crisis-item strong {
  color: #9f1239;
  font-size: 1.05rem;
}

.crisis-item span {
  color: #4c0519;
  font-size: 0.85rem;
}

/* Secciones Generales */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.section-title {
  font-size: 1.65rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.015em;
}

.section-subtitle {
  font-size: 0.92rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.see-all-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #7c3aed;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.92rem;
  transition: gap 0.15s;
}

.see-all-link:hover {
  gap: 0.6rem;
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.category-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 1.75rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.category-card:hover {
  transform: translateY(-4px);
  border-color: #c4b5fd;
  box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.12);
}

.cat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #ede9fe;
  color: #7c3aed;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.cat-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.4rem;
}

.cat-desc {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 1.25rem;
  flex: 1;
}

.cat-action {
  font-size: 0.88rem;
  font-weight: 600;
  color: #7c3aed;
}

/* Articles Grid */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
  gap: 1.75rem;
}

.article-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s, box-shadow 0.2s;
}

.article-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.card-meta-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-pill {
  font-size: 0.74rem;
  font-weight: 700;
  color: #7c3aed;
  background: #ede9fe;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  text-transform: uppercase;
}

.read-time {
  font-size: 0.8rem;
  color: #94a3b8;
}

.article-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
}

.article-title a {
  color: inherit;
  text-decoration: none;
  transition: color 0.15s;
}

.article-title a:hover {
  color: #7c3aed;
}

.article-summary {
  font-size: 0.92rem;
  color: #64748b;
  line-height: 1.55;
  flex: 1;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.views-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: #94a3b8;
}

.link-read {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: #7c3aed;
  text-decoration: none;
}

.link-read:hover {
  text-decoration: underline;
}

/* Resources Grid */
.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 1.5rem;
}

.resource-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.resource-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
  font-weight: 700;
  color: #0284c7;
  background: #e0f2fe;
  padding: 0.25rem 0.65rem;
  border-radius: 8px;
  align-self: flex-start;
  text-transform: uppercase;
}

.resource-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.resource-desc {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
  flex: 1;
}

.resource-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.downloads-info {
  font-size: 0.82rem;
  color: #94a3b8;
}

.btn-download {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #7c3aed;
  color: white;
  padding: 0.45rem 0.95rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s;
}

.btn-download:hover {
  background: #6d28d9;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  font-size: 0.95rem;
}

.spinner {
  width: 24px;
  height: 24px;
  margin: 0 auto;
  border: 2px solid #e2e8f0;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 2.2rem;
  }
}
</style>
