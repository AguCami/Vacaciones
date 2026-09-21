import { useState } from 'react'
import { hoy, nuevoId } from '../ganchos/useViaje'
import { formatearCentavos } from '../dominio/cuentas'
import { CATEGORIAS, MONEDAS, type Categoria, type Gasto, type Moneda, type Persona } from '../dominio/tipos'

type Props = {
  personas: Persona[]
  gastos: Gasto[]
  yoId: string
  alAgregar: (gasto: Gasto) => void
  alAnular: (id: string) => void
}

export function Cuentas({ personas, gastos, yoId, alAgregar, alAnular }: Props) {
  const [abierto, setAbierto] = useState(false)

  return (
    <section className="flex flex-col gap-4">
      {abierto ? (
        <Formulario
          personas={personas}
          yoId={yoId}
          alGuardar={(g) => {
            alAgregar(g)
            setAbierto(false)
          }}
          alCancelar={() => setAbierto(false)}
        />
      ) : (
        <button
          type="button"
          className="boton w-full bg-[var(--color-coral)] px-6 py-4 text-lg text-white"
          onClick={() => setAbierto(true)}
        >
          + Anotar un gasto
        </button>
      )}

      {gastos.length === 0 ? (
        <p className="tarjeta p-8 text-center font-bold opacity-70">
          Todavía no hay nada anotado. El primero suele ser la nafta.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {gastos.map((g) => (
            <Fila key={g.id} gasto={g} personas={personas} alAnular={alAnular} />
          ))}
        </ul>
      )}
    </section>
  )
}

function Fila({
  gasto,
  personas,
  alAnular,
}: {
  gasto: Gasto
  personas: Persona[]
  alAnular: (id: string) => void
}) {
  const pagador = personas.find((p) => p.id === gasto.pagadorId)
  const cuantos = gasto.participantesIds.length
  const todos = cuantos === personas.length && personas.length > 0
  const nombres = gasto.participantesIds
    .map((id) => personas.find((p) => p.id === id)?.nombre ?? '?')
    .join(', ')

  return (
    <li className="tarjeta flex items-center gap-3 px-4 py-3">
      <span className="text-2xl" aria-hidden>
        {CATEGORIAS[gasto.categoria].emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-black">{gasto.descripcion}</p>
        <p className="truncate text-xs font-bold opacity-65">
          {new Date(`${gasto.fecha}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
          {' · pagó '}
          <span style={{ color: pagador?.color }}>{pagador?.nombre ?? '?'}</span>
          {' · '}
          {todos ? 'entre todos' : `entre ${cuantos}: ${nombres}`}
        </p>
      </div>
      <div className="text-right">
        <p className="font-black tabular-nums">
          {MONEDAS[gasto.moneda].simbolo}
          {gasto.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <button
          type="button"
          className="text-xs font-bold text-[var(--color-coral-oscuro)] underline underline-offset-2"
          onClick={() => {
            if (confirm(`¿Borrar "${gasto.descripcion}"?`)) alAnular(gasto.id)
          }}
        >
          borrar
        </button>
      </div>
    </li>
  )
}

function Formulario({
  personas,
  yoId,
  alGuardar,
  alCancelar,
}: {
  personas: Persona[]
  yoId: string
  alGuardar: (gasto: Gasto) => void
  alCancelar: () => void
}) {
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState<Moneda>('BRL')
  const [categoria, setCategoria] = useState<Categoria>('comida')
  const [pagadorId, setPagadorId] = useState(yoId || personas[0]?.id || '')
  const [fecha, setFecha] = useState(hoy())
  const [entre, setEntre] = useState<string[]>(personas.map((p) => p.id))

  const montoNum = Number(monto.replace(',', '.'))
  const valido = descripcion.trim() !== '' && montoNum > 0 && pagadorId !== '' && entre.length > 0

  function alternar(id: string) {
    setEntre((previos) => (previos.includes(id) ? previos.filter((x) => x !== id) : [...previos, id]))
  }

  return (
    <form
      className="tarjeta flex flex-col gap-4 p-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valido) return
        alGuardar({
          id: nuevoId(),
          fecha,
          descripcion: descripcion.trim(),
          monto: montoNum,
          moneda,
          pagadorId,
          participantesIds: entre,
          categoria,
          creadoEn: Date.now(),
          creadoPor: yoId || pagadorId,
        })
      }}
    >
      <div className="flex flex-col gap-1">
        <Etiqueta>¿Qué fue?</Etiqueta>
        <input
          className={claseCampo}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Nafta en Uruguaiana"
          autoFocus
        />
      </div>

      <div className="flex gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Etiqueta>Cuánto</Etiqueta>
          <input
            className={`${claseCampo} w-full`}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
          />
        </div>
        {/* Ancho fijo: si no, el select se estira con el nombre de la moneda y
            se escapa del borde de la tarjeta en pantallas angostas. */}
        <div className="flex w-28 shrink-0 flex-col gap-1">
          <Etiqueta>Moneda</Etiqueta>
          <select
            className={`${claseCampo} w-full px-3`}
            value={moneda}
            onChange={(e) => setMoneda(e.target.value as Moneda)}
          >
            {(Object.keys(MONEDAS) as Moneda[]).map((m) => (
              <option key={m} value={m}>
                {MONEDAS[m].simbolo} {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Etiqueta>Categoría</Etiqueta>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CATEGORIAS) as Categoria[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria(c)}
              className={`boton px-3 py-1.5 text-sm ${
                categoria === c ? 'bg-[var(--color-mar)] text-white' : 'bg-white/70 text-[var(--color-tinta)]'
              }`}
            >
              {CATEGORIAS[c].emoji} {CATEGORIAS[c].nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Etiqueta>Pagó</Etiqueta>
        <div className="flex flex-wrap gap-1.5">
          {personas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPagadorId(p.id)}
              className="boton px-4 py-1.5 text-sm"
              style={
                pagadorId === p.id
                  ? { background: p.color, color: '#fff' }
                  : { background: 'rgb(255 255 255 / 0.7)', color: 'var(--color-tinta)' }
              }
            >
              {p.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Etiqueta>Se reparte entre</Etiqueta>
        <div className="flex flex-wrap gap-1.5">
          {personas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => alternar(p.id)}
              className="boton px-4 py-1.5 text-sm"
              style={
                entre.includes(p.id)
                  ? { background: p.color, color: '#fff' }
                  : { background: 'rgb(255 255 255 / 0.55)', color: 'var(--color-tinta)', opacity: 0.6 }
              }
            >
              {entre.includes(p.id) ? '✓ ' : ''}
              {p.nombre}
            </button>
          ))}
        </div>
        {entre.length > 0 && montoNum > 0 && (
          <p className="text-xs font-bold opacity-65">
            {formatearCentavos(Math.round((montoNum * 100) / entre.length), moneda)} para cada uno
            {entre.length > 1 && Math.round(montoNum * 100) % entre.length !== 0 && ' (el resto lo absorbe el primero)'}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Etiqueta>Día</Etiqueta>
        <input type="date" className={claseCampo} value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!valido}
          className="boton flex-1 bg-[var(--color-palmera)] px-6 py-3 text-white disabled:opacity-40"
        >
          Guardar
        </button>
        <button type="button" className="boton bg-white/70 px-6 py-3" onClick={alCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

const claseCampo =
  'rounded-2xl border-2 border-white/70 bg-white/80 px-4 py-2.5 font-bold text-[var(--color-tinta)] outline-none focus:border-[var(--color-mar)]'

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-black uppercase tracking-wide opacity-60">{children}</span>
}
