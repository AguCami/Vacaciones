import { useState } from 'react'
import {
  CONSEJOS,
  EMERGENCIAS_ARGENTINA,
  EMERGENCIAS_BRASIL,
  FRASES,
  PASEOS,
  PLAYAS,
  type Lugar,
  type Telefono,
} from '../datos/guia'
import { MONEDAS, type Ajustes, type Moneda } from '../dominio/tipos'

export function Guia({ ajustes }: { ajustes: Ajustes }) {
  return (
    <section className="flex flex-col gap-4">
      <Conversor ajustes={ajustes} />

      <Seccion titulo="Emergencias" emoji="🚨" abierta>
        <p className="text-sm font-bold opacity-65">Tocá un número para llamar. Son gratis desde cualquier celular.</p>
        <h4 className="mt-3 text-xs font-black uppercase tracking-wide opacity-60">🇧🇷 En Brasil</h4>
        <Telefonos lista={EMERGENCIAS_BRASIL} />
        <h4 className="mt-4 text-xs font-black uppercase tracking-wide opacity-60">🇦🇷 En Argentina</h4>
        <Telefonos lista={EMERGENCIAS_ARGENTINA} />
        <p className="mt-3 text-sm font-bold opacity-65">
          El teléfono de la asistencia al viajero y del consulado conviene anotarlo en Listas → Datos a mano.
        </p>
      </Seccion>

      <Seccion titulo="Frases en portugués" emoji="🗣️">
        <Frases />
      </Seccion>

      <Seccion titulo="Playas de Bombinhas" emoji="🏖️">
        <Lugares lista={PLAYAS} />
      </Seccion>

      <Seccion titulo="Paseos cerca" emoji="🧭">
        <Lugares lista={PASEOS} />
      </Seccion>

      <Seccion titulo="Consejos" emoji="💡">
        <ul className="flex flex-col gap-3">
          {CONSEJOS.map((c) => (
            <li key={c.titulo}>
              <p className="font-black">{c.titulo}</p>
              <p className="text-sm font-bold opacity-75">{c.texto}</p>
            </li>
          ))}
        </ul>
      </Seccion>
    </section>
  )
}

