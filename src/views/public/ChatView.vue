<template>
  <div class="chat-page">
    <div class="chat-container">
      <!-- Encabezado del Chat -->
      <div class="chat-header">
        <div class="avatar-badge">
          <Sparkles :size="20" class="sparkle-icon" />
        </div>
        <div class="chat-header-info">
          <div class="title-row">
            <h2 class="chat-title">Alexia</h2>
            <span class="online-indicator"></span>
            <span class="rag-badge">RAG Afirmativo</span>
          </div>
          <p class="chat-status">
            Respuestas verificadas con base de conocimiento institucional • Sesión 100% anónima
          </p>
        </div>

        <button
          class="btn-reset"
          title="Reiniciar conversación y generar nueva sesión anónima"
          @click="confirmReset"
        >
          <RotateCcw :size="16" />
          <span class="reset-text">Reiniciar</span>
        </button>
      </div>

      <!-- TARJETA DE CRISIS INMEDIATA (PRIORIDAD CERO - RF-RAG-09) -->
      <div v-if="chatStore.isCrisisActive" class="crisis-card-banner" role="alert">
        <div class="crisis-header">
          <div class="crisis-icon-badge">
            <ShieldAlert :size="22" />
          </div>
          <div class="crisis-header-text">
            <span class="crisis-tag">PRIORIDAD CERO • ATENCIÓN INMEDIATA</span>
            <h4 class="crisis-title">Tu vida, tu dignidad y tu bienestar son lo más valioso</h4>
          </div>
          <button
            class="btn-dismiss-crisis"
            title="Cerrar advertencia"
            @click="chatStore.dismissCrisisAlert"
          >
            <X :size="16" />
          </button>
        </div>

        <p class="crisis-desc">
          Si te encuentras atravesando un momento de dolor abrumador, crisis emocional o riesgo de violencia, no estás solx. Existen líneas oficiales de escucha activa, gratuitas y disponibles 24/7 en Colombia:
        </p>

        <div class="hotlines-grid">
          <div
            v-for="h in emergencyHotlinesList"
            :key="h.phone"
            class="hotline-card"
          >
            <div class="hotline-info">
              <span class="hotline-name">{{ h.name }}</span>
              <span class="hotline-desc">{{ h.description }}</span>
            </div>
            <a :href="'tel:' + h.phone" class="btn-call">
              <PhoneCall :size="15" />
              <span>Llamar al {{ h.phone }}</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Área de Mensajes -->
      <div class="messages-area" ref="messagesArea">
        <!-- Bienvenida si no hay mensajes -->
        <div v-if="chatStore.messages.length === 0" class="welcome-card">
          <div class="welcome-avatar-core">
            <Sparkles :size="36" />
          </div>
          <h3 class="welcome-title">Hola, soy Alexia</h3>
          <p class="welcome-subtitle">
            Tu asistente virtual de autocuidado y acompañamiento. Puedo orientarte sobre salud afirmativa, protocolos médicos, marco legal de identidad y redes comunitarias.
          </p>

          <div class="prompts-container">
            <span class="prompts-label">Preguntas frecuentes que puedes hacerme:</span>
            <div class="prompts-grid">
              <button
                class="prompt-btn"
                @click="sendQuickPrompt('¿Cómo se realiza el trámite de corrección de sexo en el registro civil ante notaría?')"
              >
                <FileText :size="15" />
                <span>Corrección de sexo ante notaría (Decreto 1227)</span>
              </button>
              <button
                class="prompt-btn"
                @click="sendQuickPrompt('¿Cuáles son las pautas para iniciar terapia hormonal de afirmación de género en el sistema de salud?')"
              >
                <Heart :size="15" />
                <span>Pautas para terapia hormonal de afirmación</span>
              </button>
              <button
                class="prompt-btn"
                @click="sendQuickPrompt('¿Qué redes de apoyo comunitario y colectivas trans existen en Colombia?')"
              >
                <Users :size="15" />
                <span>Redes de apoyo comunitario y colectivas</span>
              </button>
              <button
                class="prompt-btn"
                @click="sendQuickPrompt('¿A dónde puedo acudir si sufro discriminación o violencia por identidad de género?')"
              >
                <Shield :size="15" />
                <span>Rutas de denuncia ante discriminación o violencia</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Lista de Mensajes -->
        <div
          v-for="(msg, idx) in chatStore.messages"
          :key="idx"
          class="message-row"
          :class="msg.role === 'USER' ? 'message-row--user' : 'message-row--assistant'"
        >
          <div
            class="message-bubble"
            :class="{ 'bubble--crisis': msg.is_crisis_detected }"
          >
            <!-- Rol / Encabezado pequeño -->
            <div class="bubble-header">
              <span class="sender-name">{{ msg.role === 'USER' ? 'Tú' : 'Alexia' }}</span>
              <span v-if="msg.created_at" class="msg-time">
                {{ formatTime(msg.created_at) }}
              </span>
            </div>

            <!-- Contenido del Mensaje -->
            <div class="message-body" v-html="formatMessage(msg.content)"></div>

            <!-- Citas Bibliográficas Desplegables (RF-RAG-07) -->
            <div
              v-if="msg.citations && msg.citations.length > 0"
              class="citations-wrapper"
            >
              <button
                type="button"
                class="btn-toggle-citations"
                @click="toggleCitations(idx)"
              >
                <BookMarked :size="14" />
                <span>
                  {{ openCitations[idx] ? 'Ocultar fuentes consultadas' : `${msg.citations.length} fuentes institucionales verificadas` }}
                </span>
                <ChevronDown
                  :size="14"
                  class="chevron-icon"
                  :class="{ rotated: openCitations[idx] }"
                />
              </button>

              <div v-if="openCitations[idx]" class="citations-list">
                <div
                  v-for="(cit, cIdx) in msg.citations"
                  :key="cIdx"
                  class="citation-card"
                >
                  <div class="citation-top">
                    <span class="doc-title">{{ cit.document_title }}</span>
                    <span class="doc-page">Pág. {{ cit.page || 1 }}</span>
                  </div>
                  <div v-if="cit.section && cit.section !== 'General'" class="doc-section">
                    Sección: {{ cit.section }}
                  </div>
                  <blockquote class="citation-quote">
                    "{{ cit.snippet }}"
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Indicador de Escritura -->
        <div v-if="chatStore.loading" class="typing-row">
          <div class="typing-bubble">
            <span class="typing-label">Alexia está procesando la información...</span>
            <div class="typing-dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Barra Inferior de Entrada -->
      <form @submit.prevent="handleSend" class="chat-input-bar">
        <div class="input-wrapper">
          <input
            v-model="inputQuery"
            type="text"
            maxlength="2000"
            placeholder="Escribe tu consulta en lenguaje natural (ej. ¿cuáles son los requisitos ante notaría?)..."
            class="chat-input"
            :disabled="chatStore.loading"
            @keydown.enter.exact.prevent="handleSend"
          />
          <span class="char-count" :class="{ 'char-warning': inputQuery.length > 1800 }">
            {{ inputQuery.length }}/2000
          </span>
        </div>

        <button
          type="submit"
          class="btn-send"
          :disabled="chatStore.loading || !inputQuery.trim()"
          title="Enviar consulta"
        >
          <Send :size="18" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import type { EmergencyHotline } from '@/types/rag'
