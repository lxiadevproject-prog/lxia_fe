import http from '@/lib/http'
import type {
  KnowledgeDocument,
  DocumentCreatePayload,
  TestSearchResult,
} from '@/types/rag'

export class RAGService {
  /**
   * Obtiene la lista de documentos de la base de conocimiento con filtros opcionales.
   */
  async getDocuments(params?: {
    status?: string
    document_type?: string
    search?: string
  }): Promise<{ count: number; results: KnowledgeDocument[] }> {
    const res = await http.get<any>('/api/v1/knowledge/documents/', { params })
    if (Array.isArray(res)) {
      return { count: res.length, results: res }
    }
    return {
      count: res?.count || 0,
      results: res?.results || [],
    }
  }

  /**
   * Obtiene el detalle completo de un documento, incluyendo texto extraído y mensajes de error.
   */
  async getDocument(id: number): Promise<KnowledgeDocument> {
    return await http.get<KnowledgeDocument>(`/api/v1/knowledge/documents/${id}/`)
  }

  /**
   * Registra un nuevo documento en la base de conocimiento.
   * Admite subida liviana con URLs de Firebase Storage (0 MB en Render) o texto manual.
   */
  async createDocument(payload: DocumentCreatePayload): Promise<KnowledgeDocument> {
    return await http.post<KnowledgeDocument>('/api/v1/knowledge/documents/', payload)
  }

  /**
   * Elimina un documento de conocimiento y sus fragmentos vectoriales asociados.
   */
  async deleteDocument(id: number): Promise<void> {
    await http.delete(`/api/v1/knowledge/documents/${id}/`)
  }

  /**
   * Dispara el pipeline de indexación (extracción de texto, chunking y generación de embeddings).
   */
  async triggerIndex(id: number): Promise<{ success: boolean; chunks_count: number; message: string }> {
    return await http.post<{ success: boolean; chunks_count: number; message: string }>(
      `/api/v1/knowledge/documents/${id}/index/`
    )
  }

  /**
   * Realiza una prueba de similitud vectorial en vivo sobre los fragmentos indexados.
   */
  async testSearch(
    query: string,
    topK: number = 4,
    threshold: number = 0.15
  ): Promise<{ query: string; total_matches: number; results: TestSearchResult[] }> {
    return await http.post<{ query: string; total_matches: number; results: TestSearchResult[] }>(
      '/api/v1/knowledge/test-search/',
      {
        query: query.trim(),
        top_k: topK,
        threshold,
      }
    )
  }
}

export const ragService = new RAGService()
export default ragService
