// Botões do agente (RF12) — um botão para cada transição do agente no Diagrama de Estados.
// Fila de validação: Confirmar e Descartar. Detalhe do alerta: Confirmar alerta, Encerrar,
// Cancelar alerta e Descartar evento. estilo = aparência do botão; perigo = "Sim" vermelho.
import { PERFIS } from '../navegacao.js'
import { ESTADOS } from './parametros.js'
import { passouPorAlerta } from './eventos.js'

export const ACOES = {
  confirmarAlerta: {
    id: 'confirmarAlerta',
    rotulo: 'Confirmar alerta',
    acao: 'agenteConfirma', // tira a marca "não confirmado" (RN02)
    confirmacao: null,
    estilo: 'primario',
  },
  encerrar: {
    id: 'encerrar',
    rotulo: 'Encerrar',
    acao: 'agenteEncerra', // RN05, por ação do agente
    confirmacao: 'Encerrar o evento? Ele sai do painel e não gera novos alertas.',
    estilo: 'secundario',
  },
  cancelarAlerta: {
    id: 'cancelarAlerta',
    rotulo: 'Cancelar alerta',
    acao: 'agenteRejeita', // → Descartado, com notificação "Alerta cancelado"
    confirmacao: 'Cancelar o alerta? Quem recebeu será avisado com "Alerta cancelado".',
    estilo: 'perigo-contorno',
    perigo: true,
  },
  descartarEvento: {
    id: 'descartarEvento',
    rotulo: 'Descartar evento',
    acao: 'agenteRejeita', // → Descartado; ninguém foi alertado, então não há notificação
    confirmacao: 'Descartar o evento? Ninguém foi alertado, então nenhuma notificação será enviada.',
    estilo: 'secundario',
  },
  // Fila de validação (eventos Em validação)
  confirmar: {
    id: 'confirmar',
    rotulo: 'Confirmar',
    acao: 'agenteConfirma', // Em validação → Confirmado; com risco ≥ Alto, sai o alerta (RN01)
    confirmacao: 'Confirmar o evento? Com risco Alto ou Crítico, sai um alerta para quem acompanha a região.',
    estilo: 'primario',
  },
  descartar: {
    id: 'descartar',
    rotulo: 'Descartar',
    acao: 'agenteRejeita', // Em validação → Descartado; ninguém foi alertado, sem notificação
    confirmacao: 'Descartar o evento? Ninguém foi alertado, então nenhuma notificação será enviada.',
    estilo: 'secundario',
  },
}

export const ACOES_FILA = [ACOES.confirmar, ACOES.descartar]

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
