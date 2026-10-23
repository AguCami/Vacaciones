import { useState } from 'react'
import { nuevoId } from '../ganchos/useViaje'
import type { Persona } from '../dominio/tipos'

export const COLORES = ['#ff6b5a', '#0ea5b7', '#ffc23c', '#2fa36b', '#a06cd5', '#ef7d9d']

/** Primera vez que se abre la app: quiénes viajan. Sin esto no hay cuentas. */
export function Bienvenida({ alEmpezar }: { alEmpezar: (personas: Persona[]) => void }) {
  // Ya vienen los cuatro del viaje; se pueden cambiar acá mismo.
  const [nombres, setNombres] = useState(['Agu', 'Aldi', 'Mile', 'Fran'])
  const validos = nombres.map((n) => n.trim()).filter((n) => n !== '')

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4 py-10">
      <div className="text-center">
        <p className="text-6xl" aria-hidden>
          🏖️
        </p>
        <h1 className="mt-2 text-4xl font-black">Vacaciones</h1>
        <p className="mt-1 font-bold opacity-70">Córdoba → Bombas y Bombinhas</p>
      </div>

      <form
        className="tarjeta flex flex-col gap-3 p-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (validos.length < 2) return
          alEmpezar(
            nombres
              .map((n) => n.trim())
              .filter((n) => n !== '')
              .map((nombre, i) => ({ id: nuevoId(), nombre, color: COLORES[i % COLORES.length] })),
          )
        }}
      >
        <h2 className="text-lg font-black">¿Quiénes viajan?</h2>
        <p className="-mt-2 text-sm font-bold opacity-65">
          Se pueden cambiar después. Si van más de cuatro, se agregan en Ajustes.
        </p>
        {nombres.map((nombre, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="size-8 shrink-0 rounded-full" style={{ background: COLORES[i] }} />
            <input
              className="flex-1 rounded-2xl border-2 border-white/70 bg-white/80 px-4 py-2.5 font-bold text-[var(--color-tinta)] outline-none focus:border-[var(--color-mar)]"
              value={nombre}
              placeholder={`Nombre ${i + 1}`}
              onChange={(e) => setNombres((ns) => ns.map((n, j) => (j === i ? e.target.value : n)))}
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={validos.length < 2}
          className="boton mt-2 bg-[var(--color-coral)] px-6 py-3 text-white disabled:opacity-40"
        >
          Empezar el viaje
        </button>
      </form>
    </div>
  )
}
