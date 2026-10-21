<template>
  <div class="avatar-page">
    <div class="avatar-stage-card">
      <!-- Escenario Visual del Avatar -->
      <div class="stage-viewport" :class="'stage--' + chatStore.activeExpression.toLowerCase()">
        <!-- Auras de Energía según Expresión Visual (RF-ALX-01 a 03) -->
        <div class="aura-outer"></div>
        <div class="aura-middle"></div>

        <!-- Silueta y Núcleo del Avatar -->
        <div class="avatar-silhouette">
          <div class="avatar-halo"></div>
          <div class="avatar-core">
            <Sparkles :size="58" class="core-icon" />
          </div>
          <!-- Ojos / Expresión estilizada -->
          <div class="avatar-eyes">
            <span class="eye left-eye"></span>
            <span class="eye right-eye"></span>
          </div>
        </div>

        <!-- Badge de Expresión Emocional Sugerida -->
        <div class="expression-badge" :class="'badge--' + chatStore.activeExpression.toLowerCase()">
          <span class="expr-dot"></span>
          <span class="expr-text">{{ expressionLabel }}</span>
        </div>

        <!-- Ecualizador de Ondas de Voz (Activo durante TTS) -->
        <div class="speech-waves-container" :class="{ 'speaking-active': isSpeaking }">
          <div class="wave wave-1"></div>
          <div class="wave wave-2"></div>
          <div class="wave wave-3"></div>
          <div class="wave wave-4"></div>
          <div class="wave wave-5"></div>
          <div class="wave wave-6"></div>
        </div>

        <!-- Controles de Audio en el Escenario -->
        <div class="stage-audio-controls">
          <button
            class="btn-audio-toggle"
            :class="{ active: soundEnabled }"
            :title="soundEnabled ? 'Silenciar voz de Alexia' : 'Activar voz de Alexia'"
            @click="soundEnabled = !soundEnabled"
          >
            <Volume2 v-if="soundEnabled" :size="16" />
            <VolumeX v-else :size="16" />
            <span>{{ soundEnabled ? 'Voz activada' : 'Silenciada' }}</span>
          </button>
        </div>
      </div>

      <!-- Alerta Inmediata de Crisis en Avatar (Prioridad Cero - RF-RAG-09) -->
      <div v-if="chatStore.isCrisisActive" class="avatar-crisis-banner">
        <ShieldAlert :size="20" class="crisis-icon" />
        <div class="crisis-banner-content">
          <strong>Línea de Apoyo Inmediato 24/7:</strong>
          <span> Marca gratis a la <strong>Línea 106</strong> (salud mental) o al <strong>123</strong> (emergencias).</span>
        </div>
        <a href="tel:106" class="btn-quick-call">Llamar 106</a>
      </div>

      <!-- Tarjeta de Subtítulos y Diálogo Fonético Limpio (Sin Markdown) -->
      <div class="dialogue-box">
        <div class="dialogue-header">
          <span class="dialogue-speaker">Alexia</span>
          <span v-if="isSpeaking" class="speaking-tag">Sintetizando voz en vivo...</span>
        </div>

        <p v-if="chatStore.lastTtsText" class="dialogue-text">
          "{{ chatStore.lastTtsText }}"
        </p>
        <p v-else class="dialogue-placeholder">
          Hola, soy Alexia. Puedes interactuar conmigo escribiendo tu mensaje abajo. Te responderé en tiempo real con expresiones visuales y síntesis de voz.
        </p>

        <div v-if="chatStore.lastTtsText" class="dialogue-actions">
          <button
            class="btn-repeat-speech"
            title="Escuchar de nuevo con voz del navegador"
            :disabled="isSpeaking"
            @click="speakCurrentText"
          >
            <Volume2 :size="15" />
            <span>{{ isSpeaking ? 'Hablando...' : 'Escuchar de nuevo' }}</span>
          </button>

          <button
            v-if="isSpeaking"
            class="btn-stop-speech"
            title="Detener lectura"
            @click="stopSpeech"
          >
            <Square :size="14" />
            <span>Detener</span>
          </button>
        </div>
      </div>

      <!-- Formulario de Entrada y Preguntas Rápidas -->
      <div class="interaction-container">
        <form @submit.prevent="handleInteract" class="interaction-form">
          <input
            v-model="userQuery"
            type="text"
            maxlength="1000"
            placeholder="Pregúntale a Alexia (ej. ¿cómo tramito mi cambio de nombre?)..."
            class="interaction-input"
            :disabled="chatStore.loading"
          />
          <button
            type="submit"
            class="btn-interact"
            :disabled="chatStore.loading || !userQuery.trim()"
          >
            <Send :size="18" />
            <span>{{ chatStore.loading ? 'Pensando...' : 'Preguntar' }}</span>
          </button>
        </form>

        <div class="quick-chips">
          <span class="chips-label">Prueba con:</span>
          <button
            class="chip-btn"
            @click="sendQuickAvatarQuery('¿Cuáles son los pasos para la corrección de sexo en mi documento de identidad?')"
          >
            Corrección de sexo en notaría
          </button>
          <button
            class="chip-btn"
            @click="sendQuickAvatarQuery('¿Qué debo saber antes de empezar una terapia hormonal?')"
          >
            Terapia hormonal afirmativa
          </button>
          <button
            class="chip-btn"
            @click="sendQuickAvatarQuery('Me siento muy sola y triste hoy')"
          >
            Apoyo emocional
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import {
  Sparkles,
  Send,
  Volume2,
  VolumeX,
  Square,
  ShieldAlert,
} from '@lucide/vue'

