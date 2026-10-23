/**
 * El recorrido: Córdoba → Bombas y Bombinhas (Santa Catarina, Brasil).
 *
 * Dos días: salida el 16 de enero bien temprano, noche en São Gabriel y
 * llegada el 17 a Bombas.
 *
 * Ruta por el paso de Paso de los Libres / Uruguaiana, que es la más directa
 * desde Córdoba hacia la costa catarinense.
 *
 * Los kilómetros y las horas son de ruta, aproximados y sin contar paradas.
 * Las horas son de manejo puro: sumale nafta, comida y la frontera.
 *
 * Este archivo es el único lugar donde vive el recorrido. Cambiar una parada,
 * agregar una o mover una fecha se hace acá y el mapa se redibuja solo.
 */

export type TipoParada = 'salida' | 'parada' | 'frontera' | 'destino'

export type Parada = {
  id: string
  nombre: string
  provincia: string
  pais: 'AR' | 'BR'
  /** Coordenadas reales, para ubicarla en el mapa. */
  lat: number
  lon: number
  tipo: TipoParada
  /** Kilómetros desde la parada anterior. 0 en la salida. */
  km: number
  /** Horas de manejo desde la parada anterior. */
  horas: number
  /** Si está pensada para dormir ahí. */
  dormir?: boolean
  nota?: string
}

export const PARADAS: Parada[] = [
  {
    id: 'cordoba',
    nombre: 'Córdoba',
    provincia: 'Córdoba',
    pais: 'AR',
    lat: -31.42,
    lon: -64.19,
    tipo: 'salida',
    km: 0,
    horas: 0,
    nota: 'Arranque. Conviene salir temprano para llegar con luz a Santa Fe.',
  },
  {
    id: 'santa-fe',
    nombre: 'Santa Fe',
    provincia: 'Santa Fe',
    pais: 'AR',
    lat: -31.63,
    lon: -60.7,
    tipo: 'parada',
    km: 340,
    horas: 4,
    nota: 'Por RN 19. Primer tramo largo y derecho.',
  },
  {
    id: 'parana',
    nombre: 'Paraná',
    provincia: 'Entre Ríos',
    pais: 'AR',
    lat: -31.73,
    lon: -60.52,
    tipo: 'parada',
    km: 25,
    horas: 0.5,
    nota: 'Cruce del túnel subfluvial. Acá empieza la RN 127.',
  },
  {
    id: 'concordia',
    nombre: 'Concordia',
    provincia: 'Entre Ríos',
    pais: 'AR',
    lat: -31.39,
    lon: -58.02,
    tipo: 'parada',
    km: 280,
    horas: 3.5,
    nota: 'Se pasa de largo. Ojo con el horario: hay que cruzar con luz.',
  },
  {
    id: 'paso-de-los-libres',
    nombre: 'Paso de los Libres',
    provincia: 'Corrientes',
    pais: 'AR',
    lat: -29.71,
    lon: -57.09,
    tipo: 'parada',
    km: 320,
    horas: 4,
    nota: 'Por RN 14. Última ciudad argentina: cargar nafta y cambiar plata acá.',
  },
  {
    id: 'uruguaiana',
    nombre: 'Uruguaiana',
    provincia: 'Rio Grande do Sul',
    pais: 'BR',
    lat: -29.75,
    lon: -57.09,
    tipo: 'frontera',
    km: 12,
    horas: 1.5,
    nota: 'Frontera sobre el puente. Seguro del auto, cédula verde y migraciones. La espera puede ser larga en temporada.',
  },
  {
    id: 'sao-gabriel',
    nombre: 'São Gabriel',
    provincia: 'Rio Grande do Sul',
    pais: 'BR',
    lat: -30.34,
    lon: -54.32,
    tipo: 'parada',
    km: 310,
    horas: 3.5,
    dormir: true,
    nota: 'Por BR-290. Se duerme acá la noche del 16: es el día más largo, unos 1.290 km desde Córdoba.',
  },
  {
    id: 'porto-alegre',
    nombre: 'Porto Alegre',
    provincia: 'Rio Grande do Sul',
    pais: 'BR',
    lat: -30.03,
    lon: -51.23,
    tipo: 'parada',
    km: 320,
    horas: 3.5,
    nota: 'Se rodea por la BR-290 sin entrar a la ciudad, rumbo a Osório y la costa.',
  },
  {
    id: 'torres',
    nombre: 'Torres',
    provincia: 'Rio Grande do Sul',
    pais: 'BR',
    lat: -29.34,
    lon: -49.73,
    tipo: 'parada',
    km: 200,
    horas: 2.5,
    nota: 'Acá aparece el mar por primera vez. Arranca la BR-101 costera.',
  },
  {
    id: 'florianopolis',
    nombre: 'Florianópolis',
    provincia: 'Santa Catarina',
    pais: 'BR',
    lat: -27.59,
    lon: -48.55,
    tipo: 'parada',
    km: 270,
    horas: 3.5,
    nota: 'Se pasa de largo por la BR-101, o se corta acá si quieren conocer.',
  },
  {
    id: 'bombinhas',
    nombre: 'Bombas y Bombinhas',
    provincia: 'Santa Catarina',
    pais: 'BR',
    lat: -27.14,
    lon: -48.48,
    tipo: 'destino',
    km: 65,
    horas: 1,
    dormir: true,
    nota: 'Llegada el 17: el Airbnb recibe desde las 15:00. Se sale de la BR-101 en Porto Belo y quedan 15 km de camino a la península.',
  },
]

