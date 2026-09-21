import { useState } from 'react'
import { Ajustes } from './componentes/Ajustes'
import { Balances } from './componentes/Balances'
import { Bienvenida } from './componentes/Bienvenida'
import { Cuentas } from './componentes/Cuentas'
import { Mapa } from './componentes/Mapa'
import { PARADAS } from './datos/recorrido'
import { useViaje, useYo } from './ganchos/useViaje'

type Pestania = 'mapa' | 'gastos' | 'cuentas' | 'ajustes'

/** Qué decir en el encabezado según dónde estén parados. */
function estadoDelViaje(parada: (typeof PARADAS)[number]): string {
  if (parada.tipo === 'destino') return '¡llegamos!'
  if (parada.tipo === 'salida') return 'todavía sin salir'
  return `vamos por ${parada.nombre}`
}

const PESTANIAS: { id: Pestania; nombre: string; emoji: string }[] = [
  { id: 'mapa', nombre: 'Mapa', emoji: '🗺️' },
  { id: 'gastos', nombre: 'Gastos', emoji: '🧾' },
  { id: 'cuentas', nombre: 'Cuentas', emoji: '⚖️' },
  { id: 'ajustes', nombre: 'Ajustes', emoji: '⚙️' },
]

export function App() {
  const viaje = useViaje()
  const { yoId, elegir } = useYo(viaje.personas)
  const [pestania, setPestania] = useState<Pestania>('mapa')

  if (viaje.cargando || !viaje.ajustes) {
    return <div className="grid min-h-dvh place-items-center text-2xl font-black opacity-60">Cargando…</div>
  }

  if (viaje.personas.length === 0) {
    return (
      <Bienvenida
        alEmpezar={(personas) => {
          void viaje.guardarPersonas(personas)
          elegir(personas[0].id)
        }}
      />
    )
  }

  const ajustes = viaje.ajustes
  const paradaActualId = ajustes.paradaActualId ?? PARADAS[0].id
  const parada = PARADAS.find((p) => p.id === paradaActualId) ?? PARADAS[0]

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-28 pt-6">
      <header className="mb-5 text-center">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Vacaciones <span aria-hidden>🏖️</span>
        </h1>
        <p className="font-bold opacity-70">
          Córdoba → Bombas y Bombinhas · {estadoDelViaje(parada)}
        </p>
      </header>

      <main className="flex-1">
        {pestania === 'mapa' && (
          <Mapa
            paradaActualId={paradaActualId}
            alLlegar={(id) => void viaje.guardarAjustes({ ...ajustes, paradaActualId: id })}
          />
        )}
        {pestania === 'gastos' && (
          <Cuentas
            personas={viaje.personas}
            gastos={viaje.gastosVigentes}
            yoId={yoId}
            alAgregar={(g) => void viaje.agregarGasto(g)}
            alAnular={(id) => void viaje.anularGasto(id)}
          />
        )}
        {pestania === 'cuentas' && (
          <Balances
            personas={viaje.personas}
            gastos={viaje.gastosVigentes}
            pagos={viaje.pagosVigentes}
            ajustes={ajustes}
            yoId={yoId}
            alRegistrarPago={(p) => void viaje.agregarPago(p)}
          />
        )}
        {pestania === 'ajustes' && (
          <Ajustes
            personas={viaje.personas}
            ajustes={ajustes}
            yoId={yoId}
            alElegirYo={elegir}
            alGuardarPersonas={(ps) => void viaje.guardarPersonas(ps)}
            alGuardarAjustes={(a) => void viaje.guardarAjustes(a)}
            exportar={viaje.exportar}
            importar={viaje.importar}
          />
        )}
      </main>

      {/* La barra va abajo y fija: en el auto se usa con una mano. */}
      <nav className="fixed inset-x-0 bottom-0 z-10 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div className="tarjeta mx-auto flex max-w-2xl gap-1 p-1.5">
          {PESTANIAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPestania(p.id)}
              aria-current={pestania === p.id ? 'page' : undefined}
              className={`boton flex-1 px-2 py-2.5 text-xs sm:text-sm ${
                pestania === p.id ? 'bg-[var(--color-mar)] text-white' : 'bg-transparent shadow-none'
              }`}
            >
              <span className="block text-lg leading-none" aria-hidden>
                {p.emoji}
              </span>
              {p.nombre}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
