# 📐 Plan de Implementación y Arquitectura del Frontend (`lxia_fe`)

> **Proyecto**: Plataforma TransLúcidas / LXIA Frontend  
> **Ubicación**: `C:/Users/Lenovo/WebstormProjects/lxia_fe`  
> **Proyecto de Referencia**: `C:/Users/Lenovo/Documents/rehabilitacion/telerehabilitation_admin`  
> **Backend de Integración**: `lxia_be` (`http://localhost:8000` / `https://lxia-be.onrender.com`)  
> **Stack Técnico**: Vue 3.5+, Vite 8, TypeScript, Vue Router 4, Pinia, Lucide Icons

---

## 1. Diagnóstico y Análisis del Proyecto de Referencia (`telerehabilitation_admin`)

Tras auditar la arquitectura de `telerehabilitation_admin`, se identificaron los siguientes patrones clave que adaptaremos y modernizaremos para `lxia_fe`:

| Componente | Patrón en `telerehabilitation_admin` | Evolución Moderna en `lxia_fe` |
| :--- | :--- | :--- |
| **Framework y Build** | Vue 3 con Webpack / Vue CLI, JavaScript | **Vue 3.5+ con Vite 8, TypeScript y SFC `<script setup lang="ts">`** |
| **Cliente HTTP (`lib/http.js`)** | Singleton con selección de entorno (`localhost` vs `render`), `Token <key>` en headers, métodos `authGet`, `authPost`, etc. | **`src/lib/http.ts`**: Cliente tipado con TypeScript, detección automática de entorno (`import.meta.env`), interceptores de error y tipado estricto de respuestas |
| **Almacenamiento (`lib/storage.js`)** | LocalStorage para token, usuario y grupos | **`src/lib/storage.ts`** + **`src/stores/auth.ts` (Pinia)** para estado reactivo centralizado |
| **Enrutamiento y Guardas** | `vue-router` con meta `requiresAuth` y control de grupos (`Admin`, `Therapist`) | **`src/router/index.ts`** con guardas tipadas por roles RBAC (`SUPERADMIN`, `CONTENT_MANAGER`, `RESEARCHER`) y rutas públicas |
| **Layouts** | Layout único protegido (`SignedIn.vue`) con `navbar` y `sidebar` dinámico | **Doble Layout**: `PublicLayout.vue` (para portal ciudadano, chat y avatar) y `AdminLayout.vue` (para panel administrativo) |

---

## 2. Alcance Funcional y Módulos a Integrar

El frontend dará soporte integral a todos los endpoints desarrollados en el backend `lxia_be`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LXIA FRONTEND (lxia_fe)                         │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│     PORTAL PÚBLICO CIUDADANO    │     │       PANEL ADMINISTRATIVO      │
│  (Personas Trans y Cuidadores)  │     │   (Colaboradores / Investigac.) │
├─────────────────────────────────┤     ├─────────────────────────────────┤
│ • Home y Guías de Autocuidado   │     │ • Autenticación y Perfil        │
│ • Lector de Artículos Móvil     │     │ • Gestión de Usuarios (RBAC)    │
│ • Directorio de Recursos / PDFs │     │ • CMS de Contenidos (Artículos) │
│ • Chat Asistente RAG con Citas  │     │ • Base de Conocimiento RAG      │
│ • Banner Prioridad Cero Crisis  │     │ • Consola Test-Search Similitud │
│ • Avatar Alexia (TTS / Emoción) │     │ • Auditoría Webhook Cloud Func  │
└─────────────────────────────────┘     └─────────────────────────────────┘
```

---

## 3. Estructura de Directorios Propuesta

```text
lxia_fe/src/
├── assets/                  # Estilos globales, variables CSS, fuentes e ilustraciones
├── components/              # Componentes de interfaz reutilizables
│   ├── common/              # Botones, Modales, Tablas paginadas, Badges, Loaders
│   ├── layout/              # Navbar.vue, Sidebar.vue, PublicHeader.vue, Footer.vue
│   ├── chat/                # MessageBubble.vue, CitationCard.vue, CrisisAlert.vue
│   └── cms/                 # ArticleCard.vue, ResourceCard.vue, CategoryPill.vue
├── layouts/                 # Plantillas de layout (AdminLayout.vue, PublicLayout.vue)
├── lib/                     # Utilidades fundamentales
│   ├── http.ts              # Cliente HTTP singleton con token interceptor
│   ├── storage.ts           # Gestión tipada de LocalStorage / SessionStorage
│   └── formatters.ts        # Fechas, tamaños de archivo, estimación de lectura
├── router/                  # Enrutador y Navigation Guards
│   └── index.ts             # Rutas públicas y protegidas con roles
├── services/                # Servicios API desacoplados por dominio
│   ├── authService.ts       # Login, Me, Change Password, Users CRUD
│   ├── contentService.ts    # Categories, Articles, Resources, Tags
│   └── ragService.ts        # Chat, Alexia Avatar, Knowledge Docs, Test Search
├── stores/                  # Stores de estado reactivo global (Pinia)
│   ├── authStore.ts         # Token, usuario actual, rol activo y permisos
│   └── chatStore.ts         # Historial conversacional, session_id activo
├── types/                   # Tipados TypeScript de contratos de la API
│   ├── auth.ts              # User, Role, LoginPayload, AuthResponse
│   ├── content.ts           # Category, Tag, Article, Resource
│   └── rag.ts               # KnowledgeDocument, ChatMessage, Citation, Hotline
└── views/                   # Vistas principales de la aplicación
    ├── auth/                # LoginView.vue
    ├── public/              # HomeView.vue, ArticlesView.vue, ChatView.vue, AlexiaView.vue
    └── admin/               # DashboardView.vue, UsersView.vue, CmsView.vue, KnowledgeView.vue
