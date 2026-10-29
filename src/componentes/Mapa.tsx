import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  PARADAS,
  TOTAL_HORAS,
  TOTAL_KM,
  kmAcumulados,
  paradaAlcanzada,
  ubicarEnRuta,
  type Parada,
} from '../datos/recorrido'
import { useUbicacion } from '../ganchos/useUbicacion'
import { AUTO_IMAGEN, AUTO_PROPORCION } from './auto'
import { caminoTierra, curvaSuave, LIENZO, proyectar } from './escena'

/**
 * Dónde cae el nombre de cada parada respecto de su chinche.
 *
 * Hace falta a mano porque hay pares que en el mapa quedan casi encimados:
 * Santa Fe y Paraná están a 25 km, y Paso de los Libres y Uruguaiana a 12 km
 * con el río en el medio. Sin esto, los nombres se pisan y no se lee ninguno.
 */
const ETIQUETAS: Record<string, { dx: number; dy: number; anclaje: 'start' | 'middle' | 'end' }> = {
  cordoba: { dx: 17, dy: 27, anclaje: 'start' },
  'santa-fe': { dx: -12, dy: -14, anclaje: 'end' },
  parana: { dx: 10, dy: 26, anclaje: 'start' },
  concordia: { dx: 15, dy: 5, anclaje: 'start' },
  'paso-de-los-libres': { dx: -11, dy: -16, anclaje: 'end' },
  uruguaiana: { dx: 15, dy: 22, anclaje: 'start' },
  'sao-gabriel': { dx: 0, dy: 26, anclaje: 'middle' },
  'porto-alegre': { dx: 15, dy: 7, anclaje: 'start' },
  torres: { dx: 15, dy: 3, anclaje: 'start' },
  florianopolis: { dx: -14, dy: 20, anclaje: 'end' },
  bombinhas: { dx: -18, dy: -12, anclaje: 'end' },
}

/** Ancho del auto en el lienzo del mapa dibujado (que mide 1000 de ancho). */
const ANCHO_AUTO = 88

// El mapa real (Leaflet) se baja recién cuando se muestra: pesa y no hace falta para abrir la app.
const MapaReal = lazy(() => import('./MapaReal'))

type Vista = 'real' | 'dibujo'
const CLAVE_VISTA = 'vacaciones-vista-mapa'

function vistaInicial(): Vista {
  // Sin señal el mapa real no carga: se arranca con el dibujado.
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'dibujo'
  try {
    return localStorage.getItem(CLAVE_VISTA) === 'dibujo' ? 'dibujo' : 'real'
  } catch {
    return 'real'
  }
}

/**
 * El link para navegar con la app de Google Maps (gratis, sin clave): desde
 * donde estén hasta Bombinhas, pasando por las paradas para dormir que falten.
 */
function enlaceGoogleMaps(indiceActual: number): string {
  const destino = PARADAS[PARADAS.length - 1]
  const escalas = PARADAS.filter((p, i) => i > indiceActual && p.dormir && p !== destino)
    .map((p) => `${p.lat},${p.lon}`)
    .join('|')
  const parametros = new URLSearchParams({ api: '1', destination: `${destino.lat},${destino.lon}`, travelmode: 'driving' })
  if (escalas) parametros.set('waypoints', escalas)
  return `https://www.google.com/maps/dir/?${parametros}`
}

const COLOR_TIPO: Record<Parada['tipo'], string> = {
  salida: '#ff6b5a',
  parada: '#ffffff',
  frontera: '#ffc23c',
  destino: '#2fa36b',
}

type Props = {
  paradaActualId: string
  alLlegar: (id: string) => void
}

