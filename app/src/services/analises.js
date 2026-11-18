// Análises (RF14, RNF11): eventos do período por tipo de risco e por bairro, e as duas metas do RNF11
// calculadas ao vivo sobre os mesmos eventos (as ações do agente mudam os números na hora).
import { HORA, TIPOS } from './parametros.js'
import { resumoAlertasPreliminares, taxaAlertasConfiancaAlta, taxaFalsoAlerta } from './eventos.js'

export const PERIODOS_DIAS = [7, 30]

// Metas do RNF11 (docs/01-requisitos.md)
export const METAS_RNF11 = { falsoAlertaMax: 0.1, confiancaAltaMin: 0.9 }

// Eventos criados nos últimos N dias (inclui os atuais e o histórico)
export function eventosNoPeriodo(eventos, agora, dias) {
  const inicio = agora.getTime() - dias * 24 * HORA
  return eventos.filter((e) => e.criadoEm.getTime() >= inicio && e.criadoEm <= agora)
}

// Contagem por um campo, na ordem das categorias dadas (categorias sem eventos aparecem com 0)
function contarPor(eventos, campo, categorias) {
  return categorias.map((categoria) => ({ categoria, total: eventos.filter((e) => e[campo] === categoria).length }))
}

export function eventosPorTipo(eventos) {
  return contarPor(eventos, 'tipo', Object.values(TIPOS))
}

export function eventosPorBairro(eventos, bairros) {
  return contarPor(eventos, 'bairro', bairros.map((b) => b.nome))
}

// Tudo o que a tela Análises mostra, para um período
export function resumoAnalises(eventos, { agora, dias, bairros }) {
  const doPeriodo = eventosNoPeriodo(eventos, agora, dias)
  const falso = taxaFalsoAlerta(doPeriodo)
  const confianca = taxaAlertasConfiancaAlta(doPeriodo)
  return {
    total: doPeriodo.length,
    porTipo: eventosPorTipo(doPeriodo),
    porBairro: eventosPorBairro(doPeriodo, bairros),
    // Sem alertas no período, não há o que medir: a meta aparece como "sem alertas no período"
    falsoAlerta: { ...falso, cumpre: falso.emitidos === 0 ? null : falso.taxa <= METAS_RNF11.falsoAlertaMax },
    confiancaAlta: { ...confianca, cumpre: confianca.alertas === 0 ? null : confianca.taxa >= METAS_RNF11.confiancaAltaMin },
    preliminares: resumoAlertasPreliminares(doPeriodo),
  }
}

// "4,3%" — percentual com 1 casa decimal
export function formatarPercentual(taxa) {
  return `${(taxa * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}
