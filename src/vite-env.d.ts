/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_ACCESS_TOKEN: string
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
