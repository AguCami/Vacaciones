import { useCallback, useEffect, useRef, useState } from 'react'
import { traerCotizaciones, VIGENCIA_MS } from '../datos/cotizaciones'
import type { Ajustes, Moneda, TipoDolar } from '../dominio/tipos'

export type EstadoCotizacion = '' | 'trayendo' | 'error'

/**
 * La cotización del día: se trae sola al abrir (si pasó la vigencia y nadie la
 * escribió a mano) y se puede pedir de nuevo desde la Guía o Ajustes.
 */
export function useCotizacion(ajustes: Ajustes | null, guardarAjustes: (a: Ajustes) => Promise<void>) {
  const [estado, setEstado] = useState<EstadoCotizacion>('')

  const actualizar = useCallback(
    async (tipo?: TipoDolar, base?: Moneda) => {
      if (!ajustes) return
      const nuevoTipo = tipo ?? ajustes.tipoDolar ?? 'blue'
      const nuevaBase = base ?? ajustes.monedaBase
      setEstado('trayendo')
      try {
        const { cotizaciones, fuente } = await traerCotizaciones(nuevoTipo, nuevaBase)
        await guardarAjustes({
          ...ajustes,
          monedaBase: nuevaBase,
          tipoDolar: nuevoTipo,
          cotizaciones,
          cotizacionManual: false,
          cotizacionActualizada: Date.now(),
          cotizacionFuente: fuente,
        })
        setEstado('')
      } catch {
        setEstado('error')
      }
    },
    [ajustes, guardarAjustes],
  )

  // Una sola vez por apertura, así sin señal no queda reintentando.
  const yaIntento = useRef(false)
  useEffect(() => {
    if (yaIntento.current || !ajustes || ajustes.cotizacionManual) return
    if (Date.now() - (ajustes.cotizacionActualizada ?? 0) < VIGENCIA_MS) return
    yaIntento.current = true
    void actualizar()
  }, [ajustes, actualizar])

  return { estado, actualizar }
}
