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
export async function traerCotizaciones(tipo: TipoDolar, base: Moneda): Promise<Cotizaciones> {
  const [dolares, real] = await Promise.all([pedir<Respuesta[]>('dolares'), pedir<Respuesta>('cotizaciones/brl')])
  const elegido = dolares.find((d) => d.casa === tipo)?.venta
  const oficial = dolares.find((d) => d.casa === 'oficial')?.venta
  if (!elegido || !oficial || !real.venta) throw new Error('Faltan datos en la respuesta')

  // Cuántos pesos vale una unidad de cada moneda.
  const enPesos: Record<Moneda, number> = {
    ARS: 1,
    USD: elegido,
    BRL: real.venta * (elegido / oficial),
  }
  return {
    ARS: redondear(enPesos.ARS / enPesos[base]),
    USD: redondear(enPesos.USD / enPesos[base]),
    BRL: redondear(enPesos.BRL / enPesos[base]),
  }
}

const redondear = (n: number) => Math.round(n * 10_000) / 10_000

/** Cada cuánto se vuelve a pedir sola, si está en automático. */
export const VIGENCIA_MS = 3 * 60 * 60 * 1000
