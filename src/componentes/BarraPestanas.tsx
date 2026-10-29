import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * La barra de abajo, con menisco.
 *
 * La pestaña elegida sale de la barra en una burbuja que flota sobre el borde,
 * y el borde se hunde debajo de ella como el agua alrededor de algo que flota.
 * Toda la silueta es un solo camino: el hueco es un cuenco circular unido al
 * borde por dos hombros redondeados, cada uno tangente al borde y al cuenco.
 *
 * Al moverse, la velocidad inclina la superficie: el hombro de atrás se estira
 * y el de adelante se cierra. La pestaña no se desliza: la barra se derrite.
 * Al pasar sobre cada pestaña, la burbuja toma su ícono (que se apaga en la
 * barra) y va cambiando de a poco al color de esa pestaña. Debajo de la barra
 * queda un resplandor del mismo color. Se puede tocar o arrastrar la burbuja.
 */

export type Pestana<Id extends string> = { id: Id; nombre: string; icono: string; color: string }

/** Un canal (0 rojo, 1 verde, 2 azul) de un color #rrggbb. */
const canalDe = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)

/** Mezcla dos colores #rrggbb: t = 0 es el primero, 1 el segundo. */
function mezclar(a: string, b: string, t: number): string {
  const c = canalDe
  const canal = (i: number) => Math.round(c(a, i) + (c(b, i) - c(a, i)) * t)
  return `rgb(${canal(0)} ${canal(1)} ${canal(2)})`
}

type Props<Id extends string> = {
  pestanas: Pestana<Id>[]
  actual: Id | null
  alElegir: (id: Id) => void
}

/** Medidas de la silueta, en px. */
const ALTO_BARRA = 58
const ESQUINA = 24
const RADIO_BURBUJA = 25
/** Lo que el cuenco deja de aire alrededor de la burbuja. */
const AIRE = 5
const RADIO_CUENCO = RADIO_BURBUJA + AIRE
const HOMBRO = 10
/** Cuánto asoma la burbuja por encima del borde: el centro, un poco arriba. */
const ALTURA_BURBUJA = 3
/** Espacio libre arriba de la barra para la burbuja. */
const TECHO = RADIO_BURBUJA + ALTURA_BURBUJA + 6

/** El resorte que lleva la burbuja de una pestaña a otra. */
const RESORTE = { k: 300, c: 26 }

const n = (v: number) => v.toFixed(2)

/**
 * El camino de la barra con el hueco centrado en `cx`. `sI` y `sD` son los
 * radios de los hombros izquierdo y derecho, y `cy` la altura del cuenco.
 */
function silueta(ancho: number, cx: number, cy: number, sI: number, sD: number): string {
  const T = TECHO
  const B = TECHO + ALTO_BARRA
  const r = RADIO_CUENCO
  // Cada hombro es un círculo tangente al borde (centro a s por debajo) y
  // tangente al cuenco (centros a s + r): de ahí sale a qué distancia está.
  const alcance = (s: number) => Math.sqrt(Math.max(0, (s + r) ** 2 - (T + s - cy) ** 2))
  const dI = alcance(sI)
  const dD = alcance(sD)
  // El hueco no puede meterse en las esquinas redondeadas.
  const x = Math.min(Math.max(cx, ESQUINA + dI), ancho - ESQUINA - dD)

  const tangente = (hx: number, s: number) => {
    const k = s / (s + r)
    return [hx + (x - hx) * k, T + s + (cy - T - s) * k] as const
  }
  const [p1x, p1y] = tangente(x - dI, sI)
  const [p2x, p2y] = tangente(x + dD, sD)
  const grande = p1y < cy ? 1 : 0

  return [
    `M ${ESQUINA} ${T}`,
    `L ${n(x - dI)} ${T}`,
    `A ${n(sI)} ${n(sI)} 0 0 1 ${n(p1x)} ${n(p1y)}`,
    `A ${r} ${r} 0 ${grande} 0 ${n(p2x)} ${n(p2y)}`,
    `A ${n(sD)} ${n(sD)} 0 0 1 ${n(x + dD)} ${T}`,
    `L ${ancho - ESQUINA} ${T}`,
    `A ${ESQUINA} ${ESQUINA} 0 0 1 ${ancho} ${T + ESQUINA}`,
    `L ${ancho} ${B - ESQUINA}`,
    `A ${ESQUINA} ${ESQUINA} 0 0 1 ${ancho - ESQUINA} ${B}`,
    `L ${ESQUINA} ${B}`,
    `A ${ESQUINA} ${ESQUINA} 0 0 1 0 ${B - ESQUINA}`,
    `L 0 ${T + ESQUINA}`,
    `A ${ESQUINA} ${ESQUINA} 0 0 1 ${ESQUINA} ${T}`,
    'Z',
  ].join(' ')
}

