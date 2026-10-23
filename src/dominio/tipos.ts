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
  /** Día de salida, `AAAA-MM-DD`. Con esto el encabezado cuenta los días. */
  fechaSalida?: string
  /** Día de vuelta, `AAAA-MM-DD`. */
  fechaVuelta?: string
  /** Donde paran en Bombinhas. Vive en los datos y no en el código: el repo es público. */
  hospedaje?: Hospedaje
  actualizadoEn: number
}

export type Hospedaje = {
  nombre: string
  direccion: string
  /** Coordenadas para el "Cómo llegar". Si faltan, se busca por dirección. */
  lat?: number
  lon?: number
  /** `AAAA-MM-DD` */
  entrada: string
  /** `HH:MM`, desde qué hora se puede entrar. */
  horaEntrada?: string
  salida: string
  /** `HH:MM`, hasta qué hora hay que dejarlo. */
  horaSalida?: string
  anfitrion?: string
  /** Con código de país, como lo da Airbnb: +55 51 9…. */
  telefono?: string
  codigo?: string
  /** Link a la reserva. */
  enlace?: string
  /** Cancelación, pagos, normas de la casa. */
  notas?: string
}

export type ListaId = 'papeles' | 'auto' | 'valija' | 'antes' | 'datos'

/**
 * Un renglón de una lista: un papel, algo para la valija, una tarea.
 *
 * Los renglones que vienen sugeridos tienen un id fijo (`papeles-dni`), así
 * cuando estén en Firestore los cuatro celulares hablan del mismo documento y
 * no aparecen cuatro copias de "DNI". Los que agrega cada uno llevan id al azar.
 */
export type ItemLista = {
  id: string
  lista: ListaId
  texto: string
  /** Aclaración corta debajo del texto. */
  nota?: string
  hecho: boolean
  /** Quién lo tildó por última vez. */
  hechoPor?: string
  /** Quién se encarga. Vacío: cualquiera. */
  encargadoId?: string
  anulado?: boolean
  creadoEn: number
  creadoPor: string
  actualizadoEn: number
}
