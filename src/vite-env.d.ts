/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KIS_APP_KEY: string
  readonly VITE_KIS_APP_SECRET: string
  readonly VITE_KIS_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
