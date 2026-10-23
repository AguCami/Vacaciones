/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** JSON con el hospedaje para precargar. Va en `.env.local`, que no se sube. */
  readonly VITE_HOSPEDAJE?: string
}
