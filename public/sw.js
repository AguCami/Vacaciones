/*
 * Que la app abra sin señal: en la ruta y en la frontera muchas veces no hay.
 *
 * La página se pide primero a la red (así siempre llega la última versión) y,
 * si no hay red, sale de la copia guardada. Los archivos de assets/ llevan un
 * hash en el nombre y nunca cambian, así que esos van directo de la copia.
 */
const CACHE = 'vacaciones-v3'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== self.location.origin) return

  if (new URL(pedido.url).pathname.includes('/assets/')) {
    evento.respondWith(
      caches.match(pedido).then(
        (guardada) =>
          guardada ??
          fetch(pedido).then((respuesta) => {
            const copia = respuesta.clone()
            void caches.open(CACHE).then((c) => c.put(pedido, copia))
            return respuesta
          }),
      ),
    )
    return
  }

  evento.respondWith(
    fetch(pedido)
      .then((respuesta) => {
        // Solo respuestas enteras: el video llega por pedazos (206) y esos no se guardan.
        if (respuesta.status === 200) {
          const copia = respuesta.clone()
          void caches.open(CACHE).then((c) => c.put(pedido, copia))
        }
        return respuesta
      })
      // Sin red: la copia de esa página o, si nunca se guardó, la de inicio.
      .catch(() =>
        caches
          .match(pedido)
          .then((guardada) => guardada ?? caches.match('./'))
          .then((guardada) => guardada ?? Response.error()),
      ),
  )
})