const chatStore = useChatStore()
const userQuery = ref('')
const isSpeaking = ref(false)
const soundEnabled = ref(true)

const expressionLabel = computed(() => {
  switch (chatStore.activeExpression) {
    case 'EMPATHETIC':
      return 'Expresión Empática y Cálida'
    case 'SUPPORTIVE':
      return 'Expresión de Apoyo y Respaldo'
    case 'INFORMATIVE':
      return 'Expresión Analítica e Informativa'
    default:
      return 'Expresión Neutral y Receptiva'
  }
})

function speakCurrentText() {
  if (!chatStore.lastTtsText || !soundEnabled.value || !('speechSynthesis' in window)) {
    return
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(chatStore.lastTtsText)
  utterance.lang = 'es-CO'
  utterance.rate = 1.0
  utterance.pitch = 1.05

  // Intentar seleccionar una voz femenina en español si está disponible en el navegador
  const voices = window.speechSynthesis.getVoices()
  const esVoice = voices.find(
    (v) =>
      v.lang.startsWith('es') &&
      (v.name.toLowerCase().includes('sabina') ||
        v.name.toLowerCase().includes('paulina') ||
        v.name.toLowerCase().includes('monica') ||
        v.name.toLowerCase().includes('helena') ||
        v.name.toLowerCase().includes('female'))
  ) || voices.find((v) => v.lang.startsWith('es'))

  if (esVoice) {
    utterance.voice = esVoice
  }

  utterance.onstart = () => {
    isSpeaking.value = true
  }
  utterance.onend = () => {
    isSpeaking.value = false
  }
  utterance.onerror = () => {
    isSpeaking.value = false
  }

  window.speechSynthesis.speak(utterance)
}

function stopSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  isSpeaking.value = false
}

async function handleInteract() {
  if (!userQuery.value.trim() || chatStore.loading) return
  const q = userQuery.value
  userQuery.value = ''
  stopSpeech()

  const res = await chatStore.interactWithAvatar(q)
  if (res && res.tts_clean_text && soundEnabled.value) {
    speakCurrentText()
  }
}

function sendQuickAvatarQuery(query: string) {
  userQuery.value = query
  handleInteract()
}

onMounted(() => {
  // Inicializar voces del navegador si aún no se han cargado
  if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      // Voces cargadas en background
    }
  }
})

onUnmounted(() => {
  stopSpeech()
})
</script>

<style scoped>
.avatar-page {
  max-width: 860px;
  margin: 0 auto;
}

.avatar-stage-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
}

