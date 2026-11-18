// Reavaliação pelo tempo (RN03, RN05): reavaliarPorTempo() é pura e o simulador a chama a cada tique
import { afterEach, describe, expect, it, vi } from 'vitest'
import bairros from '../data/bairros.json'
import { reavaliarPorTempo } from './estados.js'
import { criarRepositorio } from './repositorio.js'
import { iniciarSimulador } from './simulador.js'
import { atualizarSituacao, criarDadoStatus } from './status.js'
import { HORA, MINUTO } from './parametros.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')
const depois = (ms) => new Date(AGORA.getTime() + ms)

function evento(estado, extras = {}) {
  return {
    id: 'e1',
    estado,
    risco: 'Baixo',
    confianca: 40,
    naoConfirmado: false,
    riscoAlertado: null,
    riscoBaixoDesde: null,
    criadoEm: AGORA,
    historico: [{ estado, em: AGORA }],
    dados: [{ confirmacoes: 0 }],
    ...extras,
  }
}

describe('reavaliarPorTempo — fronteiras', () => {
  it('RN03: Reportado sem confirmação continua com 2 h − 1 ms e é descartado com 2 h exatas', () => {
    expect(reavaliarPorTempo(evento('Reportado'), depois(2 * HORA - 1)).evento.estado).toBe('Reportado')
    const r = reavaliarPorTempo(evento('Reportado'), depois(2 * HORA))
    expect(r.evento.estado).toBe('Descartado')
    expect(r.efeitos).toEqual([]) // ninguém foi alertado: sem notificação
  })

  it('RN03: com uma confirmação de morador, não é descartado', () => {
    const e = evento('Reportado', { dados: [{ confirmacoes: 1 }] })
    expect(reavaliarPorTempo(e, depois(3 * HORA)).evento.estado).toBe('Reportado')
  })

  it('RN05: risco Baixo há 30 min − 1 ms continua; com 30 min exatos é encerrado', () => {
    const e = evento('Em monitoramento', { riscoBaixoDesde: AGORA })
    expect(reavaliarPorTempo(e, depois(30 * MINUTO - 1)).evento.estado).toBe('Em monitoramento')
    expect(reavaliarPorTempo(e, depois(30 * MINUTO)).evento.estado).toBe('Encerrado')
  })

  it('RN05: se o risco deixou de ser Baixo, a contagem recomeça', () => {
    const e = evento('Em monitoramento', { risco: 'Moderado', riscoBaixoDesde: AGORA })
    const r = reavaliarPorTempo(e, depois(HORA))
    expect(r.evento).toMatchObject({ estado: 'Em monitoramento', riscoBaixoDesde: null })
  })

  it('Encerrado e Descartado ficam como estão', () => {
    ;['Encerrado', 'Descartado'].forEach((estado) => {
      const e = evento(estado)
      expect(reavaliarPorTempo(e, depois(10 * HORA))).toEqual({ evento: e, efeitos: [] })
    })
  })
})

describe('reavaliação pelo tempo no repositório', () => {
  it('ao carregar, nenhum evento simulado muda de estado e nenhuma notificação nova sai', () => {
    const r = criarRepositorio({ agora: AGORA })
    const estados = r.listarEventos().map((e) => [e.id, e.estado])
    const notificacoes = r.listarUsuarios().flatMap((u) => r.listarNotificacoes(u.id)).length
    r.reavaliarTodosPorTempo(AGORA)
    expect(r.listarEventos().map((e) => [e.id, e.estado])).toEqual(estados)
    expect(r.listarUsuarios().flatMap((u) => r.listarNotificacoes(u.id))).toHaveLength(notificacoes)
  })

  it('status Normalizado: o evento é encerrado 30 min depois sem dado novo (RF18, RN05)', () => {
    const r = criarRepositorio({ agora: AGORA })
    const juliana = r.obterUsuario('usr-juliana')
    const dado = criarDadoStatus({
      servico: 'Energia elétrica',
      area: { tipo: 'bairro', bairro: 'Jardim Maria Helena' },
      situacao: 'Em atendimento',
      inicio: new Date(AGORA.getTime() - HORA),
      previsao: depois(HORA),
      pessoasAfetadas: '1500',
      atingeServicoCritico: false,
      usuario: juliana,
      bairros,
      agora: AGORA,
    })
    const { id } = r.publicarStatus(dado, AGORA)
    r.publicarStatus(atualizarSituacao(dado, 'Normalizado', AGORA), AGORA)
    r.reavaliarTodosPorTempo(depois(30 * MINUTO - 1))
    expect(r.obterEvento(id).estado).toBe('Em monitoramento')
    r.reavaliarTodosPorTempo(depois(30 * MINUTO))
    expect(r.obterEvento(id).estado).toBe('Encerrado')
  })
})

describe('simulador chama a reavaliação a cada tique', () => {
  afterEach(() => vi.useRealTimers())

  it('evt-04 (Reportado, 40, sem confirmação, criado há 20 min) é descartado quando completa 2 h', () => {
    vi.useFakeTimers()
    vi.setSystemTime(AGORA)
    const r = criarRepositorio({ agora: new Date() })
    const parar = iniciarSimulador({ repositorio: r, aleatorio: () => 0.5 })
    vi.advanceTimersByTime(99 * MINUTO) // 1 h 59 min de vida
    expect(r.obterEvento('evt-04').estado).toBe('Reportado')
    vi.advanceTimersByTime(MINUTO) // 2 h
    expect(r.obterEvento('evt-04').estado).toBe('Descartado')
    parar()
  })
})
