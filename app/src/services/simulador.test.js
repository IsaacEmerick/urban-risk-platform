import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarRepositorio } from './repositorio.js'
import { emModoDemonstracao, iniciarSimulador, intervaloDoSimulador, proximoNivel } from './simulador.js'

describe('proximoNivel', () => {
  it('sobe 5 cm por leitura (sem oscilação)', () => {
    expect(proximoNivel(3.3, 4.2, () => 0.5)).toBe(3.35)
  })
  it('oscila no máximo ±1 cm', () => {
    expect(proximoNivel(3.3, 4.2, () => 0)).toBe(3.34)
    expect(proximoNivel(3.3, 4.2, () => 1)).toBe(3.36)
  })
  it('depois de transbordar não passa de 15 cm acima da margem', () => {
    expect(proximoNivel(4.35, 4.2, () => 1)).toBe(4.35)
    expect(proximoNivel(4.35, 4.2, () => 0)).toBeLessThan(4.35)
  })
})

describe('simulador do sensor do rio Cotia (a cada 15 s)', () => {
  let repo
  let parar

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-17T18:00:00-03:00'))
    repo = criarRepositorio({ agora: new Date() })
    // sem oscilação: +5 cm exatos por leitura, a partir de 3,30 m (cota 4,20 m)
    parar = iniciarSimulador({ repositorio: repo, aleatorio: () => 0.5 })
  })

  afterEach(() => {
    parar()
    vi.useRealTimers()
  })

  const evt01 = () => repo.obterEvento('evt-01')
  const alertasDaAna = () => repo.listarNotificacoes('usr-ana').filter((n) => n.eventoId === 'evt-01')

  it('gera uma leitura a cada 15 s e atualiza o mesmo evento (RN04)', () => {
    vi.advanceTimersByTime(14999)
    expect(repo.obterSensor('sensor-cotia-01').leituras).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(repo.obterSensor('sensor-cotia-01').leituras).toHaveLength(1)
    vi.advanceTimersByTime(15000)
    const leituras = repo.obterSensor('sensor-cotia-01').leituras
    expect(leituras.map((l) => l.nivelRioM)).toEqual([3.35, 3.4])
    // a leitura nova substitui a anterior do mesmo sensor dentro do evento
    expect(evt01().dados).toHaveLength(1)
    expect(evt01().dados[0].medicoes.nivelRioM).toBe(3.4)
    expect(repo.listarEventos()).toHaveLength(28) // 8 atuais + 20 históricos: nenhum evento novo
  })

  it('alerta antecipado: na cota de alerta (falta 0,50 m) o risco vira Alto e a Ana é notificada', () => {
    vi.advanceTimersByTime(7 * 15000) // 3,65 m → faltam 0,55 m
    expect(evt01().risco).toBe('Moderado')
    expect(alertasDaAna()).toHaveLength(0)

    vi.advanceTimersByTime(15000) // 3,70 m → faltam 0,50 m
    expect(evt01().risco).toBe('Alto')
    expect(evt01().estado).toBe('Em monitoramento') // passou por Alerta emitido
    expect(evt01().historico.map((h) => h.estado)).toContain('Alerta emitido')
    expect(alertasDaAna()).toHaveLength(1)
    expect(alertasDaAna()[0]).toMatchObject({ tipo: 'Alerta', risco: 'Alto' })
    expect(evt01().confiancaAlertada).toBe(90) // confiança do sensor no momento da escalada
  })

  it('ao transbordar escala para Crítico e renotifica (escalada, RN06)', () => {
    vi.advanceTimersByTime(18 * 15000) // 4,20 m → faltam 0 m: ainda Alto
    expect(evt01().risco).toBe('Alto')
    vi.advanceTimersByTime(15000) // 4,25 m → transbordou
    expect(evt01().risco).toBe('Crítico')
    expect(alertasDaAna().map((n) => n.risco)).toEqual(['Alto', 'Crítico'])
  })

  it('a confiança do evento é a do sensor atualizado (90, Alta)', () => {
    vi.advanceTimersByTime(15000)
    expect(evt01().confianca).toBe(90)
    expect(evt01().faixaConfianca).toBe('Alta')
  })
})

describe('modo demonstração (?demo=1)', () => {
  it('lê o parâmetro da URL', () => {
    expect(emModoDemonstracao('?demo=1')).toBe(true)
    expect(emModoDemonstracao('?demo=0')).toBe(false)
    expect(emModoDemonstracao('')).toBe(false)
  })
  it('intervalo de 2 s na demonstração e 15 s no normal', () => {
    expect(intervaloDoSimulador(true)).toBe(2000)
    expect(intervaloDoSimulador(false)).toBe(15000)
  })
  it('na demonstração, o alerta Alto chega em ~16 s e o Crítico em ~38 s', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-17T18:00:00-03:00'))
    const repo = criarRepositorio({ agora: new Date() })
    const parar = iniciarSimulador({ repositorio: repo, intervaloMs: intervaloDoSimulador(true), aleatorio: () => 0.5 })
    const riscos = () => repo.listarNotificacoes('usr-ana').filter((n) => n.eventoId === 'evt-01').map((n) => n.risco)
    vi.advanceTimersByTime(16_000) // 8 leituras: 3,30 → 3,70 m (falta 0,50 m)
    expect(riscos()).toEqual(['Alto'])
    vi.advanceTimersByTime(22_000) // 19 leituras: 4,25 m (transbordou)
    expect(riscos()).toEqual(['Alto', 'Crítico'])
    parar()
    vi.useRealTimers()
  })
})