import {
  Sparkles,
  Send,
  RotateCcw,
  ShieldAlert,
  PhoneCall,
  X,
  FileText,
  Heart,
  Users,
  Shield,
  BookMarked,
  ChevronDown,
} from '@lucide/vue'

const chatStore = useChatStore()
const inputQuery = ref('')
const messagesArea = ref<HTMLElement | null>(null)
const openCitations = reactive<Record<number, boolean>>({})

// Líneas de emergencia predeterminadas como fallback seguro
const defaultHotlines: EmergencyHotline[] = [
  {
    name: 'Línea 106 - El poder de ser escuchadx',
    phone: '106',
    channel: 'TELEFONO',
    hours: '24/7',
    description: 'Orientación psicosocial, apoyo en crisis emocional y prevención de autolesiones.',
    is_toll_free: true,
  },
  {
    name: 'Línea 123 - Número Único de Seguridad y Emergencias',
    phone: '123',
    channel: 'TELEFONO',
    hours: '24/7',
    description: 'Atención de emergencias médicas, situaciones de riesgo y protección inmediata.',
    is_toll_free: true,
  },
  {
    name: 'Línea Púrpura Distrital',
    phone: '018000112137',
    channel: 'TELEFONO',
    hours: '24/7',
    description: 'Atención a mujeres y personas con identidades diversas víctimas de violencias.',
    is_toll_free: true,
  },
]

const emergencyHotlinesList = computed(() => {
  if (chatStore.emergencyHotlines && chatStore.emergencyHotlines.length > 0) {
    return chatStore.emergencyHotlines
  }
  return defaultHotlines
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesArea.value) {
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight
    }
  })
}

function toggleCitations(idx: number) {
  openCitations[idx] = !openCitations[idx]
}

