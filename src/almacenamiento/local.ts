import type { Ajustes, Gasto, Pago, Persona } from '../dominio/tipos'
import type { Almacenamiento } from './tipos'

const CLAVE = 'vacaciones-brasil'

type Contenido = {
  version: 1
  personas: Persona[]
  gastos: Gasto[]
  pagos: Pago[]
  ajustes: Ajustes
}

const INICIAL: Contenido = {
  version: 1,
  personas: [],
  gastos: [],
  pagos: [],
  ajustes: {
    monedaBase: 'ARS',
    cotizaciones: { ARS: 1, BRL: 1, USD: 1 },
    paradaActualId: 'cordoba',
    actualizadoEn: 0,
  },
}

function leer(): Contenido {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return structuredClone(INICIAL)
    return { ...structuredClone(INICIAL), ...JSON.parse(crudo) }
  } catch {
    // Storage bloqueado (modo incógnito, permisos) o JSON roto: la app tiene que
    // abrir igual, aunque sea vacía, en vez de quedar en pantalla blanca.
    return structuredClone(INICIAL)
  }
}

/**
 * Junta dos listas por id, dejando ganar a la entrante.
 *
 * Es lo que hace que importar una copia no pise lo que ya había: se fusiona
 * registro por registro en vez de reemplazar la lista entera.
 */
function fusionarPorId<T extends { id: string }>(viejos: T[], nuevos: T[] = []): T[] {
  const mapa = new Map(viejos.map((x) => [x.id, x]))
  for (const nuevo of nuevos) mapa.set(nuevo.id, nuevo)
  return [...mapa.values()]
}

function escribir(contenido: Contenido): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(contenido))
  } catch {
    // Sin storage no se pierde la sesión en curso, solo no sobrevive al recargar.
  }
}

/**
 * Guarda todo en el navegador de cada uno. Sirve para desarrollar y para cargar
 * de a uno, pero no comparte nada entre celulares: eso llega con Firebase.
 */
export class AlmacenamientoLocal implements Almacenamiento {
  private oyentes = new Set<() => void>()

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === CLAVE) this.avisar()
      })
    }
  }

  private avisar(): void {
    for (const oyente of this.oyentes) oyente()
  }

  private mutar(cambio: (c: Contenido) => void): Promise<void> {
    const contenido = leer()
    cambio(contenido)
    escribir(contenido)
    this.avisar()
    return Promise.resolve()
  }

  leerPersonas(): Promise<Persona[]> {
    return Promise.resolve(leer().personas)
  }

  guardarPersonas(personas: Persona[]): Promise<void> {
    return this.mutar((c) => {
      c.personas = personas
    })
  }

  leerGastos(): Promise<Gasto[]> {
    return Promise.resolve(leer().gastos)
  }

  agregarGasto(gasto: Gasto): Promise<void> {
    return this.mutar((c) => {
      c.gastos = [...c.gastos.filter((g) => g.id !== gasto.id), gasto]
    })
  }

  anularGasto(id: string): Promise<void> {
    return this.mutar((c) => {
      c.gastos = c.gastos.map((g) => (g.id === id ? { ...g, anulado: true } : g))
    })
  }

  leerPagos(): Promise<Pago[]> {
    return Promise.resolve(leer().pagos)
  }

  agregarPago(pago: Pago): Promise<void> {
    return this.mutar((c) => {
      c.pagos = [...c.pagos.filter((p) => p.id !== pago.id), pago]
    })
  }

  anularPago(id: string): Promise<void> {
    return this.mutar((c) => {
      c.pagos = c.pagos.map((p) => (p.id === id ? { ...p, anulado: true } : p))
    })
  }

  leerAjustes(): Promise<Ajustes> {
    return Promise.resolve(leer().ajustes)
  }

  guardarAjustes(ajustes: Ajustes): Promise<void> {
    return this.mutar((c) => {
      c.ajustes = ajustes
    })
  }

  suscribir(alCambiar: () => void): () => void {
    this.oyentes.add(alCambiar)
    return () => this.oyentes.delete(alCambiar)
  }

  exportar(): Promise<string> {
    return Promise.resolve(JSON.stringify(leer(), null, 2))
  }

  importar(json: string): Promise<void> {
    const entrante = JSON.parse(json) as Partial<Contenido>
    // Se fusiona por id en vez de pisar: si alguien exportó desde su celular y
    // otro ya cargó cosas acá, no se pierde ninguna de las dos puntas.
    return this.mutar((c) => {
      c.personas = fusionarPorId(c.personas, entrante.personas)
      c.gastos = fusionarPorId(c.gastos, entrante.gastos)
      c.pagos = fusionarPorId(c.pagos, entrante.pagos)
      if (entrante.ajustes) c.ajustes = entrante.ajustes
    })
  }
}
