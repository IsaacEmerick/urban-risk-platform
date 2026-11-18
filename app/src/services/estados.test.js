import { describe, expect, it } from 'vitest'
import { EFEITOS, agenteConfirma, agenteEncerra, agenteRejeita, avaliar, notificacaoEnviada } from './estados.js'
import { HORA, MINUTO } from './parametros.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')
const antes = (ms) => new Date(AGORA.getTime() - ms)

// Evento já consolidado (risco e confiança calculados)
function evento(estado, extras = {}) {
  return {
    id: 'e1',
    estado,
    risco: 'Moderado',
    confianca: 60,
    naoConfirmado: false,
    riscoAlertado: null,
    riscoBaixoDesde: null,
    criadoEm: AGORA,
    historico: [{ estado, em: AGORA }],
    dados: [{ confirmacoes: 0 }],
    ...extras,
  }
}
const estadosPercorridos = (r) => r.evento.historico.map((h) => h.estado)

describe('Reportado (RN01, RN02, RN03)', () => {
  it('confiança 75 → Confirmado (risco Moderado segue para Em monitoramento)', () => {
    const r = avaliar(evento('Reportado', { confianca: 75 }), AGORA)
    expect(estadosPercorridos(r)).toEqual(['Reportado', 'Confirmado', 'Em monitoramento'])
    expect(r.efeitos).toEqual([])
  })

  it('RN01: confiança 75 e risco Alto → Confirmado → Alerta emitido, com notificação', () => {
    const r = avaliar(evento('Reportado', { confianca: 75, risco: 'Alto' }), AGORA)
    expect(r.evento.estado).toBe('Alerta emitido')
    expect(r.evento.riscoAlertado).toBe('Alto')
    expect(r.efeitos).toEqual([EFEITOS.NOTIFICAR_USUARIOS])
  })

  it('RN01: risco Alto com confiança 74 NÃO emite alerta automático → Em validação', () => {
    const r = avaliar(evento('Reportado', { confianca: 74, risco: 'Alto' }), AGORA)
    expect(r.evento.estado).toBe('Em validação')
    expect(r.efeitos).toEqual([])
  })

  it('RN02: confiança 50 → Em validação; 49 → continua Reportado', () => {
    expect(avaliar(evento('Reportado', { confianca: 50 }), AGORA).evento.estado).toBe('Em validação')
    expect(avaliar(evento('Reportado', { confianca: 49 }), AGORA).evento.estado).toBe('Reportado')
  })

  it('RN03: confiança < 50 e sem confirmação em 2 h → Descartado (1 h 59 min ainda não)', () => {
    const quase = evento('Reportado', { confianca: 40, criadoEm: antes(2 * HORA - MINUTO) })
    expect(avaliar(quase, AGORA).evento.estado).toBe('Reportado')
    const vencido = evento('Reportado', { confianca: 40, criadoEm: antes(2 * HORA) })
    expect(avaliar(vencido, AGORA).evento.estado).toBe('Descartado')
  })

  it('RN03: com alguma confirmação não é descartado em 2 h', () => {
    const e = evento('Reportado', { confianca: 40, criadoEm: antes(3 * HORA), dados: [{ confirmacoes: 1 }] })
    expect(avaliar(e, AGORA).evento.estado).toBe('Reportado')
  })
})

describe('Em validação (RN02)', () => {
  it('fica aguardando o agente com confiança Média e risco abaixo de Crítico', () => {
    const r = avaliar(evento('Em validação', { risco: 'Alto' }), AGORA)
    expect(r.evento.estado).toBe('Em validação')
  })

  it('se a confiança subir para 75 → Confirmado', () => {
    const r = avaliar(evento('Em validação', { confianca: 75, risco: 'Alto' }), AGORA)
    expect(estadosPercorridos(r)).toEqual(['Em validação', 'Confirmado', 'Alerta emitido'])
  })

  it('Crítico → alerta preliminar marcado como "não confirmado"', () => {
    const r = avaliar(evento('Em validação', { risco: 'Crítico' }), AGORA)
    expect(r.evento.estado).toBe('Alerta emitido')
    expect(r.evento.naoConfirmado).toBe(true)
    expect(r.efeitos).toEqual([EFEITOS.ALERTA_PRELIMINAR])
  })

  it('agente confirma → Confirmado (e segue as guardas: Alto → Alerta emitido)', () => {
    const r = agenteConfirma(evento('Em validação', { risco: 'Alto' }), AGORA)
    expect(estadosPercorridos(r)).toEqual(['Em validação', 'Confirmado', 'Alerta emitido'])
    expect(r.efeitos).toEqual([EFEITOS.NOTIFICAR_USUARIOS])
  })

  it('agente descarta → Descartado, sem aviso de cancelamento (não houve alerta)', () => {
    const r = agenteRejeita(evento('Em validação'), AGORA)
    expect(r.evento.estado).toBe('Descartado')
    expect(r.efeitos).toEqual([])
  })
})

describe('Confirmado', () => {
  it('risco < Alto → Em monitoramento', () => {
    expect(avaliar(evento('Confirmado', { confianca: 90 }), AGORA).evento.estado).toBe('Em monitoramento')
  })
  it('risco ≥ Alto → Alerta emitido', () => {
    expect(avaliar(evento('Confirmado', { confianca: 90, risco: 'Crítico' }), AGORA).evento.estado).toBe('Alerta emitido')
  })
})

