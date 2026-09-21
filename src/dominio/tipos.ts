/**
 * El modelo de datos del viaje.
 *
 * Todo lo que se guarda es *append-only*: un gasto o un pago se crea una vez y
 * después no se pisa. Editar es escribir una versión nueva; borrar es marcar
 * `anulado`. Esto es a propósito — cuando esto viva en Firestore y los cuatro
 * carguen desde su propio celular, dos escrituras simultáneas no se pelean por
 * el mismo documento.
 */

export type Moneda = 'ARS' | 'BRL' | 'USD'

export const MONEDAS: Record<Moneda, { simbolo: string; nombre: string }> = {
  ARS: { simbolo: '$', nombre: 'Peso argentino' },
  BRL: { simbolo: 'R$', nombre: 'Real' },
  USD: { simbolo: 'US$', nombre: 'Dólar' },
}

export type Categoria =
  | 'nafta'
  | 'peaje'
  | 'comida'
  | 'alojamiento'
  | 'playa'
  | 'salidas'
  | 'compras'
  | 'otros'

export const CATEGORIAS: Record<Categoria, { nombre: string; emoji: string }> = {
  nafta: { nombre: 'Nafta', emoji: '⛽' },
  peaje: { nombre: 'Peajes', emoji: '🛣️' },
  comida: { nombre: 'Comida', emoji: '🍽️' },
  alojamiento: { nombre: 'Alojamiento', emoji: '🛏️' },
  playa: { nombre: 'Playa', emoji: '🏖️' },
  salidas: { nombre: 'Salidas', emoji: '🍹' },
  compras: { nombre: 'Compras', emoji: '🛍️' },
  otros: { nombre: 'Otros', emoji: '✨' },
}

export type Persona = {
  id: string
  nombre: string
  /** Color con el que se la reconoce en toda la app. */
  color: string
}

export type Gasto = {
  id: string
  /** Día del gasto, `AAAA-MM-DD`. Lo elige quien carga, puede no ser hoy. */
  fecha: string
  descripcion: string
  /** Monto en la moneda en que se pagó, siempre positivo. */
  monto: number
  moneda: Moneda
  /** Quién puso la plata. */
  pagadorId: string
  /** Entre quiénes se reparte. Si van los cuatro, son los cuatro. */
  participantesIds: string[]
  categoria: Categoria
  /** Marca de borrado. No se borra el documento: se anula. */
  anulado?: boolean
  creadoEn: number
  creadoPor: string
}

/** Plata que una persona le devuelve a otra para emparejar las cuentas. */
export type Pago = {
  id: string
  fecha: string
  deId: string
  paraId: string
  monto: number
  moneda: Moneda
  nota?: string
  anulado?: boolean
  creadoEn: number
  creadoPor: string
}

/**
 * Cuánto vale una unidad de cada moneda en la moneda base del viaje.
 * Se carga a mano porque en la ruta no siempre hay señal para ir a buscar la
 * cotización, y porque la que importa es a la que ustedes cambiaron de verdad.
 */
export type Cotizaciones = Record<Moneda, number>

export type Ajustes = {
  monedaBase: Moneda
  cotizaciones: Cotizaciones
  /** Hasta qué parada llegaron. Mueve el auto en el mapa. */
  paradaActualId?: string
  actualizadoEn: number
}
