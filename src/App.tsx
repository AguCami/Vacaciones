import { useState } from 'react'
import { Ajustes } from './componentes/Ajustes'
import { Balances } from './componentes/Balances'
import { BarraPestanas, type Pestana } from './componentes/BarraPestanas'
import { Cuentas } from './componentes/Cuentas'
import { Guia } from './componentes/Guia'
import { Intro } from './componentes/Intro'
import { Listas } from './componentes/Listas'
import { Mapa } from './componentes/Mapa'
import { PARADAS } from './datos/recorrido'
import { useCotizacion } from './ganchos/useCotizacion'
import { useViaje, useYo } from './ganchos/useViaje'

type Pestania = 'mapa' | 'gastos' | 'cuentas' | 'listas' | 'guia' | 'ajustes'

// Ajustes no está en la barra: se usa poco, y se entra desde el final de la Guía.
// Cinco botones es lo que entra cómodo en un celular angosto.
// Cada una con su ícono dibujado, en public/iconos/<id>.webp.
const PESTANIAS: Pestana<Exclude<Pestania, 'ajustes'>>[] = (
  [
    // Cada pestaña con su color de playa: la burbuja de abajo lo va tomando.
    ['mapa', 'Mapa', '#2ec4d6'],
    ['gastos', 'Gastos', '#ffc23c'],
    ['cuentas', 'Cuentas', '#ff6b5a'],
    ['listas', 'Listas', '#6fd16a'],
    ['guia', 'Guía', '#ff9a5c'],
  ] as const
).map(([id, nombre, color]) => ({ id, nombre, color, icono: `${import.meta.env.BASE_URL}iconos/${id}.webp` }))

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

  const cotizacion = useCotizacion(viaje.ajustes, viaje.guardarAjustes)

  if (enIntro) return <Intro fechaSalida={viaje.ajustes?.fechaSalida} alEntrar={entrar} />

  if (viaje.cargando || !viaje.ajustes) {
    return <div className="grid min-h-dvh place-items-center text-2xl font-black opacity-60">Cargando…</div>
  }


  const ajustes = viaje.ajustes
  const paradaActualId = ajustes.paradaActualId ?? PARADAS[0].id

  return (
    // Los márgenes respetan la muesca y la barra del iPhone (y la cámara en horizontal):
    // con la app agregada a la pantalla de inicio, el contenido llega hasta el borde.
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col pb-32 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      {/* De fondo, un cuadro quieto del video de la intro: la playa detrás del vidrio. */}
      <div
        className="fondo"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}fondo.jpg)` }}
        aria-hidden
      />
      <header className="relative mb-5 text-center">
        <h1>
          <img
            src={`${import.meta.env.BASE_URL}titulo.webp`}
            alt="Bombas y Bombinhas"
            width={900}
            height={193}
            className="mx-auto h-auto w-full max-w-md drop-shadow-[0_2px_6px_rgb(0_0_0/0.18)]"
          />
        </h1>
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
            cotizacion={cotizacion}
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
            cotizacion={cotizacion}
          />
        )}
      </main>

      {/* La barra va abajo y fija: en el auto se usa con una mano. */}
      <nav className="fixed inset-x-0 bottom-0 z-10 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-2">
        <BarraPestanas
          pestanas={PESTANIAS}
          actual={pestania === 'ajustes' ? null : pestania}
          alElegir={setPestania}
        />
      </nav>
    </div>
  )
}
