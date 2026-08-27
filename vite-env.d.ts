/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_GLOBAL_JOURNEY_ENABLED?: string
  readonly VITE_GUEST_DIAGNOSTIC_ENABLED?: string
  readonly VITE_UNIVERSITY_DATA_PLATFORM_ENABLED?: string
  readonly VITE_APPLICATION_WORKSPACE_ENABLED?: string
  readonly VITE_AUTOMATED_BILLING_ENABLED?: string
  readonly VITE_GROWTH_RELEASE_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
