// Nível de confiança do dado (docs/01-requisitos.md, seção 4.1) — calcularConfianca()
import {
  AJUSTES_CONFIANCA,
  BASE_CONFIANCA,
  CORROBORACAO,
  FATOR_DESATUALIZADO,
  FAIXAS_CONFIANCA,
  INTERVALO_ESPERADO_MIN,
  MINUTO,
  ORIGENS,
} from './parametros.js'
import { distanciaMetros } from './geo.js'

// Converte o valor numérico na faixa: Alta ≥ 75, Média 50–74, Baixa < 50
export function faixaConfianca(valor) {
  if (valor >= FAIXAS_CONFIANCA.alta) return 'Alta'
  if (valor >= FAIXAS_CONFIANCA.media) return 'Média'
  return 'Baixa'
}

// Desatualizado = sem atualização há MAIS de 2× o intervalo esperado da origem.
// Comunidade não tem intervalo esperado, então nunca fica desatualizada.
export function estaDesatualizado(dado, agora) {
  const intervalo = INTERVALO_ESPERADO_MIN[dado.origem]
  if (intervalo == null) return false
  const semAtualizacaoMs = agora - dado.atualizadoEm
  return semAtualizacaoMs > FATOR_DESATUALIZADO * intervalo * MINUTO
}

// Corroborado = existe outro dado de Sensor ou Base pública (inclui concessionária), do mesmo tipo
// de risco, a até 500 m e até 30 min. Leituras da mesma fonte (ex.: o mesmo sensor) não contam.
export function estaCorroborado(dado, outrosDados = []) {
  const origensQueCorroboram = [ORIGENS.SENSOR, ORIGENS.BASE_PUBLICA, ORIGENS.CONCESSIONARIA]
  return outrosDados.some(
    (outro) =>
      outro.id !== dado.id &&
      (outro.fonteId == null || outro.fonteId !== dado.fonteId) &&
      outro.tipo === dado.tipo &&
      origensQueCorroboram.includes(outro.origem) &&
      distanciaMetros(dado, outro) <= CORROBORACAO.raioMetros &&
      Math.abs(outro.registradoEm - dado.registradoEm) <= CORROBORACAO.janelaMinutos * MINUTO,
  )
}

// Devolve o valor (0–100), a faixa e a lista de ajustes — a decomposição aparece na tela Origem e confiança.
export function calcularConfianca(dado, { agora = new Date(), outrosDados = [] } = {}) {
  const base = BASE_CONFIANCA[dado.origem]
  if (base == null) throw new Error(`Origem desconhecida: ${dado.origem}`)

  // curto: rótulo do resumo de uma linha (Fila de validação)
  const ajustes = [{ descricao: `Base da origem ${dado.origem}`, curto: dado.origem, pontos: base }]

  const confirmacoes = Math.min(dado.confirmacoes ?? 0, AJUSTES_CONFIANCA.maxConfirmacoes)
  if (confirmacoes > 0) {
    const descricao = confirmacoes === 1 ? '1 confirmação de morador' : `${confirmacoes} confirmações de moradores`
    ajustes.push({
      descricao,
      curto: confirmacoes === 1 ? '1 confirmação' : `${confirmacoes} confirmações`,
      pontos: confirmacoes * AJUSTES_CONFIANCA.porConfirmacao,
    })
  }
  if (estaCorroborado(dado, outrosDados)) {
    ajustes.push({ descricao: 'Corroborado por Sensor ou Base pública (500 m, 30 min)', curto: 'corroborado', pontos: AJUSTES_CONFIANCA.corroborado })
  }
  if (dado.fotoGeolocalizada) {
    ajustes.push({ descricao: 'Foto geolocalizada', curto: 'foto', pontos: AJUSTES_CONFIANCA.fotoGeolocalizada })
  }
  if (estaDesatualizado(dado, agora)) {
    ajustes.push({ descricao: 'Dado desatualizado', curto: 'desatualizado', pontos: AJUSTES_CONFIANCA.desatualizado })
  }
  if (dado.origem === ORIGENS.SENSOR && dado.falhaSensor) {
    ajustes.push({ descricao: 'Sensor com leitura fora da faixa ou falha recente', curto: 'falha do sensor', pontos: AJUSTES_CONFIANCA.sensorComFalha })
  }

  const soma = ajustes.reduce((total, ajuste) => total + ajuste.pontos, 0)
  const valor = Math.max(0, Math.min(100, soma)) // limita a 0–100
  return { valor, faixa: faixaConfianca(valor), ajustes }
}

// Resumo de uma linha: "Comunidade 40 + 2 confirmações (20) + foto (5) = 65"; "Sensor 90 − falha do sensor (30) = 60"
export function resumoConfianca({ valor, ajustes }) {
  const [base, ...resto] = ajustes
  const partes = resto.map((a) => `${a.pontos < 0 ? '−' : '+'} ${a.curto} (${Math.abs(a.pontos)})`)
  return [`${base.curto} ${base.pontos}`, ...partes, `= ${valor}`].join(' ')
}
