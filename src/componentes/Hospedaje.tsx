import { useState } from 'react'
import { enlaceComoLlegar, enlaceWhatsapp } from '../datos/hospedaje'
import type { Hospedaje as TipoHospedaje } from '../dominio/tipos'

type Props = {
  hospedaje?: TipoHospedaje
  alGuardar: (hospedaje: TipoHospedaje | undefined) => void
}

function fechaLarga(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function noches(entrada: string, salida: string): number {
  return Math.round((Date.parse(`${salida}T12:00:00`) - Date.parse(`${entrada}T12:00:00`)) / 86_400_000)
}

export function Hospedaje({ hospedaje, alGuardar }: Props) {
  const [editando, setEditando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  if (editando || !hospedaje) {
    return editando ? (
      <Formulario
        inicial={hospedaje}
        alGuardar={(h) => {
          alGuardar(h)
          setEditando(false)
        }}
        alCancelar={() => setEditando(false)}
      />
    ) : (
      <div className="tarjeta p-5">
        <h3 className="text-lg font-black">🏠 Hospedaje</h3>
        <p className="mt-1 text-sm font-bold opacity-65">
          Cargá la reserva y queda a mano la dirección, el check-in y el contacto del anfitrión.
        </p>
        <button
          type="button"
          className="boton mt-3 bg-[var(--color-coral)] px-5 py-2.5 text-white"
          onClick={() => setEditando(true)}
        >
          + Cargar hospedaje
        </button>
      </div>
    )
  }

  const h = hospedaje
  const n = noches(h.entrada, h.salida)

  return (
    <div className="tarjeta overflow-hidden">
      <div className="bg-[var(--color-palmera)] px-5 py-4 text-white">
        <p className="text-xs font-black uppercase tracking-wide opacity-85">🏠 Donde paramos</p>
        <h3 className="text-xl font-black">{h.nombre}</h3>
        <p className="text-sm font-bold opacity-90">{h.direccion}</p>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-white/50 px-2 py-3">
            <p className="text-xs font-black uppercase tracking-wide opacity-60">Entrada</p>
            <p className="font-black">{fechaLarga(h.entrada)}</p>
            {h.horaEntrada && <p className="text-sm font-bold opacity-70">desde las {h.horaEntrada}</p>}
          </div>
          <div className="rounded-2xl bg-white/50 px-2 py-3">
            <p className="text-xs font-black uppercase tracking-wide opacity-60">Salida</p>
            <p className="font-black">{fechaLarga(h.salida)}</p>
            {h.horaSalida && <p className="text-sm font-bold opacity-70">hasta las {h.horaSalida}</p>}
          </div>
        </div>
        {n > 0 && <p className="-mt-2 text-center text-sm font-black opacity-65">{n} noches</p>}

        <div className="flex flex-wrap gap-2">
          <a
            href={enlaceComoLlegar(h)}
            target="_blank"
            rel="noreferrer"
            className="boton bg-[var(--color-mar)] px-4 py-2 text-sm text-white no-underline"
          >
            🧭 Cómo llegar
          </a>
          {h.telefono && (
            <a
              href={enlaceWhatsapp(h.telefono)}
              target="_blank"
              rel="noreferrer"
              className="boton bg-[var(--color-palmera)] px-4 py-2 text-sm text-white no-underline"
            >
              💬 WhatsApp {h.anfitrion ?? 'anfitrión'}
            </a>
          )}
          {h.enlace && (
            <a
              href={h.enlace}
              target="_blank"
              rel="noreferrer"
              className="boton bg-white/70 px-4 py-2 text-sm text-[var(--color-tinta)] no-underline"
            >
              Ver reserva ↗
            </a>
          )}
        </div>

        <dl className="flex flex-col gap-2 text-sm">
          {h.anfitrion && <Dato nombre="Anfitrión">{h.anfitrion}</Dato>}
          {h.telefono && (
            <Dato nombre="Teléfono">
              <span className="select-all tabular-nums">{h.telefono}</span>
            </Dato>
          )}
          {h.codigo && (
            <Dato nombre="Código">
              <button
                type="button"
                className="font-black tracking-wider tabular-nums underline decoration-dotted underline-offset-4"
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(h.codigo ?? '')
                    .then(() => setCopiado(true))
                    .catch(() => {})
                }}
              >
                {h.codigo}
              </button>
              {copiado && <span className="ml-2 text-xs font-bold text-[var(--color-palmera)]">copiado</span>}
            </Dato>
          )}
        </dl>

        {h.notas && <p className="whitespace-pre-line rounded-2xl bg-white/50 px-4 py-3 text-sm font-bold">{h.notas}</p>}

        <button
          type="button"
          className="self-start text-sm font-bold text-[var(--color-mar-hondo)] underline underline-offset-2"
          onClick={() => setEditando(true)}
        >
          editar
        </button>
      </div>
    </div>
  )
}

