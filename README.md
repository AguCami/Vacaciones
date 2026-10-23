# Vacaciones 🏖️

El viaje en auto de **Córdoba a Bombas y Bombinhas** en una sola app: el mapa del recorrido, las
cuentas de los cuatro, las listas para no olvidarse nada y una guía para cuando ya estén allá.

Dos pantallas que resuelven dos problemas distintos. El mapa contesta *¿cuánto falta?*. Las cuentas
contestan *¿quién le debe a quién?*, que es la pregunta que arruina el último día de todas las
vacaciones compartidas.

## El recorrido

2.142 km y unas 27,5 horas de manejo puro, por el paso de **Paso de los Libres / Uruguaiana**.

| # | Parada | Tramo | Acumulado |
|---|---|---|---|
| 1 | Córdoba | — | 0 km |
| 2 | Santa Fe | 340 km · 4 h | 340 km |
| 3 | Paraná | 25 km · 0,5 h | 365 km |
| 4 | Concordia 🛏️ | 280 km · 3,5 h | 645 km |
| 5 | Paso de los Libres | 320 km · 4 h | 965 km |
| 6 | Uruguaiana 🇧🇷 | 12 km · 1,5 h | 977 km |
| 7 | Porto Alegre 🛏️ | 630 km · 7 h | 1.607 km |
| 8 | Torres | 200 km · 2,5 h | 1.807 km |
| 9 | Florianópolis | 270 km · 3,5 h | 2.077 km |
| 10 | Bombas y Bombinhas 🛏️ | 65 km · 1 h | 2.142 km |

Los kilómetros y las horas son de ruta y aproximados, sin contar paradas ni la espera en la frontera.

**Todo el recorrido vive en un solo archivo: `src/datos/recorrido.ts`.** Cambiar una parada, agregar
una o corregir un tramo se hace ahí y el mapa se redibuja solo. No hay que tocar nada más.

El mapa está **dibujado a mano en SVG**, no es satelital. Pero cada parada se ubica con su latitud y
longitud de verdad, así que las proporciones y el orden son correctos. Es una ilustración fiel, no un
plano de navegación: para manejar, el GPS.

## Las cuentas

- Se anota **quién pagó** y **entre quiénes se reparte** — no siempre son los cuatro.
- **Pesos, reales y dólares** en el mismo viaje. La cotización se carga a mano en Ajustes: la que vale
  es a la que cambiaron ustedes, no la del diario.
- **Para quedar a mano** calcula la menor cantidad de pagos posible. Entre cuatro personas eso suele
  ser dos o tres transferencias en lugar de seis.

### Por qué los centavos son enteros

Todo se calcula en centavos enteros, nunca en decimales. Con decimales, $10 entre 3 da 3,33 a cada uno
y falta un centavo: aparece después como una deuda de $0,01 que nadie puede saldar nunca. Acá el resto
se reparte de a un centavo entre los primeros, y la suma de los saldos da exactamente cero siempre.

## Las listas

Papeles, Auto, Valija, Antes de salir y Datos a mano. Vienen con lo habitual para cruzar en auto a
Brasil ya cargado (`src/datos/listas.ts`), y desde la app se tilda, se borra o se agrega lo que falte.
Cada renglón puede tener **encargado**: se toca el chip y va rotando entre los cuatro, y con *Solo lo
que me toca a mí* cada uno ve lo suyo.

Los renglones sugeridos tienen **id fijo**: cuando esto esté en Firestore, los cuatro celulares van a
tildar el mismo documento en vez de crear cuatro "DNI".

> Los requisitos de frontera cambian: confirmar con Migraciones y la aseguradora antes de salir.

## La guía

Todo texto fijo, así funciona sin señal (`src/datos/guia.ts`):

- **Conversor** reales / pesos / dólares con las cotizaciones de Ajustes.
- **Emergencias** de Brasil y Argentina: se tocan y llaman.
- **Frases en portugués** por tema, con cómo se pronuncian y un 🔊 que las lee con la voz del celular.
- **Playas de Bombinhas** y **paseos cerca**, con link al mapa.
- **Consejos** de frontera, manejo, plata y sol.

En Ajustes se cargan las **fechas del viaje** y arriba aparece cuántos días faltan.

## Sin señal

La app publicada se guarda sola en el celular (`public/sw.js`) y abre aunque no haya internet — en la
ruta y en la frontera pasa seguido. Conviene abrirla una vez con señal y agregarla a la pantalla de
inicio.

