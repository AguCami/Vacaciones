import type { Ajustes, Gasto, Pago, Persona } from './tipos'

/**
 * Las cuentas del viaje.
 *
 * Todo se calcula en centavos enteros de la moneda base. Con decimales, cuatro
 * personas dividiendo 10 dan 2,50 cada una y cierra; dividiendo 10 entre 3 dan
 * 3,33 y falta un centavo que aparece después como una deuda fantasma de $0,01
 * que nadie puede saldar. Con enteros el reparto cierra siempre.
 */

/** Pasa un monto a centavos de la moneda base. */
function aCentavosBase(monto: number, moneda: string, ajustes: Ajustes): number {
  const cotizacion = ajustes.cotizaciones[moneda as keyof typeof ajustes.cotizaciones] ?? 1
  return Math.round(monto * cotizacion * 100)
}

/**
 * Reparte un total en centavos entre `cantidad` personas sin perder ni inventar
 * centavos: los que sobran se dan de a uno a los primeros, en orden.
 */
export function repartir(totalCentavos: number, cantidad: number): number[] {
  if (cantidad <= 0) return []
  const base = Math.floor(totalCentavos / cantidad)
  const resto = totalCentavos - base * cantidad
  return Array.from({ length: cantidad }, (_, i) => base + (i < resto ? 1 : 0))
}

export type Balance = {
  personaId: string
  /** Lo que puso de su bolsillo. */
  puso: number
  /** Lo que le tocaba poner según lo que consumió. */
  leTocaba: number
  /** Positivo: le deben. Negativo: debe. Todo en centavos de la moneda base. */
  saldo: number
}

export function calcularBalances(
  personas: Persona[],
  gastos: Gasto[],
  pagos: Pago[],
  ajustes: Ajustes,
): Balance[] {
  const puso = new Map<string, number>()
  const leTocaba = new Map<string, number>()
  for (const p of personas) {
    puso.set(p.id, 0)
    leTocaba.set(p.id, 0)
  }

  for (const gasto of gastos) {
    if (gasto.anulado) continue
    const participantes = gasto.participantesIds.filter((id) => puso.has(id))
    if (participantes.length === 0) continue

    const total = aCentavosBase(gasto.monto, gasto.moneda, ajustes)
    if (puso.has(gasto.pagadorId)) {
      puso.set(gasto.pagadorId, (puso.get(gasto.pagadorId) ?? 0) + total)
    }

    const partes = repartir(total, participantes.length)
    participantes.forEach((id, i) => {
      leTocaba.set(id, (leTocaba.get(id) ?? 0) + partes[i])
    })
  }

  // Un pago no es un gasto: no cambia lo que consumió nadie, solo mueve plata.
  // Quien paga queda como si hubiera puesto más; quien cobra, como si hubiera
  // puesto menos.
  for (const pago of pagos) {
    if (pago.anulado) continue
    const monto = aCentavosBase(pago.monto, pago.moneda, ajustes)
    if (puso.has(pago.deId)) puso.set(pago.deId, (puso.get(pago.deId) ?? 0) + monto)
    if (puso.has(pago.paraId)) puso.set(pago.paraId, (puso.get(pago.paraId) ?? 0) - monto)
  }

  return personas.map((p) => {
    const p1 = puso.get(p.id) ?? 0
    const p2 = leTocaba.get(p.id) ?? 0
    return { personaId: p.id, puso: p1, leTocaba: p2, saldo: p1 - p2 }
  })
}

export type Transferencia = { deId: string; paraId: string; monto: number }

/**
 * Cómo emparejar las cuentas con la menor cantidad de transferencias posible.
 *
 * En vez de "cada uno le paga a cada uno", junta a los que deben con los que
 * tienen a favor y va cancelando de a pares, siempre el que más debe con el que
 * más tiene a favor. Para cuatro personas eso suele ser dos o tres pagos en
 * total en lugar de seis.
 */
export function liquidar(balances: Balance[]): Transferencia[] {
  const deudores = balances
    .filter((b) => b.saldo < 0)
    .map((b) => ({ id: b.personaId, monto: -b.saldo }))
    .toSorted((a, b) => b.monto - a.monto)
  const acreedores = balances
    .filter((b) => b.saldo > 0)
    .map((b) => ({ id: b.personaId, monto: b.saldo }))
    .toSorted((a, b) => b.monto - a.monto)

  const transferencias: Transferencia[] = []
  let i = 0
  let j = 0
  while (i < deudores.length && j < acreedores.length) {
    const monto = Math.min(deudores[i].monto, acreedores[j].monto)
    if (monto > 0) {
      transferencias.push({ deId: deudores[i].id, paraId: acreedores[j].id, monto })
      deudores[i].monto -= monto
      acreedores[j].monto -= monto
    }
    if (deudores[i].monto === 0) i++
    if (acreedores[j].monto === 0) j++
  }
  return transferencias
}

export function totalGastado(gastos: Gasto[], ajustes: Ajustes): number {
  return gastos
    .filter((g) => !g.anulado)
    .reduce((total, g) => total + aCentavosBase(g.monto, g.moneda, ajustes), 0)
}

export function formatearCentavos(centavos: number, moneda: string): string {
  const simbolos: Record<string, string> = { ARS: '$', BRL: 'R$', USD: 'US$' }
  const signo = centavos < 0 ? '-' : ''
  const valor = Math.abs(centavos) / 100
  return `${signo}${simbolos[moneda] ?? ''}${valor.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
