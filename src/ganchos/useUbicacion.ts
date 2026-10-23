import { useCallback, useEffect, useState } from 'react'

const CLAVE = 'vacaciones-ubicacion'

export type Posicion = { lat: number; lon: number; cuando: number }

/**
 * La ubicación del celular, en vivo, si la quieren compartir.
 *
 * Se recuerda en este aparato si la dejaron prendida, así al abrir la app sigue
 * sola (el permiso del navegador ya quedó dado la primera vez).
 */
export function useUbicacion() {
  const [activa, setActiva] = useState(() => {
    try {
      return localStorage.getItem(CLAVE) === '1'
    } catch {
      return false
    }
  })
  const [posicion, setPosicion] = useState<Posicion | null>(null)
  const [error, setError] = useState('')
  const disponible = typeof navigator !== 'undefined' && 'geolocation' in navigator

  useEffect(() => {
    if (!activa || !disponible) return
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPosicion({ lat: p.coords.latitude, lon: p.coords.longitude, cuando: p.timestamp })
        setError('')
      },
      (e) => {
        setError(
          e.code === e.PERMISSION_DENIED
            ? 'No hay permiso de ubicación. Se activa en los ajustes del navegador para esta página.'
            : 'No se pudo saber dónde están. Se vuelve a intentar solo.',
        )
      },
      // Para seguir un auto por la ruta no hace falta precisión fina, y así gasta menos batería.
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 30_000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [activa, disponible])

  const cambiar = useCallback((prender: boolean) => {
    setActiva(prender)
    if (!prender) {
      setPosicion(null)
      setError('')
    }
    try {
      localStorage.setItem(CLAVE, prender ? '1' : '0')
    } catch {
      // Sin storage hay que volver a prenderla al abrir, nada más.
    }
  }, [])

  return { disponible, activa, posicion, error, cambiar }
}
