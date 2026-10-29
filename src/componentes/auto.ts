/**
 * El auto del viaje: un Chevrolet Onix blanco, de costado, mirando hacia
 * adelante (a la derecha, que es para donde queda Brasil).
 *
 * Los rasgos del Onix que lo hacen reconocible: techo bajo, parabrisas muy
 * tendido, la línea de las ventanas que sube hacia atrás, faros finos y la
 * franja oscura de abajo. Es el contenido de un SVG con el origen en el
 * centro del auto y el piso en y = 9.5. Lo usan los dos mapas.
 */

/** Una llanta de 5 rayos centrada en (cx, cy). */
function rueda(cx: number, cy: number): string {
  const rayos = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
    const x = (cx + Math.cos(a) * 2.5).toFixed(2)
    const y = (cy + Math.sin(a) * 2.5).toFixed(2)
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#7b8a97" stroke-width="0.75" stroke-linecap="round" />`
  }).join('')
  return `
    <circle cx="${cx}" cy="${cy}" r="4.4" fill="#1b232b" />
    <circle cx="${cx}" cy="${cy}" r="2.9" fill="#dbe3ea" />
    ${rayos}
    <circle cx="${cx}" cy="${cy}" r="0.8" fill="#5d6b77" />`
}

export const AUTO_SVG = `
  <ellipse cx="0.5" cy="9.6" rx="21" ry="2.4" fill="#0d2b3a" opacity="0.25" />
  <path d="M -21.5 2.5 L -21.5 -3 Q -21.3 -5.2 -19.5 -5.8 L -17.5 -6.3 L -13.5 -10.6 Q -12.6 -11.5 -11 -11.6 L 1.5 -11.6 Q 3.8 -11.5 5.5 -10.2 L 11.5 -5.6 L 19.5 -4.3 Q 22.3 -3.8 22.4 -1.2 L 22.4 2.6 Q 22.4 4.8 20.4 4.8 L -19.6 4.8 Q -21.5 4.8 -21.5 2.5 Z"
    fill="#f8fafc" stroke="#8fa2b2" stroke-width="0.8" stroke-linejoin="round" />
  <path d="M -16.4 -6.6 L -13 -10.4 Q -12.4 -10.9 -11.4 -10.9 L -6.3 -10.9 L -6.3 -7.2 Z" fill="#22303d" />
  <path d="M -5.2 -7.1 L -5.2 -10.9 L 1.2 -10.9 Q 3.1 -10.9 4.5 -9.9 L 9.4 -6 Z" fill="#22303d" />
  <path d="M -3.6 -10.2 L -1.4 -10.2 L -3.6 -7.6 Z" fill="#ffffff" opacity="0.28" />
  <path d="M -20.4 -2.9 Q 0 -2.9 20.6 -2.1" fill="none" stroke="#c9d4dd" stroke-width="0.6" />
  <path d="M -5.75 -7.1 L -5.75 3.2 M 9.2 -5.4 L 10.2 3.2" stroke="#c9d4dd" stroke-width="0.55" fill="none" />
  <rect x="-9.4" y="-5.9" width="2.4" height="0.7" rx="0.35" fill="#8fa2b2" />
  <rect x="2.6" y="-5.6" width="2.4" height="0.7" rx="0.35" fill="#8fa2b2" />
  <path d="M 8.2 -6.3 L 10 -7.1 L 10.6 -6 L 8.8 -5.5 Z" fill="#e9eef2" stroke="#8fa2b2" stroke-width="0.4" />
  <path d="M 17.6 -4.5 L 22.1 -3.5 Q 22.3 -2.7 21.5 -2.5 L 18.4 -3.2 Z" fill="#eaf6ff" stroke="#8fa2b2" stroke-width="0.4" />
  <path d="M 18.4 -3.3 L 21.6 -2.6" stroke="#ffd36b" stroke-width="0.45" />
  <path d="M -21.5 -4.5 L -19.1 -5.6 L -18.8 -3.9 L -21.5 -3.3 Z" fill="#e0463b" />
  <rect x="-21" y="3" width="43" height="1.7" rx="0.85" fill="#3a4752" />
  <!-- El moño de Chevrolet: una barra ancha de puntas cortadas en diagonal, con el centro apenas más alto. -->
  <path d="M 18.9 -0.35 L 20.15 -0.35 L 20.25 -0.75 L 20.95 -0.75 L 20.9 -0.35 L 22.1 -0.35 L 21.8 0.45 L 20.75 0.45 L 20.65 0.85 L 19.95 0.85 L 20 0.45 L 18.6 0.45 Z"
    fill="#f2b632" stroke="#9c7114" stroke-width="0.2" stroke-linejoin="round" />
  ${rueda(-12.5, 5)}
  ${rueda(13.4, 5)}
`

/** El mismo auto como <svg> suelto, para el mapa real. */
export const AUTO_SVG_SUELTO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-23 -14 47 26" width="58" height="32">${AUTO_SVG}</svg>`