function Seccion({
  titulo,
  emoji,
  abierta,
  children,
}: {
  titulo: string
  emoji: string
  abierta?: boolean
  children: React.ReactNode
}) {
  return (
    <details className="tarjeta group p-5" open={abierta}>
      <summary className="flex cursor-pointer list-none items-center gap-2 text-lg font-black">
        <span aria-hidden>{emoji}</span>
        <span className="flex-1">{titulo}</span>
        <span className="text-sm opacity-50 transition-transform group-open:rotate-180" aria-hidden>
          ▼
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}

function Conversor({ ajustes }: { ajustes: Ajustes }) {
  const [monto, setMonto] = useState('100')
  const [desde, setDesde] = useState<Moneda>('BRL')

  const valor = Number(monto.replace(',', '.'))
  const enBase = Number.isFinite(valor) ? valor * ajustes.cotizaciones[desde] : 0
  const otras = (Object.keys(MONEDAS) as Moneda[]).filter((m) => m !== desde)
  // Si todas las cotizaciones siguen en 1 nadie las cargó, y el conversor
  // diría que un real vale un peso.
  const sinCargar = otras.some((m) => m !== ajustes.monedaBase && ajustes.cotizaciones[m] === 1)

  return (
    <div className="tarjeta p-5">
      <h3 className="text-lg font-black">💱 ¿Cuánto es en pesos?</h3>
      <div className="mt-3 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-2xl border-2 border-white/70 bg-white/80 px-4 py-2.5 text-xl font-black tabular-nums text-[var(--color-tinta)] outline-none focus:border-[var(--color-mar)]"
          inputMode="decimal"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          aria-label="Monto"
        />
        <div className="flex shrink-0 gap-1">
          {(Object.keys(MONEDAS) as Moneda[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDesde(m)}
              className={`boton px-3 text-sm ${
                desde === m ? 'bg-[var(--color-mar)] text-white' : 'bg-white/70 text-[var(--color-tinta)]'
              }`}
            >
              {MONEDAS[m].simbolo}
            </button>
          ))}
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {otras.map((m) => (
          <li key={m} className="flex items-baseline justify-between rounded-2xl bg-white/50 px-4 py-2">
            <span className="text-sm font-bold opacity-70">{MONEDAS[m].nombre}</span>
            <span className="text-lg font-black tabular-nums">
              {MONEDAS[m].simbolo}{' '}
              {(enBase / ajustes.cotizaciones[m]).toLocaleString('es-AR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </li>
        ))}
      </ul>
      {sinCargar && (
        <p className="mt-2 text-sm font-bold text-[var(--color-coral-oscuro)]">
          Falta cargar la cotización en Ajustes ⚙️ — mientras tanto la cuenta da cualquier cosa.
        </p>
      )}
    </div>
  )
}

function Telefonos({ lista }: { lista: Telefono[] }) {
  return (
    <ul className="mt-2 flex flex-col gap-1.5">
      {lista.map((t) => (
        <li key={t.numero}>
          <a
            href={`tel:${t.numero}`}
            className="flex items-center gap-3 rounded-2xl bg-white/50 px-4 py-2.5 no-underline"
          >
            <span className="w-14 shrink-0 text-2xl font-black tabular-nums text-[var(--color-coral-oscuro)]">
              {t.numero}
            </span>
            <span className="min-w-0">
              <span className="block font-black">{t.nombre}</span>
              {t.detalle && <span className="block text-xs font-bold opacity-65">{t.detalle}</span>}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/** Lee la frase con la voz del celular. Si no hay voz en portugués, no hace nada. */
function decir(texto: string) {
  if (typeof speechSynthesis === 'undefined') return
  speechSynthesis.cancel()
  const voz = new SpeechSynthesisUtterance(texto.split('/')[0].replace('…', ''))
  voz.lang = 'pt-BR'
  voz.rate = 0.9
  speechSynthesis.speak(voz)
}

function Frases() {
  const [tema, setTema] = useState(0)
  const puedeHablar = typeof speechSynthesis !== 'undefined'
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {FRASES.map((t, i) => (
          <button
            key={t.tema}
            type="button"
            onClick={() => setTema(i)}
            className={`boton px-3 py-1.5 text-sm ${
              tema === i ? 'bg-[var(--color-mar)] text-white' : 'bg-white/70 text-[var(--color-tinta)]'
            }`}
          >
            {t.emoji} {t.tema}
          </button>
        ))}
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {FRASES[tema].frases.map((f) => (
          <li key={f.pt} className="flex items-center gap-3 rounded-2xl bg-white/50 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold opacity-65">{f.es}</p>
              <p className="font-black">{f.pt}</p>
              <p className="text-xs font-bold italic text-[var(--color-mar-hondo)]">se dice: {f.suena}</p>
            </div>
            {puedeHablar && (
              <button
                type="button"
                onClick={() => decir(f.pt)}
                className="boton grid size-10 shrink-0 place-items-center bg-white/80 text-lg"
                aria-label={`Escuchar "${f.pt}"`}
              >
                🔊
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

function Lugares({ lista }: { lista: Lugar[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {lista.map((l) => (
        <li key={l.nombre} className="flex gap-3 rounded-2xl bg-white/50 px-4 py-3">
          <span className="text-2xl" aria-hidden>
            {l.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-baseline gap-x-2 font-black">
              {l.nombre}
              <span className="text-xs font-bold text-[var(--color-mar-hondo)]">{l.ideal}</span>
            </p>
            <p className="text-sm font-bold opacity-75">{l.texto}</p>
            <a
              className="text-xs font-black text-[var(--color-mar-hondo)] underline underline-offset-2"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.nombre}, Santa Catarina, Brasil`)}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver en el mapa ↗
            </a>
          </div>
        </li>
      ))}
    </ul>
  )
}
