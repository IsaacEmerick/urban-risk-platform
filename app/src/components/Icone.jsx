// Ícones SVG do protótipo (sem biblioteca). Cada ícone de risco tem uma FORMA diferente
// (círculo, círculo, triângulo, octógono) para não depender só da cor (RNF07).
// Os mesmos desenhos viram texto em svgDoIcone(), usado nos marcadores do Leaflet.

const ICONES = {
  // Risco: forma de fundo + sinal
  Baixo: ['<circle cx="12" cy="12" r="9.5"/>', '<path d="M7.5 12.3l3 3 6-6.3"/>'],
  Moderado: ['<circle cx="12" cy="12" r="9.5"/>', '<path d="M12 11v6"/>', '<circle cx="12" cy="7.5" r="0.6" fill="currentColor"/>'],
  Alto: ['<path d="M12 2.8L22 20.5H2z"/>', '<path d="M12 9.5v5"/>', '<circle cx="12" cy="17.6" r="0.6" fill="currentColor"/>'],
  Crítico: [
    '<path d="M8.2 2.5h7.6l5.7 5.7v7.6l-5.7 5.7H8.2l-5.7-5.7V8.2z"/>',
    '<path d="M12 7v6.5"/>',
    '<circle cx="12" cy="16.8" r="0.6" fill="currentColor"/>',
  ],

  // Origens
  Sensor: ['<path d="M12 3v10"/>', '<circle cx="12" cy="4.5" r="1.5"/>', '<path d="M3 17c2 0 2-1.6 4.5-1.6S9.5 17 12 17s2-1.6 4.5-1.6S19 17 21 17"/>', '<path d="M3 21c2 0 2-1.6 4.5-1.6S9.5 21 12 21s2-1.6 4.5-1.6S19 21 21 21"/>'],
  'Base pública': ['<path d="M3 9l9-5 9 5"/>', '<path d="M5.5 10v7.5M10 10v7.5M14 10v7.5M18.5 10v7.5"/>', '<path d="M3 20.5h18"/>'],
  'Base pública (concessionária)': ['<path d="M9 3v5M15 3v5"/>', '<path d="M6 8h12v3a6 6 0 0 1-12 0z"/>', '<path d="M12 17v4"/>'],
  Comunidade: ['<circle cx="9" cy="8" r="3"/>', '<path d="M3.5 20a5.5 5.5 0 0 1 11 0"/>', '<circle cx="17" cy="9" r="2.5"/>', '<path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/>'],

  // Tipos de risco (Registro comunitário)
  Alagamento: ['<path d="M12 3s-5 5.6-5 9a5 5 0 0 0 10 0c0-3.4-5-9-5-9z"/>', '<path d="M2 21c1.7 0 1.7-1.2 3.3-1.2S7 21 8.7 21s1.7-1.2 3.3-1.2 1.7 1.2 3.3 1.2 1.7-1.2 3.3-1.2S20.3 21 22 21"/>'],
  'Ilha de calor': ['<path d="M10 4.5a2 2 0 0 1 4 0v9.6a4 4 0 1 1-4 0z"/>', '<path d="M12 10v7"/>', '<path d="M18 4v2M20.5 7.5h-2M18.2 10.3l1.4 1.4"/>'],
  'Interrupção de serviço': ['<path d="M13 2.5L5.5 13H11l-1 8.5L17.5 11H12z"/>', '<path d="M3 3l18 18"/>'],

  // Altura da água: rua com meio-fio (as duas primeiras) e pessoa (as duas últimas); a onda sobe
  'agua-abaixoMeioFio': ['<path d="M2 21.5h20"/>', '<path d="M14 21.5v-5h8"/>', '<path d="M2 19.5c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1"/>'],
  'agua-meioFio': ['<path d="M2 21.5h20"/>', '<path d="M14 21.5v-5h8"/>', '<path d="M2 16.5c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/>'],
  'agua-canela': ['<circle cx="12" cy="3.5" r="2"/>', '<path d="M12 6v8M8 9.5h8M12 14l-3 7.5M12 14l3 7.5"/>', '<path d="M2 18.5c1.7 0 1.7-1 3.3-1s1.7 1 3.4 1 1.6-1 3.3-1 1.7 1 3.3 1 1.7-1 3.4-1 1.6 1 3.3 1"/>'],
  'agua-joelho': ['<circle cx="12" cy="3.5" r="2"/>', '<path d="M12 6v8M8 9.5h8M12 14l-3 7.5M12 14l3 7.5"/>', '<path d="M2 14.5c1.7 0 1.7-1 3.3-1s1.7 1 3.4 1 1.6-1 3.3-1 1.7 1 3.3 1 1.7-1 3.4-1 1.6 1 3.3 1"/>'],

  // Interface
  camera: ['<path d="M3.5 8h3.5l2-3h6l2 3h3.5v11.5h-17z"/>', '<circle cx="12" cy="13.5" r="3.5"/>'],
  marcado: ['<path d="M5 12.5l4.5 4.5L19 7.5"/>'],
  confirmado: ['<circle cx="12" cy="12" r="9.5"/>', '<path d="M7.5 12.3l3 3 6-6.3"/>'],
  sino: ['<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/>', '<path d="M10 20.5a2 2 0 0 0 4 0"/>'],
  relogio: ['<circle cx="12" cy="12" r="9"/>', '<path d="M12 7v5l3 2"/>'],
  voltar: ['<path d="M15 5l-7 7 7 7"/>'],
  seguir: ['<path d="M9 5l7 7-7 7"/>'],
  local: ['<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/>', '<circle cx="12" cy="9.5" r="2.5"/>'],
}

const atributos = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'

// Versão em texto (para L.divIcon do Leaflet, que recebe HTML)
export function svgDoIcone(nome) {
  return `<svg ${atributos} aria-hidden="true" focusable="false">${(ICONES[nome] ?? []).join('')}</svg>`
}

// Decorativo por padrão: o texto ao lado sempre diz o que o ícone significa
export default function Icone({ nome, className = 'icone' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: (ICONES[nome] ?? []).join('') }}
    />
  )
}
