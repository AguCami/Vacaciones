import { useEffect, useRef, useState } from 'react'
import { Ajustes } from './componentes/Ajustes'
import { Balances } from './componentes/Balances'
import { Cuentas } from './componentes/Cuentas'
import { Guia } from './componentes/Guia'
import { Intro } from './componentes/Intro'
import { Listas } from './componentes/Listas'
import { Mapa } from './componentes/Mapa'
import { traerCotizaciones, VIGENCIA_MS } from './datos/cotizaciones'
import { PARADAS } from './datos/recorrido'
import { useViaje, useYo } from './ganchos/useViaje'

type Pestania = 'mapa' | 'gastos' | 'cuentas' | 'listas' | 'guia' | 'ajustes'

/** Qué decir en el encabezado según dónde estén parados. */
function estadoDelViaje(parada: (typeof PARADAS)[number]): string {
  if (parada.tipo === 'destino') return '¡llegamos!'
  if (parada.tipo === 'salida') return 'todavía sin salir'
  return `vamos por ${parada.nombre}`
}

/** Días que faltan para salir, o null si ya salieron o no hay fecha. */
function diasParaSalir(fechaSalida?: string): number | null {
  if (!fechaSalida) return null
  const salida = new Date(`${fechaSalida}T00:00:00`)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const dias = Math.round((salida.getTime() - hoy.getTime()) / 86_400_000)
  return dias >= 0 ? dias : null
}

// Ajustes no está en la barra: se usa poco, y se entra desde el final de la Guía.
// Cinco botones es lo que entra cómodo en un celular angosto.
const PESTANIAS: { id: Pestania; nombre: string; emoji: string }[] = [
  { id: 'mapa', nombre: 'Mapa', emoji: '🗺️' },
  { id: 'gastos', nombre: 'Gastos', emoji: '🧾' },
  { id: 'cuentas', nombre: 'Cuentas', emoji: '⚖️' },
  { id: 'listas', nombre: 'Listas', emoji: '✅' },
  { id: 'guia', nombre: 'Guía', emoji: '🧭' },
]

export function App() {
  const viaje = useViaje()
  const { yoId, elegir } = useYo(viaje.personas)
  const [pestania, setPestania] = useState<Pestania>('mapa')
  const [enIntro, setEnIntro] = useState(() => {
    // Una vez por visita: si recargan la página no hace falta volver a verla.
    try {
      return sessionStorage.getItem('vacaciones-intro') !== 'vista'
    } catch {
      return true
    }
  })

  function entrar() {
    setEnIntro(false)
    try {
      sessionStorage.setItem('vacaciones-intro', 'vista')
    } catch {
      // Sin storage se vuelve a ver al recargar, nada más.
    }
  }

  // La cotización del día se trae sola al abrir, salvo que alguien la haya
  // escrito a mano. Sin señal no pasa nada: queda la última que había.
  // Se intenta una sola vez por apertura, así sin señal no queda reintentando.
  const ajustesCargados = viaje.ajustes
  const guardarAjustes = viaje.guardarAjustes
  const yaIntento = useRef(false)
  useEffect(() => {
    if (yaIntento.current || !ajustesCargados || ajustesCargados.cotizacionManual) return
    if (Date.now() - (ajustesCargados.cotizacionActualizada ?? 0) < VIGENCIA_MS) return
    yaIntento.current = true
    traerCotizaciones(ajustesCargados.tipoDolar ?? 'blue', ajustesCargados.monedaBase)
      .then((cotizaciones) =>
        guardarAjustes({ ...ajustesCargados, cotizaciones, cotizacionActualizada: Date.now() }),
      )
      .catch(() => {})
  }, [ajustesCargados, guardarAjustes])

  if (enIntro) return <Intro fechaSalida={viaje.ajustes?.fechaSalida} alEntrar={entrar} />

  if (viaje.cargando || !viaje.ajustes) {
    return <div className="grid min-h-dvh place-items-center text-2xl font-black opacity-60">Cargando…</div>
  }


  const ajustes = viaje.ajustes
  const paradaActualId = ajustes.paradaActualId ?? PARADAS[0].id
  const parada = PARADAS.find((p) => p.id === paradaActualId) ?? PARADAS[0]
  const faltan = parada.tipo === 'salida' ? diasParaSalir(ajustes.fechaSalida) : null

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-28 pt-6">
      {/* De fondo, un cuadro quieto del video de la intro: la playa detrás del vidrio. */}
      <div
        className="fondo"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}fondo.jpg)` }}
        aria-hidden
      />
      <header className="relative mb-5 text-center">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Vacaciones <span aria-hidden>🏖️</span>
        </h1>
        <p className="font-bold opacity-70">
          Córdoba → Bombas y Bombinhas · {estadoDelViaje(parada)}
        </p>
        {faltan !== null && (
          <p className="tarjeta mt-2 inline-block !rounded-full px-4 py-1 text-sm font-black">
            {faltan === 0 ? '¡Hoy salimos! 🚗' : faltan === 1 ? 'Mañana salimos 🚗' : `Faltan ${faltan} días 🚗`}
          </p>
        )}
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
        {pestania === 'listas' && (
          <Listas
            personas={viaje.personas}
            items={viaje.items}
            yoId={yoId}
            alGuardar={(i) => void viaje.guardarItem(i)}
          />
        )}
        {pestania === 'guia' && (
          <Guia
            ajustes={ajustes}
            alGuardarHospedaje={(h) => void viaje.guardarAjustes({ ...ajustes, hospedaje: h })}
            alAbrirAjustes={() => setPestania('ajustes')}
          />
        )}
        {pestania === 'ajustes' && (
          <button
            type="button"
            className="mb-3 text-sm font-black underline underline-offset-2 opacity-80"
            onClick={() => setPestania('guia')}
          >
            ← Volver a la Guía
          </button>
        )}
        {pestania === 'ajustes' && (
          <Ajustes
            personas={viaje.personas}
            ajustes={ajustes}
            yoId={yoId}
            alElegirYo={elegir}
            alGuardarAjustes={(a) => void viaje.guardarAjustes(a)}
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
                pestania === p.id ? 'bg-[var(--color-mar)] text-white' : 'boton-plano bg-transparent'
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
