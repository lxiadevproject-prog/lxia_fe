export type DocumentStatus = 'PENDING' | 'EXTRACTING' | 'INDEXED' | 'FAILED' | 'ARCHIVED'
export type DocumentType = 'GUIDE' | 'PROTOCOL' | 'LEGAL' | 'WORKSHOP' | 'FAQ' | 'OTHER'
export type IngestionSource = 'MANUAL_TEXT' | 'FIREBASE_DIRECT' | 'CLOUD_FUNCTION_WEBHOOK' | 'LOCAL_FILE'

export interface KnowledgeDocument {
  id: number
  title: string
  slug: string
  description?: string
  document_type: DocumentType
  document_type_display: string
  ingestion_source: IngestionSource
  ingestion_source_display: string
  file_url?: string
  storage_path?: string
  file_size_bytes: number
  status: DocumentStatus
  status_display: string
  chunks_count: number
  raw_text?: string
  error_message?: string
  uploaded_by_username?: string
  created_at: string
  updated_at: string
}

export interface DocumentCreatePayload {
  title: string
  description?: string
  document_type: DocumentType
  ingestion_source: IngestionSource
  file_url?: string
  storage_path?: string
  file_size_bytes?: number
  raw_text?: string
}

export interface Citation {
  document_id?: number
  document_title: string
  chunk_id?: number
  chunk_index?: number
  page?: number
  section?: string
  snippet: string
}

export interface EmergencyHotline {
  name: string
  phone: string
  channel: string
  hours: string
  description: string
  is_toll_free: boolean
}

export type AvatarExpression = 'EMPATHETIC' | 'SUPPORTIVE' | 'INFORMATIVE' | 'NEUTRAL'

export interface ChatMessage {
  id?: number
  session_id: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  citations?: Citation[]
  is_crisis_detected: boolean
  suggested_expression?: AvatarExpression
  tts_clean_text?: string
  latency_ms?: number
  emergency_hotlines?: EmergencyHotline[]
  created_at?: string
}

export interface ChatHistoryResponse {
  session_id: string
  channel: string
  is_anonymous: boolean
  created_at: string
  updated_at: string
  messages: Array<{
    id: number
    role: 'USER' | 'ASSISTANT' | 'SYSTEM'
    content: string
    citations: Citation[]
    is_crisis_detected: boolean
    metadata: Record<string, any>
    created_at: string
  }>
}

export interface TestSearchResult {
  chunk_id: number
  document_id: number
  document_title: string
  score: number
  page: number
  content_snippet: string
}
