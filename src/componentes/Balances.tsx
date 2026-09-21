import { useMemo } from 'react'
import { calcularBalances, formatearCentavos, liquidar, totalGastado } from '../dominio/cuentas'
import { CATEGORIAS, type Ajustes, type Categoria, type Gasto, type Pago, type Persona } from '../dominio/tipos'
import { hoy, nuevoId } from '../ganchos/useViaje'

type Props = {
  personas: Persona[]
  gastos: Gasto[]
  pagos: Pago[]
  ajustes: Ajustes
  yoId: string
  alRegistrarPago: (pago: Pago) => void
}

export function Balances({ personas, gastos, pagos, ajustes, yoId, alRegistrarPago }: Props) {
  const base = ajustes.monedaBase
  const balances = useMemo(
    () => calcularBalances(personas, gastos, pagos, ajustes),
    [personas, gastos, pagos, ajustes],
  )
  const transferencias = useMemo(() => liquidar(balances), [balances])
  const total = useMemo(() => totalGastado(gastos, ajustes), [gastos, ajustes])
  const porCabeza = personas.length > 0 ? Math.round(total / personas.length) : 0

  const porCategoria = useMemo(() => {
    const mapa = new Map<Categoria, number>()
    for (const g of gastos) {
      const enBase = Math.round(g.monto * (ajustes.cotizaciones[g.moneda] ?? 1) * 100)
      mapa.set(g.categoria, (mapa.get(g.categoria) ?? 0) + enBase)
    }
    return [...mapa.entries()].toSorted((a, b) => b[1] - a[1])
  }, [gastos, ajustes])

  const mayor = porCategoria[0]?.[1] ?? 1

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="tarjeta px-2 py-4 text-center sm:px-4">
          <p className="text-xs font-black uppercase tracking-wide opacity-60">Gastado en total</p>
          <p className="text-xl font-black sm:text-3xl">{formatearCentavos(total, base)}</p>
        </div>
        <div className="tarjeta px-2 py-4 text-center sm:px-4">
          <p className="text-xs font-black uppercase tracking-wide opacity-60">Por cabeza</p>
          <p className="text-xl font-black sm:text-3xl">{formatearCentavos(porCabeza, base)}</p>
        </div>
      </div>

      <div className="tarjeta p-5">
        <h3 className="mb-3 text-lg font-black">Cómo va cada uno</h3>
        <ul className="flex flex-col gap-2.5">
          {balances.map((b) => {
            const persona = personas.find((p) => p.id === b.personaId)
            const aFavor = b.saldo > 0
            const enCero = b.saldo === 0
            return (
              <li key={b.personaId} className="flex items-center gap-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full font-black text-white"
                  style={{ background: persona?.color }}
                >
                  {persona?.nombre.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-black">{persona?.nombre}</p>
                  <p className="text-xs font-bold opacity-60">
                    puso {formatearCentavos(b.puso, base)} · le tocaba {formatearCentavos(b.leTocaba, base)}
                  </p>
                </div>
                <p
                  className="shrink-0 text-right font-black tabular-nums"
                  style={{
                    color: enCero ? 'var(--texto-suave)' : aFavor ? 'var(--color-palmera)' : 'var(--color-coral-oscuro)',
                  }}
                >
                  {enCero ? 'en cero' : formatearCentavos(b.saldo, base)}
                  <span className="block text-[0.65rem] font-bold uppercase opacity-70">
                    {enCero ? '' : aFavor ? 'le deben' : 'debe'}
                  </span>
                </p>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="tarjeta p-5">
        <h3 className="text-lg font-black">Para quedar a mano</h3>
        {transferencias.length === 0 ? (
          <p className="mt-2 font-bold opacity-70">
            Están todos en cero. No hay nada que devolverle a nadie. 🏖️
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm font-bold opacity-65">
              {transferencias.length === 1
                ? 'Con un solo pago se arregla todo:'
                : `Con ${transferencias.length} pagos se arregla todo — es el mínimo posible:`}
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {transferencias.map((t, i) => {
                const de = personas.find((p) => p.id === t.deId)
                const para = personas.find((p) => p.id === t.paraId)
                return (
                  <li
                    key={`${t.deId}-${t.paraId}-${i}`}
                    className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/50 px-4 py-3"
                  >
                    <span className="font-black" style={{ color: de?.color }}>
                      {de?.nombre}
                    </span>
                    <span className="opacity-60">le da</span>
                    <span className="font-black tabular-nums">{formatearCentavos(t.monto, base)}</span>
                    <span className="opacity-60">a</span>
                    <span className="font-black" style={{ color: para?.color }}>
                      {para?.nombre}
                    </span>
                    <button
                      type="button"
                      className="boton ml-auto bg-[var(--color-palmera)] px-4 py-1.5 text-sm text-white"
                      onClick={() =>
                        alRegistrarPago({
                          id: nuevoId(),
                          fecha: hoy(),
                          deId: t.deId,
                          paraId: t.paraId,
                          monto: t.monto / 100,
                          moneda: base,
                          nota: 'Para quedar a mano',
                          creadoEn: Date.now(),
                          creadoPor: yoId || t.deId,
                        })
                      }
                    >
                      Ya se pagó
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {porCategoria.length > 0 && (
        <div className="tarjeta p-5">
          <h3 className="mb-3 text-lg font-black">En qué se va la plata</h3>
          <ul className="flex flex-col gap-2">
            {porCategoria.map(([categoria, monto]) => (
              <li key={categoria} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm font-bold">
                  {CATEGORIAS[categoria].emoji} {CATEGORIAS[categoria].nombre}
                </span>
                <span className="h-3 flex-1 overflow-hidden rounded-full bg-white/50">
                  <span
                    className="block h-full rounded-full bg-[var(--color-mar)]"
                    style={{ width: `${Math.max(3, (monto / mayor) * 100)}%` }}
                  />
                </span>
                <span className="w-28 shrink-0 text-right text-sm font-black tabular-nums">
                  {formatearCentavos(monto, base)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
