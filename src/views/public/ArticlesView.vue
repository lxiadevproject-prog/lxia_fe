<template>
  <div class="articles-view">
    <div class="header-section">
      <div class="header-badge">
        <BookOpen :size="15" />
        <span>Biblioteca Afirmativa de Autocuidado</span>
      </div>
      <h1 class="page-title">Guías y Artículos Informativos</h1>
      <p class="page-desc">
        Información confiable, validada y sensible sobre salud integral, marco legal y bienestar para la comunidad TransLúcidas.
      </p>
    </div>

    <!-- Barra de Búsqueda y Filtros -->
    <div class="search-filters-bar">
      <div class="search-input-wrapper">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por título, temática o palabras clave..."
          class="search-input"
          @keyup.enter="applyFilters"
        />
        <button v-if="searchQuery" class="btn-clear" @click="clearSearch">
          <X :size="16" />
        </button>
      </div>

      <div class="filter-controls">
        <select v-model="selectedOrdering" class="sort-select" @change="applyFilters">
          <option value="-published_at">Más recientes primero</option>
          <option value="-views_count">Más leídos</option>
          <option value="title">Alfabético (A - Z)</option>
        </select>
      </div>
    </div>

    <!-- Pestañas de Categorías -->
    <div class="category-tabs">
      <button
        class="cat-tab"
        :class="{ active: selectedCategorySlug === 'ALL' }"
        @click="selectCategory('ALL')"
      >
        Todas las temáticas
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="cat-tab"
        :class="{ active: selectedCategorySlug === cat.slug }"
        @click="selectCategory(cat.slug)"
      >
        {{ cat.name }}
      </button>
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando guías y contenidos...</p>
    </div>

    <!-- Estado vacío -->
    <div v-else-if="articles.length === 0" class="empty-state">
      <BookOpen :size="48" class="empty-icon" />
      <h3 class="empty-title">No se encontraron artículos</h3>
      <p class="empty-desc">
        No hay publicaciones que coincidan con los criterios seleccionados. Prueba buscando con otros términos.
      </p>
      <button class="btn-reset" @click="resetFilters">
        Limpiar filtros
      </button>
    </div>

    <!-- Grilla de Artículos -->
    <div v-else class="articles-grid">
      <article v-for="a in articles" :key="a.id" class="article-card">
        <div class="card-meta">
          <span class="category-pill">{{ a.category_name || 'Autocuidado' }}</span>
          <span class="reading-time">
            <Clock :size="13" />
            <span>{{ a.reading_time_minutes }} min</span>
          </span>
        </div>

        <h2 class="article-title">
          <router-link :to="'/articulos/' + a.slug">{{ a.title }}</router-link>
        </h2>

        <p class="article-summary">{{ a.summary }}</p>

        <div class="card-footer">
          <div class="footer-meta">
            <span class="author-tag">{{ a.author_name || 'Equipo TransLúcidas' }}</span>
            <span class="views-tag">
              <Eye :size="13" />
              <span>{{ a.views_count }}</span>
            </span>
          </div>
          <router-link :to="'/articulos/' + a.slug" class="btn-read">
            <span>Leer</span>
            <ArrowRight :size="14" />
          </router-link>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import contentService from '@/services/contentService'
import type { Article, Category } from '@/types/content'
import { BookOpen, Search, X, Clock, Eye, ArrowRight } from '@lucide/vue'

const route = useRoute()
const router = useRouter()

const articles = ref<Article[]>([])
const categories = ref<Category[]>([])
const loading = ref(false)

const searchQuery = ref<string>('')
const selectedCategorySlug = ref<string>('ALL')
const selectedOrdering = ref<string>('-published_at')

async function loadCategories() {
  try {
    const cats = await contentService.getCategories()
    categories.value = cats.filter((c) => c.is_active)
  } catch (err) {
    console.error('Error cargando categorías:', err)
  }
}

async function fetchArticles() {
  loading.value = true
  try {
    const params: any = {
      ordering: selectedOrdering.value,
    }
    if (selectedCategorySlug.value !== 'ALL') {
      params.category__slug = selectedCategorySlug.value
    }
    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    const res = await contentService.getPublicArticles(params)
    articles.value = res.results
  } catch (err) {
    console.error('Error cargando artículos:', err)
  } finally {
    loading.value = false
  }
}

function selectCategory(slug: string) {
  selectedCategorySlug.value = slug
  router.replace({
    query: {
      ...route.query,
      categoria: slug !== 'ALL' ? slug : undefined,
    },
  })
  fetchArticles()
}

function applyFilters() {
  fetchArticles()
}

function clearSearch() {
  searchQuery.value = ''
  fetchArticles()
}

function resetFilters() {
  searchQuery.value = ''
  selectedCategorySlug.value = 'ALL'
  selectedOrdering.value = '-published_at'
  router.replace({ query: {} })
  fetchArticles()
}

// Escuchar cambios de query en la ruta (ej. si vienen desde el home)
watch(
  () => route.query.categoria,
  (newCat) => {
    if (newCat && typeof newCat === 'string') {
      selectedCategorySlug.value = newCat
    } else {
      selectedCategorySlug.value = 'ALL'
    }
    fetchArticles()
  }
)

onMounted(async () => {
  await loadCategories()
  if (route.query.categoria && typeof route.query.categoria === 'string') {
    selectedCategorySlug.value = route.query.categoria
  }
  fetchArticles()
})
</script>

<style scoped>
.articles-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 3rem;
}

.header-section {
  text-align: center;
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #ede9fe;
  color: #6d28d9;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  margin-bottom: 1rem;
}

.page-title {
  font-size: 2.4rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin-bottom: 0.65rem;
}

.page-desc {
  font-size: 1.05rem;
  color: #64748b;
  line-height: 1.55;
}

/* Search and Filters Bar */
.search-filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.8rem 2.6rem 0.8rem 2.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.95rem;
  background: white;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.btn-clear {
  position: absolute;
  right: 0.85rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.sort-select {
  padding: 0.8rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: white;
  font-size: 0.9rem;
  color: #334155;
  outline: none;
  cursor: pointer;
}

/* Category Tabs */
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.cat-tab {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.cat-tab:hover {
  border-color: #c4b5fd;
  color: #7c3aed;
}

.cat-tab.active {
  background: #7c3aed;
  border-color: #7c3aed;
  color: white;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.25);
}

/* Grid */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.06);
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #7c3aed;
  background: #ede9fe;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  text-transform: uppercase;
}

.reading-time {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: #94a3b8;
}

.article-title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.35;
  color: #0f172a;
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

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.footer-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: #94a3b8;
}

.views-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-read {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #7c3aed;
  font-weight: 600;
  font-size: 0.88rem;
  text-decoration: none;
}

.btn-read:hover {
  text-decoration: underline;
}

/* Loading & Empty */
.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-icon {
  color: #cbd5e1;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.empty-desc {
  font-size: 0.92rem;
  color: #64748b;
  max-width: 420px;
}

.btn-reset {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.btn-reset:hover {
  background: #e2e8f0;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
