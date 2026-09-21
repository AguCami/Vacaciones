import { useRef, useState } from 'react'
import { COLORES } from './Bienvenida'
import { MONEDAS, type Ajustes as TipoAjustes, type Moneda, type Persona } from '../dominio/tipos'
import { nuevoId } from '../ganchos/useViaje'

type Props = {
  personas: Persona[]
  ajustes: TipoAjustes
  yoId: string
  alElegirYo: (id: string) => void
  alGuardarPersonas: (personas: Persona[]) => void
  alGuardarAjustes: (ajustes: TipoAjustes) => void
  exportar: () => Promise<string>
  importar: (json: string) => Promise<void>
}

export function Ajustes({
  personas,
  ajustes,
  yoId,
  alElegirYo,
  alGuardarPersonas,
  alGuardarAjustes,
  exportar,
  importar,
}: Props) {
  const archivo = useRef<HTMLInputElement>(null)
  const [aviso, setAviso] = useState('')

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
        <h3 className="text-lg font-black">Quiénes viajan</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {personas.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2">
              <input
                type="color"
                className="size-9 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
                value={p.color}
                onChange={(e) =>
                  alGuardarPersonas(personas.map((x) => (x.id === p.id ? { ...x, color: e.target.value } : x)))
                }
                aria-label={`Color de ${p.nombre}`}
              />
              <input
                className="flex-1 rounded-2xl border-2 border-white/70 bg-white/80 px-4 py-2 font-bold text-[var(--color-tinta)] outline-none focus:border-[var(--color-mar)]"
                value={p.nombre}
                onChange={(e) =>
                  alGuardarPersonas(personas.map((x) => (x.id === p.id ? { ...x, nombre: e.target.value } : x)))
                }
              />
              {personas.length > 2 && (
                <button
                  type="button"
                  className="px-2 text-sm font-bold text-[var(--color-coral-oscuro)] underline"
                  onClick={() => {
                    if (confirm(`¿Sacar a ${p.nombre}? Los gastos que ya cargó quedan igual.`)) {
                      alGuardarPersonas(personas.filter((x) => x.id !== p.id))
                    }
                  }}
                >
                  sacar
                </button>
              )}
              <span className="sr-only">{i}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="boton mt-3 bg-white/70 px-4 py-2 text-sm"
          onClick={() =>
            alGuardarPersonas([
              ...personas,
              { id: nuevoId(), nombre: `Nombre ${personas.length + 1}`, color: COLORES[personas.length % COLORES.length] },
            ])
          }
        >
          + Sumar a alguien
        </button>
      </div>

      <div className="tarjeta p-5">
        <h3 className="text-lg font-black">Monedas</h3>
        <p className="mt-1 text-sm font-bold opacity-65">
          Los totales se muestran en la moneda base. Poné la cotización a la que cambiaron de verdad, no
          la del diario: la cuenta que importa es la que pagaron ustedes.
        </p>

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
                  alGuardarAjustes({
                    ...ajustes,
                    monedaBase: m,
                    // La base siempre vale 1 consigo misma; si no, todos los
                    // totales quedarían multiplicados por un número al azar.
                    cotizaciones: { ...ajustes.cotizaciones, [m]: 1 },
                  })
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
                    alGuardarAjustes({ ...ajustes, cotizaciones: { ...ajustes.cotizaciones, [m]: valor } })
                  }}
                />
                <span className="text-sm font-bold opacity-70">
                  {MONEDAS[base].simbolo} {base}
                </span>
              </li>
            ))}
        </ul>
      </div>

      <div className="tarjeta p-5">
        <h3 className="text-lg font-black">Copia de seguridad</h3>
        <p className="mt-1 text-sm font-bold opacity-65">
          Por ahora los datos viven solo en este celular. Bajá el archivo cada tanto — y sobre todo antes
          de pasar la app a Firebase, para no perder nada de lo cargado.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="boton bg-[var(--color-mar)] px-4 py-2 text-sm text-white"
            onClick={async () => {
              const json = await exportar()
              const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
              const a = document.createElement('a')
              a.href = url
              a.download = `vacaciones-${new Date().toISOString().slice(0, 10)}.json`
              a.click()
              URL.revokeObjectURL(url)
              setAviso('Archivo descargado.')
            }}
          >
            Bajar copia
          </button>
          <button
            type="button"
            className="boton bg-white/70 px-4 py-2 text-sm"
            onClick={() => archivo.current?.click()}
          >
            Traer copia
          </button>
          <input
            ref={archivo}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              try {
                await importar(await f.text())
                setAviso('Listo: se juntó con lo que ya había.')
              } catch {
                setAviso('Ese archivo no se pudo leer.')
              }
              e.target.value = ''
            }}
          />
        </div>
        {aviso && <p className="mt-2 text-sm font-bold text-[var(--color-palmera)]">{aviso}</p>}
      </div>
    </section>
  )
}