function formatTime(isoDate: string) {
  try {
    return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatMessage(content: string) {
  // Limpieza y formato seguro de Markdown
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

async function handleSend() {
  if (!inputQuery.value.trim() || chatStore.loading) return
  const q = inputQuery.value
  inputQuery.value = ''
  scrollToBottom()

  await chatStore.sendMessage(q, 'PORTAL_WEB')

  // Auto-abrir citas si el último mensaje tiene citas
  const lastIdx = chatStore.messages.length - 1
  if (lastIdx >= 0 && chatStore.messages[lastIdx]?.citations?.length) {
    openCitations[lastIdx] = true
  }

  scrollToBottom()
}

function sendQuickPrompt(promptText: string) {
  inputQuery.value = promptText
  handleSend()
}

function confirmReset() {
  if (confirm('¿Deseas reiniciar la sesión? Se generará una nueva sesión anónima y se limpiará el historial visible.')) {
    chatStore.resetSession()
  }
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-page {
  max-width: 900px;
  margin: 0 auto;
}

.chat-container {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 82vh;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* Header */
.chat-header {
  padding: 1rem 1.75rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-badge {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  flex-shrink: 0;
}

.chat-header-info {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chat-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.online-indicator {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
}

.rag-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #7c3aed;
  background: #ede9fe;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  text-transform: uppercase;
}

.chat-status {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.15rem;
}

.btn-reset {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 0.45rem 0.85rem;
  border-radius: 10px;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-reset:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Crisis Card Banner */
.crisis-card-banner {
  background: #fff1f2;
  border-bottom: 2px solid #f43f5e;
  padding: 1.25rem 1.75rem;
  animation: slide-down 0.25s ease-out;
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.crisis-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.crisis-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #e11d48;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.crisis-header-text {
  flex: 1;
}

.crisis-tag {
  font-size: 0.72rem;
  font-weight: 800;
  color: #be123c;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.crisis-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #9f1239;
}

.btn-dismiss-crisis {
  background: transparent;
  border: none;
  color: #9f1239;
  cursor: pointer;
  padding: 0.35rem;
}

.crisis-desc {
  font-size: 0.88rem;
  color: #881337;
  line-height: 1.5;
  margin-bottom: 0.85rem;
}

.hotlines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;
}

.hotline-card {
  background: white;
  border: 1px solid #fecdd3;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.hotline-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
}

.hotline-desc {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.35;
}

.btn-call {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: #e11d48;
  color: white;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s;
}

.btn-call:hover {
  background: #be123c;
}

/* Messages Area */
.messages-area {
  flex: 1;
  padding: 1.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #f8fafc;
}

/* Welcome Card */
.welcome-card {
  text-align: center;
  max-width: 580px;
  margin: auto;
  padding: 2rem 1rem;
}

.welcome-avatar-core {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #ede9fe, #e0e7ff);
  color: #7c3aed;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.15);
}

.welcome-title {
  font-size: 1.55rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.welcome-subtitle {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 1.75rem;
}

.prompts-container {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.prompts-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.65rem;
}

.prompt-btn {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: white;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.86rem;
  font-weight: 500;
  color: #334155;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.prompt-btn:hover {
  border-color: #7c3aed;
  color: #7c3aed;
  background: #fbf9ff;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.08);
}

/* Message Rows */
.message-row {
  display: flex;
}

.message-row--user {
  justify-content: flex-end;
}

.message-row--assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 82%;
  padding: 1.15rem 1.4rem;
  border-radius: 20px;
  font-size: 0.95rem;
  line-height: 1.6;
}

.message-row--user .message-bubble {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25);
}

.message-row--assistant .message-bubble {
  background: white;
  color: #0f172a;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.bubble--crisis {
  border-left: 4px solid #ef4444 !important;
  background: #fffafa !important;
}

.bubble-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
  font-size: 0.75rem;
}

.message-row--user .sender-name {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
}

.message-row--user .msg-time {
  color: rgba(255, 255, 255, 0.7);
}

.message-row--assistant .sender-name {
  color: #7c3aed;
  font-weight: 700;
}

.message-row--assistant .msg-time {
  color: #94a3b8;
}

.message-body {
  word-break: break-word;
}

/* Citations Box */
.citations-wrapper {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
}

.btn-toggle-citations {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-toggle-citations:hover {
  color: #7c3aed;
  border-color: #c4b5fd;
  background: #ede9fe;
}

.chevron-icon {
  transition: transform 0.2s;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

.citations-list {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.citation-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #7c3aed;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
}

.citation-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  color: #0f172a;
}

.doc-page {
  font-size: 0.75rem;
  color: #7c3aed;
}

.doc-section {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.15rem;
}

.citation-quote {
  margin: 0.35rem 0 0;
  font-style: italic;
  color: #475569;
  line-height: 1.45;
}

/* Typing Indicator */
.typing-row {
  display: flex;
}

.typing-bubble {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1.15rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.typing-label {
  font-size: 0.82rem;
  color: #64748b;
}

.typing-dots {
  display: flex;
  gap: 0.3rem;
}

.dot {
  width: 6px;
  height: 6px;
  background: #7c3aed;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Input Bar */
.chat-input-bar {
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.chat-input {
  width: 100%;
  padding: 0.85rem 4rem 0.85rem 1.25rem;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  font-size: 0.95rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.2s;
}

.chat-input:focus {
  background: white;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.char-count {
  position: absolute;
  right: 0.85rem;
  font-size: 0.72rem;
  color: #94a3b8;
  pointer-events: none;
}

.char-warning {
  color: #dc2626;
  font-weight: 700;
}

.btn-send {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white;
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-send:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 640px) {
  .chat-container {
    height: 88vh;
  }
  .message-bubble {
    max-width: 92%;
  }
}
</style>
