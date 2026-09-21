import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // El repo se publica en GitHub Pages bajo /Vacaciones/, así que las rutas de
  // los assets tienen que salir con ese prefijo o la página queda en blanco.
  base: process.env.NODE_ENV === 'production' ? '/Vacaciones/' : '/',
  plugins: [react(), tailwindcss()],
})
