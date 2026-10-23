import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './estilos.css'

const raiz = document.getElementById('raiz')
if (raiz) createRoot(raiz).render(<StrictMode><App /></StrictMode>)

// Solo en producción: en desarrollo una copia guardada taparía los cambios.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  })
}
