// Prioridade do alerta (docs/01-requisitos.md, seção 4.3) — calcularPrioridade()
// P = R × 25 × (C / 100) + V
import { BONUS_AREA_VULNERAVEL } from './parametros.js'
import { pesoRisco } from './risco.js'

// evento.vulnerabilidades: lista de motivos (ex.: ['escola', 'suscetivel_sgb']).
// O bônus V é aplicado uma única vez, mesmo com mais de um motivo.
export function calcularPrioridade({ risco, confianca, vulnerabilidades = [] }) {
  const R = pesoRisco(risco)
  const V = vulnerabilidades.length > 0 ? BONUS_AREA_VULNERAVEL : 0
  return Math.round((R * 25 * (confianca / 100) + V) * 10) / 10 // 1 casa decimal
}
