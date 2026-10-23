import { useEffect, useState } from 'react'

/** "Muy temprano": a esta hora apunta la cuenta regresiva el día de salida. */
const HORA_SALIDA = '05:00'

type Props = {
  fechaSalida?: string
  alEntrar: () => void
}

type Faltante = { dias: number; horas: number; minutos: number; segundos: number }

function cuantoFalta(destino: number, ahora: number): Faltante | null {
  const ms = destino - ahora
  if (ms <= 0) return null
  const s = Math.floor(ms / 1000)
  return {
    dias: Math.floor(s / 86_400),
    horas: Math.floor((s % 86_400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
  }
}

/**
 * La pantalla de entrada: la playa en video y, arriba, cuánto falta para salir.
 *
 * El video va mudo porque los navegadores solo reproducen solos los videos sin
 * sonido. Con "menos movimiento" pedido, queda la foto quieta.
 */
export function Intro({ fechaSalida, alEntrar }: Props) {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(reloj)
  }, [])

  const destino = fechaSalida ? new Date(`${fechaSalida}T${HORA_SALIDA}:00`).getTime() : NaN
  const falta = Number.isFinite(destino) ? cuantoFalta(destino, ahora) : null
  const quieto = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const base = import.meta.env.BASE_URL

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[var(--color-noche)] text-white">
      <video
        className="absolute inset-0 size-full object-cover"
        src={`${base}intro.mp4`}
        poster={`${base}intro.jpg`}
        autoPlay={!quieto}
        muted
        loop
        playsInline
        aria-hidden
      />
      {/* Un velo arriba y abajo para que el texto blanco se lea sobre el cielo y la arena. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45" aria-hidden />

      <div className="relative mx-auto flex h-full max-w-md flex-col justify-between px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="vidrio p-4 text-center sm:p-5">
          {falta ? (
            <>
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-90">Faltan</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                <Celda valor={falta.dias} nombre={falta.dias === 1 ? 'día' : 'días'} />
                <Celda valor={falta.horas} nombre="horas" />
                <Celda valor={falta.minutos} nombre="min" />
                <Celda valor={falta.segundos} nombre="seg" />
              </div>
            </>
          ) : (
            <p className="py-2 text-xl font-black">¡Ya estamos en viaje! 🚗</p>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          {/* Sin título a la vista: la playa habla sola. Queda para lectores de pantalla. */}
          <h1 className="sr-only">Vacaciones: Córdoba a Bombas y Bombinhas</h1>
          <button type="button" onClick={alEntrar} className="vidrio vidrio-boton px-8 py-3.5 text-lg font-black">
            Entrar al viaje
          </button>
        </div>
      </div>
    </div>
  )
}

function Celda({ valor, nombre }: { valor: number; nombre: string }) {
  return (
    <div className="vidrio vidrio-chico px-1 py-2">
      <p className="text-3xl font-black tabular-nums leading-none sm:text-4xl">{String(valor).padStart(2, '0')}</p>
      <p className="mt-1 text-[0.7rem] font-black uppercase tracking-wide opacity-85">{nombre}</p>
    </div>
  )
}
