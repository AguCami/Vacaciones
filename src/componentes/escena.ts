/**
 * La geometría del mapa: cómo pasar de coordenadas reales a la ilustración.
 *
 * El mapa está dibujado a mano, no es un mapa satelital — pero las paradas se
 * ubican con su latitud y longitud de verdad, así que las proporciones y el
 * orden del recorrido son los correctos. Es una ilustración fiel, no un plano
 * de navegación: para llegar, el GPS.
 */

/** Ventana del mundo que entra en el dibujo (grados). */
export const VISTA = { oesteLon: -66, esteLon: -46, norteLat: -25, surLat: -36 }
export const LIENZO = { ancho: 1000, alto: 560 }

export function proyectar(lon: number, lat: number): [number, number] {
  const x = ((lon - VISTA.oesteLon) / (VISTA.esteLon - VISTA.oesteLon)) * LIENZO.ancho
  const y = ((VISTA.norteLat - lat) / (VISTA.norteLat - VISTA.surLat)) * LIENZO.alto
  return [x, y]
}

/**
 * La costa atlántica, de sur a norte: desde la provincia de Buenos Aires,
 * el embudo del Río de la Plata, Uruguay, y toda la costa brasileña hasta
 * pasando Santa Catarina. Simplificada, pero con la forma reconocible.
 */
const COSTA: [number, number][] = [
  [-56.7, -36.4],
  [-56.75, -36.3],
  [-57.2, -35.6],
  [-58.4, -34.6], // Río de la Plata: la punta del embudo, Buenos Aires
  [-57.85, -34.47],
  [-56.19, -34.9], // Montevideo
  [-54.95, -34.97], // Punta del Este
  [-54.14, -34.66],
  [-53.45, -33.69], // Chuy, la frontera
  [-52.1, -32.03], // Rio Grande
  [-50.9, -31.1],
  [-50.13, -30.0], // Tramandaí
  [-49.73, -29.34], // Torres
  [-49.49, -28.94],
  [-48.78, -28.48], // Laguna
  [-48.5, -27.6], // Florianópolis
  [-48.55, -27.16], // Porto Belo / Bombinhas
  [-48.66, -26.9], // Itajaí
  [-48.5, -25.5],
]

/**
 * La tierra: la costa, cerrada por afuera del lienzo para que quede un bloque
 * macizo y el mar sea lo que queda del otro lado.
 */
export function caminoTierra(): string {
  const puntos = COSTA.map(([lon, lat]) => proyectar(lon, lat))
  const [xFin] = proyectar(-48.5, -25.5)
  const partes = [
    `M ${puntos[0][0].toFixed(1)} ${puntos[0][1].toFixed(1)}`,
    ...puntos.slice(1).map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`),
    `L ${xFin.toFixed(1)} -40`,
    `L -40 -40`,
    `L -40 ${LIENZO.alto + 40}`,
    `L ${puntos[0][0].toFixed(1)} ${LIENZO.alto + 40}`,
    'Z',
  ]
  return partes.join(' ')
}

/**
 * Une los puntos con una curva suave en vez de rectas.
 *
 * Es Catmull-Rom pasado a curvas de Bézier: cada tramo se dobla mirando al
 * punto anterior y al siguiente, así la ruta se ve como una cinta que fluye y
 * no como una línea quebrada de planilla.
 */
export function curvaSuave(puntos: [number, number][], tension = 0.5): string {
  if (puntos.length < 2) return ''
  const d = [`M ${puntos[0][0].toFixed(1)} ${puntos[0][1].toFixed(1)}`]
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[i - 1] ?? puntos[i]
    const p1 = puntos[i]
    const p2 = puntos[i + 1]
    const p3 = puntos[i + 2] ?? p2
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2
    d.push(
      `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`,
    )
  }
  return d.join(' ')
}
