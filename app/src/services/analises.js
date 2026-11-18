// Análises (RF14, RNF11): eventos do período escolhido (7 ou 30 dias) por tipo de risco e por bairro, e as
// duas metas do RNF11, sempre nos últimos 30 dias (janela móvel, como o RNF03), calculadas ao vivo
// (as ações do agente mudam os números na hora).
import { HORA, TIPOS } from './parametros.js'
import { resumoAlertasPreliminares, taxaAlertasConfiancaAlta, taxaFalsoAlerta } from './eventos.js'

export const PERIODOS_DIAS = [7, 30]

// Metas do RNF11 (docs/01-requisitos.md)
export const METAS_RNF11 = { falsoAlertaMax: 0.1, confiancaAltaMin: 0.9, janelaDias: 30 }

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

// Metas do RNF11 nos últimos 30 dias (não dependem do período dos gráficos)
export function metasRnf11(eventos, agora) {
  const daJanela = eventosNoPeriodo(eventos, agora, METAS_RNF11.janelaDias)
  const falso = taxaFalsoAlerta(daJanela)
  const confianca = taxaAlertasConfiancaAlta(daJanela)
  return {
    // Sem alertas na janela, não há o que medir: a meta aparece como "sem alertas no período"
    falsoAlerta: { ...falso, cumpre: falso.emitidos === 0 ? null : falso.taxa <= METAS_RNF11.falsoAlertaMax },
    confiancaAlta: { ...confianca, cumpre: confianca.alertas === 0 ? null : confianca.taxa >= METAS_RNF11.confiancaAltaMin },
    preliminares: resumoAlertasPreliminares(daJanela),
  }
}

// Tudo o que a tela Análises mostra: gráficos no período escolhido; metas sempre em 30 dias
export function resumoAnalises(eventos, { agora, dias, bairros }) {
  const doPeriodo = eventosNoPeriodo(eventos, agora, dias)
  return {
    total: doPeriodo.length,
    porTipo: eventosPorTipo(doPeriodo),
    porBairro: eventosPorBairro(doPeriodo, bairros),
    ...metasRnf11(eventos, agora),
  }
}

// "4,3%" — percentual com 1 casa decimal
export function formatarPercentual(taxa) {
  return `${(taxa * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}
