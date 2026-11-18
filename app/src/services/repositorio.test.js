// receberDado: leitura nova da mesma fonte vai para o evento ativo que já tem essa fonte
// (substitui a anterior), mesmo fora da janela da RN04. Testes de regressão.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarRepositorio } from './repositorio.js'
import { mesmaFonte } from './eventos.js'
import { criarLeitura, criarLeituraTemperatura, iniciarSimulador, proximaSensacao } from './simulador.js'
import { MINUTO } from './parametros.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')
const depois = (min) => new Date(AGORA.getTime() + min * MINUTO)

const registroComunitario = (id, autorPseudonimo, extras = {}) => ({
  id,
  tipo: 'Alagamento',
  origem: 'Comunidade',
  autorPseudonimo,
  bairro: 'Jardim Maria Helena',
  lat: -23.5235,
  lng: -46.8665,
  registradoEm: AGORA,
  atualizadoEm: AGORA,
  medicoes: { laminaCm: 5 },
  confirmacoes: 0,
  ...extras,
})

describe('receberDado — mesma fonte', () => {
  it('o sensor do rio continua igual: a leitura substitui a anterior no evt-01, sem evento novo', () => {
    const r = criarRepositorio({ agora: AGORA })
    const total = r.listarEventos().length
    const sensor = r.obterSensor('sensor-cotia-01')
    r.receberDado(criarLeitura(sensor, 3.45, depois(1)), depois(1))
    expect(r.obterEvento('evt-01').dados).toHaveLength(1)
    expect(r.obterEvento('evt-01').dados[0].medicoes.nivelRioM).toBe(3.45)
    expect(r.listarEventos()).toHaveLength(total)
  })

  it('status atualizado 90 min depois (fora da janela de 60 min da RN04) continua no mesmo evento (evt-06)', () => {
    const r = criarRepositorio({ agora: AGORA })
    const total = r.listarEventos().length
    const antigo = r.obterEvento('evt-06').dados[0]
    r.receberDado({ ...antigo, id: 'dado-06-v2', medicoes: { ...antigo.medicoes, situacao: 'Normalização parcial' }, atualizadoEm: AGORA }, AGORA)
    expect(r.listarEventos()).toHaveLength(total)
    expect(r.obterEvento('evt-06').dados.map((d) => d.id)).toEqual(['dado-06-v2'])
  })

  it('evento Descartado não é reaproveitado: a leitura seguinte do mesmo sensor cria evento novo', () => {
    const r = criarRepositorio({ agora: AGORA })
    r.executarAcao('evt-09', 'agenteRejeita', AGORA)
    const sensor = r.obterSensor('sensor-temp-jmh-01')
    const novo = r.receberDado(criarLeituraTemperatura(sensor, 39, depois(1)), depois(1))
    expect(novo.id).not.toBe('evt-09')
    expect(novo).toMatchObject({ tipo: 'Ilha de calor', estado: 'Em validação', confianca: 60 })
    expect(r.obterEvento('evt-09')).toMatchObject({ estado: 'Descartado' })
    expect(r.obterEvento('evt-09').dados.map((d) => d.id)).toEqual(['dado-09-sensor'])
  })

  it('evento Encerrado não é reaproveitado', () => {
    const r = criarRepositorio({ agora: AGORA })
    r.executarAcao('evt-06', 'agenteEncerra', AGORA)
    const antigo = r.obterEvento('evt-06').dados[0]
    const novo = r.receberDado({ ...antigo, id: 'dado-06-v2', atualizadoEm: AGORA }, AGORA)
    expect(novo.id).not.toBe('evt-06')
    expect(r.obterEvento('evt-06').estado).toBe('Encerrado')
  })

  it('registros da Comunidade de pessoas diferentes nunca contam como mesma fonte', () => {
    const a = registroComunitario('a', 'p-0001', { fonteId: 'app' })
    const b = registroComunitario('b', 'p-0002', { fonteId: 'app' })
    expect(mesmaFonte(a, b)).toBe(false)
    expect(mesmaFonte(registroComunitario('c', 'p-0001'), registroComunitario('d', 'p-0001'))).toBe(false)

    // No mesmo lugar e na mesma hora, os dois entram no mesmo evento pela RN04, mas um não substitui o outro
    const r = criarRepositorio({ agora: AGORA })
    r.receberDado(a, AGORA)
    const evento = r.receberDado(b, depois(1))
    expect(evento.dados.map((d) => d.id)).toEqual(['a', 'b'])
  })

  it('sensores diferentes não são a mesma fonte', () => {
    expect(mesmaFonte({ origem: 'Sensor', fonteId: 's1' }, { origem: 'Sensor', fonteId: 's2' })).toBe(false)
    expect(mesmaFonte({ origem: 'Sensor', fonteId: 's1' }, { origem: 'Sensor', fonteId: 's1' })).toBe(true)
    expect(mesmaFonte({ origem: 'Sensor' }, { origem: 'Sensor' })).toBe(false) // sem fonteId
  })
})

describe('sensor de temperatura do evt-09 (simulador)', () => {
  let repo
  let parar

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(AGORA)
    repo = criarRepositorio({ agora: new Date() })
  })

  afterEach(() => {
    parar?.()
    vi.useRealTimers()
  })

  it('a sensação fica entre 38,5 e 39,5 °C (nunca chega a 38 nem a 42)', () => {
    const sensor = repo.obterSensor('sensor-temp-jmh-01')
    expect(proximaSensacao(sensor, () => 0)).toBe(38.5)
    expect(proximaSensacao(sensor, () => 0.999)).toBe(39.5)
    expect(proximaSensacao(sensor, () => 0.5)).toBe(39)
  })

  it('depois de 20 tiques (5 min): confiança 60, risco Alto, Em validação, um dado só (a leitura substitui a anterior)', () => {
    let i = 0
    const valores = [0, 0.999, 0.3, 0.7]
    parar = iniciarSimulador({ repositorio: repo, aleatorio: () => valores[i++ % valores.length] })
    const total = repo.listarEventos().length
    vi.advanceTimersByTime(20 * 15000)
    const evt09 = repo.obterEvento('evt-09')
    expect(evt09).toMatchObject({ confianca: 60, risco: 'Alto', estado: 'Em validação' })
    expect(evt09.dados).toHaveLength(1)
    expect(evt09.dados[0].falhaSensor).toBe(true)
    expect(evt09.dados[0].medicoes.sensacaoTermicaC).toBeGreaterThanOrEqual(38.5)
    expect(evt09.dados[0].medicoes.sensacaoTermicaC).toBeLessThanOrEqual(39.5)
    expect(repo.listarEventos()).toHaveLength(total)
  })

  it('sem o simulador, o sensor ficaria desatualizado depois de 10 min (60 → 40): por isso ele manda leituras', () => {
    repo.recalcular(depois(11))
    expect(repo.obterEvento('evt-09').confianca).toBe(40)
  })
})
