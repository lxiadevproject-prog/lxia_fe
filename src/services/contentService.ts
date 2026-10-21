import http from '@/lib/http'
import type {
  Category,
  CategoryWritePayload,
  Tag,
  Article,
  ArticleWritePayload,
  Resource,
  ResourceWritePayload,
  PaginatedResponse,
} from '@/types/content'

export class ContentService {
  // ==========================================
  // CATEGORÍAS
  // ==========================================

  /**
   * Obtiene la lista de categorías temáticas.
   */
  async getCategories(params?: { search?: string }): Promise<Category[]> {
    const res = await http.get<PaginatedResponse<Category> | Category[]>('/api/v1/content/categories/', { params })
    if (Array.isArray(res)) return res
    return res?.results || []
  }

  /**
   * Obtiene el detalle de una categoría por su slug.
   */
  async getCategory(slug: string): Promise<Category> {
    return await http.get<Category>(`/api/v1/content/categories/${slug}/`)
  }

  /**
   * Crea una nueva categoría (CMS / Superadmin / Content Manager).
   */
  async createCategory(payload: CategoryWritePayload): Promise<Category> {
    return await http.post<Category>('/api/v1/content/categories/', payload)
  }

  /**
   * Actualiza una categoría existente por su slug.
   */
  async updateCategory(slug: string, payload: Partial<CategoryWritePayload>): Promise<Category> {
    return await http.patch<Category>(`/api/v1/content/categories/${slug}/`, payload)
  }

  /**
   * Elimina una categoría por su slug.
   */
  async deleteCategory(slug: string): Promise<void> {
    await http.delete(`/api/v1/content/categories/${slug}/`)
  }

  // ==========================================
  // ETIQUETAS (TAGS)
  // ==========================================

  async getTags(): Promise<Tag[]> {
    const res = await http.get<PaginatedResponse<Tag> | Tag[]>('/api/v1/content/tags/')
    if (Array.isArray(res)) return res
    return res?.results || []
  }

  // ==========================================
  // ARTÍCULOS - PORTAL PÚBLICO (RF-CNT-01, 04)
  // ==========================================

  /**
   * Obtiene artículos publicados para el portal web con soporte de búsqueda y filtros.
   */
  async getPublicArticles(params?: {
    category__slug?: string
    tags__slug?: string
    search?: string
    ordering?: string
    page?: number
  }): Promise<{ count: number; results: Article[] }> {
    const res = await http.get<PaginatedResponse<Article> | Article[]>('/api/v1/content/articles/', { params })
    if (Array.isArray(res)) {
      return { count: res.length, results: res }
    }
    return {
      count: res?.count || 0,
      results: res?.results || [],
    }
  }

  /**
   * Obtiene el detalle completo del artículo por su slug y dispara la contabilización de lectura.
   */
  async getPublicArticleDetail(slug: string): Promise<Article> {
    return await http.get<Article>(`/api/v1/content/articles/${slug}/`)
  }

  // ==========================================
  // ARTÍCULOS - PANEL ADMINISTRATIVO CMS (RF-CNT-03)
  // ==========================================

  /**
   * Obtiene todos los artículos (borradores, publicados y archivados) para el CMS.
   */
  async getCmsArticles(params?: {
    status?: string
    category?: number
    search?: string
    page?: number
  }): Promise<{ count: number; results: Article[] }> {
    const res = await http.get<PaginatedResponse<Article> | Article[]>('/api/v1/content/manage/articles/', { params })
    if (Array.isArray(res)) {
      return { count: res.length, results: res }
    }
    return {
      count: res?.count || 0,
      results: res?.results || [],
    }
  }

  /**
   * Obtiene el detalle de un artículo en el CMS por su ID.
   */
  async getCmsArticleDetail(id: number): Promise<Article> {
    return await http.get<Article>(`/api/v1/content/manage/articles/${id}/`)
  }

  /**
   * Crea un nuevo artículo en borrador o publicado desde el CMS.
   */
  async createCmsArticle(payload: ArticleWritePayload): Promise<Article> {
    return await http.post<Article>('/api/v1/content/manage/articles/', payload)
  }

  /**
   * Actualiza un artículo en el CMS.
   */
  async updateCmsArticle(id: number, payload: Partial<ArticleWritePayload>): Promise<Article> {
    return await http.patch<Article>(`/api/v1/content/manage/articles/${id}/`, payload)
  }

  /**
   * Elimina un artículo del CMS.
   */
  async deleteCmsArticle(id: number): Promise<void> {
    await http.delete(`/api/v1/content/manage/articles/${id}/`)
  }

  /**
   * Publica inmediatamente un artículo.
   */
  async publishCmsArticle(id: number): Promise<Article> {
    return await http.post<Article>(`/api/v1/content/manage/articles/${id}/publish/`)
  }

  /**
   * Archiva un artículo retirándolo de la vista ciudadana.
   */
  async archiveCmsArticle(id: number): Promise<Article> {
    return await http.post<Article>(`/api/v1/content/manage/articles/${id}/archive/`)
  }

  // ==========================================
  // RECURSOS DESCARGABLES (PDF, GUÍAS, AUDIOS)
  // ==========================================

  /**
   * Lista recursos descargables con filtros temáticos.
   */
  async getResources(params?: {
    category?: number
    category__slug?: string
    resource_type?: string
    is_featured?: boolean
    search?: string
  }): Promise<{ count: number; results: Resource[] }> {
    const res = await http.get<PaginatedResponse<Resource> | Resource[]>('/api/v1/content/resources/', { params })
    if (Array.isArray(res)) {
      return { count: res.length, results: res }
    }
    return {
      count: res?.count || 0,
      results: res?.results || [],
    }
  }

  /**
   * Registra y contabiliza la descarga de un recurso.
   */
  async trackDownload(id: number): Promise<{ detail: string; download_count: number }> {
    return await http.post<{ detail: string; download_count: number }>(`/api/v1/content/resources/${id}/track-download/`)
  }

  /**
   * Crea un nuevo recurso (soporta URL externa o archivo).
   */
  async createResource(payload: ResourceWritePayload): Promise<Resource> {
    return await http.post<Resource>('/api/v1/content/resources/', payload)
  }

  /**
   * Actualiza un recurso existente.
   */
  async updateResource(id: number, payload: Partial<ResourceWritePayload>): Promise<Resource> {
    return await http.patch<Resource>(`/api/v1/content/resources/${id}/`, payload)
  }

  /**
   * Elimina un recurso descargable.
   */
  async deleteResource(id: number): Promise<void> {
    await http.delete(`/api/v1/content/resources/${id}/`)
  }
}

export const contentService = new ContentService()
export default contentService