export function BarraPestanas<Id extends string>({ pestanas, actual, alElegir }: Props<Id>) {
  const caja = useRef<HTMLDivElement>(null)
  const vidrio = useRef<HTMLDivElement>(null)
  const canto = useRef<SVGPathElement>(null)
  const sombra = useRef<SVGPathElement>(null)
  const burbuja = useRef<HTMLDivElement>(null)
  const iconoBurbuja = useRef<HTMLImageElement>(null)
  const resplandor = useRef<HTMLDivElement>(null)
  const iconos = useRef<(HTMLImageElement | null)[]>([])
  const etiquetas = useRef<(HTMLSpanElement | null)[]>([])
  const botones = useRef<(HTMLButtonElement | null)[]>([])
  const [centros, setCentros] = useState<number[]>([])
  const [ancho, setAncho] = useState(0)

  useLayoutEffect(() => {
    const medir = () => {
      const base = caja.current?.getBoundingClientRect()
      if (!base) return
      setAncho(base.width)
      setCentros(
        botones.current.map((b) => {
          const r = b?.getBoundingClientRect()
          return r ? r.left - base.left + r.width / 2 : 0
        }),
      )
    }
    medir()
    const observador = new ResizeObserver(medir)
    if (caja.current) observador.observe(caja.current)
    return () => observador.disconnect()
  }, [pestanas.length])

  // La posición de la burbuja vive fuera de React: se mueve en cada cuadro.
  const fisica = useRef({ x: 0, v: 0, objetivo: 0, listo: false, visible: 0 })
  const arrastre = useRef<{ x0: number; activo: boolean } | null>(null)
  const ignorarClick = useRef(false)

  const indice = pestanas.findIndex((p) => p.id === actual)

  useEffect(() => {
    const f = fisica.current
    if (indice < 0 || centros[indice] === undefined) return
    f.objetivo = centros[indice]
    if (!f.listo) {
      f.x = f.objetivo
      f.listo = true
    }
  }, [indice, centros])

  useEffect(() => {
    if (!ancho) return
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches
    let cuadro = 0
    let antes = performance.now()

    const paso = (ahora: number) => {
      const f = fisica.current
      const dt = Math.min(0.032, (ahora - antes) / 1000)
      antes = ahora
      if (quieto) {
        f.x = f.objetivo
        f.v = 0
      } else {
        f.v += (-RESORTE.k * (f.x - f.objetivo) - RESORTE.c * f.v) * dt
        f.x += f.v * dt
      }
      f.visible += ((indice >= 0 ? 1 : 0) - f.visible) * Math.min(1, dt * 12)

      // La velocidad inclina la superficie: q de -1 a 1 según para dónde va.
      const q = Math.max(-1, Math.min(1, f.v / 1400))
      const mag = Math.abs(q)
      const sI = HOMBRO * (1 + 0.06 * mag + 0.4 * q)
      const sD = HOMBRO * (1 + 0.06 * mag - 0.4 * q)
      // Sin burbuja (en Ajustes), el cuenco sube hasta que el borde queda casi
      // plano; con velocidad, la burbuja se levanta un poco.
      const cy = TECHO - ALTURA_BURBUJA - (1 - f.visible) * (RADIO_CUENCO - ALTURA_BURBUJA - 1) - mag * 3
      const camino = silueta(ancho, f.x, cy, sI, sD)

      if (vidrio.current) vidrio.current.style.clipPath = `path('${camino}')`
      canto.current?.setAttribute('d', camino)
      sombra.current?.setAttribute('d', camino)
      // Entre qué dos pestañas está la burbuja, y cuánto de cada una.
      let i0 = 0
      while (i0 < centros.length - 2 && f.x > centros[i0 + 1]) i0++
      const tramo = centros[i0 + 1] - centros[i0] || 1
      const t = Math.min(1, Math.max(0, (f.x - centros[i0]) / tramo))
      const color = mezclar(pestanas[i0].color, pestanas[Math.min(i0 + 1, pestanas.length - 1)].color, t)
      const cercana = t < 0.5 ? i0 : i0 + 1

      if (burbuja.current) {
        burbuja.current.style.transform = `translate(${f.x - RADIO_BURBUJA}px, ${cy - RADIO_BURBUJA}px) scale(${0.6 + 0.4 * f.visible})`
        burbuja.current.style.opacity = `${f.visible}`
        burbuja.current.style.backgroundColor = color
        burbuja.current.style.setProperty('--brillo', color)
      }
      // La burbuja muestra el ícono de la pestaña que tiene debajo.
      const src = pestanas[cercana]?.icono
      if (iconoBurbuja.current && src && iconoBurbuja.current.dataset.src !== src) {
        iconoBurbuja.current.src = src
        iconoBurbuja.current.dataset.src = src
      }
      // En la barra, el ícono se apaga a medida que la burbuja lo tapa.
      iconos.current.forEach((img, i) => {
        if (!img) return
        const tapado = Math.min(1, Math.max(0, (Math.abs(f.x - centros[i]) - 8) / 40))
        const apagado = 1 - f.visible * (1 - tapado)
        img.style.opacity = `${0.9 * apagado}`
        img.style.transform = `scale(${0.6 + 0.4 * apagado})`
        // El nombre aparece donde el ícono se fue: así nunca se pisan.
        const etiqueta = etiquetas.current[i]
        if (etiqueta) {
          etiqueta.style.opacity = `${1 - apagado}`
          etiqueta.style.transform = `translateY(${4 * apagado}px)`
        }
      })
      if (resplandor.current) {
        resplandor.current.style.transform = `translateX(${f.x - 90}px)`
        resplandor.current.style.opacity = `${f.visible * 0.6}`
        resplandor.current.style.backgroundImage = `radial-gradient(closest-side, ${color}, transparent)`
      }
      cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [ancho, indice, centros, pestanas])

  function masCercana(x: number): number {
    let mejor = 0
    centros.forEach((c, i) => {
      if (Math.abs(c - x) < Math.abs(centros[mejor] - x)) mejor = i
    })
    return mejor
  }

  const xEnBarra = (clientX: number) => clientX - (caja.current?.getBoundingClientRect().left ?? 0)
  const iconoActivo = indice >= 0 ? pestanas[indice].icono : undefined

  return (
    <div
      ref={caja}
      className="menisco relative mx-auto max-w-2xl"
      style={{ height: TECHO + ALTO_BARRA, touchAction: 'none' }}
      onPointerDown={(e) => {
        arrastre.current = { x0: e.clientX, activo: false }
      }}
      onPointerMove={(e) => {
        const d = arrastre.current
        if (!d) return
        if (!d.activo && Math.abs(e.clientX - d.x0) > 8) {
          d.activo = true
          caja.current?.setPointerCapture(e.pointerId)
        }
        if (d.activo) fisica.current.objetivo = xEnBarra(e.clientX)
      }}
      onPointerUp={(e) => {
        const d = arrastre.current
        arrastre.current = null
        if (!d?.activo) return
        // El click que sigue a soltar no cuenta; si no llega, el aviso se borra solo.
        ignorarClick.current = true
        setTimeout(() => {
          ignorarClick.current = false
        }, 0)
        const i = masCercana(xEnBarra(e.clientX))
        fisica.current.objetivo = centros[i]
        alElegir(pestanas[i].id)
      }}
      onPointerCancel={() => {
        arrastre.current = null
        if (indice >= 0) fisica.current.objetivo = centros[indice]
      }}
    >
      {/* El resplandor del color de la burbuja, debajo de la barra. */}
      <div
        ref={resplandor}
        className="pointer-events-none absolute left-0 top-full h-16 w-[180px] -translate-y-1/2 blur-xl"
        aria-hidden
      />
      {/* Atrás, la sombra de la silueta; encima, el vidrio recortado con la misma forma. */}
      <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
        <defs>
          <filter id="menisco-sombra" x="-10%" y="-30%" width="120%" height="180%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        <path ref={sombra} className="menisco-sombra" filter="url(#menisco-sombra)" transform="translate(0 8)" />
      </svg>
      <div ref={vidrio} className="menisco-vidrio absolute inset-0" aria-hidden />
      <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="menisco-canto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--vidrio-brillo)" />
            <stop offset="100%" stopColor="var(--vidrio-borde)" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <path ref={canto} fill="none" stroke="url(#menisco-canto)" strokeWidth="1.5" />
      </svg>

      {/* La burbuja con el ícono de la pestaña elegida. */}
      <div
        ref={burbuja}
        className="menisco-burbuja pointer-events-none absolute left-0 top-0 grid place-items-center rounded-full"
        style={{ width: RADIO_BURBUJA * 2, height: RADIO_BURBUJA * 2, opacity: 0 }}
        aria-hidden
      >
        {iconoActivo && (
          <img ref={iconoBurbuja} src={iconoActivo} alt="" width={34} height={34} className="size-[34px]" draggable={false} />
        )}
      </div>

      {/* Las pestañas. El margen a los costados deja lugar para que el hueco no
          choque con las esquinas cuando la burbuja está en la primera o la última. */}
      <div className="absolute inset-x-0 bottom-0 flex px-7" style={{ height: ALTO_BARRA }}>
        {pestanas.map((p, i) => {
          const elegida = actual === p.id
          return (
            <button
              key={p.id}
              ref={(b) => {
                botones.current[i] = b
              }}
              type="button"
              aria-label={p.nombre}
              aria-current={elegida ? 'page' : undefined}
              onClick={() => {
                if (ignorarClick.current) {
                  ignorarClick.current = false
                  return
                }
                alElegir(p.id)
              }}
              className="relative flex flex-1 flex-col items-center justify-center rounded-full transition-transform active:scale-95"
            >
              {/* El ícono de la elegida se fue a la burbuja: acá queda su nombre. */}
              <img
                ref={(img) => {
                  iconos.current[i] = img
                }}
                src={p.icono}
                alt=""
                width={32}
                height={32}
                draggable={false}
                className="size-8"
              />
              <span
                ref={(span) => {
                  etiquetas.current[i] = span
                }}
                className="absolute bottom-[7px] text-xs font-black leading-none opacity-0"
                // El color de la pestaña, mezclado con el del texto para que se lea en los dos temas.
                style={{ color: `color-mix(in srgb, ${p.color} 65%, var(--texto))` }}
              >
                {p.nombre}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
