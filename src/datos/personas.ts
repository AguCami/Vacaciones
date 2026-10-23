import type { Persona } from '../dominio/tipos'

export const COLORES = ['#ff6b5a', '#0ea5b7', '#ffc23c', '#2fa36b', '#a06cd5', '#ef7d9d']

/**
 * Los cuatro del viaje. Vienen cargados de fábrica, sin pantalla de bienvenida.
 *
 * Los ids son fijos a propósito: cuando esto esté en Firestore, los cuatro
 * celulares tienen que hablar de la misma "Aldi", no de cuatro Aldis distintas.
 */
export const PERSONAS_DEL_VIAJE: Persona[] = ['Agu', 'Aldi', 'Mile', 'Fran'].map((nombre, i) => ({
  id: nombre.toLowerCase(),
  nombre,
  color: COLORES[i],
}))