describe('Alerta emitido', () => {
  it('espera a notificação; notificacaoEnviada → Em monitoramento', () => {
    const e = evento('Alerta emitido', { risco: 'Alto', confianca: 90 })
    expect(avaliar(e, AGORA).evento.estado).toBe('Alerta emitido')
    expect(notificacaoEnviada(e, AGORA).evento.estado).toBe('Em monitoramento')
  })

  it('agente cancela o alerta → Descartado, com notificação "Alerta cancelado"', () => {
    const e = evento('Alerta emitido', { historico: [{ estado: 'Alerta emitido', em: AGORA }] })
    const r = agenteRejeita(e, AGORA)
    expect(r.evento.estado).toBe('Descartado')
    expect(r.efeitos).toEqual([EFEITOS.NOTIFICAR_CANCELAMENTO])
  })
})

describe('Em monitoramento', () => {
  const comAlerta = { historico: [{ estado: 'Alerta emitido', em: AGORA }, { estado: 'Em monitoramento', em: AGORA }] }

  it('escalada de um evento que nunca alertou → Alerta emitido com notificarUsuarios (primeiro alerta)', () => {
    const r = avaliar(evento('Em monitoramento', { risco: 'Alto', confianca: 90 }), AGORA)
    expect(r.evento.estado).toBe('Alerta emitido')
    expect(r.evento.riscoAlertado).toBe('Alto')
    expect(r.efeitos).toEqual([EFEITOS.NOTIFICAR_USUARIOS])
  })

  it('RN01: depois de confirmado, a escalada alerta sem nova checagem de confiança (confiança 60)', () => {
    // ex.: confirmado pelo agente com confiança Média e risco Moderado; depois o risco sobe para Alto
    const r = avaliar(evento('Em monitoramento', { risco: 'Alto', confianca: 60 }), AGORA)
    expect(r.evento.estado).toBe('Alerta emitido')
    expect(r.efeitos).toEqual([EFEITOS.NOTIFICAR_USUARIOS])
  })

  it('escalada de Alto para Crítico depois de um alerta Alto → reenviarAlerta (mesmo com confiança 55)', () => {
    const r = avaliar(evento('Em monitoramento', { risco: 'Crítico', confianca: 55, riscoAlertado: 'Alto' }), AGORA)
    expect(r.evento.estado).toBe('Alerta emitido')
    expect(r.efeitos).toEqual([EFEITOS.REENVIAR_ALERTA])
  })

  it('mesmo risco do último alerta não reenvia', () => {
    const r = avaliar(evento('Em monitoramento', { risco: 'Alto', confianca: 90, riscoAlertado: 'Alto' }), AGORA)
    expect(r.evento.estado).toBe('Em monitoramento')
  })

  it('subir de Baixo para Moderado não é escalada (não chega a Alto)', () => {
    const r = avaliar(evento('Em monitoramento', { risco: 'Moderado', confianca: 90 }), AGORA)
    expect(r.evento.estado).toBe('Em monitoramento')
  })

  it('RN05: risco Baixo por 30 min → Encerrado; 29 min ainda não', () => {
    const quase = evento('Em monitoramento', { risco: 'Baixo', riscoBaixoDesde: antes(29 * MINUTO) })
    expect(avaliar(quase, AGORA).evento.estado).toBe('Em monitoramento')
    const vencido = evento('Em monitoramento', { risco: 'Baixo', riscoBaixoDesde: antes(30 * MINUTO) })
    expect(avaliar(vencido, AGORA).evento.estado).toBe('Encerrado')
  })

  it('RN05: começa a contar quando o risco fica Baixo e zera quando sobe', () => {
    const r = avaliar(evento('Em monitoramento', { risco: 'Baixo' }), AGORA)
    expect(r.evento.riscoBaixoDesde).toEqual(AGORA)
    const subiu = avaliar({ ...r.evento, risco: 'Moderado' }, AGORA)
    expect(subiu.evento.riscoBaixoDesde).toBeNull()
  })

  it('agente encerra → Encerrado', () => {
    expect(agenteEncerra(evento('Em monitoramento'), AGORA).evento.estado).toBe('Encerrado')
  })

  it('"Confirmar alerta" tira a marca "não confirmado" sem mudar o estado (transição interna)', () => {
    const r = agenteConfirma(evento('Em monitoramento', { naoConfirmado: true, ...comAlerta }), AGORA)
    expect(r.evento.estado).toBe('Em monitoramento')
    expect(r.evento.naoConfirmado).toBe(false)
    expect(r.efeitos).toEqual([EFEITOS.ATUALIZAR_ALERTA])
  })

  it('cancelar alerta → Descartado com "Alerta cancelado" se houve alerta; sem aviso se não houve', () => {
    expect(agenteRejeita(evento('Em monitoramento', comAlerta), AGORA).efeitos).toEqual([EFEITOS.NOTIFICAR_CANCELAMENTO])
    expect(agenteRejeita(evento('Em monitoramento'), AGORA).efeitos).toEqual([])
  })
})

describe('ações inválidas', () => {
  it('lançam erro fora dos estados permitidos pelo diagrama', () => {
    expect(() => agenteConfirma(evento('Reportado'), AGORA)).toThrow()
    expect(() => agenteConfirma(evento('Em monitoramento'), AGORA)).toThrow() // sem marca "não confirmado"
    expect(() => agenteRejeita(evento('Reportado'), AGORA)).toThrow()
    expect(() => agenteRejeita(evento('Encerrado'), AGORA)).toThrow()
    expect(() => agenteEncerra(evento('Alerta emitido'), AGORA)).toThrow()
    expect(() => notificacaoEnviada(evento('Em monitoramento'), AGORA)).toThrow()
  })

  it('Encerrado e Descartado são finais', () => {
    expect(avaliar(evento('Encerrado', { risco: 'Crítico', confianca: 100 }), AGORA).evento.estado).toBe('Encerrado')
    expect(avaliar(evento('Descartado', { risco: 'Crítico', confianca: 100 }), AGORA).evento.estado).toBe('Descartado')
  })
})
