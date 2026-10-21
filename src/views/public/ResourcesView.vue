<template>
  <div class="resources-view">
    <div class="header-section">
      <div class="header-badge">
        <FolderDown :size="15" />
        <span>Repositorio de Materiales Afirmativos</span>
      </div>
      <h1 class="page-title">Biblioteca de Recursos y Guías Descargables</h1>
      <p class="page-desc">
        Infografías, documentos en PDF, formatos de trámites y enlaces externos diseñados para el empoderamiento y acompañamiento de la comunidad.
      </p>
    </div>

    <!-- Barra de Búsqueda y Tipos -->
    <div class="toolbar-section">
      <div class="search-input-wrapper">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar recurso por nombre o contenido..."
          class="search-input"
          @keyup.enter="fetchResources"
        />
        <button v-if="searchQuery" class="btn-clear" @click="clearSearch">
          <X :size="16" />
        </button>
      </div>

      <div class="type-filter-chips">
        <button
          class="type-chip"
          :class="{ active: selectedType === 'ALL' }"
          @click="selectType('ALL')"
        >
          Todos los recursos
        </button>
        <button
          class="type-chip"
          :class="{ active: selectedType === 'PDF' }"
          @click="selectType('PDF')"
        >
          <FileText :size="14" />
          <span>Guías PDF</span>
        </button>
        <button
          class="type-chip"
          :class="{ active: selectedType === 'INFOGRAPHIC' }"
          @click="selectType('INFOGRAPHIC')"
        >
          <Sparkles :size="14" />
          <span>Infografías</span>
        </button>
        <button
          class="type-chip"
          :class="{ active: selectedType === 'EXTERNAL_LINK' }"
          @click="selectType('EXTERNAL_LINK')"
        >
          <ExternalLink :size="14" />
          <span>Enlaces y Directorios</span>
        </button>
        <button
          class="type-chip"
          :class="{ active: selectedType === 'AUDIO' }"
          @click="selectType('AUDIO')"
        >
          <Headphones :size="14" />
          <span>Audios / Podcasts</span>
        </button>
      </div>
    </div>

    <!-- Estado de Carga -->
    <div v-if="loading" class="state-container">
      <div class="spinner"></div>
      <p>Cargando biblioteca de recursos...</p>
    </div>

    <!-- Estado Vacío -->
    <div v-else-if="filteredResources.length === 0" class="state-container">
      <FolderDown :size="48" class="empty-icon" />
      <h3 class="state-title">No se encontraron recursos</h3>
      <p class="state-desc">No hay materiales disponibles con los criterios seleccionados.</p>
      <button class="btn-reset" @click="resetFilters">Restablecer filtros</button>
    </div>

    <!-- Grilla de Recursos -->
    <div v-else class="resources-grid">
      <div v-for="r in filteredResources" :key="r.id" class="resource-card">
        <div class="card-top-row">
          <div class="type-badge" :class="'type-' + r.resource_type.toLowerCase()">
            <FileText v-if="r.resource_type === 'PDF'" :size="14" />
            <Sparkles v-else-if="r.resource_type === 'INFOGRAPHIC'" :size="14" />
            <ExternalLink v-else-if="r.resource_type === 'EXTERNAL_LINK'" :size="14" />
            <Headphones v-else-if="r.resource_type === 'AUDIO'" :size="14" />
            <span>{{ r.resource_type_display || r.resource_type }}</span>
          </div>

          <span v-if="r.category_name" class="category-pill">
            {{ r.category_name }}
          </span>
        </div>

        <h3 class="resource-title">{{ r.title }}</h3>
        <p class="resource-desc">{{ r.description || 'Sin descripción detallada.' }}</p>

        <div class="resource-footer">
          <span class="downloads-count">
            <DownloadCloud :size="14" />
            <span>{{ r.download_count }} accesos</span>
          </span>

          <a
            :href="r.file || r.external_url || '#'"
            target="_blank"
            class="btn-access"
            @click="handleAccess(r)"
          >
            <Download v-if="r.resource_type === 'PDF'" :size="15" />
            <ExternalLink v-else :size="15" />
            <span>{{ r.resource_type === 'EXTERNAL_LINK' ? 'Visitar enlace' : 'Descargar' }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import contentService from '@/services/contentService'
import type { Resource } from '@/types/content'
import {
  FolderDown,
  Search,
  X,
  FileText,
  Sparkles,
  ExternalLink,
  Headphones,
  DownloadCloud,
  Download,
} from '@lucide/vue'

const resources = ref<Resource[]>([])
const loading = ref(false)

const searchQuery = ref<string>('')
const selectedType = ref<string>('ALL')

const filteredResources = computed(() => {
  return resources.value.filter((r) => {
    // Filtro por tipo
    if (selectedType.value !== 'ALL' && r.resource_type !== selectedType.value) {
      return false
    }
    // Filtro por búsqueda
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchTitle = r.title.toLowerCase().includes(q)
      const matchDesc = (r.description || '').toLowerCase().includes(q)
      const matchCat = (r.category_name || '').toLowerCase().includes(q)
      return matchTitle || matchDesc || matchCat
    }
    return true
  })
})

async function fetchResources() {
  loading.value = true
  try {
    const res = await contentService.getResources()
    resources.value = res.results
  } catch (err) {
    console.error('Error cargando recursos:', err)
  } finally {
    loading.value = false
  }
}

function selectType(type: string) {
  selectedType.value = type
}

function clearSearch() {
  searchQuery.value = ''
}

function resetFilters() {
  searchQuery.value = ''
  selectedType.value = 'ALL'
}

async function handleAccess(r: Resource) {
  try {
    const res = await contentService.trackDownload(r.id)
    if (res && res.download_count !== undefined) {
      r.download_count = res.download_count
    } else {
      r.download_count += 1
    }
  } catch (e) {
    // silencioso
  }
}

onMounted(() => {
  fetchResources()
})
</script>

<style scoped>
.resources-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 3.5rem;
}

.header-section {
  text-align: center;
  max-width: 740px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #e0f2fe;
  color: #0284c7;
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

/* Toolbar */
.toolbar-section {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 540px;
  width: 100%;
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
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.btn-clear {
  position: absolute;
  right: 0.85rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.type-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.type-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
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

.type-chip:hover {
  border-color: #7dd3fc;
  color: #0284c7;
}

.type-chip.active {
  background: #0284c7;
  border-color: #0284c7;
  color: white;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.25);
}

/* Grilla */
.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.75rem;
}

.resource-card {
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

.resource-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.06);
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 8px;
  text-transform: uppercase;
}

.type-pdf { background: #fee2e2; color: #dc2626; }
.type-infographic { background: #fef3c7; color: #b45309; }
.type-external_link { background: #e0f2fe; color: #0284c7; }
.type-audio { background: #ede9fe; color: #7c3aed; }

.category-pill {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
}

.resource-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
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

.downloads-count {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: #94a3b8;
}

.btn-access {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #7c3aed;
  color: white;
  padding: 0.55rem 1rem;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s;
}

.btn-access:hover {
  background: #6d28d9;
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

.empty-icon {
  color: #cbd5e1;
}

.state-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.state-desc {
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
