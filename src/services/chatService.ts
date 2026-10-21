import http from '@/lib/http'
import type { ChatMessage, ChatHistoryResponse } from '@/types/rag'

export class ChatService {
  /**
   * Envía un mensaje en lenguaje natural al asistente RAG Alexia.
   * Dispara búsqueda semántica de fragmentos y evaluación de crisis prioridad cero.
   */
  async sendMessage(
    message: string,
    sessionId?: string | null,
    channel: string = 'PORTAL_WEB'
  ): Promise<ChatMessage> {
    const payload: Record<string, any> = {
      message: message.trim(),
      channel,
    }
    if (sessionId) {
      payload.session_id = sessionId
    }

    return await http.post<ChatMessage>('/api/v1/chat/message/', payload)
  }

  /**
   * Interacción especializada con el Avatar interactivo de Alexia.
   * Retorna tts_clean_text optimizado para síntesis de voz y suggested_expression.
   */
  async interactWithAvatar(
    message: string,
    sessionId?: string | null
  ): Promise<ChatMessage> {
    const payload: Record<string, any> = {
      message: message.trim(),
      channel: 'ALEXIA_AVATAR',
    }
    if (sessionId) {
      payload.session_id = sessionId
    }

    return await http.post<ChatMessage>('/api/v1/alexia/interact/', payload)
  }

  /**
   * Consulta el historial previo de una sesión de conversación anónima.
   */
  async getHistory(sessionId: string): Promise<ChatHistoryResponse> {
    return await http.get<ChatHistoryResponse>(`/api/v1/chat/history/${sessionId}/`)
  }
}

export const chatService = new ChatService()
export default chatService
