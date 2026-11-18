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

describe('metas do RNF11: sempre nos últimos 30 dias (janela móvel)', () => {
  it('as metas são as mesmas com o período dos gráficos em 7 ou em 30 dias', () => {
    const eventos = criarRepositorio({ agora: AGORA }).listarEventos()
    const em7 = resumoAnalises(eventos, { agora: AGORA, dias: 7, bairros })
    const em30 = resumoAnalises(eventos, { agora: AGORA, dias: 30, bairros })
    expect(em7.falsoAlerta).toEqual(em30.falsoAlerta)
    expect(em7.confiancaAlta).toEqual(em30.confiancaAlta)
    expect(em7.preliminares).toEqual(em30.preliminares)
    expect(em7.total).toBeLessThan(em30.total)
  })

  it('números ao carregar (os fonteId próprios do hist-04 e do hist-15 não mudam nada)', () => {
    const r = resumoAnalises(criarRepositorio({ agora: AGORA }).listarEventos(), { agora: AGORA, dias: 30, bairros })
    expect(r.falsoAlerta).toMatchObject({ falsos: 2, emitidos: 22, cumpre: true })
    expect(r.confiancaAlta).toMatchObject({ comConfiancaAlta: 21, alertas: 22, cumpre: true })
    expect(r.total).toBe(31)
    expect(r.porTipo.map((c) => c.total)).toEqual([20, 7, 4])
    expect(r.porBairro.map((c) => c.total)).toEqual([16, 15])
  })

  it('hist-05 (7 dias + 3 h) fica fora da janela de 7 dias: o gráfico não muda segundos depois de abrir', () => {
    const eventos = criarRepositorio({ agora: AGORA }).listarEventos()
    const agoraMesmo = resumoAnalises(eventos, { agora: AGORA, dias: 7, bairros })
    const umMinutoDepois = resumoAnalises(eventos, { agora: new Date(AGORA.getTime() + 60_000), dias: 7, bairros })
    expect(umMinutoDepois.porTipo).toEqual(agoraMesmo.porTipo)
    expect(agoraMesmo.total).toBe(15)
  })

  it('fluxo do vídeo: Ana confirma evt-02 → Carlos confirma evt-10 → descarta evt-11 → alerta do rio', async () => {
    const { criarLeitura } = await import('./simulador.js')
    const repo = criarRepositorio({ agora: AGORA })
    const metas = () => {
      const r = resumoAnalises(repo.listarEventos(), { agora: AGORA, dias: 30, bairros })
      return [r.falsoAlerta.falsos, r.falsoAlerta.emitidos, r.confiancaAlta.comConfiancaAlta, r.confiancaAlta.alertas]
    }
    expect(metas()).toEqual([2, 22, 21, 22])
    repo.confirmarOcorrencia('evt-02', 'usr-ana', AGORA)
    expect(metas()).toEqual([2, 23, 22, 23])
    repo.executarAcao('evt-10', 'agenteConfirma', AGORA)
    expect(metas()).toEqual([2, 24, 22, 24])
    repo.executarAcao('evt-11', 'agenteRejeita', AGORA) // nunca alertou: não conta como falso alerta
    expect(metas()).toEqual([2, 24, 22, 24])
    // rio na cota de alerta (falta 0,50 m): evt-01 vira Alto e alerta com a confiança do sensor (90)
    repo.receberDado(criarLeitura(repo.obterSensor('sensor-cotia-01'), 3.7, AGORA), AGORA)
    expect(repo.obterEvento('evt-01')).toMatchObject({ riscoAlertado: 'Alto', confiancaAlertada: 90 })
    expect(metas()).toEqual([2, 25, 23, 25])
  })
})