/* Escenario Viewport */
.stage-viewport {
  height: 420px;
  background: radial-gradient(circle at 50% 40%, #1e1b4b 0%, #0f172a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: background 0.8s ease;
}

/* Temas según Expresión Visual */
.stage--empathetic {
  background: radial-gradient(circle at 50% 40%, #3b0764 0%, #0f172a 100%);
}

.stage--supportive {
  background: radial-gradient(circle at 50% 40%, #0c4a6e 0%, #0f172a 100%);
}

.stage--informative {
  background: radial-gradient(circle at 50% 40%, #1e1b4b 0%, #090d16 100%);
}

/* Auras */
.aura-outer {
  position: absolute;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(124, 58, 237, 0) 70%);
  animation: pulse-slow 4s infinite ease-in-out;
}

.aura-middle {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.35) 0%, rgba(167, 139, 250, 0) 70%);
  animation: pulse-slow 3s infinite ease-in-out reverse;
}

@keyframes pulse-slow {
  0%, 100% { transform: scale(0.9); opacity: 0.5; }
  50% { transform: scale(1.15); opacity: 0.9; }
}

/* Silueta */
.avatar-silhouette {
  position: relative;
  width: 150px;
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.avatar-halo {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(196, 181, 253, 0.4);
  box-shadow: 0 0 25px rgba(139, 92, 246, 0.5);
  animation: rotate-halo 10s linear infinite;
}

@keyframes rotate-halo {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.avatar-core {
  width: 110px;
  height: 110px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 35px rgba(139, 92, 246, 0.7);
  transition: transform 0.3s;
}

.core-icon {
  color: white;
  animation: float-sparkle 3s infinite alternate ease-in-out;
}

@keyframes float-sparkle {
  0% { transform: scale(0.95); opacity: 0.85; }
  100% { transform: scale(1.08); opacity: 1; }
}

.avatar-eyes {
  position: absolute;
  top: 50px;
  display: flex;
  gap: 22px;
}

.eye {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 8px white;
  animation: blink 4s infinite;
}

@keyframes blink {
  0%, 96%, 100% { transform: scaleY(1); }
  98% { transform: scaleY(0.1); }
}

/* Expression Badge */
.expression-badge {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 5;
}

.expr-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a78bfa;
}

.badge--empathetic .expr-dot { background: #f472b6; }
.badge--supportive .expr-dot { background: #38bdf8; }
.badge--informative .expr-dot { background: #818cf8; }

.expr-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* Speech Waves */
.speech-waves-container {
  position: absolute;
  bottom: 2rem;
  display: flex;
  gap: 0.4rem;
  align-items: flex-end;
  height: 30px;
  opacity: 0.3;
  transition: opacity 0.2s;
}

.speech-waves-container.speaking-active {
  opacity: 1;
}

.wave {
  width: 5px;
  background: #38bdf8;
  border-radius: 999px;
  height: 8px;
}

.speaking-active .wave-1 { animation: wave 0.8s infinite alternate ease-in-out 0.1s; }
.speaking-active .wave-2 { animation: wave 0.8s infinite alternate ease-in-out 0.3s; }
.speaking-active .wave-3 { animation: wave 0.8s infinite alternate ease-in-out 0.2s; }
.speaking-active .wave-4 { animation: wave 0.8s infinite alternate ease-in-out 0.4s; }
.speaking-active .wave-5 { animation: wave 0.8s infinite alternate ease-in-out 0.15s; }
.speaking-active .wave-6 { animation: wave 0.8s infinite alternate ease-in-out 0.35s; }

@keyframes wave {
  from { height: 6px; }
  to { height: 26px; }
}

.stage-audio-controls {
  position: absolute;
  bottom: 1.25rem;
  right: 1.25rem;
  z-index: 5;
}

.btn-audio-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #94a3b8;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-audio-toggle.active {
  color: white;
  border-color: rgba(56, 189, 248, 0.5);
}

/* Crisis Banner */
.avatar-crisis-banner {
  background: #fff1f2;
  border-bottom: 2px solid #f43f5e;
  padding: 0.85rem 1.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #9f1239;
  font-size: 0.88rem;
}

.crisis-icon {
  color: #e11d48;
  flex-shrink: 0;
}

.crisis-banner-content {
  flex: 1;
}

.btn-quick-call {
  background: #e11d48;
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
}

/* Dialogue Box */
.dialogue-box {
  padding: 1.75rem 2rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
}

.dialogue-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dialogue-speaker {
  font-size: 0.82rem;
  font-weight: 800;
  color: #7c3aed;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.speaking-tag {
  font-size: 0.72rem;
  color: #0284c7;
  font-weight: 600;
}

.dialogue-text {
  font-size: 1.15rem;
  line-height: 1.65;
  color: #0f172a;
  font-weight: 500;
  font-style: italic;
}

.dialogue-placeholder {
  color: #64748b;
  font-size: 0.98rem;
  line-height: 1.6;
}

.dialogue-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-repeat-speech {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #ede9fe;
  color: #6d28d9;
  border: 1px solid #ddd6fe;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-stop-speech {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

/* Interaction Form */
.interaction-container {
  padding: 1.5rem 2rem 2rem;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.interaction-form {
  display: flex;
  gap: 0.75rem;
}

.interaction-input {
  flex: 1;
  padding: 0.85rem 1.25rem;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  font-size: 0.95rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.2s;
}

.interaction-input:focus {
  background: white;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.btn-interact {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white;
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: 14px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-interact:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(124, 58, 237, 0.4);
}

.btn-interact:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* Quick Chips */
.quick-chips {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.chips-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
}

.chip-btn {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.chip-btn:hover {
  background: #ede9fe;
  color: #7c3aed;
  border-color: #c4b5fd;
}
</style>