```

---

## 4. Fases Detalladas de Implementación

### 🚀 Fase 1: Cimientos, Dependencias y Capa HTTP
* **Tareas**:
  1. Instalar `vue-router@4`, `pinia`, `lucide-vue-next`.
  2. Crear archivo de variables de entorno `.env`:
     ```env
     VITE_API_URL_LOCAL=http://localhost:8000
     VITE_API_URL_REMOTE=https://lxia-be.onrender.com
     VITE_CLOUD_FUNCTION_WEBHOOK_SECRET=lxia-cloud-func-secret-key-2026
     ```
  3. Implementar `src/lib/storage.ts`: almacenamiento seguro de token, rol y sesión anónima de chat.
  4. Implementar `src/lib/http.ts`: cliente `Http` con:
     * Detección automática de entorno local/producción.
     * Header `Authorization: Token <key>`.
     * Manejo controlado de códigos de respuesta (401 redirige al login; 403 avisa permisos insuficientes).
  5. Crear `src/stores/authStore.ts` con Pinia para reactividad de sesión y roles.
  6. Configurar el sistema base de estilos (`src/assets/main.css`) con variables CSS y tema inclusivo.

---

### 🔐 Fase 2: Módulo 1 - Autenticación y Control de Acceso (RBAC) ✅ [COMPLETADA]
* **Endpoints Backend vinculados**:
  * `POST /api/v1/auth/login/`
  * `POST /api/v1/auth/logout/`
  * `GET /api/v1/auth/me/`
  * `POST /api/v1/auth/change-password/`
  * `GET/POST /api/v1/auth/users/` y `GET/PATCH/DELETE /api/v1/auth/users/{id}/`
* **Entregables Implementados y Validados**:
  1. **`src/services/authService.ts`**: Servicio centralizado con normalización de respuestas DRF (`normalizeUser`), tipado estricto y manejo de errores.
  2. **`src/stores/authStore.ts`**: Store Pinia con sincronización reactiva de sesión, getters de roles (`isSuperadmin`, `isContentManager`, `isResearcher`), y actualización de perfil.
  3. **`LoginView.vue`**: Interfaz con paleta TransLúcidas, botón de acceso rápido para pruebas institucionales (`admin`), validación de credenciales y redirección dinámica (`redirect` query param).
  4. **`UsersManagementView.vue`**:
     * Métricas en tiempo real (Total, Superadmins, Gestores, Investigadores).
     * Barra de búsqueda reactiva por nombre, email, usuario u organización.
     * Filtro por rol en pestañas (`Todos`, `Superadmins`, `Gestores`, `Investigadores`) y selector de estado.
     * Tabla con avatar dinámico, roles con color temático, toggle rápido de estado activo/inactivo.
     * Modal interactivo para crear usuarios con generador de contraseña segura aleatoria y asignación de rol.
     * Modal interactivo para editar datos de colaboradores.
     * Modal de confirmación para eliminación segura con protección contra auto-eliminación.
  5. **`ProfileView.vue`**: Pestañas de datos personales y cambio de contraseña con validación de coincidencia y longitud mínima de 8 caracteres.
  6. **Pruebas y Verificación**:
     * `npm run build` (`vue-tsc --build` + `vite build`) ejecutado con **0 errores de compilación**.
     * Pruebas integrales de API con `test_fe_be_auth.py` completadas con **100% de éxito (7/7 tests aprobados)**.

---

### 🌐 Fase 3: Módulo 2 - Portal Web Público & CMS de Contenidos ✅ [COMPLETADA]
* **Endpoints Backend vinculados**:
  * `GET/POST /api/v1/content/categories/` y `GET/PATCH/DELETE .../{slug}/`
  * `GET /api/v1/content/articles/` y `GET /api/v1/content/articles/{slug}/` (incremento automático de lectura)
  * `GET/POST /api/v1/content/resources/` y `POST .../{id}/track-download/`
  * `GET/POST/PATCH/DELETE /api/v1/content/manage/articles/` (CMS) + `publish/` + `archive/`
* **Entregables Implementados y Validados**:
  1. **`src/services/contentService.ts`**: Cliente tipado completo para Categorías, Artículos públicos, Gestión de Artículos CMS y Recursos con conteo atómico de lecturas y descargas.
  2. **`HomeView.vue`**: Portada dinámica con ejes temáticos activos, artículos recientes con tiempo de lectura, recursos destacados, banner de alerta de líneas de crisis (106, 123, Línea Púrpura) y accesos directos al Chat y Avatar de Alexia.
  3. **`ArticlesView.vue`**: Catálogo público con selector dinámico de categorías temáticas, búsqueda en vivo, ordenamiento (más recientes, más leídos, alfabético) y tarjetas optimizadas para bajo consumo de datos móviles (RF-CNT-04).
  4. **`ArticleDetailView.vue`**: Lectura inmersiva con renderizado de Markdown, badge de categoría, tiempo estimado, botón para compartir/copiar enlace al portapapeles, recordatorio de líneas de crisis y caja de llamada a la acción hacia Alexia.
  5. **`ResourcesView.vue`**: Biblioteca de descargables clasificada por tipo (`PDF`, `INFOGRAPHIC`, `EXTERNAL_LINK`, `AUDIO`), buscador en vivo y seguimiento en tiempo real del contador de descargas.
  6. **`CmsArticlesView.vue`**: Consola administrativa CMS con filtros de estado (`Borradores`, `Publicados`, `Archivados`), acciones directas de publicación/archivado con 1 clic, modal de creación/edición y confirmación de borrado.
  7. **`CmsCategoriesView.vue`**: Administración de categorías temáticas con slug automático, íconos representativos, orden y switch de activación.
  8. **`CmsResourcesView.vue`**: Gestión de recursos descargables mediante entrega liviana con enlaces de almacenamiento (Firebase / Web) y switch de recurso destacado.
  9. **Pruebas y Verificación**:
     * `npm run build` (`vue-tsc --build` + `vite build`) ejecutado con **0 errores de compilación** (1.44s).
     * Script de integración backend `test_fe_be_content.py`: **100% de éxito (7/7 tests aprobados)**.
     * Todas las rutas públicas y administrativas verificadas con HTTP 200 en el servidor Vite.

---

### 🤖 Fase 4: Módulo 3 - Asistente Conversacional & Avatar Alexia ✅ [COMPLETADA]
* **Endpoints Backend vinculados**:
  * `POST /api/v1/chat/message/`
  * `GET /api/v1/chat/history/{session_id}/`
  * `POST /api/v1/alexia/interact/`
* **Entregables Implementados y Validados**:
  1. **`src/services/chatService.ts`**: Cliente de mensajería para asistente RAG y avatar de Alexia con soporte para canales (`PORTAL_WEB`, `ALEXIA_AVATAR`).
  2. **`src/stores/chatStore.ts`**: Store Pinia con persistencia de `session_id` anónimo en `sessionStorage`, detección reactiva de crisis, gestión de hotlines de emergencia y estado del avatar.
  3. **`ChatView.vue`**:
     * Interfaz conversacional con sesión anónima, respetando la privacidad ciudadana (RF-OBS-02).
     * **Tarjeta de Crisis Prioridad Cero (RF-RAG-09)**: Al activarse una señal de crisis o violencia, despliega automáticamente el panel superior de alerta con botones de marcación directa a la **Línea 106**, **Línea 123** y **Línea Púrpura**.
     * **Citas Bibliográficas Desplegables (RF-RAG-07)**: Acordeón interactivo bajo cada respuesta mostrando documento fuente, página, sección y extracto en citas para auditoría y confianza.
     * Formateador de Markdown limpio y sugerencias rápidas de preguntas para inicio de conversación.
     * Auto-scroll reactivo e indicador animado de escritura.
  4. **`AlexiaAvatarView.vue`**:
     * Escenario visual del avatar con auras reactivas según la emoción sugerida por el backend (`EMPATHETIC`, `SUPPORTIVE`, `INFORMATIVE`).
     * Síntesis de voz automática en el navegador (Web Speech API) leyendo el texto fonético sin Markdown (`tts_clean_text`).
     * Ecualizador visual de ondas de audio animado durante la reproducción de voz.
     * Subtítulos de diálogo en tiempo real y controles de reproducción y silencio.
  5. **Pruebas y Verificación**:
     * `npm run build` (`vue-tsc --build` + `vite build`) ejecutado con **0 errores de compilación** (1.41s).
     * Script de integración backend `test_fe_be_chat.py`: **100% de éxito (4/4 tests aprobados)**, incluyendo la activación del detector de crisis y retorno de 5 líneas de ayuda.
     * Rutas `/chat` y `/alexia` verificadas con HTTP 200 en el servidor Vite.

---

### 📚 Fase 5: Módulo 3 (Admin) - Base de Conocimiento RAG & Similitud Vectorial ✅ [COMPLETADA]
* **Endpoints Backend vinculados**:
  * `GET/POST/DELETE /api/v1/knowledge/documents/`
  * `GET /api/v1/knowledge/documents/{id}/`
  * `POST /api/v1/knowledge/documents/{id}/index/`
  * `POST /api/v1/knowledge/test-search/`
  * `POST /api/v1/knowledge/webhook/document-extracted/`
* **Entregables Implementados y Validados**:
  1. **`src/types/rag.ts`**: Definición de interfaces para `KnowledgeDocument`, `DocumentCreatePayload`, `Citation`, `EmergencyHotline`, `ChatMessage`, `TestSearchResult` y estados del ciclo de vida RAG.
  2. **`src/services/ragService.ts`**: Servicio TypeScript cliente para listado paginado, detalle completo, creación liviana (0 MB en Render), eliminación, disparo de indexación en vivo y auditoría de similitud vectorial.
  3. **`KnowledgeDocsView.vue`**:
     * Métricas de la base de conocimiento: total de documentos, fragmentos vectoriales activos, documentos indexados y pendientes.
     * Filtros interactivos por estado (`INDEXED`, `PENDING`, `FAILED`) y buscador de títulos.
     * **Modal de Registro Serverless**: Permite registrar documentos mediante URLs de Firebase Storage (**0 MB de consumo de subida/almacenamiento en Render**) o inserción directa de texto manual.
     * **Acción de Indexación en Vivo (1 Clic)**: Dispara `/index/` mostrando spinner reactivo y actualizando el conteo de chunks vectoriales.
     * **Modal de Auditoría de Documento**: Visor del texto extraído, metadatos y reporte de fallos si existieren.
     * Confirmación modal para eliminación de documentos y sus chunks asociados.
  4. **`TestSearchView.vue`**:
     * Consola para el Equipo de Investigación y Auditoría del motor de embeddings de Alexia.
     * Parámetros ajustables reactivos:
       * Selector `Top K` (1 a 10 fragmentos máximos).
       * Slider de `Umbral de Similitud Coseno` (0% a 80%).
     * Chips de pruebas rápidas (ej: *"Decreto 1227 de 2015 trámite notarial cambio de sexo"*, *"Requisitos para terapia de reemplazo hormonal trans"*).
     * Métricas de auditoría: latencia en milisegundos (`⚡ ms`), conteo de fragmentos válidos y consulta normalizada.
     * Tarjetas de fragmentos recuperados con porcentaje de similitud categorizado por color (Alta, Media, Baja relevancia), número de chunk, página fuente y cita textual.
  5. **Pruebas y Verificación**:
     * `npm run build` (`vue-tsc --build` + `vite build`) ejecutado con **0 errores de compilación** (1.41s).
     * Script de integración backend `test_fe_be_rag.py`: **100% de éxito (6/6 tests aprobados)**, validando autenticación, listado, creación de documento con texto de TransLúcidas, indexación en vivo, recuperación con puntaje de similitud (`0.3562`) y eliminación limpia.
     * Rutas `/admin/rag/documentos` y `/admin/rag/test-search` verificadas y operativas con control de acceso por rol (`RESEARCHER` / `SUPERADMIN`).

---

## 5. Matriz de Rutas del Frontend (`src/router/index.ts`)

| Ruta | Vista | Layout | Acceso / Permiso |
| :--- | :--- | :--- | :--- |
| `/` | `HomeView.vue` | `PublicLayout` | Público / Anónimo |
| `/articulos` | `ArticlesListView.vue` | `PublicLayout` | Público / Anónimo |
| `/articulos/:slug` | `ArticleDetailView.vue` | `PublicLayout` | Público / Anónimo |
| `/recursos` | `ResourcesView.vue` | `PublicLayout` | Público / Anónimo |
| `/chat` | `ChatView.vue` | `PublicLayout` | Público / Anónimo |
| `/alexia` | `AlexiaAvatarView.vue` | `PublicLayout` | Público / Anónimo |
| `/login` | `LoginView.vue` | Vacío | Público (Redirige a `/admin` si hay token) |
| `/admin` | `DashboardView.vue` | `AdminLayout` | Requiere Autenticación |
| `/admin/perfil` | `ProfileView.vue` | `AdminLayout` | Requiere Autenticación |
| `/admin/usuarios` | `UsersManagementView.vue` | `AdminLayout` | Solo `SUPERADMIN` |
| `/admin/cms/articulos` | `CmsArticlesView.vue` | `AdminLayout` | `CONTENT_MANAGER` / `SUPERADMIN` |
| `/admin/cms/categorias` | `CmsCategoriesView.vue` | `AdminLayout` | `CONTENT_MANAGER` / `SUPERADMIN` |
| `/admin/cms/recursos` | `CmsResourcesView.vue` | `AdminLayout` | `CONTENT_MANAGER` / `SUPERADMIN` |
| `/admin/rag/documentos` | `KnowledgeDocsView.vue` | `AdminLayout` | `RESEARCHER` / `SUPERADMIN` |
| `/admin/rag/test-search` | `TestSearchView.vue` | `AdminLayout` | `RESEARCHER` / `SUPERADMIN` |

---

## 6. Estado de Ejecución del Proyecto: ¡100% COMPLETADO! 🚀

Todas las 5 fases de modernización e implementación del frontend `lxia_fe` han sido completadas, integradas y validadas con el backend Django `lxia_be`:

1. **Fase 1 (Arquitectura Base & Layouts)**: ✅ Completada y validada (Vue 3.5, Vite 8, Pinia, Lucide, CSS tokens, Layouts público y admin).
2. **Fase 2 (Autenticación & Gestión de Usuarios con RBAC)**: ✅ Completada y validada (7/7 tests aprobados).
3. **Fase 3 (Portal Web Ciudadano & CMS de Contenidos)**: ✅ Completada y validada (7/7 tests aprobados).
4. **Fase 4 (Asistente RAG & Avatar Interactivo Alexia)**: ✅ Completada y validada (4/4 tests aprobados).
5. **Fase 5 (Consola Administrativa RAG & Similitud Vectorial)**: ✅ Completada y validada (6/6 tests aprobados).

**Resumen de Calidad**:
* `npm run build` (`vue-tsc --build` + `vite build`): **0 advertencias, 0 errores (1.41s)**.
* **Cobertura de Integración Backend**: **24/24 pruebas de integración frontend-backend exitosas** en vivo sobre `http://127.0.0.1:8000`.

