import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { PARADAS, type Parada } from '../datos/recorrido'
import { AUTO_IMAGEN, AUTO_PROPORCION } from './auto'

/**
 * El mapa real: calles de OpenStreetMap, gratis y sin clave. Encima, la ruta
 * de verdad, las paradas, y el auto. (CARTO, que se usaba antes, empezó a
 * pedir clave para sus mapas.)
 *
 * El trazado por rutas lo calcula OSRM (también libre) una sola vez y queda
 * guardado en el celular; mientras no lo tiene, o sin señal, une las paradas
 * en línea recta.
 */

type Props = {
  indiceActual: number
  /** Dónde está el auto: la ubicación en vivo si la hay, si no la última parada. */
  auto: { lat: number; lon: number }
  seleccionada: string | null
  alSeleccionar: (id: string | null) => void
}

const CLAVE_RUTA = 'vacaciones-ruta-real-v1'

const COLOR_TIPO: Record<Parada['tipo'], string> = {
  salida: '#ff6b5a',
  parada: '#ffffff',
  frontera: '#ffc23c',
  destino: '#2fa36b',
}

/** Las paradas que llevan el nombre siempre a la vista; el resto, al tocarlas. Con más se pisan. */
const CON_NOMBRE = new Set(['cordoba', 'sao-gabriel', 'bombinhas'])
/** Las que están contra el borde derecho llevan el nombre a la izquierda. */
const NOMBRE_A_LA_IZQUIERDA = new Set(['bombinhas', 'florianopolis', 'torres', 'porto-alegre'])

function leerRutaGuardada(): [number, number][] | null {
  try {
    const crudo = localStorage.getItem(CLAVE_RUTA)
    return crudo ? (JSON.parse(crudo) as [number, number][]) : null
  } catch {
    return null
  }
}

async function traerRuta(): Promise<[number, number][]> {
  const puntos = PARADAS.map((p) => `${p.lon},${p.lat}`).join(';')
  const respuesta = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${puntos}?overview=simplified&geometries=geojson`,
  )
  if (!respuesta.ok) throw new Error(`OSRM respondió ${respuesta.status}`)
  const datos = (await respuesta.json()) as { routes?: { geometry: { coordinates: [number, number][] } }[] }
  const coordenadas = datos.routes?.[0]?.geometry.coordinates
  if (!coordenadas?.length) throw new Error('OSRM no devolvió ruta')
  // GeoJSON viene como [lon, lat]; Leaflet usa [lat, lon].
  const ruta = coordenadas.map(([lon, lat]) => [lat, lon] as [number, number])
  try {
    localStorage.setItem(CLAVE_RUTA, JSON.stringify(ruta))
  } catch {
    // Sin storage se vuelve a pedir la próxima vez, nada más.
  }
  return ruta
}

function iconoParada(p: Parada, recorrida: boolean, elegida: boolean): L.DivIcon {
  const tamano = p.tipo === 'destino' || p.tipo === 'salida' ? 22 : 16
  return L.divIcon({
    className: 'mapa-real-chinche',
    iconSize: [tamano, tamano],
    html: `<span style="--color:${COLOR_TIPO[p.tipo]};opacity:${recorrida || elegida ? 1 : 0.85}" class="${
      elegida ? 'elegida' : ''
    }">${p.dormir ? '<i></i>' : ''}</span>`,
  })
}

// El Onix parado justo arriba del punto, así no tapa la chinche de la parada.
const ANCHO_AUTO = 66
const ALTO_AUTO = Math.round(ANCHO_AUTO / AUTO_PROPORCION)
const iconoAuto = L.divIcon({
  className: 'mapa-real-auto',
  iconSize: [ANCHO_AUTO, ALTO_AUTO],
  iconAnchor: [ANCHO_AUTO / 2, ALTO_AUTO + 10],
  html: `<img src="${AUTO_IMAGEN}" alt="" width="${ANCHO_AUTO}" height="${ALTO_AUTO}" draggable="false" />`,
})

export default function MapaReal({ indiceActual, auto, seleccionada, alSeleccionar }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const chinches = useRef<L.Marker[]>([])
  const marcaAuto = useRef<L.Marker | null>(null)
  const alSeleccionarRef = useRef(alSeleccionar)
  alSeleccionarRef.current = alSeleccionar

  // El mapa se arma una sola vez.
  useEffect(() => {
    if (!contenedor.current || mapa.current) return
    // zoomSnap fino: así el recorrido llena el cuadro en vez de saltar al zoom entero de abajo.
    const m = L.map(contenedor.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.25 })
    L.control.zoom({ position: 'bottomright' }).addTo(m)
    // El mapa va siempre claro, también con el celular en modo oscuro: así se leen las calles.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)

    const recta = PARADAS.map((p) => [p.lat, p.lon] as [number, number])
    const encuadrar = () => m.fitBounds(L.latLngBounds(recta), { padding: [28, 28] })
    encuadrar()
    // Si el cuadro cambia de tamaño (rotar el celular, o el primer dibujo), se reencuadra.
    const observador = new ResizeObserver(() => {
      m.invalidateSize()
      encuadrar()
    })
    observador.observe(contenedor.current)

    // La ruta: un borde blanco ancho y encima la línea de color, como en los mapas de navegación.
    const borde = L.polyline(leerRutaGuardada() ?? recta, { color: '#ffffff', weight: 8, opacity: 0.9 }).addTo(m)
    const linea = L.polyline(leerRutaGuardada() ?? recta, { color: '#0ea5b7', weight: 4.5, opacity: 1 }).addTo(m)
    if (!leerRutaGuardada()) {
      traerRuta()
        .then((ruta) => {
          borde.setLatLngs(ruta)
          linea.setLatLngs(ruta)
        })
        .catch(() => {})
    }

    chinches.current = PARADAS.map((p) => {
      const marca = L.marker([p.lat, p.lon], { icon: iconoParada(p, false, false), keyboard: true, title: p.nombre })
        .addTo(m)
        .on('click', () => alSeleccionarRef.current(p.id))
      marca.bindTooltip(p.nombre, {
        permanent: CON_NOMBRE.has(p.id),
        direction: NOMBRE_A_LA_IZQUIERDA.has(p.id) ? 'left' : 'right',
        offset: NOMBRE_A_LA_IZQUIERDA.has(p.id) ? [-10, 0] : [10, 0],
        className: 'mapa-real-nombre',
      })
      return marca
    })
    marcaAuto.current = L.marker([auto.lat, auto.lon], { icon: iconoAuto, interactive: false, zIndexOffset: 1000 }).addTo(m)
    m.on('click', () => alSeleccionarRef.current(null))
    mapa.current = m

    return () => {
      observador.disconnect()
      m.remove()
      mapa.current = null
    }
    // El auto inicial se toma una vez; después lo mueve el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Las chinches se repintan según por dónde van y cuál está elegida.
  useEffect(() => {
    chinches.current.forEach((marca, i) =>
      marca.setIcon(iconoParada(PARADAS[i], i <= indiceActual, PARADAS[i].id === seleccionada)),
    )
  }, [indiceActual, seleccionada])

  useEffect(() => {
    marcaAuto.current?.setLatLng([auto.lat, auto.lon])
  }, [auto.lat, auto.lon])

  return <div ref={contenedor} className="mapa-real h-[18rem] w-full overflow-hidden rounded-[1.1rem]" />
}
