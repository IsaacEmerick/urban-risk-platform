// Agrupamento de dados em eventos (RN04), consolidação (RN07) e falso alerta (RNF11)
import { ESTADOS, MINUTO, REGRAS } from './parametros.js'
import { distanciaMetros } from './geo.js'
import { calcularConfianca, faixaConfianca } from './confianca.js'
import { classificarRisco, maiorRisco } from './risco.js'
import { calcularPrioridade } from './prioridade.js'

export function eventoAtivo(evento) {
  return evento.estado !== ESTADOS.ENCERRADO && evento.estado !== ESTADOS.DESCARTADO
}

// RN04: dado do mesmo tipo a até 300 m e 60 min de algum dado de um evento ativo entra nesse evento.
// Devolve o evento encontrado ou null (null = criar evento novo).
export function agruparDado(dado, eventos) {
  return (
    eventos.find(
      (evento) =>
        eventoAtivo(evento) &&
        evento.tipo === dado.tipo &&
        evento.dados.some(
          (existente) =>
            distanciaMetros(dado, existente) <= REGRAS.agrupamentoRaioMetros &&
            Math.abs(dado.registradoEm - existente.registradoEm) <= REGRAS.agrupamentoJanelaMinutos * MINUTO,
        ),
    ) ?? null
  )
}

// Calcula confiança e risco de cada dado e aplica a RN07:
// risco e confiança do evento = maior valor entre os dados agrupados.
export function consolidarEvento(evento, { agora = new Date(), todosDados = evento.dados } = {}) {
  const dados = evento.dados.map((dado) => ({
    ...dado,
    confianca: calcularConfianca(dado, { agora, outrosDados: todosDados }),
    risco: classificarRisco(dado.tipo, dado.medicoes, agora),
  }))
  const confianca = Math.max(...dados.map((d) => d.confianca.valor))
  const risco = maiorRisco(dados.map((d) => d.risco))
  const atualizadoEm = new Date(Math.max(...dados.map((d) => d.atualizadoEm)))
  const consolidado = { ...evento, dados, confianca, faixaConfianca: faixaConfianca(confianca), risco, atualizadoEm }
  return { ...consolidado, prioridade: calcularPrioridade(consolidado) }
}

export function passouPorAlerta(evento) {
  return evento.historico.some((h) => h.estado === ESTADOS.ALERTA_EMITIDO)
}

// RNF11: falso alerta = eventos que passaram por Alerta emitido e foram para Descartado ÷ alertas emitidos
export function taxaFalsoAlerta(eventos) {
  const emitidos = eventos.filter(passouPorAlerta)
  const falsos = emitidos.filter((e) => e.estado === ESTADOS.DESCARTADO)
  return {
    emitidos: emitidos.length,
    falsos: falsos.length,
    taxa: emitidos.length ? falsos.length / emitidos.length : 0,
  }
}
