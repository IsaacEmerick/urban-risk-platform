// Fila de validação (RF12): os eventos simulados evt-09, evt-10 e evt-11, a ordem por
// prioridade e o desempate (Em validação há mais tempo primeiro, seção 4.3)
import { describe, expect, it } from 'vitest'
import { criarRepositorio } from './repositorio.js'
import { distanciaMetros } from './geo.js'
import { filaDeValidacao, ordenarPorPrioridade } from './eventos.js'
import { resumoConfianca } from './confianca.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')

describe('eventos da Fila de validação (dados simulados)', () => {
  const repo = criarRepositorio({ agora: AGORA })
  const evento = (id) => repo.obterEvento(id)

  it.each([
    ['evt-02', 65, 'Alto', 58.8, 'Comunidade 40 + 2 confirmações (20) + foto (5) = 65'],
    ['evt-09', 60, 'Alto', 45, 'Sensor 90 − falha do sensor (30) = 60'],
    ['evt-10', 60, 'Alto', 45, 'Comunidade 40 + 2 confirmações (20) = 60'],
    ['evt-11', 55, 'Baixo', 13.8, 'Comunidade 40 + 1 confirmação (10) + foto (5) = 55'],
  ])('%s: confiança %i, risco %s, prioridade %d', (id, confianca, risco, prioridade, resumo) => {
    const e = evento(id)
    expect(e).toMatchObject({ confianca, risco, prioridade, estado: 'Em validação' })
    expect(resumoConfianca(e.dados[0].confianca)).toBe(resumo)
  })

  it('evt-10 fica a mais de 500 m do sensor do rio: sem os +15 de corroboração', () => {
    const sensor = repo.obterSensor('sensor-cotia-01')
    expect(distanciaMetros(evento('evt-10'), sensor)).toBeGreaterThan(500)
    expect(evento('evt-10').dados[0].confianca.ajustes.map((a) => a.curto)).not.toContain('corroborado')
  })

  it('evt-09 fica a mais de 500 m do evt-05 (INMET): sem os +15, que o levariam a 75', () => {
    expect(distanciaMetros(evento('evt-09'), evento('evt-05'))).toBeGreaterThan(500)
  })

  it('evt-09, evt-10 e evt-11 ficam a mais de 300 m de qualquer outro evento atual do mesmo tipo (sem RN04)', () => {
    const atuais = repo.listarEventos().filter((e) => !e.id.startsWith('hist-'))
    ;['evt-09', 'evt-10', 'evt-11'].forEach((id) => {
      const novo = evento(id)
      atuais
        .filter((outro) => outro.id !== id && outro.tipo === novo.tipo)
        .forEach((outro) => expect(distanciaMetros(novo, outro), `${id} × ${outro.id}`).toBeGreaterThan(300))
    })
  })

  it('evt-11 fica a mais de 300 m da posição simulada da Ana (o registro da demonstração não se junta a ele)', async () => {
    const { POSICAO_ATUAL_SIMULADA } = await import('./registro.js')
    expect(distanciaMetros(evento('evt-11'), POSICAO_ATUAL_SIMULADA)).toBeGreaterThan(300)
  })
})

describe('ordem da Fila de validação', () => {
  it('ao carregar: evt-02 (58,8) → evt-10 e evt-09 empatados em 45,0 (evt-10 está Em validação há mais tempo) → evt-11 (13,8)', () => {
    const repo = criarRepositorio({ agora: AGORA })
    expect(filaDeValidacao(repo.listarEventos()).map((e) => e.id)).toEqual(['evt-02', 'evt-10', 'evt-09', 'evt-11'])
  })

  it('depois de a Ana confirmar o evt-02, ele sai da Fila: evt-10 → evt-09 → evt-11', () => {
    const repo = criarRepositorio({ agora: AGORA })
    repo.confirmarOcorrencia('evt-02', 'usr-ana', AGORA)
    expect(filaDeValidacao(repo.listarEventos()).map((e) => e.id)).toEqual(['evt-10', 'evt-09', 'evt-11'])
  })

  it('o desempate da Fila é pela entrada em Em validação, não pela atualização (Lista: o atualizado mais recente)', () => {
    const base = { estado: 'Em validação', prioridade: 45 }
    const antigo = { ...base, id: 'a', atualizadoEm: new Date(3000), historico: [{ estado: 'Em validação', em: new Date(1000) }] }
    const novo = { ...base, id: 'b', atualizadoEm: new Date(2000), historico: [{ estado: 'Em validação', em: new Date(2000) }] }
    expect(filaDeValidacao([novo, antigo]).map((e) => e.id)).toEqual(['a', 'b'])
    // Na Lista de alertas o mesmo empate vai para o atualizado mais recente
    expect(ordenarPorPrioridade([novo, antigo]).map((e) => e.id)).toEqual(['a', 'b'])
    const atualizadoAntes = { ...antigo, atualizadoEm: new Date(1500) }
    expect(ordenarPorPrioridade([atualizadoAntes, novo]).map((e) => e.id)).toEqual(['b', 'a'])
    expect(filaDeValidacao([atualizadoAntes, novo]).map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('só eventos Em validação entram na Fila', () => {
    const repo = criarRepositorio({ agora: AGORA })
    expect(filaDeValidacao(repo.listarEventos()).every((e) => e.estado === 'Em validação')).toBe(true)
  })
})

describe('ações do Carlos na Fila (verify)', () => {
  it('Confirmar o evt-10 → alerta emitido (Alto) com confiança 60; Descartar o evt-11 → Descartado, sem notificação', () => {
    const repo = criarRepositorio({ agora: AGORA })
    const evt10 = repo.executarAcao('evt-10', 'agenteConfirma', AGORA)
    expect(evt10).toMatchObject({ estado: 'Em monitoramento', riscoAlertado: 'Alto', confiancaAlertada: 60 })
    expect(repo.listarNotificacoes('usr-ana').filter((n) => n.eventoId === 'evt-10').map((n) => n.tipo)).toEqual(['Alerta'])

    const evt11 = repo.executarAcao('evt-11', 'agenteRejeita', AGORA)
    expect(evt11.estado).toBe('Descartado')
    const notificacoes11 = repo.listarUsuarios().flatMap((u) => repo.listarNotificacoes(u.id).filter((n) => n.eventoId === 'evt-11'))
    expect(notificacoes11).toEqual([])
  })
})
