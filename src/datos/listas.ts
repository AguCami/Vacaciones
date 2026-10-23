import type { ItemLista, ListaId } from '../dominio/tipos'

/**
 * Las listas del viaje y lo que viene sugerido en cada una.
 *
 * Los sugeridos son un punto de partida: se tildan, se borran o se les suma lo
 * que falte desde la app. Los ids son fijos a propósito (ver `ItemLista`).
 *
 * Lo de papeles y frontera es lo habitual para cruzar en auto propio de
 * Argentina a Brasil, pero los requisitos cambian: confirmarlo en Migraciones y
 * con el seguro antes de salir.
 */

export const LISTAS: Record<ListaId, { nombre: string; emoji: string; ayuda: string }> = {
  papeles: {
    nombre: 'Papeles',
    emoji: '🪪',
    ayuda: 'Lo que piden en la frontera o en un control. Sin esto no se cruza.',
  },
  auto: {
    nombre: 'Auto',
    emoji: '🚗',
    ayuda: 'Lo que tiene que estar en el baúl y lo que hay que revisar antes de salir.',
  },
  valija: {
    nombre: 'Valija',
    emoji: '🧳',
    ayuda: 'Para no descubrir en Bombinhas que nadie trajo protector.',
  },
  antes: {
    nombre: 'Antes de salir',
    emoji: '✅',
    ayuda: 'Trámites y cosas de la casa. Cada una con su encargado.',
  },
  datos: {
    nombre: 'Datos a mano',
    emoji: '📌',
    ayuda: 'Reservas, direcciones, teléfonos del seguro. Lo que se busca con apuro y sin señal.',
  },
}

type Sugerido = [lista: ListaId, clave: string, texto: string, nota?: string]

const SUGERIDOS: Sugerido[] = [
  ['papeles', 'dni', 'DNI vigente de cada uno', 'El de tarjeta. Pasaporte también sirve.'],
  [
    'papeles',
    'menores',
    'Papeles de menores, si viajan',
    'Partida de nacimiento o DNI, y autorización de viaje si no van con los dos padres.',
  ],
  ['papeles', 'licencia', 'Licencia de conducir de quien maneje', 'Vigente, de cada uno que vaya a manejar.'],
  [
    'papeles',
    'cedula',
    'Cédula del auto',
    'Si el auto no está a nombre de quien maneja: cédula azul o autorización ante escribano.',
  ],
  ['papeles', 'seguro-mercosur', 'Seguro con cobertura Mercosur (Carta Verde)', 'Es obligatorio. Pedírsela a la aseguradora.'],
  ['papeles', 'asistencia', 'Asistencia al viajero', 'No la piden en la frontera, pero una guardia en Brasil sin cobertura sale cara.'],
  ['papeles', 'tarjetas', 'Tarjetas habilitadas para el exterior', 'Avisar al banco y revisar el límite.'],
  ['papeles', 'copias', 'Fotos de todos los papeles en el celular', 'Y en el de otro, por si se pierde uno.'],

  ['auto', 'service', 'Service, aceite y agua', 'Son 2.100 km de ida.'],
  ['auto', 'cubiertas', 'Presión de cubiertas y rueda de auxilio'],
  ['auto', 'gato', 'Gato y llave de rueda'],
  ['auto', 'balizas', 'Balizas triangulares'],
  ['auto', 'matafuegos', 'Matafuegos cargado'],
  ['auto', 'chaleco', 'Chaleco reflectante'],
  ['auto', 'botiquin', 'Botiquín'],
  ['auto', 'cargadores', 'Cargadores de celular para el auto'],
  ['auto', 'mapas', 'Mapas sin conexión bajados', 'En Google Maps: bajar la zona de la ruta y la de Bombinhas.'],

  ['valija', 'protector', 'Protector solar', 'En Brasil es bastante más caro.'],
  ['valija', 'repelente', 'Repelente'],
  ['valija', 'mallas', 'Mallas y ojotas'],
  ['valija', 'toallas', 'Toallas de playa'],
  ['valija', 'lentes', 'Anteojos de sol y gorra'],
  ['valija', 'remedios', 'Remedios de cada uno', 'Más algo para el mareo, la panza y el dolor de cabeza.'],
  ['valija', 'abrigo', 'Un buzo y un rompevientos', 'A la noche refresca y en la ruta hay aire acondicionado.'],
  ['valija', 'snorkel', 'Snorkel o antiparras', 'En Bombinhas el agua es transparente: vale la pena.'],
  ['valija', 'enchufe', 'Adaptador de enchufe', 'En Brasil usan el de tres patas redondas.'],
  ['valija', 'bolsas', 'Bolsas para la ropa mojada'],

  ['antes', 'reales', 'Conseguir reales en efectivo', 'Para peajes y lugares chicos. Lo grande se paga con tarjeta o Pix.'],
  ['antes', 'pix', 'Configurar cómo pagar con Pix', 'Varias billeteras argentinas ya pagan QR de Pix: probarlo antes.'],
  ['antes', 'chip', 'Roaming o chip para Brasil', 'O un eSIM. Uno con datos alcanza para el GPS de todos.'],
  [
    'antes',
    'tpa',
    'Pagar la tasa ambiental de Bombinhas (TPA)',
    'Se cobra por auto en temporada. Se paga online antes de llegar: ver la página de la Prefeitura.',
  ],
  ['antes', 'alojamientos', 'Confirmar los alojamientos', 'Concordia, Porto Alegre y Bombinhas.'],
  ['antes', 'casa', 'Dejar la casa lista', 'Plantas, heladera, llaves a alguien de confianza.'],
  ['antes', 'copia', 'Bajar una copia de esta app', 'Desde Ajustes, por si se borra algo.'],
]

export const ITEMS_SUGERIDOS: ItemLista[] = SUGERIDOS.map(([lista, clave, texto, nota], i) => ({
  id: `${lista}-${clave}`,
  lista,
  texto,
  nota,
  hecho: false,
  // Los sugeridos van primero y en el orden de arriba.
  creadoEn: i,
  creadoPor: '',
  actualizadoEn: 0,
}))