## Dónde se guardan los datos

**Hoy, en el navegador de cada uno.** O sea: cada celular ve solo lo suyo. Sirve para desarrollar y
para ir cargando, pero **no comparte nada entre los cuatro todavía**. Eso llega con Firebase.

Mientras tanto, en Ajustes hay **Bajar copia** y **Traer copia**. Al traer una copia, los datos se
**fusionan por id** en lugar de pisarse: si alguien cargó cosas en su celular y otro acá, no se pierde
ninguna de las dos puntas.

### Cómo está preparado para Firebase

Ningún componente sabe de dónde salen los datos. Todo pasa por la interfaz `Almacenamiento`
(`src/almacenamiento/tipos.ts`), con métodos **async desde el día uno** aunque localStorage sea
instantáneo — si fueran sincrónicos, el día de la migración habría que reescribir cada pantalla.

Además, los datos ya tienen la forma que Firestore quiere:

- Cada gasto y cada pago es un **documento con id propio**, generado en el cliente. Eso permite
  escribir sin esperar al servidor y que dos personas cargando a la vez no choquen.
- **Nada se pisa ni se borra**: editar es escribir una versión nueva, borrar es marcar `anulado`.
- Ya existe `suscribir()`, que hoy avisa cuando cambia otra pestaña y mañana va a avisar cuando cargue
  cualquiera de los cuatro.

### La migración, paso a paso

1. Crear el proyecto en [console.firebase.google.com](https://console.firebase.google.com) y habilitar
   **Firestore**.
2. `npm install firebase`
3. Poner las claves del proyecto en un `.env` (ya está en `.gitignore`):
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
4. Escribir `src/almacenamiento/firestore.ts` con una clase que implemente la misma interfaz
   `Almacenamiento`. Los métodos mapean casi uno a uno: `agregarGasto` es un `setDoc` en la colección
   `gastos`, `leerGastos` es un `getDocs`, y `suscribir` es un `onSnapshot`.
5. Cambiar **una línea** en `src/almacenamiento/indice.ts`:
   ```ts
   export const almacenamiento: Almacenamiento = new AlmacenamientoFirestore()
   ```
6. Cada uno baja su copia desde Ajustes **antes** de migrar y la trae después. Como se fusiona por id,
   se pueden traer las cuatro copias una atrás de la otra sin duplicar nada.

Nada más de la app cambia.

> ⚠️ Antes de salir de viaje, probar de verdad entre los cuatro celulares. Mientras esté en
> localStorage cada uno ve solo lo suyo, así que el "¿nos vemos todos lo mismo?" recién se puede
> responder después de migrar.

## Correrla

```bash
npm install
npm run dev      # desarrollo
npm run build    # compila a dist/
npm run lint
```

## Publicarla

`.github/workflows/publicar.yml` compila y publica en **GitHub Pages** en cada push a `main`. Para que
funcione hay que entrar una vez a **Settings → Pages** del repo y poner *Source: GitHub Actions*.

Queda en `https://agucami.github.io/Vacaciones/`, que se abre en cualquier celular y se puede agregar a
la pantalla de inicio.

## Cómo está hecha

React 19 + TypeScript + Vite + Tailwind 4, sin dependencias de más: el mapa es SVG escrito a mano y no
hay librería de gráficos ni de mapas.

```
src/
  datos/recorrido.ts        el viaje: paradas, km, horas
  dominio/tipos.ts          el modelo de datos
  dominio/cuentas.ts        balances y liquidación (en centavos enteros)
  almacenamiento/tipos.ts   la interfaz Almacenamiento
  almacenamiento/local.ts   la implementación de hoy (localStorage)
  almacenamiento/indice.ts  el único lugar donde se elige la implementación
  ganchos/useViaje.ts       el estado del viaje
  componentes/escena.ts     la geometría del mapa (proyección y curvas)
  componentes/Mapa.tsx      el mapa ilustrado
  componentes/Cuentas.tsx   cargar y listar gastos
  componentes/Balances.tsx  quién debe a quién
  componentes/Ajustes.tsx   personas, fechas, monedas y copias
  datos/listas.ts           las listas y lo que viene sugerido
  datos/guia.ts             emergencias, frases, playas, paseos
  componentes/Listas.tsx    las listas para tildar
  componentes/Guia.tsx      conversor y guía
public/sw.js                para que abra sin señal
```