export const TOTAL_KM = PARADAS.reduce((total, p) => total + p.km, 0)
export const TOTAL_HORAS = PARADAS.reduce((total, p) => total + p.horas, 0)

/** Kilómetro acumulado en el que queda cada parada, contando desde Córdoba. */
export function kmAcumulados(): number[] {
  let acumulado = 0
  return PARADAS.map((p) => {
    acumulado += p.km
    return acumulado
  })
}

export type EnRuta = {
  /** Índice de la parada desde la que arranca el tramo en el que están. */
  tramo: number
  /** Qué parte del tramo ya hicieron, de 0 a 1. */
  fraccion: number
  /** Kilómetros de ruta hechos desde Córdoba (aproximado). */
  kmHechos: number
  /** A cuántos km en línea recta están de la ruta. */
  distanciaKm: number
}

/**
 * Dónde cae una posición GPS sobre el recorrido.
 *
 * Se aproxima cada tramo como una recta entre dos paradas y se busca el punto
 * más cercano. Alcanza para saber por dónde van; para manejar, el GPS.
 */
export function ubicarEnRuta(lat: number, lon: number): EnRuta {
  // A esta escala, una proyección plana alcanza: grados a km a la latitud del viaje.
  const kmPorGradoLon = 111.32 * Math.cos((-30 * Math.PI) / 180)
  const kmPorGradoLat = 110.57
  const plano = (la: number, lo: number) => [lo * kmPorGradoLon, la * kmPorGradoLat] as const
  const [px, py] = plano(lat, lon)
  const acumulados = kmAcumulados()

  let mejor: EnRuta = { tramo: 0, fraccion: 0, kmHechos: 0, distanciaKm: Infinity }
  for (let i = 0; i < PARADAS.length - 1; i++) {
    const [ax, ay] = plano(PARADAS[i].lat, PARADAS[i].lon)
    const [bx, by] = plano(PARADAS[i + 1].lat, PARADAS[i + 1].lon)
    const dx = bx - ax
    const dy = by - ay
    const largo2 = dx * dx + dy * dy
    const t = largo2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / largo2))
    const distanciaKm = Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
    if (distanciaKm < mejor.distanciaKm) {
      mejor = { tramo: i, fraccion: t, kmHechos: acumulados[i] + t * PARADAS[i + 1].km, distanciaKm }
    }
  }
  return mejor
}

/** La última parada por la que ya pasaron, según dónde están. */
export function paradaAlcanzada(enRuta: EnRuta): Parada {
  // Casi al final del tramo cuenta como llegados: el GPS nunca da justo encima.
  return PARADAS[enRuta.fraccion > 0.97 ? enRuta.tramo + 1 : enRuta.tramo]
}
