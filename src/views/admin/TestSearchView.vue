<template>
  <div class="test-search-view">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">Consola de Similitud Vectorial RAG</h2>
        <p class="page-desc">
          Auditoría en tiempo real del motor semántico de Alexia. Evalúa distancias de coseno,
          umbrales de relevancia y fragmentos recuperados para cualquier consulta ciudadana.
        </p>
      </div>
    </div>

    <!-- Panel de Configuración y Búsqueda -->
    <div class="search-panel-card">
      <form @submit.prevent="runSearch" class="search-form">
        <!-- Input principal -->
        <div class="search-input-group">
          <div class="input-icon-wrapper">
            <Search :size="20" class="input-icon" />
            <input
              v-model="query"
              type="text"
              required
              placeholder="Escribe una consulta semántica (ej: trámite notarial cambio de nombre y sexo)..."
              class="search-input"
            />
            <button
              v-if="query"
              type="button"
              class="btn-clear"
              title="Limpiar consulta"
              @click="query = ''"
            >
              <X :size="16" />
            </button>
          </div>
          <button type="submit" class="btn-primary" :disabled="loading || !query.trim()">
            <Loader2 v-if="loading" :size="18" class="spin" />
            <Sparkles v-else :size="18" />
            <span>{{ loading ? 'Evaluando Embeddings...' : 'Auditar Similitud' }}</span>
          </button>
        </div>

        <!-- Parámetros de Similitud Vectorial -->
        <div class="params-row">
          <div class="param-item">
            <div class="param-label-row">
              <label for="topKInput" class="param-label">
                <Sliders :size="14" />
                <span>Top K (Fragmentos Máximos):</span>
              </label>
              <span class="param-val-badge">{{ topK }}</span>
            </div>
            <input
              id="topKInput"
              v-model.number="topK"
              type="range"
              min="1"
              max="10"
              step="1"
              class="param-slider"
            />
            <span class="param-hint">Recupera entre 1 y 10 fragmentos más cercanos.</span>
          </div>

          <div class="param-item">
            <div class="param-label-row">
              <label for="thresholdInput" class="param-label">
                <Percent :size="14" />
                <span>Umbral de Similitud Coseno:</span>
              </label>
              <span class="param-val-badge">{{ (threshold * 100).toFixed(0) }}%</span>
            </div>
            <input
              id="thresholdInput"
              v-model.number="threshold"
              type="range"
              min="0.00"
              max="0.80"
              step="0.05"
              class="param-slider"
            />
            <span class="param-hint">Descarta fragmentos con similitud inferior a este valor.</span>
          </div>
        </div>

        <!-- Consultas Rápidas Recomendadas -->
        <div class="quick-queries">
          <span class="quick-title">Pruebas sugeridas:</span>
          <div class="pills-list">
            <button
              v-for="(sample, idx) in sampleQueries"
              :key="idx"
              type="button"
              class="sample-pill"
              @click="applySample(sample)"
            >
              {{ sample }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Métricas del Retorno de Búsqueda -->
    <div v-if="hasSearched" class="search-metrics-bar">
      <div class="metric-pill">
        <span class="metric-label">Consulta Evaluada:</span>
        <strong class="metric-value">"{{ lastQuery }}"</strong>
      </div>
      <div class="metric-pill">
        <span class="metric-label">Coincidencias Válidas:</span>
        <strong class="metric-value text-accent">{{ results.length }}</strong>
      </div>
      <div class="metric-pill">
        <span class="metric-label">Latencia de Vectorización:</span>
        <strong class="metric-value text-emerald">⚡ {{ latencyMs }} ms</strong>
      </div>
      <div class="metric-pill">
        <span class="metric-label">Filtros:</span>
        <span class="metric-value">Top {{ topK }} | Umbral ≥ {{ (threshold * 100).toFixed(0) }}%</span>
      </div>
    </div>

    <!-- Resultados -->
    <div v-if="results.length > 0" class="results-container">
      <h3 class="results-heading">
        Fragmentos Relevantes Recuperados por el Motor Vectorial
      </h3>
      <div class="results-grid">
        <div
          v-for="(r, idx) in results"
          :key="r.chunk_id || idx"
          class="match-card"
        >
          <div class="match-card-top">
            <div class="match-rank-info">
              <span class="rank-number">#{{ idx + 1 }}</span>
              <div class="match-doc-meta">
                <span class="doc-title">{{ r.document_title }}</span>
                <span v-if="r.page" class="doc-page-badge">Página {{ r.page }}</span>
                <span class="doc-chunk-id">Chunk ID: {{ r.chunk_id }}</span>
              </div>
            </div>

            <!-- Score Badge -->
            <div class="score-container">
              <div class="score-badge" :class="getScoreClass(r.score)">
                <span class="score-percent">{{ (r.score * 100).toFixed(1) }}%</span>
                <span class="score-type">{{ getScoreLabel(r.score) }}</span>
              </div>
              <div class="score-bar-bg">
                <div
                  class="score-bar-fill"
                  :class="getScoreClass(r.score)"
                  :style="{ width: `${Math.min(r.score * 100, 100)}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Snippet del Contenido -->
          <div class="match-content-box">
            <Quote :size="16" class="quote-icon" />
            <p class="match-content">{{ r.content_snippet }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado Vacío cuando se buscó y no hubo resultados -->
    <div v-else-if="hasSearched && !loading" class="empty-results-card">
      <AlertTriangle :size="36" class="empty-icon text-amber" />
      <h4 class="empty-title">No se encontraron fragmentos sobre el umbral</h4>
      <p class="empty-desc">
        Ningún fragmento indexado alcanzó el umbral mínimo de similitud de {{ (threshold * 100).toFixed(0) }}%
        para la consulta "{{ lastQuery }}".
      </p>
      <div class="empty-actions">
        <button type="button" class="btn-secondary" @click="threshold = 0.05; runSearch()">
          Bajar umbral a 5% y reintentar
        </button>
        <router-link to="/admin/knowledge/docs" class="btn-link">
          Gestionar Documentos RAG
        </router-link>
      </div>
    </div>

    <!-- Estado Inicial Informativo -->
    <div v-else-if="!hasSearched" class="info-guide-card">
      <div class="guide-icon-col">
        <Database :size="32" class="guide-icon" />
      </div>
      <div class="guide-text-col">
        <h4 class="guide-title">¿Cómo funciona la búsqueda semántica en Alexia?</h4>
        <p class="guide-desc">
          Cuando un(a) usuario(a) hace una pregunta al asistente, el texto se convierte en un vector de alta dimensionalidad mediante modelos de embeddings. Luego, el motor calcula la similitud de coseno contra todos los fragmentos indexados de leyes, decretos, guías de salud y protocolos trans de la Fundación TransLúcidas.
        </p>
        <div class="guide-features">
          <div class="guide-feat">
            <CheckCircle :size="16" class="feat-check" />
            <span>Verifica qué documentos sustentan las respuestas generadas</span>
          </div>
          <div class="guide-feat">
            <CheckCircle :size="16" class="feat-check" />
            <span>Ajusta umbrales para prevenir alucinaciones de la IA</span>
          </div>
          <div class="guide-feat">
            <CheckCircle :size="16" class="feat-check" />
            <span>Garantiza citas bibliográficas precisas para la comunidad</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ragService from '@/services/ragService'
import type { TestSearchResult } from '@/types/rag'
import {
  Search,
  Sparkles,
  Loader2,
  X,
  Sliders,
  Percent,
  Quote,
  AlertTriangle,
  Database,
  CheckCircle,
} from 'lucide-vue-next'

const query = ref('')
const lastQuery = ref('')
const topK = ref(4)
const threshold = ref(0.15)
const loading = ref(false)
const hasSearched = ref(false)
const latencyMs = ref(0)
const results = ref<TestSearchResult[]>([])

const sampleQueries = [
  'Decreto 1227 de 2015 trámite notarial cambio de sexo',
  'Requisitos para terapia de reemplazo hormonal trans',
  'Ruta de atención integral en salud para personas trans',
  'Líneas de atención en crisis y prevención del suicidio',
]

function applySample(sample: string) {
  query.value = sample
  runSearch()
}

function getScoreClass(score: number): string {
  if (score >= 0.65) return 'score-high'
  if (score >= 0.35) return 'score-med'
  return 'score-low'
}

function getScoreLabel(score: number): string {
  if (score >= 0.65) return 'Alta Relevancia'
  if (score >= 0.35) return 'Relevancia Media'
  return 'Baja Relevancia'
}

async function runSearch() {
  if (!query.value.trim() || loading.value) return
  loading.value = true
  lastQuery.value = query.value.trim()
  const start = performance.now()

  try {
    const res = await ragService.testSearch(lastQuery.value, topK.value, threshold.value)
    results.value = res.results || []
    hasSearched.value = true
    latencyMs.value = Math.round(performance.now() - start)
  } catch (err: any) {
    alert(`Error en auditoría vectorial: ${err?.message || 'Fallo de conexión'}`)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.test-search-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1000px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.page-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 0.25rem;
  line-height: 1.5;
}

/* Panel de Búsqueda */
.search-panel-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.search-input-group {
  display: flex;
  gap: 0.75rem;
}

.input-icon-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.85rem 2.75rem 0.85rem 2.85rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.95rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.2s ease;
  color: #0f172a;
}

.search-input:focus {
  background: white;
  border-color: #7c3aed;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
}

.btn-clear {
  position: absolute;
  right: 0.85rem;
  background: #e2e8f0;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-clear:hover {
  background: #cbd5e1;
  color: #0f172a;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white;
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Parámetros */
.params-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.param-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.param-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.param-val-badge {
  background: #ede9fe;
  color: #6d28d9;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
  border-radius: 6px;
}

.param-slider {
  width: 100%;
  accent-color: #7c3aed;
  cursor: pointer;
}

.param-hint {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Quick Queries */
.quick-queries {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
}

.quick-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
}

.pills-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sample-pill {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 500;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sample-pill:hover {
  background: #ede9fe;
  color: #6d28d9;
  border-color: #c4b5fd;
}

/* Métricas */
.search-metrics-bar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  background: #f8fafc;
  padding: 0.85rem 1.25rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.metric-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: #475569;
}

.metric-label {
  color: #64748b;
}

.metric-value {
  color: #0f172a;
}

.text-accent {
  color: #7c3aed;
}

.text-emerald {
  color: #059669;
}

/* Resultados */
.results-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.results-heading {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.results-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.match-card {
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: border-color 0.2s;
}

.match-card:hover {
  border-color: #cbd5e1;
}

.match-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.match-rank-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.rank-number {
  background: #f1f5f9;
  color: #475569;
  font-weight: 800;
  font-size: 0.95rem;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.match-doc-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.doc-title {
  font-weight: 700;
  color: #0f172a;
  font-size: 1rem;
}

.doc-page-badge {
  display: inline-block;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  width: fit-content;
}

.doc-chunk-id {
  font-size: 0.72rem;
  color: #94a3b8;
  font-family: monospace;
}

.score-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  min-width: 140px;
}

.score-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.score-percent {
  font-size: 0.88rem;
  font-weight: 800;
}

.score-high {
  background: #ecfdf5;
  color: #047857;
}

.score-med {
  background: #f0fdf4;
  color: #0284c7;
}

.score-low {
  background: #fef3c7;
  color: #b45309;
}

.score-bar-bg {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.score-bar-fill.score-high {
  background: #10b981;
}

.score-bar-fill.score-med {
  background: #0284c7;
}

.score-bar-fill.score-low {
  background: #f59e0b;
}

/* Snippet */
.match-content-box {
  background: #f8fafc;
  border-left: 3px solid #7c3aed;
  padding: 0.85rem 1rem;
  border-radius: 0 8px 8px 0;
  position: relative;
  display: flex;
  gap: 0.65rem;
}

.quote-icon {
  color: #94a3b8;
  flex-shrink: 0;
  margin-top: 0.2rem;
}

.match-content {
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.6;
  font-style: italic;
}

/* Estados Vacíos / Informativos */
.empty-results-card {
  background: white;
  padding: 2.5rem 1.5rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.text-amber {
  color: #f59e0b;
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.empty-desc {
  font-size: 0.9rem;
  color: #64748b;
  max-width: 500px;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.btn-secondary {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-link {
  color: #7c3aed;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: underline;
  display: inline-flex;
  align-items: center;
}

.info-guide-card {
  background: white;
  padding: 1.75rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  gap: 1.5rem;
}

.guide-icon-col {
  flex-shrink: 0;
}

.guide-icon {
  color: #7c3aed;
  background: #ede9fe;
  padding: 0.65rem;
  box-sizing: content-box;
  border-radius: 12px;
}

.guide-text-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.guide-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.guide-desc {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.6;
}

.guide-features {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.guide-feat {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.84rem;
  color: #334155;
}

.feat-check {
  color: #10b981;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