function Dato({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-24 shrink-0 text-xs font-black uppercase tracking-wide opacity-60">{nombre}</dt>
      <dd className="min-w-0 font-bold break-words">{children}</dd>
    </div>
  )
}

function Formulario({
  inicial,
  alGuardar,
  alCancelar,
}: {
  inicial?: TipoHospedaje
  alGuardar: (h: TipoHospedaje | undefined) => void
  alCancelar: () => void
}) {
  const [h, setH] = useState<TipoHospedaje>(
    inicial ?? { nombre: '', direccion: '', entrada: '2027-01-17', salida: '2027-01-30' },
  )
  const valido = h.nombre.trim() !== '' && h.direccion.trim() !== '' && h.entrada !== '' && h.salida >= h.entrada

  function campo<K extends keyof TipoHospedaje>(clave: K, valor: TipoHospedaje[K]) {
    setH((previo) => ({ ...previo, [clave]: valor }))
  }

  const texto = (clave: 'nombre' | 'direccion' | 'anfitrion' | 'telefono' | 'codigo' | 'enlace', etiqueta: string, ejemplo: string) => (
    <label className="flex flex-col gap-1">
      <Etiqueta>{etiqueta}</Etiqueta>
      <input
        className={claseCampo}
        value={h[clave] ?? ''}
        placeholder={ejemplo}
        onChange={(e) => campo(clave, e.target.value)}
      />
    </label>
  )

  return (
    <form
      className="tarjeta flex flex-col gap-3 p-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (valido) alGuardar({ ...h, nombre: h.nombre.trim(), direccion: h.direccion.trim() })
      }}
    >
      <h3 className="text-lg font-black">🏠 Hospedaje</h3>
      {texto('nombre', 'Nombre', 'Depto en Bombinhas')}
      {texto('direccion', 'Dirección', 'Rua …, Bombinhas - SC')}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-w-0 flex-col gap-1">
          <Etiqueta>Entrada</Etiqueta>
          <input type="date" className={claseCampo} value={h.entrada} onChange={(e) => campo('entrada', e.target.value)} />
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <Etiqueta>Desde las</Etiqueta>
          <input type="time" className={claseCampo} value={h.horaEntrada ?? ''} onChange={(e) => campo('horaEntrada', e.target.value)} />
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <Etiqueta>Salida</Etiqueta>
          <input type="date" className={claseCampo} value={h.salida} min={h.entrada} onChange={(e) => campo('salida', e.target.value)} />
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <Etiqueta>Hasta las</Etiqueta>
          <input type="time" className={claseCampo} value={h.horaSalida ?? ''} onChange={(e) => campo('horaSalida', e.target.value)} />
        </label>
      </div>
      {texto('anfitrion', 'Anfitrión', 'Nombre')}
      {texto('telefono', 'Teléfono', '+55 48 9…')}
      {texto('codigo', 'Código de reserva', 'HM…')}
      {texto('enlace', 'Link a la reserva', 'https://www.airbnb.com.ar/…')}
      <label className="flex flex-col gap-1">
        <Etiqueta>Notas</Etiqueta>
        <textarea
          className={`${claseCampo} min-h-24`}
          value={h.notas ?? ''}
          placeholder="Cancelación, pagos, cómo se retiran las llaves…"
          onChange={(e) => campo('notas', e.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
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
      {inicial && (
        <button
          type="button"
          className="self-start text-sm font-bold text-[var(--color-coral-oscuro)] underline underline-offset-2"
          onClick={() => alGuardar(undefined)}
        >
          sacar hospedaje
        </button>
      )}
    </form>
  )
}

const claseCampo =
  'w-full rounded-2xl border-2 border-white/70 bg-white/80 px-4 py-2.5 font-bold text-[var(--color-tinta)] outline-none focus:border-[var(--color-mar)]'

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-black uppercase tracking-wide opacity-60">{children}</span>
}