export function Mapa({ paradaActualId, alLlegar }: Props) {
  const [seleccionada, setSeleccionada] = useState<string | null>(null)

  const puntos = useMemo(() => PARADAS.map((p) => proyectar(p.lon, p.lat)), [])
  const acumulados = useMemo(() => kmAcumulados(), [])
  const indiceActual = Math.max(0, PARADAS.findIndex((p) => p.id === paradaActualId))

  const rutaCompleta = useMemo(() => curvaSuave(puntos), [puntos])
  const rutaRecorrida = useMemo(
    () => (indiceActual > 0 ? curvaSuave(puntos.slice(0, indiceActual + 1)) : ''),
    [puntos, indiceActual],
  )

  const parada = PARADAS.find((p) => p.id === seleccionada) ?? null
  const indiceSel = parada ? PARADAS.indexOf(parada) : -1
  const ubicacion = useUbicacion()
  const enRuta = useMemo(
    () => (ubicacion.posicion ? ubicarEnRuta(ubicacion.posicion.lat, ubicacion.posicion.lon) : null),
    [ubicacion.posicion],
  )
  // A más de 100 km de la ruta no tiene sentido ubicarlos en ella (por ejemplo,
  // si alguien abre la app desde otro lado): el auto queda donde estaba.
  const sobreLaRuta = enRuta && enRuta.distanciaKm <= 100 ? enRuta : null

  // Al pasar por una parada, queda marcada sola.
  const alcanzadaId = sobreLaRuta ? paradaAlcanzada(sobreLaRuta).id : null
  useEffect(() => {
    if (alcanzadaId && alcanzadaId !== paradaActualId) alLlegar(alcanzadaId)
  }, [alcanzadaId, paradaActualId, alLlegar])

  // Con ubicación, el auto va en el punto del tramo donde están; sin ella, en la última parada.
  const [autoX, autoY] = sobreLaRuta
    ? (() => {
        const [ax, ay] = puntos[sobreLaRuta.tramo]
        const [bx, by] = puntos[sobreLaRuta.tramo + 1]
        return [ax + (bx - ax) * sobreLaRuta.fraccion, ay + (by - ay) * sobreLaRuta.fraccion]
      })()
    : puntos[indiceActual]
  const kmRestantes = Math.round(sobreLaRuta ? TOTAL_KM - sobreLaRuta.kmHechos : TOTAL_KM - acumulados[indiceActual])

  const [vista, setVista] = useState<Vista>(vistaInicial)
  const elegirVista = (v: Vista) => {
    setVista(v)
    try {
      localStorage.setItem(CLAVE_VISTA, v)
    } catch {
      // Sin storage se vuelve al real al recargar, nada más.
    }
  }
  const posAuto =
    sobreLaRuta && ubicacion.posicion
      ? { lat: ubicacion.posicion.lat, lon: ubicacion.posicion.lon }
      : { lat: PARADAS[indiceActual].lat, lon: PARADAS[indiceActual].lon }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="tarjeta flex !rounded-full p-1" role="tablist" aria-label="Tipo de mapa">
          {(
            [
              ['real', 'Real'],
              ['dibujo', 'Dibujado'],
            ] as const
          ).map(([v, nombre]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={vista === v}
              onClick={() => elegirVista(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-black transition-colors ${
                vista === v ? 'bg-[var(--color-mar)] text-white' : 'opacity-75'
              }`}
            >
              {nombre}
            </button>
          ))}
        </div>
        <a
          href={enlaceGoogleMaps(indiceActual)}
          target="_blank"
          rel="noreferrer"
          className="tarjeta ml-auto whitespace-nowrap !rounded-full px-4 py-2 text-sm font-black no-underline"
        >
          Google Maps ↗
        </a>
      </div>

      {vista === 'real' ? (
        <div className="tarjeta overflow-hidden p-2 sm:p-3">
          <Suspense fallback={<div className="grid h-[18rem] place-items-center font-bold opacity-70">Cargando el mapa…</div>}>
            <MapaReal
              indiceActual={indiceActual}
              auto={posAuto}
              seleccionada={seleccionada}
              alSeleccionar={setSeleccionada}
            />
          </Suspense>
        </div>
      ) : (
      <div className="tarjeta overflow-hidden p-2 sm:p-3">
        <svg
          viewBox={`0 0 ${LIENZO.ancho} ${LIENZO.alto}`}
          className="h-auto w-full rounded-[1.1rem]"
          role="img"
          aria-label={`Mapa del recorrido de Córdoba a Bombas y Bombinhas, ${PARADAS.length} paradas y ${TOTAL_KM} kilómetros`}
        >
          <defs>
            <linearGradient id="g-mar" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0%" stopColor="#7fe6ea" />
              <stop offset="45%" stopColor="#25b4cc" />
              <stop offset="100%" stopColor="#0b7f9b" />
            </linearGradient>
            <linearGradient id="g-tierra" x1="0" y1="0" x2="0.2" y2="1">
              <stop offset="0%" stopColor="#b9e48b" />
              <stop offset="55%" stopColor="#8fd06a" />
              <stop offset="100%" stopColor="#5faa4e" />
            </linearGradient>
            <radialGradient id="g-sol" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#fff3c4" />
              <stop offset="60%" stopColor="#ffc23c" />
              <stop offset="100%" stopColor="#ff9a5c" />
            </radialGradient>
            <filter id="f-blando" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#063747" floodOpacity="0.35" />
            </filter>
            <filter id="f-chinche" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#063747" floodOpacity="0.45" />
            </filter>
          </defs>

          <rect width={LIENZO.ancho} height={LIENZO.alto} fill="url(#g-mar)" />

          {/* Olas: líneas sueltas que dan textura al agua sin robarle atención
              a la ruta, que es lo que la gente vino a mirar. */}
          <g stroke="#ffffff" strokeOpacity="0.28" strokeWidth="3" strokeLinecap="round" fill="none">
            {Array.from({ length: 26 }, (_, i) => {
              const x = 120 + ((i * 137) % 860)
              const y = 40 + ((i * 97) % 500)
              return (
                <path key={i} d={`M ${x} ${y} q 11 -7 22 0 t 22 0`}>
                  <animate
                    attributeName="stroke-opacity"
                    values="0.28;0.08;0.28"
                    dur={`${5 + (i % 4)}s`}
                    begin={`${i * 0.24}s`}
                    repeatCount="indefinite"
                  />
                </path>
              )
            })}
          </g>

          <g filter="url(#f-blando)">
            <path d={caminoTierra()} fill="url(#g-tierra)" />
            {/* El borde de arena: el filo entre la tierra y el mar. */}
            <path
              d={caminoTierra()}
              fill="none"
              stroke="#f6e2b8"
              strokeWidth="9"
              strokeLinejoin="round"
            />
          </g>

          {/* Sol y nubes, arriba a la izquierda, sobre el continente. */}
          <g>
            <circle cx="92" cy="74" r="38" fill="url(#g-sol)" opacity="0.95" />
            <circle cx="92" cy="74" r="52" fill="#ffc23c" opacity="0.18" />
          </g>
          <g fill="#ffffff" opacity="0.85">
            <g>
              <ellipse cx="250" cy="70" rx="34" ry="19" />
              <ellipse cx="278" cy="76" rx="24" ry="14" />
              <ellipse cx="224" cy="78" rx="22" ry="13" />
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 26 0; 0 0"
                dur="22s"
                repeatCount="indefinite"
              />
            </g>
            <g opacity="0.7">
              <ellipse cx="300" cy="170" rx="26" ry="14" />
              <ellipse cx="322" cy="175" rx="18" ry="10" />
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -22 0; 0 0"
                dur="27s"
                repeatCount="indefinite"
              />
            </g>
          </g>

          {/* La ruta: primero el trazo completo en claro, después encima el
              tramo ya recorrido en coral. Así de un vistazo se ve cuánto falta. */}
          <path
            d={rutaCompleta}
            fill="none"
            stroke="#0d2b3a"
            strokeOpacity="0.2"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <path
            d={rutaCompleta}
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="14 12"
            strokeOpacity="0.9"
          />
          {rutaRecorrida && (
            <path
              d={rutaRecorrida}
              fill="none"
              stroke="#ff6b5a"
              strokeWidth="7"
              strokeLinecap="round"
              filter="url(#f-chinche)"
            />
          )}

          {/* Una isla con palmeras en el mar vacío: llena el hueco de abajo a la
              derecha y le pone el clima de lo que van a buscar. */}
          <g transform="translate(880 445)">
            <ellipse cx="0" cy="12" rx="46" ry="14" fill="#f6e2b8" />
            <ellipse cx="0" cy="8" rx="34" ry="9" fill="#ffefcb" />
            <path d="M 0 8 q -3 -20 3 -36" stroke="#8a5a33" strokeWidth="5" fill="none" strokeLinecap="round" />
            <g fill="#2fa36b">
              <path d="M 3 -28 q -22 -9 -29 2 q 18 -2 29 6 Z" />
              <path d="M 3 -28 q 22 -9 29 2 q -18 -2 -29 6 Z" />
              <path d="M 3 -28 q -7 -22 -20 -24 q 11 11 14 26 Z" />
              <path d="M 3 -28 q 7 -22 20 -24 q -11 11 -14 26 Z" />
            </g>
          </g>

          {PARADAS.map((p, i) => {
            const [x, y] = puntos[i]
            const etiqueta = ETIQUETAS[p.id] ?? { dx: 14, dy: 5, anclaje: 'start' as const }
            const recorrida = i <= indiceActual
            const esSel = p.id === seleccionada
            const radio = p.tipo === 'destino' || p.tipo === 'salida' ? 11 : 8
            return (
              <g
                key={p.id}
                className="cursor-pointer"
                onClick={() => setSeleccionada(esSel ? null : p.id)}
                role="button"
                tabIndex={0}
                aria-label={`${p.nombre}, parada ${i + 1} de ${PARADAS.length}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSeleccionada(esSel ? null : p.id)
                  }
                }}
              >
                {esSel && <circle cx={x} cy={y} r={radio + 12} fill="#ff6b5a" opacity="0.3" />}
                <circle
                  cx={x}
                  cy={y}
                  r={radio + 4}
                  fill="#0d2b3a"
                  opacity={recorrida ? 0.35 : 0.2}
                  filter="url(#f-chinche)"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={radio}
                  fill={COLOR_TIPO[p.tipo]}
                  stroke="#ffffff"
                  strokeWidth="3.5"
                />
                {p.dormir && <circle cx={x} cy={y} r={3} fill="#0d2b3a" opacity="0.55" />}
                {/* El nombre se escribe dos veces: abajo un trazo grueso del
                    color del mar que le hace de halo, arriba el texto. Sin eso,
                    los nombres sobre el agua clara no se leen. */}
                <text
                  x={x + etiqueta.dx}
                  y={y + etiqueta.dy}
                  textAnchor={etiqueta.anclaje}
                  fontSize="21"
                  fontWeight="800"
                  stroke="#075c74"
                  strokeWidth="6"
                  strokeLinejoin="round"
                  opacity="0.75"
                >
                  {p.nombre}
                </text>
                <text
                  x={x + etiqueta.dx}
                  y={y + etiqueta.dy}
                  textAnchor={etiqueta.anclaje}
                  fontSize="21"
                  fontWeight="800"
                  fill="#ffffff"
                >
                  {p.nombre}
                </text>
              </g>
            )
          })}

          {/* El auto: con ubicación, apoyado en el punto donde están; sin ella,
              parado justo arriba de la última parada, sin tapar la chinche. */}
          <g
            transform={
              // El origen es donde apoyan las ruedas: con ubicación, sobre el punto;
              // sin ella, un poco arriba de la chinche para no taparla.
              sobreLaRuta ? `translate(${autoX} ${autoY + 2})` : `translate(${autoX} ${autoY - 14})`
            }
          >
            {/* El Onix blanco, con un saltito suave como si fuera andando. */}
            <g>
              <ellipse cx="0" cy="-1" rx="40" ry="5" fill="#0d2b3a" opacity="0.28" />
              <image
                href={AUTO_IMAGEN}
                x={-ANCHO_AUTO / 2}
                y={-ANCHO_AUTO / AUTO_PROPORCION}
                width={ANCHO_AUTO}
                height={ANCHO_AUTO / AUTO_PROPORCION}
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 -2.5; 0 0"
                dur="2.4s"
                repeatCount="indefinite"
              />
            </g>
          </g>
        </svg>
      </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Dato titulo="Distancia total" valor={`${TOTAL_KM.toLocaleString('es-AR')} km`} pie="ida, por Paso de los Libres" />
        <Dato titulo="Manejo" valor={`${TOTAL_HORAS} h`} pie="sin contar paradas ni frontera" />
        <Dato
          titulo="Falta"
          valor={`${kmRestantes.toLocaleString('es-AR')} km`}
          pie={kmRestantes === 0 ? '¡llegaron!' : sobreLaRuta ? 'desde donde están' : `desde ${PARADAS[indiceActual].nombre}`}
        />
      </div>

      {ubicacion.disponible && (
        <div className="tarjeta flex flex-wrap items-center gap-3 px-5 py-4">
          <span className="text-2xl" aria-hidden>
            📍
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-black">{ubicacion.activa ? 'Siguiendo dónde están' : '¿Dónde vamos?'}</p>
            <p className="text-xs font-bold opacity-70">
              {!ubicacion.activa
                ? 'Con la ubicación del celular el auto se mueve solo por el mapa.'
                : ubicacion.error
                  ? ubicacion.error
                  : !ubicacion.posicion
                    ? 'Buscando la señal…'
                    : !sobreLaRuta
                      ? `Están a ${Math.round(enRuta?.distanciaKm ?? 0)} km de la ruta: el auto queda donde estaba.`
                      : `Entre ${PARADAS[sobreLaRuta.tramo].nombre} y ${PARADAS[sobreLaRuta.tramo + 1].nombre} · ${new Date(
                          ubicacion.posicion.cuando,
                        ).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`}
            </p>
          </div>
          <button
            type="button"
            className={`boton px-4 py-2 text-sm ${
              ubicacion.activa ? 'bg-white/70 text-[var(--color-tinta)]' : 'bg-[var(--color-mar)] text-white'
            }`}
            onClick={() => ubicacion.cambiar(!ubicacion.activa)}
          >
            {ubicacion.activa ? 'Dejar de seguir' : 'Usar mi ubicación'}
          </button>
        </div>
      )}

      {parada ? (
        <article className="tarjeta p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-2xl font-black">{parada.nombre}</h3>
            <span className="text-sm font-bold opacity-60">
              Parada {indiceSel + 1} de {PARADAS.length} · {parada.provincia}
              {parada.pais === 'BR' ? ' 🇧🇷' : ' 🇦🇷'}
            </span>
          </div>
          <p className="mt-1 text-sm font-bold opacity-70">
            {parada.km > 0
              ? `${parada.km} km desde ${PARADAS[indiceSel - 1].nombre} · ${parada.horas} h de manejo`
              : 'Punto de partida'}
            {' · '}
            {acumulados[indiceSel].toLocaleString('es-AR')} km acumulados
            {parada.dormir ? ' · 🛏️ para dormir' : ''}
          </p>
          {parada.nota && <p className="mt-3 leading-relaxed">{parada.nota}</p>}
          <button
            type="button"
            className="boton mt-4 bg-[var(--color-coral)] px-5 py-2.5 text-white"
            onClick={() => alLlegar(parada.id)}
          >
            {parada.id === paradaActualId ? 'Están acá ✓' : 'Llegamos hasta acá'}
          </button>
        </article>
      ) : (
        <p className="tarjeta self-center !rounded-full px-5 py-2 text-center text-sm font-bold">
          Tocá una chinche del mapa para ver el tramo.
        </p>
      )}
    </section>
  )
}

function Dato({ titulo, valor, pie }: { titulo: string; valor: string; pie: string }) {
  return (
    <div className="tarjeta px-2 py-3 text-center sm:px-4">
      <p className="text-[0.62rem] font-black uppercase tracking-wide opacity-60 sm:text-xs">{titulo}</p>
      <p className="text-lg font-black sm:text-2xl">{valor}</p>
      <p className="text-[0.62rem] font-semibold leading-tight opacity-60 sm:text-xs">{pie}</p>
    </div>
  )
}
