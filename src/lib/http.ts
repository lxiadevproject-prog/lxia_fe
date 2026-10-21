import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import storage from './storage'

class HttpClient {
  private static instance: HttpClient
  private client: AxiosInstance
  public baseUrl: string

  constructor() {
    // Selección inteligente de URL de la API (Local vs Remoto)
    const isProd = import.meta.env.PROD
    const localUrl = import.meta.env.VITE_API_URL_LOCAL || 'http://localhost:8000'
    const remoteUrl = import.meta.env.VITE_API_URL_REMOTE || 'https://lxia-be.onrender.com'
    
    this.baseUrl = isProd ? remoteUrl : localUrl

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    this.setupInterceptors()
  }

  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient()
    }
    return HttpClient.instance
  }

  private setupInterceptors(): void {
    // 1. Interceptor de Solicitud (Inyecta Token de Django DRF)
    this.client.interceptors.request.use(
      (config) => {
        const token = storage.getToken()
        if (token && config.headers) {
          config.headers.Authorization = `Token ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // 2. Interceptor de Respuesta (Manejo de Errores y 401)
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response.data,
      (error) => {
        if (error.response) {
          const status = error.response.status
          const data = error.response.data

          // Si el token expiró o es inválido en área administrativa
          if (status === 401 && window.location.pathname.startsWith('/admin')) {
            storage.clearAuth()
            window.location.href = '/login?expired=1'
          }

          // Extraer mensaje amigable de Django DRF
          const message =
            data?.detail ||
            data?.error ||
            (typeof data === 'string' ? data : null) ||
            (data ? Object.values(data).flat().join(' ') : 'Error inesperado del servidor')

          return Promise.reject(new Error(message))
        } else if (error.request) {
          return Promise.reject(
            new Error(
              'No fue posible comunicarse con el servidor backend. Verifique su conexión o intente más tarde.'
            )
          )
        }
        return Promise.reject(error)
      }
    )
  }

  // --- Métodos HTTP con Tipado Estricto ---

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await this.client.get(url, config)) as T
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await this.client.post(url, data, config)) as T
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await this.client.put(url, data, config)) as T
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await this.client.patch(url, data, config)) as T
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await this.client.delete(url, config)) as T
  }

  async postFormData<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    return (await this.client.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    })) as T
  }

  // Cambiar URL de la API dinámicamente si se desea probar otro host
  setBaseUrl(newUrl: string): void {
    this.baseUrl = newUrl
    this.client.defaults.baseURL = newUrl
  }
}

export const http = HttpClient.getInstance()
export default http
