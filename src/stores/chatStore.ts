import { defineStore } from 'pinia'
import { ref } from 'vue'
import storage from '@/lib/storage'
import chatService from '@/services/chatService'
import type { ChatMessage, EmergencyHotline, AvatarExpression } from '@/types/rag'

export const useChatStore = defineStore('chat', () => {
  const sessionId = ref<string | null>(storage.getChatSessionId())
  const messages = ref<ChatMessage[]>([])
  const loading = ref<boolean>(false)
  const isCrisisActive = ref<boolean>(false)
  const emergencyHotlines = ref<EmergencyHotline[]>([])
  const activeExpression = ref<AvatarExpression>('NEUTRAL')
  const lastTtsText = ref<string>('')

  // --- Enviar mensaje regular al Chat RAG ---
  async function sendMessage(text: string, channel: string = 'PORTAL_WEB'): Promise<ChatMessage | null> {
    if (!text.trim()) return null

    // 1. Agregar mensaje local del usuario inmediatamente para fluidez
    const userMsg: ChatMessage = {
      session_id: sessionId.value || '',
      role: 'USER',
      content: text.trim(),
      is_crisis_detected: false,
      created_at: new Date().toISOString(),
    }
    messages.value.push(userMsg)
    loading.value = true

    try {
      const res = await chatService.sendMessage(text, sessionId.value, channel)

      if (res) {
        // Actualizar sesión activa
        if (res.session_id) {
          sessionId.value = res.session_id
          storage.setChatSessionId(res.session_id)
        }

        // Alerta de crisis inmediata (Prioridad Cero - RF-RAG-09)
        if (res.is_crisis_detected) {
          isCrisisActive.value = true
          emergencyHotlines.value = res.emergency_hotlines || []
        }

        if (res.suggested_expression) {
          activeExpression.value = res.suggested_expression
        }
        if (res.tts_clean_text) {
          lastTtsText.value = res.tts_clean_text
        }

        messages.value.push(res)
        return res
      }
      return null
    } catch (err: any) {
      console.error('Error enviando mensaje al chat:', err)
      messages.value.push({
        session_id: sessionId.value || '',
        role: 'ASSISTANT',
        content:
          'Lo siento, ocurrió una interrupción de conexión con el servicio. Por favor intenta formular tu consulta nuevamente.',
        is_crisis_detected: false,
        created_at: new Date().toISOString(),
      })
      return null
    } finally {
      loading.value = false
    }
  }

  // --- Interacción dedicada con Avatar Alexia ---
  async function interactWithAvatar(text: string): Promise<ChatMessage | null> {
    if (!text.trim()) return null

    const userMsg: ChatMessage = {
      session_id: sessionId.value || '',
      role: 'USER',
      content: text.trim(),
      is_crisis_detected: false,
      created_at: new Date().toISOString(),
    }
    messages.value.push(userMsg)
    loading.value = true

    try {
      const res = await chatService.interactWithAvatar(text, sessionId.value)

      if (res) {
        if (res.session_id) {
          sessionId.value = res.session_id
          storage.setChatSessionId(res.session_id)
        }
        if (res.is_crisis_detected) {
          isCrisisActive.value = true
          emergencyHotlines.value = res.emergency_hotlines || []
        }
        if (res.suggested_expression) {
          activeExpression.value = res.suggested_expression
        }
        if (res.tts_clean_text) {
          lastTtsText.value = res.tts_clean_text
        }

        messages.value.push(res)
        return res
      }
      return null
    } catch (err) {
      console.error('Error en interacción con Alexia:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // --- Recuperar historial previo si existe sesión ---
  async function fetchHistory(sid: string): Promise<void> {
    try {
      const res = await chatService.getHistory(sid)
      if (res && res.messages) {
        messages.value = res.messages.map((m) => ({
          id: m.id,
          session_id: res.session_id,
          role: m.role,
          content: m.content,
          citations: m.citations,
          is_crisis_detected: m.is_crisis_detected,
          created_at: m.created_at,
        }))
      }
    } catch (err) {
      console.warn('No se pudo cargar el historial de la sesión:', err)
    }
  }

  // --- Descartar alerta de crisis ---
  function dismissCrisisAlert(): void {
    isCrisisActive.value = false
  }

  // --- Limpiar sesión ---
  function resetSession(): void {
    sessionId.value = null
    messages.value = []
    isCrisisActive.value = false
    emergencyHotlines.value = []
    activeExpression.value = 'NEUTRAL'
    lastTtsText.value = ''
    storage.clearChatSession()
  }

  return {
    sessionId,
    messages,
    loading,
    isCrisisActive,
    emergencyHotlines,
    activeExpression,
    lastTtsText,
    sendMessage,
    interactWithAvatar,
    fetchHistory,
    dismissCrisisAlert,
    resetSession,
  }
})
