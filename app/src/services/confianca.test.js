import { describe, expect, it } from 'vitest'
import { calcularConfianca, estaCorroborado, estaDesatualizado, faixaConfianca } from './confianca.js'
import { deslocarParaNorte } from './geo.js'
import { MINUTO } from './parametros.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')
const PONTO = { lat: -23.5415, lng: -46.868 } // Parque Viana
const antes = (min, seg = 0) => new Date(AGORA.getTime() - min * MINUTO - seg * 1000)

function dado(extras = {}) {
  return {
    id: 'd1',
    tipo: 'Alagamento',
    origem: 'Comunidade',
    ...PONTO,
    registradoEm: AGORA,
    atualizadoEm: AGORA,
    confirmacoes: 0,
    fotoGeolocalizada: false,
    falhaSensor: false,
    ...extras,
  }
}
const valor = (d, opcoes = {}) => calcularConfianca(d, { agora: AGORA, ...opcoes }).valor

describe('calcularConfianca — base por origem', () => {
  it.each([
    ['Sensor', 90],
    ['Base pública', 85],
    ['Base pública (concessionária)', 80],
    ['Comunidade', 40],
  ])('%s começa com %i', (origem, base) => {
    expect(valor(dado({ origem }))).toBe(base)
  })

  it('origem desconhecida lança erro', () => {
    expect(() => valor(dado({ origem: 'Rede social' }))).toThrow()
  })
})

describe('calcularConfianca — ajustes', () => {
  it('+10 por confirmação, no máximo 3', () => {
    expect(valor(dado({ confirmacoes: 1 }))).toBe(50)
    expect(valor(dado({ confirmacoes: 3 }))).toBe(70)
    expect(valor(dado({ confirmacoes: 4 }))).toBe(70)
  })

  it('+5 com foto geolocalizada', () => {
    expect(valor(dado({ fotoGeolocalizada: true }))).toBe(45)
  })

  it('−30 para sensor com falha (só vale para Sensor)', () => {
    expect(valor(dado({ origem: 'Sensor', falhaSensor: true }))).toBe(60)
    expect(valor(dado({ origem: 'Comunidade', falhaSensor: true }))).toBe(40)
  })

  it('limita o resultado entre 0 e 100', () => {
    const muitoAlto = dado({ origem: 'Sensor', confirmacoes: 3 })
    expect(valor(muitoAlto)).toBe(100) // 90 + 30 = 120 → 100
    const muitoBaixo = dado({ origem: 'Sensor', falhaSensor: true, atualizadoEm: antes(60) })
    expect(valor(muitoBaixo)).toBe(40) // 90 − 20 − 30 (com as regras atuais o mínimo possível é 40)
  })

  it('devolve a decomposição do cálculo (tela Origem e confiança)', () => {
    const r = calcularConfianca(dado({ confirmacoes: 2, fotoGeolocalizada: true }), { agora: AGORA })
    expect(r.ajustes.map((a) => a.pontos)).toEqual([40, 20, 5])
    expect(r.ajustes.reduce((s, a) => s + a.pontos, 0)).toBe(r.valor)
  })
})

describe('dado desatualizado (mais de 2× o intervalo esperado)', () => {
  it('Sensor: 10 min ainda vale; 10 min e 1 s está desatualizado (−20)', () => {
    expect(estaDesatualizado(dado({ origem: 'Sensor', atualizadoEm: antes(10) }), AGORA)).toBe(false)
    expect(estaDesatualizado(dado({ origem: 'Sensor', atualizadoEm: antes(10, 1) }), AGORA)).toBe(true)
    expect(valor(dado({ origem: 'Sensor', atualizadoEm: antes(10, 1) }))).toBe(70)
  })

  it('Base pública e concessionária: limite de 30 min', () => {
    for (const origem of ['Base pública', 'Base pública (concessionária)']) {
      expect(estaDesatualizado(dado({ origem, atualizadoEm: antes(30) }), AGORA)).toBe(false)
      expect(estaDesatualizado(dado({ origem, atualizadoEm: antes(30, 1) }), AGORA)).toBe(true)
    }
  })

  it('Comunidade nunca fica desatualizada', () => {
    expect(estaDesatualizado(dado({ atualizadoEm: antes(60 * 24) }), AGORA)).toBe(false)
  })
})

describe('corroborado por Sensor ou Base pública (500 m, 30 min, mesmo tipo)', () => {
  const sensorEm = (metros, minutos, extras = {}) =>
    dado({ id: 's1', origem: 'Sensor', fonteId: 'sensor-x', ...deslocarParaNorte(PONTO, metros), registradoEm: antes(minutos), ...extras })

  it('500 m conta; 501 m não', () => {
    expect(estaCorroborado(dado(), [sensorEm(500, 0)])).toBe(true)
    expect(estaCorroborado(dado(), [sensorEm(501, 0)])).toBe(false)
  })

  it('30 min conta; 31 min não', () => {
    expect(estaCorroborado(dado(), [sensorEm(100, 30)])).toBe(true)
    expect(estaCorroborado(dado(), [sensorEm(100, 31)])).toBe(false)
  })

  it('Base pública e concessionária corroboram; Comunidade não', () => {
    expect(estaCorroborado(dado(), [sensorEm(100, 0, { origem: 'Base pública' })])).toBe(true)
    expect(estaCorroborado(dado(), [sensorEm(100, 0, { origem: 'Base pública (concessionária)' })])).toBe(true)
    expect(estaCorroborado(dado(), [sensorEm(100, 0, { origem: 'Comunidade' })])).toBe(false)
  })

  it('tipo de risco diferente não corrobora', () => {
    expect(estaCorroborado(dado(), [sensorEm(100, 0, { tipo: 'Ilha de calor' })])).toBe(false)
  })

  it('o próprio dado e leituras da mesma fonte não contam', () => {
    const sensor = dado({ origem: 'Sensor', fonteId: 'sensor-x' })
    expect(estaCorroborado(sensor, [sensor])).toBe(false)
    expect(estaCorroborado(sensor, [{ ...sensor, id: 'outra-leitura' }])).toBe(false)
  })
})

describe('faixas de confiança', () => {
  it.each([
    [100, 'Alta'],
    [75, 'Alta'],
    [74, 'Média'],
    [50, 'Média'],
    [49, 'Baixa'],
    [0, 'Baixa'],
  ])('%i → %s', (v, faixa) => {
    expect(faixaConfianca(v)).toBe(faixa)
  })
})

describe('exemplo do documento (seção 4.1)', () => {
  it('registro da Ana: 40 + 2 confirmações + foto = 65 (Média); com sensor a 300 m, 10 min depois: 80 (Alta)', () => {
    const registroAna = dado({ confirmacoes: 2, fotoGeolocalizada: true, registradoEm: antes(10) })
    const semSensor = calcularConfianca(registroAna, { agora: AGORA })
    expect(semSensor).toMatchObject({ valor: 65, faixa: 'Média' })

    const sensor = dado({ id: 's1', origem: 'Sensor', fonteId: 'sensor-x', ...deslocarParaNorte(PONTO, 300), registradoEm: AGORA })
    const comSensor = calcularConfianca(registroAna, { agora: AGORA, outrosDados: [sensor] })
    expect(comSensor).toMatchObject({ valor: 80, faixa: 'Alta' })
  })
})
