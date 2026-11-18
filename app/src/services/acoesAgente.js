// Botões do agente no Detalhe do alerta (RF12) — um botão para cada transição do agente no
// Diagrama de Estados que não fica na Fila de validação. Confirmar e Descartar da fila ficam lá.
import { PERFIS } from '../navegacao.js'
import { ESTADOS } from './parametros.js'
import { passouPorAlerta } from './eventos.js'

export const ACOES = {
  confirmarAlerta: {
    id: 'confirmarAlerta',
    rotulo: 'Confirmar alerta',
    acao: 'agenteConfirma', // tira a marca "não confirmado" (RN02)
    confirmacao: null,
  },
  encerrar: {
    id: 'encerrar',
    rotulo: 'Encerrar',
    acao: 'agenteEncerra', // RN05, por ação do agente
    confirmacao: 'Encerrar o evento? Ele sai do painel e não gera novos alertas.',
  },
  cancelarAlerta: {
    id: 'cancelarAlerta',
    rotulo: 'Cancelar alerta',
    acao: 'agenteRejeita', // → Descartado, com notificação "Alerta cancelado"
    confirmacao: 'Cancelar o alerta? Quem recebeu será avisado com "Alerta cancelado".',
  },
  descartarEvento: {
    id: 'descartarEvento',
    rotulo: 'Descartar evento',
    acao: 'agenteRejeita', // → Descartado; ninguém foi alertado, então não há notificação
    confirmacao: 'Descartar o evento? Ninguém foi alertado, então nenhuma notificação será enviada.',
  },
}

// Quais botões aparecem para este evento e este perfil
export function acoesDisponiveis(evento, perfil) {
  if (perfil !== PERFIS.AGENTE) return []
  // Se já houve alerta, rejeitar = "Cancelar alerta"; se nunca alertou, = "Descartar evento"
  const rejeitar = passouPorAlerta(evento) ? ACOES.cancelarAlerta : ACOES.descartarEvento

  switch (evento.estado) {
    case ESTADOS.ALERTA_EMITIDO:
      return [ACOES.cancelarAlerta]
    case ESTADOS.EM_MONITORAMENTO:
      return [...(evento.naoConfirmado ? [ACOES.confirmarAlerta] : []), ACOES.encerrar, rejeitar]
    default:
      return [] // Em validação → Fila de validação; Reportado aguarda confiança; Encerrado e Descartado são finais
  }
}
