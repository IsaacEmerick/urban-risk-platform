// Análises (RF14, RNF11): contagens por período, tipo e bairro, e as metas calculadas ao vivo
import { describe, expect, it } from 'vitest'
import bairros from '../data/bairros.json'
import { criarRepositorio } from './repositorio.js'
import { eventosNoPeriodo, formatarPercentual, resumoAnalises } from './analises.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')
const DIA = 24 * 60 * 60 * 1000

describe('eventosNoPeriodo', () => {
  it('7 dias ⊂ 30 dias; o histórico tem 20 eventos em 30 dias', () => {
    const eventos = criarRepositorio({ agora: AGORA }).listarEventos()
    const em30 = eventosNoPeriodo(eventos, AGORA, 30)
    const em7 = eventosNoPeriodo(eventos, AGORA, 7)
    expect(em30).toHaveLength(eventos.length)
    expect(em7.length).toBeLessThan(em30.length)
    em7.forEach((e) => expect(AGORA - e.criadoEm).toBeLessThanOrEqual(7 * DIA))
  })
})

describe('resumoAnalises', () => {
  it('as contagens por tipo e por bairro somam o total do período', () => {
    const eventos = criarRepositorio({ agora: AGORA }).listarEventos()
    ;[7, 30].forEach((dias) => {
      const r = resumoAnalises(eventos, { agora: AGORA, dias, bairros })
      expect(r.porTipo.reduce((s, c) => s + c.total, 0)).toBe(r.total)
      expect(r.porBairro.reduce((s, c) => s + c.total, 0)).toBe(r.total)
      expect(r.porTipo.map((c) => c.categoria)).toEqual(['Alagamento', 'Ilha de calor', 'Interrupção de serviço'])
    })
  })

  it('as metas mudam ao vivo com as ações: cancelar um alerta aumenta o falso alerta', () => {
    const repo = criarRepositorio({ agora: AGORA })
    const antes = resumoAnalises(repo.listarEventos(), { agora: AGORA, dias: 30, bairros })
    repo.executarAcao('evt-05', 'agenteRejeita', AGORA)
    const depois = resumoAnalises(repo.listarEventos(), { agora: AGORA, dias: 30, bairros })
    expect(depois.falsoAlerta.falsos).toBe(antes.falsoAlerta.falsos + 1)
    expect(depois.falsoAlerta.emitidos).toBe(antes.falsoAlerta.emitidos)
  })

  it('preliminares à parte: o evt-03 conta como preliminar e passa a "confirmado depois" quando o Carlos confirma', () => {
    const repo = criarRepositorio({ agora: AGORA })
    expect(resumoAnalises(repo.listarEventos(), { agora: AGORA, dias: 30, bairros }).preliminares).toEqual({ houve: 1, confirmadosDepois: 0 })
    repo.executarAcao('evt-03', 'agenteConfirma', AGORA)
    expect(resumoAnalises(repo.listarEventos(), { agora: AGORA, dias: 30, bairros }).preliminares).toEqual({ houve: 1, confirmadosDepois: 1 })
  })

  it('sem alertas no período, a meta fica "sem dados" (cumpre = null), e não 0%', () => {
    const r = resumoAnalises([], { agora: AGORA, dias: 7, bairros })
    expect(r.falsoAlerta.cumpre).toBeNull()
    expect(r.confiancaAlta.cumpre).toBeNull()
  })

  it('formatarPercentual', () => {
    expect(formatarPercentual(1 / 23)).toBe('4,3%')
    expect(formatarPercentual(0.9)).toBe('90,0%')
  })
})
