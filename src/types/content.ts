export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  order: number
  is_active: boolean
  articles_count?: number
  created_at?: string
  updated_at?: string
}

export interface Tag {
  id: number
  name: string
  slug: string
  created_at?: string
}

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface Article {
  id: number
  title: string
  slug: string
  summary: string
  body?: string
  featured_image?: string | null
  category: number | Category
  category_name?: string
  category_slug?: string
  tags?: Tag[]
  status: ArticleStatus
  status_display: string
  views_count: number
  reading_time_minutes: number
  author_name?: string
  published_at?: string | null
  created_at: string
  updated_at?: string
}

export interface ArticleWritePayload {
  title: string
  summary: string
  body: string
  category: number
  tags?: number[]
  status?: ArticleStatus
  featured_image?: File | string | null
}

export type ResourceType = 'PDF' | 'INFOGRAPHIC' | 'EXTERNAL_LINK' | 'AUDIO'

export interface Resource {
  id: number
  title: string
  description?: string
  resource_type: ResourceType
  resource_type_display?: string
  file?: string | null
  external_url?: string | null
  category?: number | Category | null
  category_name?: string
  is_featured: boolean
  download_count: number
  created_at?: string
  updated_at?: string
}

export interface ResourceWritePayload {
  title: string
  description?: string
  resource_type: ResourceType
  category?: number | null
  external_url?: string
  is_featured?: boolean
  file?: File | null
}

export interface CategoryWritePayload {
  name: string
  description?: string
  icon?: string
  order?: number
  is_active?: boolean
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
