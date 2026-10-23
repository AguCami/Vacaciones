import { useMemo, useState } from 'react'
import { PARADAS, TOTAL_HORAS, TOTAL_KM, kmAcumulados, type Parada } from '../datos/recorrido'
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
  const [autoX, autoY] = puntos[indiceActual]
  const kmRestantes = TOTAL_KM - acumulados[indiceActual]

  return (
    <section className="flex flex-col gap-4">
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

          {/* El auto, parado en la última parada a la que llegaron. */}
          <g transform={`translate(${autoX - 30} ${autoY - 30})`}>
            <g>
              <ellipse cx="0" cy="15" rx="15" ry="4" fill="#0d2b3a" opacity="0.3" />
              <rect x="-16" y="-2" width="32" height="14" rx="6" fill="#ff6b5a" />
              <path d="M -10 -2 q 3 -10 10 -10 h 5 q 7 0 9 10 Z" fill="#8fe3e8" />
              <circle cx="-8" cy="12" r="4.5" fill="#0d2b3a" />
              <circle cx="8" cy="12" r="4.5" fill="#0d2b3a" />
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 -4; 0 0"
                dur="2.4s"
                repeatCount="indefinite"
              />
            </g>
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Dato titulo="Distancia total" valor={`${TOTAL_KM.toLocaleString('es-AR')} km`} pie="ida, por Paso de los Libres" />
        <Dato titulo="Manejo" valor={`${TOTAL_HORAS} h`} pie="sin contar paradas ni frontera" />
        <Dato
          titulo="Falta"
          valor={`${kmRestantes.toLocaleString('es-AR')} km`}
          pie={kmRestantes === 0 ? '¡llegaron!' : `desde ${PARADAS[indiceActual].nombre}`}
        />
      </div>

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
        <p className="px-2 text-center text-sm font-bold opacity-70">
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
