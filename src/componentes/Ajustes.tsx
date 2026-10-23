import { useState } from 'react'
import { TIPOS_DOLAR, traerCotizaciones } from '../datos/cotizaciones'
import { MONEDAS, type Ajustes as TipoAjustes, type Moneda, type Persona, type TipoDolar } from '../dominio/tipos'

type Props = {
  personas: Persona[]
  ajustes: TipoAjustes
  yoId: string
  alElegirYo: (id: string) => void
  alGuardarAjustes: (ajustes: TipoAjustes) => void
}

export function Ajustes({
  personas,
  ajustes,
  yoId,
  alElegirYo,
  alGuardarAjustes,
}: Props) {
  const [estado, setEstado] = useState<'' | 'trayendo' | 'error'>('')
  const tipo = ajustes.tipoDolar ?? 'blue'

  async function actualizar(nuevoTipo: TipoDolar, nuevaBase = ajustes.monedaBase) {
    setEstado('trayendo')
    try {
      const cotizaciones = await traerCotizaciones(nuevoTipo, nuevaBase)
      alGuardarAjustes({
        ...ajustes,
        monedaBase: nuevaBase,
        tipoDolar: nuevoTipo,
        cotizaciones,
        cotizacionManual: false,
        cotizacionActualizada: Date.now(),
      })
      setEstado('')
    } catch {
      setEstado('error')
    }
  }

  const base = ajustes.monedaBase

  return (
    <section className="flex flex-col gap-4">
      <div className="tarjeta p-5">
        <h3 className="text-lg font-black">¿Quién sos vos?</h3>
        <p className="mt-1 text-sm font-bold opacity-65">
          Queda guardado en este celular, así no hay que elegirlo cada vez.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {personas.map((p) => (
            <button
              key={p.id}
              type="button"
              className="boton px-4 py-2 text-sm"
              style={
                yoId === p.id
                  ? { background: p.color, color: '#fff' }
                  : { background: 'rgb(255 255 255 / 0.7)', color: 'var(--color-tinta)' }
              }
              onClick={() => alElegirYo(p.id)}
            >
              {yoId === p.id ? '✓ ' : ''}
              {p.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="tarjeta p-5">
        <h3 className="text-lg font-black">Monedas</h3>
        <p className="mt-1 text-sm font-bold opacity-65">
          La cotización del día se trae sola de internet. Si cambiaron plata a otro valor, escribilo a mano
          y queda ese.
        </p>

        <div className="mt-3 flex flex-col gap-1">
          <span className="text-xs font-black uppercase tracking-wide opacity-60">Con qué dólar</span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TIPOS_DOLAR) as TipoDolar[]).map((t) => (
              <button
                key={t}
                type="button"
                disabled={estado === 'trayendo'}
                className={`boton px-4 py-2 text-sm ${
                  tipo === t && !ajustes.cotizacionManual ? 'bg-[var(--color-mar)] text-white' : 'bg-white/70 text-[var(--color-tinta)]'
                }`}
                onClick={() => void actualizar(t)}
              >
                {TIPOS_DOLAR[t].nombre}
              </button>
            ))}
          </div>
          <p className="text-xs font-bold opacity-65">
            {TIPOS_DOLAR[tipo].ayuda} El real se calcula al mismo tipo de dólar.
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <span className="text-xs font-black uppercase tracking-wide opacity-60">Moneda base</span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MONEDAS) as Moneda[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`boton px-4 py-2 text-sm ${
                  base === m ? 'bg-[var(--color-mar)] text-white' : 'bg-white/70 text-[var(--color-tinta)]'
                }`}
                onClick={() =>
                  ajustes.cotizacionManual
                    ? alGuardarAjustes({
                        ...ajustes,
                        monedaBase: m,
                        // La base siempre vale 1 consigo misma; si no, todos los
                        // totales quedarían multiplicados por un número al azar.
                        cotizaciones: { ...ajustes.cotizaciones, [m]: 1 },
                      })
                    : void actualizar(tipo, m)
                }
              >
                {MONEDAS[m].nombre}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-4 flex flex-col gap-2">
          {(Object.keys(MONEDAS) as Moneda[])
            .filter((m) => m !== base)
            .map((m) => (
              <li key={m} className="flex items-center gap-2">
                <span className="w-28 shrink-0 text-sm font-bold">
                  1 {MONEDAS[m].simbolo} {m} =
                </span>
                <input
                  className="w-32 rounded-2xl border-2 border-white/70 bg-white/80 px-3 py-2 font-bold tabular-nums text-[var(--color-tinta)] outline-none focus:border-[var(--color-mar)]"
                  inputMode="decimal"
                  value={ajustes.cotizaciones[m]}
                  onChange={(e) => {
                    const valor = Number(e.target.value.replace(',', '.'))
                    if (!Number.isFinite(valor) || valor < 0) return
                    alGuardarAjustes({
                      ...ajustes,
                      cotizaciones: { ...ajustes.cotizaciones, [m]: valor },
                      cotizacionManual: true,
                    })
                  }}
                />
                <span className="text-sm font-bold opacity-70">
                  {MONEDAS[base].simbolo} {base}
                </span>
              </li>
            ))}
        </ul>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold">
          {estado === 'trayendo' ? (
            <span className="opacity-70">Trayendo la cotización…</span>
          ) : estado === 'error' ? (
            <span className="text-[var(--color-coral-oscuro)]">
              No se pudo traer la cotización. Sin señal queda la última que había.
            </span>
          ) : ajustes.cotizacionManual ? (
            <span className="opacity-70">Cotización escrita a mano.</span>
          ) : ajustes.cotizacionActualizada ? (
            <span className="opacity-70">
              Actualizada{' '}
              {new Date(ajustes.cotizacionActualizada).toLocaleString('es-AR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          ) : null}
          <button
            type="button"
            disabled={estado === 'trayendo'}
            className="font-black underline underline-offset-2"
            onClick={() => void actualizar(tipo)}
          >
            {ajustes.cotizacionManual ? 'volver a la del día' : 'actualizar'}
          </button>
        </div>
      </div>

    </section>
  )
}
