// Nível de risco (docs/01-requisitos.md, seção 4.2) — classificarRisco()
import { HORA, LIMIARES_RISCO, NIVEIS_RISCO, SITUACOES_INTERRUPCAO, TIPOS } from './parametros.js'

const [BAIXO, MODERADO, ALTO, CRITICO] = NIVEIS_RISCO

// Peso do nível: Baixo = 1 ... Crítico = 4 (é o R da prioridade)
export function pesoRisco(nivel) {
  const indice = NIVEIS_RISCO.indexOf(nivel)
  if (indice < 0) throw new Error(`Nível de risco desconhecido: ${nivel}`)
  return indice + 1
}

export function compararRisco(a, b) {
  return pesoRisco(a) - pesoRisco(b)
}

// Quando mais de um critério se aplica, vale o nível mais alto
export function maiorRisco(niveis) {
  return niveis.reduce((maior, nivel) => (compararRisco(nivel, maior) > 0 ? nivel : maior), BAIXO)
}

function riscoPorChuva(mmH) {
  if (mmH == null) return BAIXO
  const l = LIMIARES_RISCO.chuvaMmH
  if (mmH > l.critico) return CRITICO
  if (mmH >= l.alto) return ALTO // ≥ 25 e ≤ 50
  if (mmH >= l.moderado) return MODERADO // ≥ 10 e < 25
  return BAIXO
}

function riscoPorLamina(cm) {
  if (cm == null) return BAIXO
  const l = LIMIARES_RISCO.laminaCm
  if (cm > l.critico) return CRITICO
  if (cm >= l.alto) return ALTO // ≥ 10 e ≤ 30
  return BAIXO // a lâmina d'água não tem faixa Moderado
}

// Nível do rio: falta = cota de transbordamento − nível (m). Parâmetros fictícios do protótipo.
// Arredondada ao centímetro (resolução do sensor), para 4,20 − 3,70 dar 0,50 exato e não 0,5000000000000004.
export function faltaParaTransbordar(nivelRioM, cotaTransbordamentoM) {
  return Math.round((cotaTransbordamentoM - nivelRioM) * 100) / 100
}

function riscoPorNivelRio(nivelRioM, cotaTransbordamentoM) {
  if (nivelRioM == null || cotaTransbordamentoM == null) return BAIXO
  const falta = faltaParaTransbordar(nivelRioM, cotaTransbordamentoM)
  const l = LIMIARES_RISCO.faltaTransbordarM
  if (falta < 0) return CRITICO // transbordou
  if (falta <= l.alto) return ALTO // cota de alerta
  if (falta <= l.moderado) return MODERADO // cota de atenção
  return BAIXO
}

function riscoPorCalor(sensacaoC) {
  if (sensacaoC == null) return BAIXO
  const l = LIMIARES_RISCO.sensacaoTermicaC
  if (sensacaoC >= l.critico) return CRITICO
  if (sensacaoC >= l.alto) return ALTO
  if (sensacaoC >= l.moderado) return MODERADO
  return BAIXO
}

// Duração = previsão − início; se a previsão já passou e a interrupção continua, vale o tempo desde o início
export function duracaoInterrupcaoHoras({ inicio, previsaoNormalizacao }, agora = new Date()) {
  const fim = previsaoNormalizacao && previsaoNormalizacao > agora ? previsaoNormalizacao : agora
  return (fim - inicio) / HORA
}

function riscoPorInterrupcao(medicoes, agora) {
  if (medicoes.situacao === SITUACOES_INTERRUPCAO.NORMALIZADO) return BAIXO
  if (medicoes.atingeServicoCritico) return CRITICO // hospital, escola ou abastecimento crítico

  const horas = duracaoInterrupcaoHoras(medicoes, agora)
  const pessoas = medicoes.pessoasAfetadas ?? 0
  const d = LIMIARES_RISCO.duracaoHoras
  const p = LIMIARES_RISCO.pessoasAfetadas

  const porDuracao = horas > d.alto ? ALTO : horas >= d.moderado ? MODERADO : BAIXO
  const porPessoas = pessoas > p.alto ? ALTO : pessoas >= p.moderado ? MODERADO : BAIXO
  return maiorRisco([porDuracao, porPessoas])
}

export function classificarRisco(tipo, medicoes = {}, agora = new Date()) {
  switch (tipo) {
    case TIPOS.ALAGAMENTO:
      return maiorRisco([
        riscoPorChuva(medicoes.chuvaMmH),
        riscoPorLamina(medicoes.laminaCm),
        riscoPorNivelRio(medicoes.nivelRioM, medicoes.cotaTransbordamentoM),
      ])
    case TIPOS.ILHA_DE_CALOR:
      return riscoPorCalor(medicoes.sensacaoTermicaC)
    case TIPOS.INTERRUPCAO:
      return riscoPorInterrupcao(medicoes, agora)
    default:
      throw new Error(`Tipo de risco desconhecido: ${tipo}`)
  }
}
