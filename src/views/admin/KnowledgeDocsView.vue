<template>
  <div class="knowledge-docs-view">
    <div class="view-header">
      <div>
        <h2 class="view-title">Base de Conocimiento RAG (Fuentes Documentales)</h2>
        <p class="view-subtitle">
          Administración de documentos institucionales, vectorización semántica y fragmentación de citas para Alexia.
        </p>
      </div>
      <div class="header-actions">
        <router-link to="/admin/rag/test-search" class="btn-secondary">
          <Search :size="16" />
          <span>Consola de Similitud</span>
        </router-link>
        <button class="btn-primary" @click="openCreateModal">
          <UploadCloud :size="18" />
          <span>Registrar Fuente RAG</span>
        </button>
      </div>
    </div>

    <!-- Métricas del RAG -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon icon-purple">
          <FileText :size="20" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Documentos</span>
          <span class="metric-value">{{ docs.length }}</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon icon-green">
          <CheckCircle2 :size="20" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Documentos Indexados</span>
          <span class="metric-value">{{ countByStatus('INDEXED') }}</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon icon-amber">
          <Clock :size="20" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Pendientes de Indexar</span>
          <span class="metric-value">{{ countByStatus('PENDING') }}</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon icon-blue">
          <Database :size="20" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Chunks Vectoriales</span>
          <span class="metric-value">{{ totalChunks }}</span>
        </div>
      </div>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="filters-card">
      <div class="search-box">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar documento por título o descripción..."
          class="search-input"
        />
        <button v-if="searchQuery" class="btn-clear" @click="searchQuery = ''"><X :size="16" /></button>
      </div>

      <div class="filters-group">
        <div class="status-pills">
          <button
            class="pill-btn"
            :class="{ active: selectedStatus === 'ALL' }"
            @click="selectedStatus = 'ALL'"
          >
            Todos
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedStatus === 'INDEXED' }"
            @click="selectedStatus = 'INDEXED'"
          >
            Indexados
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedStatus === 'PENDING' }"
            @click="selectedStatus = 'PENDING'"
          >
            Pendientes
          </button>
          <button
            class="pill-btn"
            :class="{ active: selectedStatus === 'FAILED' }"
            @click="selectedStatus = 'FAILED'"
          >
            Fallidos
          </button>
        </div>

        <button class="btn-reload" title="Recargar lista" @click="fetchDocs">
          <RefreshCw :size="16" :class="{ spinning: loading }" />
        </button>
      </div>
    </div>

    <!-- Notificaciones -->
    <div v-if="successMsg" class="alert-banner alert-banner--success">
      <CheckCircle2 :size="18" />
      <span>{{ successMsg }}</span>
      <button class="btn-close-alert" @click="successMsg = ''"><X :size="14" /></button>
    </div>
    <div v-if="errorMsg" class="alert-banner alert-banner--error">
      <XCircle :size="18" />
      <span>{{ errorMsg }}</span>
      <button class="btn-close-alert" @click="errorMsg = ''"><X :size="14" /></button>
    </div>

    <!-- Tabla de Documentos -->
    <div class="table-card">
      <div v-if="loading && docs.length === 0" class="empty-state">
        <div class="spinner"></div>
        <p>Cargando fuentes de conocimiento...</p>
      </div>

      <div v-else-if="filteredDocs.length === 0" class="empty-state">
        <FileText :size="40" class="empty-icon" />
        <h4 class="empty-title">No hay documentos</h4>
        <p class="empty-desc">No se encontraron fuentes registradas con los criterios seleccionados.</p>
      </div>

      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Documento y Descripción</th>
              <th>Tipo</th>
              <th>Origen / Almacenamiento</th>
              <th>Estado RAG</th>
              <th>Fragmentos</th>
              <th>Fecha</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in filteredDocs" :key="d.id">
              <td class="main-cell">
                <span class="doc-cell-title">{{ d.title }}</span>
                <span class="doc-cell-desc">{{ d.description || 'Sin descripción' }}</span>
              </td>
              <td>
                <span class="type-tag">{{ d.document_type_display || d.document_type }}</span>
              </td>
              <td>
                <div class="source-cell">
                  <span class="source-badge" :class="'source-' + d.ingestion_source.toLowerCase()">
                    {{ d.ingestion_source === 'FIREBASE_DIRECT' ? 'Firebase Storage (0 MB)' : d.ingestion_source }}
                  </span>
                  <a v-if="d.file_url" :href="d.file_url" target="_blank" class="file-link">
                    <ExternalLink :size="12" />
                    <span>Ver archivo</span>
                  </a>
                </div>
              </td>
              <td>
                <span class="status-badge" :class="'status-' + d.status.toLowerCase()">
                  {{ d.status_display || d.status }}
                </span>
              </td>
              <td>
                <span class="chunks-badge">
                  <strong>{{ d.chunks_count }}</strong> chunks
                </span>
              </td>
              <td>
                <span class="date-text">
                  {{ new Date(d.created_at).toLocaleDateString() }}
                </span>
              </td>
              <td class="text-right">
                <div class="action-buttons">
                  <!-- Botón de Indexación / Re-indexación -->
                  <button
                    class="btn-action-index"
                    :class="{ 'btn-reindex': d.status === 'INDEXED' }"
                    :disabled="indexingId === d.id || d.status === 'EXTRACTING'"
                    :title="d.status === 'INDEXED' ? 'Re-calcular fragmentos y embeddings' : 'Indexar documento para el RAG'"
                    @click="handleTriggerIndex(d)"
                  >
                    <RefreshCw v-if="indexingId === d.id" :size="13" class="spinning" />
                    <Sparkles v-else :size="13" />
                    <span>{{ indexingId === d.id ? 'Indexando...' : (d.status === 'INDEXED' ? 'Re-indexar' : 'Indexar') }}</span>
                  </button>

                  <!-- Botón Ver Detalle -->
                  <button
                    class="btn-action-icon"
                    title="Ver detalle del documento"
                    @click="openDetailModal(d)"
                  >
                    <Eye :size="16" />
                  </button>

                  <!-- Botón Eliminar -->
                  <button
                    class="btn-action-icon btn-action--delete"
                    title="Eliminar documento y sus fragmentos"
                    @click="openDeleteModal(d)"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL 1: Registrar Documento en Base de Conocimiento -->
    <div v-if="showCreateModal" class="modal-backdrop" @click.self="closeCreateModal">
      <div class="modal-card modal-card--lg">
        <div class="modal-header">
          <div class="modal-icon-badge">
            <UploadCloud :size="20" />
          </div>
          <div>
            <h3 class="modal-title">Registrar Fuente Documental en RAG</h3>
            <p class="modal-subtitle">Integración de guías, protocolos y marco legal para Alexia</p>
          </div>
          <button class="modal-close-btn" @click="closeCreateModal"><X :size="18" /></button>
        </div>

        <!-- Banner informativo sobre 0 MB en Render -->
        <div class="cloud-info-banner">
          <Sparkles :size="18" class="cloud-info-icon" />
          <div>
            <strong>Ventaja de Arquitectura Serverless:</strong>
            <span> Al registrar URLs directas de Firebase Storage o texto manual, el backend consume <strong>0 MB de almacenamiento</strong> en disco en Render.</span>
          </div>
        </div>

        <div v-if="modalError" class="modal-alert-error">
          <XCircle :size="16" />
          <span>{{ modalError }}</span>
        </div>

        <!-- Selector de Origen de Ingesta -->
        <div class="ingestion-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: createForm.ingestion_source === 'FIREBASE_DIRECT' }"
            @click="createForm.ingestion_source = 'FIREBASE_DIRECT'"
          >
            <span>Firebase Storage (URL)</span>
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: createForm.ingestion_source === 'MANUAL_TEXT' }"
            @click="createForm.ingestion_source = 'MANUAL_TEXT'"
          >
            <span>Texto Directo / FAQ / Guía</span>
          </button>
        </div>

        <form @submit.prevent="handleCreateDocument" class="modal-form">
          <div class="form-group">
            <label class="form-label">Título del Documento *</label>
            <input
              v-model="createForm.title"
              type="text"
              required
              placeholder="Ej: Decreto 1227 de 2015 - Corrección de Componente Sexo en Registro Civil"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Tipo de Documento *</label>
              <select v-model="createForm.document_type" class="form-select" required>
                <option value="LEGAL">Marco Legal y Normativo</option>
                <option value="PROTOCOL">Protocolo Clínico y de Salud</option>
                <option value="GUIDE">Guía Comunitaria de Autocuidado</option>
                <option value="WORKSHOP">Taller y Caja de Herramientas</option>
                <option value="FAQ">Preguntas Frecuentes (FAQ)</option>
                <option value="OTHER">Otro Documento Institucional</option>
              </select>
            </div>

            <div class="form-group flex-1">
              <label class="form-label">Descripción Breve</label>
              <input
                v-model="createForm.description"
                type="text"
                placeholder="Ej: Procedimiento notarial paso a paso en Colombia"
                class="form-input"
              />
            </div>
          </div>

          <!-- Campos específicos según Ingestion Source -->
          <div v-if="createForm.ingestion_source === 'FIREBASE_DIRECT'" class="source-inputs">
            <div class="form-group">
              <label class="form-label">URL del Archivo en Firebase Storage *</label>
              <input
                v-model="createForm.file_url"
                type="url"
                required
                placeholder="https://firebasestorage.googleapis.com/v0/b/.../o/documento.pdf"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Ruta de Almacenamiento en Bucket (storage_path)</label>
              <input
                v-model="createForm.storage_path"
                type="text"
                placeholder="knowledge/normativa/decreto_1227_2015.pdf"
                class="form-input"
              />
            </div>
          </div>

          <div v-if="createForm.ingestion_source === 'MANUAL_TEXT'" class="source-inputs">
            <div class="form-group">
              <label class="form-label">Contenido Textual de la Fuente (raw_text) *</label>
              <textarea
                v-model="createForm.raw_text"
                required
                rows="8"
                placeholder="Pega aquí el contenido completo del documento o protocolo para que sea fragmentado e indexado..."
                class="form-textarea font-mono"
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="closeCreateModal">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-small"></span>
              <span>{{ submitting ? 'Registrando...' : 'Registrar e Indexar Documento' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: Ver Detalle del Documento -->
    <div v-if="showDetailModal && detailDoc" class="modal-backdrop" @click.self="showDetailModal = false">
      <div class="modal-card modal-card--lg">
        <div class="modal-header">
          <div class="modal-icon-badge modal-icon-badge--blue">
            <Eye :size="20" />
          </div>
          <div>
            <h3 class="modal-title">{{ detailDoc.title }}</h3>
            <p class="modal-subtitle">Detalle y texto extraído de la fuente</p>
          </div>
          <button class="modal-close-btn" @click="showDetailModal = false"><X :size="18" /></button>
        </div>

        <div class="doc-detail-meta-list">
          <div class="detail-row">
            <strong>Tipo:</strong> <span>{{ detailDoc.document_type_display || detailDoc.document_type }}</span>
          </div>
          <div class="detail-row">
            <strong>Estado:</strong> <span>{{ detailDoc.status_display || detailDoc.status }}</span>
          </div>
          <div class="detail-row">
            <strong>Fragmentos (Chunks):</strong> <span>{{ detailDoc.chunks_count }} fragmentos indexados</span>
          </div>
          <div v-if="detailDoc.file_url" class="detail-row">
            <strong>URL Archivo:</strong>
            <a :href="detailDoc.file_url" target="_blank" class="detail-link">{{ detailDoc.file_url }}</a>
          </div>
        </div>

        <div v-if="detailDoc.error_message" class="error-detail-box">
          <strong>Error de Extracción:</strong>
          <span>{{ detailDoc.error_message }}</span>
        </div>

        <div v-if="detailDoc.raw_text" class="raw-text-container">
          <span class="raw-text-label">Texto Extraído / Contenido:</span>
          <pre class="raw-text-viewer">{{ detailDoc.raw_text }}</pre>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="showDetailModal = false">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- MODAL 3: Confirmar Eliminación -->
    <div v-if="showDeleteModal && deletingDoc" class="modal-backdrop" @click.self="showDeleteModal = false">
      <div class="modal-card modal-card--sm">
        <div class="modal-header">
          <div class="modal-icon-badge modal-icon-badge--danger">
            <Trash2 :size="20" />
          </div>
          <div>
            <h3 class="modal-title">Eliminar Fuente Documental</h3>
            <p class="modal-subtitle">Acción irreversible</p>
          </div>
          <button class="modal-close-btn" @click="showDeleteModal = false"><X :size="18" /></button>
        </div>

        <p class="delete-msg">
          ¿Estás seguro de que deseas eliminar
          <strong>"{{ deletingDoc.title }}"</strong>?
          Se eliminarán todos sus fragmentos vectoriales y Alexia ya no podrá citarlo en sus respuestas.
        </p>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="showDeleteModal = false">Cancelar</button>
          <button type="button" class="btn-danger" :disabled="submitting" @click="confirmDelete">
            <span>{{ submitting ? 'Eliminando...' : 'Sí, eliminar documento' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import ragService from '@/services/ragService'
import type { KnowledgeDocument, DocumentCreatePayload, DocumentStatus, DocumentType, IngestionSource } from '@/types/rag'
import {
  UploadCloud,
  Search,
  X,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Sparkles,
  Eye,
  Trash2,
  XCircle,
} from '@lucide/vue'

const docs = ref<KnowledgeDocument[]>([])
const loading = ref(false)
const submitting = ref(false)
const indexingId = ref<number | null>(null)

const searchQuery = ref('')
const selectedStatus = ref('ALL')

const successMsg = ref('')
const errorMsg = ref('')

// Modal Crear
const showCreateModal = ref(false)
const modalError = ref('')
const createForm = reactive<DocumentCreatePayload>({
  title: '',
  description: '',
  document_type: 'LEGAL' as DocumentType,
  ingestion_source: 'FIREBASE_DIRECT' as IngestionSource,
  file_url: '',
  storage_path: '',
  raw_text: '',
})

// Modal Detalle
const showDetailModal = ref(false)
const detailDoc = ref<KnowledgeDocument | null>(null)

// Modal Eliminar
const showDeleteModal = ref(false)
const deletingDoc = ref<KnowledgeDocument | null>(null)

const filteredDocs = computed(() => {
  return docs.value.filter((d) => {
    if (selectedStatus.value !== 'ALL' && d.status !== selectedStatus.value) {
      return false
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchTitle = d.title.toLowerCase().includes(q)
      const matchDesc = (d.description || '').toLowerCase().includes(q)
      return matchTitle || matchDesc
    }
    return true
  })
})

const totalChunks = computed(() => {
  return docs.value.reduce((acc, curr) => acc + (curr.chunks_count || 0), 0)
})

function countByStatus(st: DocumentStatus): number {
  return docs.value.filter((d) => d.status === st).length
}

async function fetchDocs() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await ragService.getDocuments()
    docs.value = res.results
  } catch (err: any) {
    errorMsg.value = err.message || 'Error cargando documentos de la base de conocimiento'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  modalError.value = ''
  createForm.title = ''
  createForm.description = ''
  createForm.document_type = 'LEGAL'
  createForm.ingestion_source = 'FIREBASE_DIRECT'
  createForm.file_url = ''
  createForm.storage_path = ''
  createForm.raw_text = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  modalError.value = ''
}

async function handleCreateDocument() {
  submitting.value = true
  modalError.value = ''

  try {
    const created = await ragService.createDocument(createForm)
    docs.value.unshift(created)
    successMsg.value = `Documento "${created.title}" registrado correctamente.`
    closeCreateModal()

    // Si tiene texto manual o URL, auto-disparar indexación para comodidad del usuario
    if (createForm.raw_text || createForm.file_url) {
      handleTriggerIndex(created)
    }
  } catch (err: any) {
    modalError.value = err.message || 'Error al registrar el documento.'
  } finally {
    submitting.value = false
  }
}

async function handleTriggerIndex(d: KnowledgeDocument) {
  indexingId.value = d.id
  errorMsg.value = ''
  try {
    const res = await ragService.triggerIndex(d.id)
    successMsg.value = `¡Indexación exitosa! Se generaron ${res.chunks_count} fragmentos vectoriales para "${d.title}".`
    fetchDocs()
  } catch (err: any) {
    errorMsg.value = err.message || 'Error durante la indexación del documento.'
  } finally {
    indexingId.value = null
  }
}

async function openDetailModal(d: KnowledgeDocument) {
  try {
    const full = await ragService.getDocument(d.id)
    detailDoc.value = full
    showDetailModal.value = true
  } catch (err) {
    errorMsg.value = 'No fue posible cargar el detalle del documento.'
  }
}

function openDeleteModal(d: KnowledgeDocument) {
  deletingDoc.value = d
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deletingDoc.value) return
  submitting.value = true
  try {
    await ragService.deleteDocument(deletingDoc.value.id)
    docs.value = docs.value.filter((item) => item.id !== deletingDoc.value!.id)
    successMsg.value = 'Documento y fragmentos vectoriales eliminados correctamente.'
    showDeleteModal.value = false
  } catch (err: any) {
    errorMsg.value = err.message || 'Error al eliminar el documento.'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchDocs()
})
</script>

<style scoped>
.knowledge-docs-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.view-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
}

.view-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 0.2rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.15rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-purple { background: #ede9fe; color: #7c3aed; }
.icon-green { background: #dcfce7; color: #15803d; }
.icon-amber { background: #fef3c7; color: #d97706; }
.icon-blue { background: #e0f2fe; color: #0284c7; }

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
}

.metric-value {
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
}

/* Filters */
.filters-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 0.9rem 1.25rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 260px;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.65rem 2.2rem 0.65rem 2.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.2s;
}

.search-input:focus {
  background: white;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.btn-clear {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.filters-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-pills {
  display: flex;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 10px;
  gap: 0.2rem;
}

.pill-btn {
  border: none;
  background: transparent;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.pill-btn.active {
  background: white;
  color: #7c3aed;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.btn-reload {
  width: 38px;
  height: 38px;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinning { animation: spin 1s linear infinite; }

/* Table */
.table-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.data-table th {
  background: #f8fafc;
  padding: 0.9rem 1.25rem;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}

.main-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  max-width: 320px;
}

.doc-cell-title {
  font-weight: 700;
  color: #0f172a;
}

.doc-cell-desc {
  font-size: 0.8rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-tag {
  font-size: 0.76rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}

.source-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.source-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #6d28d9;
  background: #ede9fe;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}

.file-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.76rem;
  color: #7c3aed;
  text-decoration: none;
}

.file-link:hover { text-decoration: underline; }

.status-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  text-transform: uppercase;
}

.status-indexed { background: #dcfce7; color: #15803d; }
.status-pending { background: #fef3c7; color: #b45309; }
.status-extracting { background: #e0f2fe; color: #0369a1; }
.status-failed { background: #fee2e2; color: #b91c1c; }

.chunks-badge {
  font-size: 0.82rem;
  color: #475569;
}

.date-text {
  font-size: 0.82rem;
  color: #64748b;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
}

.btn-action-index {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #ede9fe;
  color: #6d28d9;
  border: 1px solid #ddd6fe;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-action-index:hover:not(:disabled) {
  background: #e4d4ff;
  border-color: #c4b5fd;
}

.btn-reindex {
  background: #f1f5f9;
  color: #475569;
  border-color: #cbd5e1;
}

.btn-reindex:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-action-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  cursor: pointer;
}

.btn-action-icon:hover { border-color: #7c3aed; color: #7c3aed; }
.btn-action--delete:hover { border-color: #dc2626; color: #dc2626; background: #fef2f2; }

.text-right { text-align: right; }

/* Cloud Info Banner */
.cloud-info-banner {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 0.85rem 1.15rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.88rem;
  color: #166534;
  margin-bottom: 1.25rem;
}

.cloud-info-icon {
  color: #15803d;
  flex-shrink: 0;
}

/* Ingestion Tabs */
.ingestion-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  background: #f1f5f9;
  padding: 0.3rem;
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  padding: 0.6rem;
  border: none;
  background: transparent;
  font-size: 0.88rem;
  font-weight: 600;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn.active {
  background: white;
  color: #7c3aed;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.source-inputs {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Modales */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  z-index: 1000;
}

.modal-card {
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-card--lg { max-width: 680px; }
.modal-card--sm { max-width: 440px; }

.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.modal-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #ede9fe;
  color: #7c3aed;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-icon-badge--blue { background: #e0f2fe; color: #0284c7; }
.modal-icon-badge--danger { background: #fee2e2; color: #dc2626; }

.modal-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; }
.modal-subtitle { font-size: 0.85rem; color: #64748b; }
.modal-close-btn { margin-left: auto; border: none; background: transparent; color: #94a3b8; cursor: pointer; }

.modal-alert-error {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.modal-form { display: flex; flex-direction: column; gap: 1.15rem; }
.form-row { display: flex; gap: 1rem; }
.flex-1 { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-label { font-size: 0.84rem; font-weight: 600; color: #334155; }

.form-input, .form-select, .form-textarea {
  padding: 0.7rem 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.2s;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  background: white;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.font-mono { font-family: ui-monospace, SFMono-Regular, monospace; }

/* Detail modal styles */
.doc-detail-meta-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #f1f5f9;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
}

.detail-row strong { color: #475569; width: 140px; }
.detail-link { color: #7c3aed; text-decoration: none; word-break: break-all; }
.detail-link:hover { text-decoration: underline; }

.error-detail-box {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #9f1239;
  padding: 0.85rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.raw-text-container {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.raw-text-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
}

.raw-text-viewer {
  background: #0f172a;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 10px;
  font-size: 0.82rem;
  line-height: 1.5;
  max-height: 280px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #7c3aed;
  color: white;
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover:not(:disabled) { background: #6d28d9; }
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1.2rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  text-decoration: none;
  font-size: 0.9rem;
}

.btn-danger { padding: 0.65rem 1.2rem; background: #dc2626; border: none; border-radius: 10px; font-weight: 600; color: white; cursor: pointer; }

.alert-banner { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1.15rem; border-radius: 12px; font-size: 0.9rem; font-weight: 500; }
.alert-banner--success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
.alert-banner--error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.btn-close-alert { margin-left: auto; background: transparent; border: none; color: inherit; cursor: pointer; }

.empty-state { padding: 3.5rem 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
.empty-icon { color: #cbd5e1; }
.empty-title { font-size: 1.15rem; font-weight: 700; color: #0f172a; }
.empty-desc { font-size: 0.88rem; color: #64748b; }

.spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; }
.spinner-small { width: 14px; height: 14px; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top-color: white; animation: spin 0.8s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
    gap: 1.15rem;
  }
}
</style>
