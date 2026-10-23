/**
 * La guía: lo que conviene tener a mano una vez en Brasil.
 *
 * Todo es texto fijo, así funciona sin señal. Las distancias son aproximadas,
 * desde el centro de Bombinhas.
 */

export type Telefono = { numero: string; nombre: string; detalle: string }

export const EMERGENCIAS_BRASIL: Telefono[] = [
  { numero: '192', nombre: 'SAMU', detalle: 'Ambulancia, emergencias médicas' },
  { numero: '193', nombre: 'Bombeiros', detalle: 'Bomberos y rescate en el mar' },
  { numero: '190', nombre: 'Polícia Militar', detalle: 'Robos, peleas, cualquier urgencia policial' },
  { numero: '191', nombre: 'Polícia Rodoviária Federal', detalle: 'Accidentes y problemas en las rutas BR' },
  { numero: '199', nombre: 'Defesa Civil', detalle: 'Temporales, inundaciones, deslizamientos' },
]

export const EMERGENCIAS_ARGENTINA: Telefono[] = [
  { numero: '911', nombre: 'Emergencias', detalle: 'Policía, en casi todo el país' },
  { numero: '107', nombre: 'SAME', detalle: 'Ambulancia' },
  { numero: '100', nombre: 'Bomberos', detalle: '' },
]

export type Frase = { es: string; pt: string; suena: string }

export const FRASES: { tema: string; emoji: string; frases: Frase[] }[] = [
  {
    tema: 'Lo básico',
    emoji: '👋',
    frases: [
      { es: 'Hola / Buen día', pt: 'Oi / Bom dia', suena: 'oi / bon chía' },
      { es: 'Buenas tardes / noches', pt: 'Boa tarde / Boa noite', suena: 'boa tárchi / boa nóiche' },
      { es: 'Gracias', pt: 'Obrigado (si sos varón) / Obrigada', suena: 'obrigádu / obrigáda' },
      { es: 'Por favor', pt: 'Por favor', suena: 'por favór' },
      { es: 'Perdón, disculpe', pt: 'Desculpa / Com licença', suena: 'deskúlpa / kon lisénsa' },
      { es: 'No entiendo, ¿más despacio?', pt: 'Não entendi, mais devagar?', suena: 'nau entenchí, mais devagár' },
      { es: '¿Habla español?', pt: 'Você fala espanhol?', suena: 'vosé fála españól' },
    ],
  },
  {
    tema: 'En la ruta',
    emoji: '⛽',
    frases: [
      { es: 'Lleno, por favor', pt: 'Completa, por favor', suena: 'kompléta, por favór' },
      { es: 'Nafta común', pt: 'Gasolina comum', suena: 'gazolína komún' },
      { es: '¿Dónde hay un baño?', pt: 'Onde fica o banheiro?', suena: 'ónchi fíka u bañéiru' },
      { es: '¿Cuánto falta para…?', pt: 'Quanto falta para…?', suena: 'kuántu fálta pára' },
      { es: 'Se pinchó una goma', pt: 'Furou o pneu', suena: 'furóu u pinéu' },
      { es: 'Gomería', pt: 'Borracharia', suena: 'borrashería' },
    ],
  },
  {
    tema: 'Comer y pagar',
    emoji: '🍽️',
    frases: [
      { es: 'La cuenta, por favor', pt: 'A conta, por favor', suena: 'a kónta, por favór' },
      { es: '¿Cuánto cuesta?', pt: 'Quanto custa?', suena: 'kuántu kústa' },
      { es: '¿Se puede pagar con tarjeta?', pt: 'Aceita cartão?', suena: 'aséita kartáu' },
      { es: 'Débito / Crédito', pt: 'Débito / Crédito', suena: 'débitu / créditu' },
      { es: 'Una mesa para cuatro', pt: 'Uma mesa para quatro', suena: 'úma mésa pára kuátru' },
      { es: 'Agua sin gas', pt: 'Água sem gás', suena: 'água sein gás' },
      { es: 'Comida por peso', pt: 'Comida a quilo', suena: 'komída a kílu' },
      { es: 'Para llevar', pt: 'Para viagem', suena: 'pára viájein' },
    ],
  },
  {
    tema: 'Playa',
    emoji: '🏖️',
    frases: [
      { es: 'Sombrilla y dos reposeras', pt: 'Um guarda-sol e duas cadeiras', suena: 'un guárda-sól i dúas kadéiras' },
      { es: '¿Hay corriente? ¿Es peligroso?', pt: 'Tem correnteza? É perigoso?', suena: 'tein korrentésa? é perigósu' },
      { es: 'Coco helado', pt: 'Água de coco gelada', suena: 'água chi kóku jeláda' },
      { es: 'Paseo en barco', pt: 'Passeio de barco', suena: 'paséiu chi bárku' },
    ],
  },
  {
    tema: 'Urgencias',
    emoji: '🚑',
    frases: [
      { es: '¡Ayuda!', pt: 'Socorro!', suena: 'sokórru' },
      { es: 'Necesito un médico', pt: 'Preciso de um médico', suena: 'presísu chi un médiku' },
      { es: 'Farmacia', pt: 'Farmácia', suena: 'farmásia' },
      { es: 'Me duele acá', pt: 'Dói aqui', suena: 'dói akí' },
      { es: 'Soy alérgico a…', pt: 'Sou alérgico a…', suena: 'sóu alérjiku a' },
      { es: 'Nos robaron', pt: 'Fomos roubados', suena: 'fómus robádus' },
    ],
  },
]

