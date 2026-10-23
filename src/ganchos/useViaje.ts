import { useCallback, useEffect, useMemo, useState } from 'react'
import { almacenamiento } from '../almacenamiento/indice'
import { ITEMS_SUGERIDOS } from '../datos/listas'
import type { Ajustes, Gasto, ItemLista, Pago, Persona } from '../dominio/tipos'

/**
 * Todo el estado del viaje en un solo lugar.
 *
 * Los componentes piden datos acá y no saben de dónde salen. Cuando esto pase a
 * Firestore, este archivo tampoco cambia: se suscribe igual y se entera igual de
 * los cambios, solo que además van a llegar los de los otros tres celulares.
 */
export function useViaje() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [itemsGuardados, setItemsGuardados] = useState<ItemLista[]>([])
  const [ajustes, setAjustes] = useState<Ajustes | null>(null)
  const [cargando, setCargando] = useState(true)

  const recargar = useCallback(async () => {
    const [ps, gs, pg, it, aj] = await Promise.all([
      almacenamiento.leerPersonas(),
      almacenamiento.leerGastos(),
      almacenamiento.leerPagos(),
      almacenamiento.leerItems(),
      almacenamiento.leerAjustes(),
    ])
    setPersonas(ps)
    setGastos(gs)
    setPagos(pg)
    setItemsGuardados(it)
    setAjustes(aj)
    setCargando(false)
  }, [])

  useEffect(() => {
    void recargar()
    return almacenamiento.suscribir(() => {
      void recargar()
    })
  }, [recargar])

  const acciones = useMemo(
    () => ({
      async agregarGasto(gasto: Gasto) {
        await almacenamiento.agregarGasto(gasto)
      },
      async anularGasto(id: string) {
        await almacenamiento.anularGasto(id)
      },
      async agregarPago(pago: Pago) {
        await almacenamiento.agregarPago(pago)
      },
      async anularPago(id: string) {
        await almacenamiento.anularPago(id)
      },
      async guardarItem(item: ItemLista) {
        await almacenamiento.guardarItem({ ...item, actualizadoEn: Date.now() })
      },
      async guardarPersonas(nuevas: Persona[]) {
        await almacenamiento.guardarPersonas(nuevas)
      },
      async guardarAjustes(nuevos: Ajustes) {
        await almacenamiento.guardarAjustes({ ...nuevos, actualizadoEn: Date.now() })
      },
      exportar: () => almacenamiento.exportar(),
      async importar(json: string) {
        await almacenamiento.importar(json)
      },
    }),
    [],
  )

  /** Los gastos vivos, del más nuevo al más viejo. */
  const gastosVigentes = useMemo(
    () =>
      gastos
        .filter((g) => !g.anulado)
        .toSorted((a, b) => (b.fecha === a.fecha ? b.creadoEn - a.creadoEn : b.fecha.localeCompare(a.fecha))),
    [gastos],
  )

  const pagosVigentes = useMemo(() => pagos.filter((p) => !p.anulado), [pagos])

  /**
   * Los sugeridos de fábrica, pisados por lo que alguien haya tocado, más lo que
   * agregó cada uno. Un sugerido borrado queda anulado y no vuelve a aparecer.
   */
  const items = useMemo(() => {
    const porId = new Map(ITEMS_SUGERIDOS.map((i) => [i.id, i]))
    for (const guardado of itemsGuardados) porId.set(guardado.id, guardado)
    return [...porId.values()].filter((i) => !i.anulado)
  }, [itemsGuardados])

  return { personas, gastos, gastosVigentes, pagos, pagosVigentes, items, ajustes, cargando, ...acciones }
}

/**
 * Quién está usando *este* celular.
 *
 * Vive siempre en el navegador, incluso cuando los datos estén en Firebase: es
 * de cada aparato, no del viaje. Así cada uno abre la app y ya está elegido.
 */
export function useYo(personas: Persona[]) {
  const [yoId, setYoId] = useState<string>(() => {
    try {
      return localStorage.getItem('vacaciones-yo') ?? ''
    } catch {
      return ''
    }
  })

  const elegir = useCallback((id: string) => {
    setYoId(id)
    try {
      localStorage.setItem('vacaciones-yo', id)
    } catch {
      // Sin storage funciona igual, solo que hay que elegir de nuevo al recargar.
    }
  }, [])

  const yo = personas.find((p) => p.id === yoId) ?? null
  return { yoId: yo?.id ?? '', yo, elegir }
}

export function nuevoId(): string {
  // El id se genera en el cliente a propósito: con Firestore eso permite escribir
  // sin esperar respuesta del servidor y que dos que cargan a la vez no choquen.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function hoy(): string {
  const d = new Date()
  const mes = `${d.getMonth() + 1}`.padStart(2, '0')
  const dia = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}
