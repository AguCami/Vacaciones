import { useState } from 'react'
import { LISTAS } from '../datos/listas'
import type { ItemLista, ListaId, Persona } from '../dominio/tipos'
import { nuevoId } from '../ganchos/useViaje'

type Props = {
  personas: Persona[]
  items: ItemLista[]
  yoId: string
  alGuardar: (item: ItemLista) => void
}

export function Listas({ personas, items, yoId, alGuardar }: Props) {
  const [listaId, setListaId] = useState<ListaId>('papeles')
  const [texto, setTexto] = useState('')
  const [soloMios, setSoloMios] = useState(false)

  const lista = LISTAS[listaId]
  const deLaLista = items
    .filter((i) => i.lista === listaId)
    .filter((i) => !soloMios || i.encargadoId === yoId)
    // Lo pendiente arriba: lo tildado ya no hace falta mirarlo.
    .toSorted((a, b) => Number(a.hecho) - Number(b.hecho) || a.creadoEn - b.creadoEn)
  const esDatos = listaId === 'datos'

  return (
    <section className="flex flex-col gap-4">
      {/* Las listas se eligen con chips que se deslizan: en un celular angosto
          cinco botones en fila no entran. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(Object.keys(LISTAS) as ListaId[]).map((id) => {
          const todos = items.filter((i) => i.lista === id)
          const hechos = todos.filter((i) => i.hecho).length
          return (
            <button
              key={id}
              type="button"
              onClick={() => setListaId(id)}
              className={`boton shrink-0 px-4 py-2 text-sm ${
                listaId === id ? 'bg-[var(--color-mar)] text-white' : 'bg-white/70 text-[var(--color-tinta)]'
              }`}
            >
              {LISTAS[id].emoji} {LISTAS[id].nombre}
              {id !== 'datos' && todos.length > 0 && (
                <span className="ml-1.5 tabular-nums opacity-70">
                  {hechos}/{todos.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="tarjeta p-5">
        <h3 className="text-lg font-black">
          {lista.emoji} {lista.nombre}
        </h3>
        <p className="mt-1 text-sm font-bold opacity-65">{lista.ayuda}</p>

        {!esDatos && <Progreso items={items.filter((i) => i.lista === listaId)} />}

        {yoId && !esDatos && (
          <label className="mt-3 flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={soloMios} onChange={(e) => setSoloMios(e.target.checked)} />
            Solo lo que me toca a mí
          </label>
        )}

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!texto.trim()) return
            const ahora = Date.now()
            alGuardar({
              id: nuevoId(),
              lista: listaId,
              texto: texto.trim(),
              hecho: false,
              creadoEn: ahora,
              creadoPor: yoId,
              actualizadoEn: ahora,
            })
            setTexto('')
          }}
        >
          <input
            className={`${claseCampo} min-w-0 flex-1`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={esDatos ? 'Reserva Bombinhas: Rua …, código 1234' : 'Agregar algo a la lista'}
          />
          <button
            type="submit"
            disabled={!texto.trim()}
            className="boton shrink-0 bg-[var(--color-coral)] px-5 text-white disabled:opacity-40"
          >
            +
          </button>
        </form>
      </div>

      {deLaLista.length === 0 ? (
        <p className="tarjeta p-8 text-center font-bold opacity-70">
          {soloMios ? 'No tenés nada asignado en esta lista.' : 'Lista vacía. Arriba se agrega lo que haga falta.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {deLaLista.map((item) => (
            <Renglon
              key={item.id}
              item={item}
              personas={personas}
              yoId={yoId}
              conTilde={!esDatos}
              alGuardar={alGuardar}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function Progreso({ items }: { items: ItemLista[] }) {
  if (items.length === 0) return null
  const hechos = items.filter((i) => i.hecho).length
  const completo = hechos === items.length
  return (
    <div className="mt-3">
      <div className="h-3 overflow-hidden rounded-full bg-white/50">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${(hechos / items.length) * 100}%`,
            background: completo ? 'var(--color-palmera)' : 'var(--color-sol)',
          }}
        />
      </div>
      <p className="mt-1 text-xs font-black opacity-65">
        {completo ? '¡Todo listo! 🎉' : `${hechos} de ${items.length} listos`}
      </p>
    </div>
  )
}

function Renglon({
  item,
  personas,
  yoId,
  conTilde,
  alGuardar,
}: {
  item: ItemLista
  personas: Persona[]
  yoId: string
  conTilde: boolean
  alGuardar: (item: ItemLista) => void
}) {
  const encargado = personas.find((p) => p.id === item.encargadoId)
  const tildo = personas.find((p) => p.id === item.hechoPor)

  /** Rota el encargado: nadie → cada uno → nadie. Un toque, sin menús. */
  function siguienteEncargado() {
    const i = personas.findIndex((p) => p.id === item.encargadoId)
    const siguiente = personas[i + 1]
    alGuardar({ ...item, encargadoId: siguiente?.id })
  }

  return (
    <li className={`tarjeta flex items-start gap-3 px-4 py-3 ${item.hecho ? 'opacity-60' : ''}`}>
      {conTilde && (
        <button
          type="button"
          role="checkbox"
          aria-checked={item.hecho}
          aria-label={item.texto}
          onClick={() => alGuardar({ ...item, hecho: !item.hecho, hechoPor: item.hecho ? undefined : yoId })}
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 text-sm font-black text-white"
          style={{
            borderColor: item.hecho ? 'var(--color-palmera)' : 'var(--color-mar)',
            background: item.hecho ? 'var(--color-palmera)' : 'transparent',
          }}
        >
          {item.hecho ? '✓' : ''}
        </button>
      )}
      <div className="min-w-0 flex-1">
        <p className={`font-black break-words ${item.hecho ? 'line-through' : ''}`}>{item.texto}</p>
        {item.nota && <p className="text-xs font-bold opacity-65">{item.nota}</p>}
        {item.hecho && tildo && <p className="text-xs font-bold opacity-65">lo tildó {tildo.nombre}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {conTilde && (
          <button
            type="button"
            onClick={siguienteEncargado}
            className="rounded-full px-2.5 py-0.5 text-xs font-black"
            style={
              encargado
                ? { background: encargado.color, color: '#fff' }
                : { background: 'rgb(255 255 255 / 0.6)', color: 'var(--color-tinta)' }
            }
            title="Tocar para cambiar quién se encarga"
          >
            {encargado ? encargado.nombre : '¿quién?'}
          </button>
        )}
        <button
          type="button"
          className="text-xs font-bold text-[var(--color-coral-oscuro)] underline underline-offset-2"
          onClick={() => {
            if (confirm(`¿Borrar "${item.texto}"?`)) alGuardar({ ...item, anulado: true })
          }}
        >
          borrar
        </button>
      </div>
    </li>
  )
}

const claseCampo =
  'rounded-2xl border-2 border-white/70 bg-white/80 px-4 py-2.5 font-bold text-[var(--color-tinta)] outline-none focus:border-[var(--color-mar)]'
