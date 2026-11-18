// Ciclo de vida do evento — mesmas transições de docs/diagramas/estados.puml (RN01, RN02, RN03, RN05).
// As funções são puras: recebem o evento (já consolidado, com risco e confiança) e devolvem
// { evento, efeitos }. Os efeitos dizem o que o sistema deve fazer depois (notificar, cancelar...).
import { ESTADOS, FAIXAS_CONFIANCA, HORA, MINUTO, REGRAS } from './parametros.js'
import { compararRisco } from './risco.js'
import { passouPorAlerta } from './eventos.js'

export const EFEITOS = {
  NOTIFICAR_USUARIOS: 'notificarUsuarios',
  ALERTA_PRELIMINAR: 'emitirAlertaPreliminar',
  REENVIAR_ALERTA: 'reenviarAlerta',
  ATUALIZAR_ALERTA: 'atualizarAlerta',
  NOTIFICAR_CANCELAMENTO: 'notificarCancelamento',
}

// Efeitos que disparam o envio de alerta aos usuários (RN06)
export const EFEITOS_DE_ALERTA = [EFEITOS.NOTIFICAR_USUARIOS, EFEITOS.ALERTA_PRELIMINAR, EFEITOS.REENVIAR_ALERTA]

const riscoAltoOuMais = (risco) => compararRisco(risco, 'Alto') >= 0

function irPara(evento, estado, agora, extras = {}) {
  return { ...evento, ...extras, estado, historico: [...evento.historico, { estado, em: agora }] }
}

function totalConfirmacoes(evento) {
  return evento.dados.reduce((total, d) => total + (d.confirmacoes ?? 0), 0)
}

// Um passo de transição automática (guardas do diagrama). Devolve null se nada muda.
function passoAutomatico(evento, agora) {
  const { confianca, risco } = evento
  switch (evento.estado) {
    case ESTADOS.REPORTADO:
      // RN01: confiança ≥ 75 → Confirmado
      if (confianca >= FAIXAS_CONFIANCA.alta) return { evento: irPara(evento, ESTADOS.CONFIRMADO, agora) }
      // RN02: confiança 50–74 → Em validação (fila do agente)
      if (confianca >= FAIXAS_CONFIANCA.media) return { evento: irPara(evento, ESTADOS.EM_VALIDACAO, agora) }
      // RN03: confiança < 50 e nenhuma confirmação em 2 h → Descartado
      if (totalConfirmacoes(evento) === 0 && agora - evento.criadoEm >= REGRAS.descarteSemConfirmacaoHoras * HORA) {
        return { evento: irPara(evento, ESTADOS.DESCARTADO, agora) }
      }
      return null

    case ESTADOS.EM_VALIDACAO:
      if (confianca >= FAIXAS_CONFIANCA.alta) return { evento: irPara(evento, ESTADOS.CONFIRMADO, agora) }
      // RN02: Crítico com confiança Média → alerta preliminar "não confirmado"
      if (risco === 'Crítico') {
        return {
          evento: irPara(evento, ESTADOS.ALERTA_EMITIDO, agora, { naoConfirmado: true, riscoAlertado: risco }),
          efeito: EFEITOS.ALERTA_PRELIMINAR,
        }
      }
      return null

    case ESTADOS.CONFIRMADO:
      // Alerta só com risco ≥ Alto
      if (riscoAltoOuMais(risco)) {
        return {
          evento: irPara(evento, ESTADOS.ALERTA_EMITIDO, agora, { riscoAlertado: risco }),
          efeito: EFEITOS.NOTIFICAR_USUARIOS,
        }
      }
      return { evento: irPara(evento, ESTADOS.EM_MONITORAMENTO, agora) }

    case ESTADOS.EM_MONITORAMENTO:
      // riscoEscalou: o risco subiu em relação ao último alerta e chegou a Alto ou mais.
      // RN01: o evento já foi confirmado, então a escalada alerta sem nova checagem de confiança.
      if (riscoAltoOuMais(risco) && (!evento.riscoAlertado || compararRisco(risco, evento.riscoAlertado) > 0)) {
        return {
          evento: irPara(evento, ESTADOS.ALERTA_EMITIDO, agora, { riscoAlertado: risco }),
          // Nunca alertou → primeiro alerta (notificarUsuarios); já alertou → reenviarAlerta
          efeito: evento.riscoAlertado ? EFEITOS.REENVIAR_ALERTA : EFEITOS.NOTIFICAR_USUARIOS,
        }
      }
      // RN05: risco Baixo por 30 min seguidos → Encerrado
      if (evento.riscoBaixoDesde && agora - evento.riscoBaixoDesde >= REGRAS.encerramentoRiscoBaixoMinutos * MINUTO) {
        return { evento: irPara(evento, ESTADOS.ENCERRADO, agora) }
      }
      return null

    default:
      return null // Alerta emitido espera notificacaoEnviada; Encerrado e Descartado são finais
  }
}

