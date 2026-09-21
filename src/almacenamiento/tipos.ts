import type { Ajustes, Gasto, Pago, Persona } from '../dominio/tipos'

/**
 * La única puerta por la que la app toca los datos.
 *
 * Ningún componente sabe si atrás hay localStorage o Firestore. Hoy hay
 * localStorage; cuando migremos a Firebase se escribe otra implementación de
 * esta misma interfaz y se cambia una línea en `indice.ts`.
 *
 * Todos los métodos son `async` aunque localStorage sea instantáneo. Es a
 * propósito: si fueran sincrónicos, cada componente habría que reescribirlo el
 * día de la migración.
 */
export interface Almacenamiento {
  leerPersonas(): Promise<Persona[]>
  guardarPersonas(personas: Persona[]): Promise<void>

  leerGastos(): Promise<Gasto[]>
  agregarGasto(gasto: Gasto): Promise<void>
  anularGasto(id: string): Promise<void>

  leerPagos(): Promise<Pago[]>
  agregarPago(pago: Pago): Promise<void>
  anularPago(id: string): Promise<void>

  leerAjustes(): Promise<Ajustes>
  guardarAjustes(ajustes: Ajustes): Promise<void>

  /**
   * Avisa cuando los datos cambiaron. Devuelve la función para desuscribirse.
   *
   * Con localStorage se dispara cuando cambia otra pestaña del mismo navegador.
   * Con Firestore se va a disparar cuando cargue cualquiera de los cuatro, que
   * es el punto de todo esto.
   */
  suscribir(alCambiar: () => void): () => void

  /** Todo el viaje en un JSON, para no perder nada en la migración. */
  exportar(): Promise<string>
  importar(json: string): Promise<void>
}
