import type { Cotizaciones, Moneda, TipoDolar } from '../dominio/tipos'

export type { TipoDolar }

/**
 * La cotización del día, desde DolarApi (dolarapi.com): gratis, sin clave y
 * pensada para Argentina. Da el dólar en sus distintas casas y el real oficial.
 */

export const TIPOS_DOLAR: Record<TipoDolar, { nombre: string; ayuda: string }> = {
  blue: { nombre: 'Blue', ayuda: 'El de la calle: para efectivo.' },
  tarjeta: { nombre: 'Tarjeta', ayuda: 'Lo que cobra la tarjeta al pagar afuera.' },
  bolsa: { nombre: 'MEP', ayuda: 'El de la app del banco o del broker.' },
  oficial: { nombre: 'Oficial', ayuda: 'El del Banco Nación, sin impuestos.' },
}

type Respuesta = { casa: string; venta: number }

async function pedir<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(`https://dolarapi.com/v1/${ruta}`)
  if (!respuesta.ok) throw new Error(`DolarApi respondió ${respuesta.status}`)
  return (await respuesta.json()) as T
}

/**
 * Las cotizaciones para la moneda base del viaje.
 *
 * El real de DolarApi es solo el oficial. Para que no quede mezclado con un
 * dólar blue, se lo lleva al mismo tipo de dólar con el cruce oficial:
 * si el dólar elegido vale X veces el oficial, el real también.
 */
export type Traidas = { cotizaciones: Cotizaciones; fuente: string }

/**
 * Trae la cotización del día. Si DolarApi no responde, usa de respaldo el tipo
 * de cambio oficial de open.er-api.com, para no quedar con todo en 1.
 */
export async function traerCotizaciones(tipo: TipoDolar, base: Moneda): Promise<Traidas> {
  try {
    return { cotizaciones: await deDolarApi(tipo, base), fuente: `Dólar ${TIPOS_DOLAR[tipo].nombre.toLowerCase()}` }
  } catch {
    return { cotizaciones: await deRespaldo(base), fuente: 'Oficial (respaldo)' }
  }
}

async function deRespaldo(base: Moneda): Promise<Cotizaciones> {
  const respuesta = await fetch('https://open.er-api.com/v6/latest/USD')
  if (!respuesta.ok) throw new Error(`open.er-api respondió ${respuesta.status}`)
  const { rates } = (await respuesta.json()) as { rates: Record<string, number> }
  if (!rates?.ARS || !rates?.BRL) throw new Error('Faltan datos en la respuesta')
  return enBase({ ARS: 1, USD: rates.ARS, BRL: rates.ARS / rates.BRL }, base)
}

async function deDolarApi(tipo: TipoDolar, base: Moneda): Promise<Cotizaciones> {
  const [dolares, real] = await Promise.all([pedir<Respuesta[]>('dolares'), pedir<Respuesta>('cotizaciones/brl')])
  const elegido = dolares.find((d) => d.casa === tipo)?.venta
  const oficial = dolares.find((d) => d.casa === 'oficial')?.venta
  if (!elegido || !oficial || !real.venta) throw new Error('Faltan datos en la respuesta')

  return enBase({ ARS: 1, USD: elegido, BRL: real.venta * (elegido / oficial) }, base)
}

/** De "cuántos pesos vale cada moneda" a "cuánto vale cada una en la moneda base". */
function enBase(enPesos: Record<Moneda, number>, base: Moneda): Cotizaciones {
  return {
    ARS: redondear(enPesos.ARS / enPesos[base]),
    USD: redondear(enPesos.USD / enPesos[base]),
    BRL: redondear(enPesos.BRL / enPesos[base]),
  }
}

const redondear = (n: number) => Math.round(n * 10_000) / 10_000

/** Cada cuánto se vuelve a pedir sola, si está en automático. */
export const VIGENCIA_MS = 3 * 60 * 60 * 1000