// Marca desde quando o risco está Baixo (usado pela RN05)
function atualizarRiscoBaixoDesde(evento, agora) {
  if (evento.risco !== 'Baixo') return { ...evento, riscoBaixoDesde: null }
  return { ...evento, riscoBaixoDesde: evento.riscoBaixoDesde ?? agora }
}

// Aplica as transições automáticas até o estado parar de mudar
export function avaliar(evento, agora = new Date()) {
  let atual = atualizarRiscoBaixoDesde(evento, agora)
  const efeitos = []
  let passo = passoAutomatico(atual, agora)
  while (passo) {
    atual = passo.evento
    if (passo.efeito) efeitos.push(passo.efeito)
    passo = passoAutomatico(atual, agora)
  }
  return { evento: atual, efeitos }
}

function acaoInvalida(acao, evento) {
  return new Error(`Ação "${acao}" não é permitida no estado ${evento.estado}`)
}

// Agente confirma: na Fila de validação (Em validação → Confirmado) ou, no Detalhe do alerta,
// o botão "Confirmar alerta" tira a marca "não confirmado" (transição interna em Em monitoramento).
export function agenteConfirma(evento, agora = new Date()) {
  if (evento.estado === ESTADOS.EM_VALIDACAO) {
    return avaliar(irPara(evento, ESTADOS.CONFIRMADO, agora), agora)
  }
  if (evento.estado === ESTADOS.EM_MONITORAMENTO && evento.naoConfirmado) {
    return { evento: { ...evento, naoConfirmado: false }, efeitos: [EFEITOS.ATUALIZAR_ALERTA] }
  }
  throw acaoInvalida('agenteConfirma', evento)
}

// Agente descarta (Fila de validação) ou cancela o alerta (Detalhe do alerta)
export function agenteRejeita(evento, agora = new Date()) {
  const permitidos = [ESTADOS.EM_VALIDACAO, ESTADOS.ALERTA_EMITIDO, ESTADOS.EM_MONITORAMENTO]
  if (!permitidos.includes(evento.estado)) throw acaoInvalida('agenteRejeita', evento)
  // Se houve alerta, quem recebeu é avisado com "Alerta cancelado" (RF10, RF12)
  const efeitos = passouPorAlerta(evento) ? [EFEITOS.NOTIFICAR_CANCELAMENTO] : []
  return { evento: irPara(evento, ESTADOS.DESCARTADO, agora), efeitos }
}

// Agente encerra (Detalhe do alerta) — RN05
export function agenteEncerra(evento, agora = new Date()) {
  if (evento.estado !== ESTADOS.EM_MONITORAMENTO) throw acaoInvalida('agenteEncerra', evento)
  return { evento: irPara(evento, ESTADOS.ENCERRADO, agora), efeitos: [] }
}

// Serviço de Notificação avisa que enviou: Alerta emitido → Em monitoramento
export function notificacaoEnviada(evento, agora = new Date()) {
  if (evento.estado !== ESTADOS.ALERTA_EMITIDO) throw acaoInvalida('notificacaoEnviada', evento)
  return { evento: irPara(evento, ESTADOS.EM_MONITORAMENTO, agora), efeitos: [] }
}
