import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * La barra de abajo con una luz que marca la pestaña elegida.
 *
 * La luz es siempre una de dos cosas: un anillo alrededor de una pestaña, o una
 * varilla recta estirada entre dos mientras viaja. Nunca una curva ni un
 * extremo suelto en el aire.
 *
 * Cada extremo tiene su propio resorte. El que va adelante es rígido y sale
 * rápido; el de atrás es blando y lo sigue. La distancia entre los dos es lo
 * que se ve como estiramiento. Mientras se estira la línea se afina, para que
 * el brillo total parezca el mismo. Se puede tocar una pestaña o arrastrar la
 * luz con el dedo a lo largo de la barra.
 */

export type Pestana<Id extends string> = { id: Id; nombre: string; icono: string }

type Props<Id extends string> = {
  pestanas: Pestana<Id>[]
  actual: Id | null
  alElegir: (id: Id) => void
}

type Caja = { centro: number; ancho: number; alto: number; arriba: number }

/** Un resorte amortiguado: rigidez y amortiguación. */
const RIGIDO = { k: 420, c: 30 }
const BLANDO = { k: 140, c: 21 }
/** Grosor de la línea quieta, y de la varilla. */
const TRAZO = 2.6
const ALTO_VARILLA = 6

export function BarraPestanas<Id extends string>({ pestanas, actual, alElegir }: Props<Id>) {
  const barra = useRef<HTMLDivElement>(null)
  const botones = useRef<(HTMLButtonElement | null)[]>([])
  const luz = useRef<SVGRectElement>(null)
  const halo = useRef<SVGRectElement>(null)
  const reflejo = useRef<HTMLDivElement>(null)
  const [cajas, setCajas] = useState<Caja[]>([])

  // Dónde está cada pestaña dentro de la barra. Se vuelve a medir si cambia el ancho.
  useLayoutEffect(() => {
    const medir = () => {
      const base = barra.current?.getBoundingClientRect()
      if (!base) return
      setCajas(
        botones.current.map((b) => {
          const r = b?.getBoundingClientRect()
          return r
            ? { centro: r.left - base.left + r.width / 2, ancho: r.width, alto: r.height, arriba: r.top - base.top }
            : { centro: 0, ancho: 0, alto: 0, arriba: 0 }
        }),
      )
    }
    medir()
    const observador = new ResizeObserver(medir)
    if (barra.current) observador.observe(barra.current)
    return () => observador.disconnect()
  }, [pestanas.length])

  // El estado de la animación vive fuera de React: se mueve 60 veces por segundo
  // y no hace falta redibujar la barra entera por eso.
  const fisica = useRef({ a: 0, b: 0, va: 0, vb: 0, objA: 0, objB: 0, listo: false, visible: 0 })
  const arrastre = useRef<{ x0: number; activo: boolean } | null>(null)
  const ignorarClick = useRef(false)

  const indice = pestanas.findIndex((p) => p.id === actual)
  const caja = indice >= 0 ? cajas[indice] : undefined

  // El anillo es un poco más chico que el botón, para que respire adentro.
  const anchoAnillo = (c: Caja) => c.ancho - 8

  useEffect(() => {
    const f = fisica.current
    if (!caja) return
    f.objA = caja.centro - anchoAnillo(caja) / 2
    f.objB = caja.centro + anchoAnillo(caja) / 2
    if (!f.listo) {
      // La primera vez aparece en su lugar, sin viajar desde la nada.
      f.a = f.objA
      f.b = f.objB
      f.listo = true
    }
  }, [caja])

  useEffect(() => {
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches
    let cuadro = 0
    let antes = performance.now()

    const paso = (ahora: number) => {
      const f = fisica.current
      const dt = Math.min(0.032, (ahora - antes) / 1000)
      antes = ahora

      if (quieto) {
        f.a = f.objA
        f.b = f.objB
        f.va = f.vb = 0
      } else {
        // El extremo que va hacia adelante es el rígido; el que queda atrás, el blando.
        const derecha = f.objB + f.objA > f.a + f.b
        const resorteA = derecha ? BLANDO : RIGIDO
        const resorteB = derecha ? RIGIDO : BLANDO
        f.va += (-resorteA.k * (f.a - f.objA) - resorteA.c * f.va) * dt
        f.vb += (-resorteB.k * (f.b - f.objB) - resorteB.c * f.vb) * dt
        f.a += f.va * dt
        f.b += f.vb * dt
      }

      const objetivoVisible = actual !== null && indice >= 0 ? 1 : 0
      f.visible += (objetivoVisible - f.visible) * Math.min(1, dt * 10)

      const c = cajas[Math.max(0, indice)] ?? cajas[0]
      if (c && luz.current && halo.current) {
        const izq = Math.min(f.a, f.b)
        const ancho = Math.max(4, Math.abs(f.b - f.a))
        // Cuánto se estiró respecto del anillo: 0 quieto, 1 o más viajando.
        const estiramiento = Math.min(1, Math.max(0, ancho / anchoAnillo(c) - 1))
        const altoAnillo = c.alto - 8
        const alto = altoAnillo + (ALTO_VARILLA - altoAnillo) * estiramiento
        const y = c.arriba + c.alto / 2 - alto / 2
        const velocidad = Math.abs(f.va) + Math.abs(f.vb)
        const trazo = Math.max(1.2, TRAZO - velocidad * 0.0012 - estiramiento * 0.8)

        for (const r of [luz.current, halo.current]) {
          r.setAttribute('x', `${izq}`)
          r.setAttribute('y', `${y}`)
          r.setAttribute('width', `${ancho}`)
          r.setAttribute('height', `${alto}`)
          r.setAttribute('rx', `${alto / 2}`)
        }
        luz.current.setAttribute('stroke-width', `${trazo}`)
        halo.current.setAttribute('stroke-width', `${trazo * 3.5}`)
        luz.current.parentElement?.setAttribute('opacity', `${f.visible}`)
        if (reflejo.current) {
          reflejo.current.style.transform = `translateX(${izq}px)`
          reflejo.current.style.width = `${ancho}px`
          reflejo.current.style.opacity = `${f.visible * (0.55 - estiramiento * 0.25)}`
        }
        barra.current?.style.setProperty('--luz-x', `${(f.a + f.b) / 2}px`)
      }
      cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [cajas, indice, actual])

  /** La pestaña más cercana a una posición horizontal de la barra. */
  function masCercana(x: number): number {
    let mejor = 0
    cajas.forEach((c, i) => {
      if (Math.abs(c.centro - x) < Math.abs(cajas[mejor].centro - x)) mejor = i
    })
    return mejor
  }

  function xEnBarra(clientX: number): number {
    return clientX - (barra.current?.getBoundingClientRect().left ?? 0)
  }

  return (
    <div
      ref={barra}
      className="barra-luz tarjeta relative mx-auto flex max-w-2xl gap-1 p-1.5"
      style={{ touchAction: 'none' }}
      onPointerDown={(e) => {
        arrastre.current = { x0: e.clientX, activo: false }
      }}
      onPointerMove={(e) => {
        const d = arrastre.current
        if (!d || !cajas.length) return
        if (!d.activo && Math.abs(e.clientX - d.x0) > 8) {
          d.activo = true
          barra.current?.setPointerCapture(e.pointerId)
        }
        if (d.activo) {
          // Arrastrando, la luz sigue al dedo con el ancho de un anillo.
          const x = xEnBarra(e.clientX)
          const medio = anchoAnillo(cajas[0]) / 2
          fisica.current.objA = x - medio
          fisica.current.objB = x + medio
        }
      }}
      onPointerUp={(e) => {
        const d = arrastre.current
        arrastre.current = null
        if (!d?.activo) return
        // El click que sigue a soltar el dedo no cuenta; si el navegador no lo
        // manda, el aviso se borra solo para no comerse el próximo toque.
        ignorarClick.current = true
        setTimeout(() => {
          ignorarClick.current = false
        }, 0)
        const i = masCercana(xEnBarra(e.clientX))
        const c = cajas[i]
        fisica.current.objA = c.centro - anchoAnillo(c) / 2
        fisica.current.objB = c.centro + anchoAnillo(c) / 2
        alElegir(pestanas[i].id)
      }}
      onPointerCancel={() => {
        arrastre.current = null
        if (caja) {
          fisica.current.objA = caja.centro - anchoAnillo(caja) / 2
          fisica.current.objB = caja.centro + anchoAnillo(caja) / 2
        }
      }}
    >
      <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
        <g opacity="0">
          {/* Abajo un trazo grueso y desenfocado que hace de resplandor; arriba la línea nítida. */}
          <rect ref={halo} fill="none" stroke="var(--luz)" opacity="0.45" filter="url(#luz-desenfoque)" />
          <rect ref={luz} fill="none" stroke="var(--luz-nucleo)" />
        </g>
        <defs>
          <filter id="luz-desenfoque" x="-50%" y="-200%" width="200%" height="500%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>
      </svg>
      {/* El reflejo de la luz sobre lo que hay debajo de la barra. */}
      <div ref={reflejo} className="barra-reflejo pointer-events-none absolute -bottom-2 left-0 h-3" aria-hidden />

      {pestanas.map((p, i) => (
        <button
          key={p.id}
          ref={(b) => {
            botones.current[i] = b
          }}
          type="button"
          onClick={() => {
            if (ignorarClick.current) {
              ignorarClick.current = false
              return
            }
            alElegir(p.id)
          }}
          aria-current={actual === p.id ? 'page' : undefined}
          className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-1.5 text-xs font-extrabold transition-transform active:scale-95 sm:text-sm ${
            actual === p.id ? 'text-[var(--luz-texto)]' : 'opacity-80'
          }`}
        >
          <img src={p.icono} alt="" width={34} height={34} className="size-[34px]" draggable={false} />
          {p.nombre}
        </button>
      ))}
    </div>
  )
}
