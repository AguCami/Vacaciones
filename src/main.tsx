import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './estilos.css'

const raiz = document.getElementById('raiz')
if (raiz) createRoot(raiz).render(<StrictMode><App /></StrictMode>)

// Solo en producción: en desarrollo una copia guardada taparía los cambios.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Si no se puede (una vista previa, un navegador que no deja) la app anda
    // igual, solo que sin copia para abrir sin señal.
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
