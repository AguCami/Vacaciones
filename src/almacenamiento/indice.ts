import { AlmacenamientoLocal } from './local'
import type { Almacenamiento } from './tipos'

/**
 * El único lugar donde se elige la implementación.
 *
 * Para migrar a Firebase: escribir `AlmacenamientoFirestore` en `firestore.ts`
 * implementando la misma interfaz, y cambiar la línea de abajo. Nada más en
 * toda la app sabe de dónde vienen los datos.
 */
export const almacenamiento: Almacenamiento = new AlmacenamientoLocal()

export type { Almacenamiento }