export type Lugar = { nombre: string; emoji: string; texto: string; ideal: string }

export const PLAYAS: Lugar[] = [
  {
    nombre: 'Bombas',
    emoji: '🏘️',
    texto: 'La playa del centro: larga, de agua mansa y con todo cerca. La más cómoda para el día a día.',
    ideal: 'Familia · servicios',
  },
  {
    nombre: 'Bombinhas',
    emoji: '🛶',
    texto: 'Al lado de Bombas, más chica y tranquila. Kayaks y botes saliendo desde la arena.',
    ideal: 'Agua calma · kayak',
  },
  {
    nombre: 'Sepultura',
    emoji: '🐠',
    texto: 'Una caleta chiquita entre piedras. De las mejores para hacer snorkel. Llegar temprano: se llena.',
    ideal: 'Snorkel',
  },
  {
    nombre: 'Lagoinha',
    emoji: '🤿',
    texto: 'Escondida y de agua transparente, con piedras y peces. Se baja por un camino empinado.',
    ideal: 'Snorkel · buceo',
  },
  {
    nombre: 'Quatro Ilhas',
    emoji: '🌊',
    texto: 'Mar abierto con vista a las cuatro islitas. Más olas, arena clara y menos gente.',
    ideal: 'Paisaje · olas',
  },
  {
    nombre: 'Mariscal',
    emoji: '🏄',
    texto: 'La más larga de la península, de mar abierto. Ojo con la corriente.',
    ideal: 'Surf · caminatas',
  },
  {
    nombre: 'Canto Grande',
    emoji: '🦀',
    texto: 'Del lado de la bahía: agua quieta y poco profunda, ideal si van chicos.',
    ideal: 'Chicos · agua quieta',
  },
  {
    nombre: 'Zimbros',
    emoji: '🎣',
    texto: 'Pueblo de pescadores con restaurantes de mariscos frente al agua. Para almorzar sin apuro.',
    ideal: 'Comer · pescadores',
  },
]

export const PASEOS: Lugar[] = [
  {
    nombre: 'Reserva del Arvoredo',
    emoji: '🐢',
    texto: 'Salidas en barco desde Bombinhas a la reserva marina. El mejor buceo y snorkel del sur de Brasil.',
    ideal: 'Medio día · reservar',
  },
  {
    nombre: 'Sendero del Morro do Macaco',
    emoji: '🥾',
    texto: 'Subida corta con vista a toda la península. Mejor al atardecer y con agua.',
    ideal: '1 hora',
  },
  {
    nombre: 'Porto Belo e Ilha de Porto Belo',
    emoji: '🏝️',
    texto: 'A unos 15 km. A la isla se cruza en lancha; tiene playa, senderos y restaurante.',
    ideal: 'Medio día',
  },
  {
    nombre: 'Balneário Camboriú',
    emoji: '🏙️',
    texto: 'A unos 35 km. Los rascacielos sobre el mar, el teleférico a Laranjeiras y el shopping.',
    ideal: 'Día de lluvia',
  },
  {
    nombre: 'Beto Carrero World',
    emoji: '🎢',
    texto: 'El parque de diversiones más grande de Latinoamérica, en Penha, a unos 70 km.',
    ideal: 'Día entero · entradas online',
  },
]

export const CONSEJOS: { titulo: string; texto: string }[] = [
  {
    titulo: 'En la frontera',
    texto:
      'Primero Migraciones y después el auto. Tener los papeles juntos en una carpeta. En temporada alta la espera puede ser de horas: salir con tanque lleno, agua y algo para comer.',
  },
  {
    titulo: 'Manejar en Brasil',
    texto:
      'Andar con luces bajas de día en ruta: en las de doble mano es obligatorio si el auto no tiene luces diurnas. Hay muchos radares fijos y lomas de burro ("lombadas") en los pueblos. Los peajes de las BR se pagan en reales; tener efectivo por si no aceptan tarjeta.',
  },
  {
    titulo: 'La plata',
    texto:
      'Pix es como pagan todos en Brasil. Si alguna billetera de ustedes paga QR de Pix, suele dar mejor cambio que la tarjeta. Cargar cada gasto en la app el mismo día, en la moneda en que se pagó.',
  },
  {
    titulo: 'El agua y el sol',
    texto:
      'Bandera roja es no meterse. El sol de Santa Catarina quema más rápido que el de Córdoba: protector cada dos horas y nada de playa al mediodía para los chicos.',
  },
]
