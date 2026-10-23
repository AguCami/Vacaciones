import type { Hospedaje } from '../dominio/tipos'

/**
 * El hospedaje que viene cargado de fábrica, si lo hay.
 *
 * Sale de `VITE_HOSPEDAJE` en `.env.local`, que no se sube al repo: el repo es
 * público y la reserva tiene código, teléfono y dirección. Sin esa variable la
 * app arranca sin hospedaje y se carga desde la Guía.
 */
export const HOSPEDAJE_PRECARGADO: Hospedaje | undefined = leer()

function leer(): Hospedaje | undefined {
  const crudo = import.meta.env.VITE_HOSPEDAJE
  if (!crudo) return undefined
  try {
    return JSON.parse(crudo) as Hospedaje
  } catch {
    return undefined
  }
}

/** Link de "Cómo llegar": por coordenadas si las hay, que es más preciso. */
export function enlaceComoLlegar(h: Hospedaje): string {
  const destino = h.lat != null && h.lon != null ? `${h.lat},${h.lon}` : h.direccion
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`
}

/** Link de WhatsApp: el número sin espacios ni signos. */
export function enlaceWhatsapp(telefono: string): string {
  return `https://wa.me/${telefono.replace(/\D/g, '')}`
}
