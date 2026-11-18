import { describe, expect, it } from 'vitest'
import { classificarRisco, duracaoInterrupcaoHoras, maiorRisco, pesoRisco } from './risco.js'
import { HORA } from './parametros.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')
const horas = (h) => new Date(AGORA.getTime() + h * HORA)

const alagamento = (medicoes) => classificarRisco('Alagamento', medicoes, AGORA)
const calor = (c) => classificarRisco('Ilha de calor', { sensacaoTermicaC: c }, AGORA)
const interrupcao = (medicoes) =>
  classificarRisco('Interrupção de serviço', { situacao: 'Em atendimento', inicio: AGORA, previsaoNormalizacao: AGORA, ...medicoes }, AGORA)

describe('Alagamento — chuva (mm/h)', () => {
  it.each([
    [9.9, 'Baixo'],
    [10, 'Moderado'],
    [24.9, 'Moderado'],
    [25, 'Alto'],
    [50, 'Alto'],
    [50.1, 'Crítico'],
  ])('%f mm/h → %s', (chuvaMmH, nivel) => {
    expect(alagamento({ chuvaMmH })).toBe(nivel)
  })
})

describe("Alagamento — lâmina d'água em via (cm)", () => {
  it.each([
    [9.9, 'Baixo'],
    [10, 'Alto'],
    [30, 'Alto'],
    [30.1, 'Crítico'],
  ])('%f cm → %s', (laminaCm, nivel) => {
    expect(alagamento({ laminaCm })).toBe(nivel)
  })
})

describe('Alagamento — nível do rio (falta para a cota de transbordamento)', () => {
  const COTA = 4.2
  // nível = cota − falta
  it.each([
    [1.01, 'Baixo'],
    [1.0, 'Moderado'],
    [0.51, 'Moderado'],
    [0.5, 'Alto'],
    [0, 'Alto'],
    [-0.01, 'Crítico'],
  ])('faltam %f m → %s', (falta, nivel) => {
    // arredonda para evitar erro de ponto flutuante na subtração
    const nivelRioM = Math.round((COTA - falta) * 100) / 100
    expect(alagamento({ nivelRioM, cotaTransbordamentoM: COTA })).toBe(nivel)
  })

  it('sem cota cadastrada o critério não se aplica', () => {
    expect(alagamento({ nivelRioM: 10 })).toBe('Baixo')
  })
})

describe('Alagamento — vários critérios: vale o maior', () => {
  it('chuva Moderado + lâmina Alto → Alto', () => {
    expect(alagamento({ chuvaMmH: 15, laminaCm: 12 })).toBe('Alto')
  })
  it('nível do rio Crítico + chuva Moderado → Crítico', () => {
    expect(alagamento({ chuvaMmH: 15, nivelRioM: 4.3, cotaTransbordamentoM: 4.2 })).toBe('Crítico')
  })
  it('sem medição → Baixo', () => {
    expect(alagamento({})).toBe('Baixo')
  })
})

describe('Ilha de calor — sensação térmica (°C)', () => {
  it.each([
    [31.9, 'Baixo'],
    [32, 'Moderado'],
    [37.9, 'Moderado'],
    [38, 'Alto'],
    [41.9, 'Alto'],
    [42, 'Crítico'],
  ])('%f °C → %s', (c, nivel) => {
    expect(calor(c)).toBe(nivel)
  })
})

describe('Interrupção de serviço', () => {
  it.each([
    [1.9, 'Baixo'],
    [2, 'Moderado'],
    [6, 'Moderado'],
    [6.1, 'Alto'],
  ])('duração de %f h → %s', (h, nivel) => {
    expect(interrupcao({ previsaoNormalizacao: horas(h) })).toBe(nivel)
  })

  it.each([
    [999, 'Baixo'],
    [1000, 'Moderado'],
    [10000, 'Moderado'],
    [10001, 'Alto'],
  ])('%i pessoas afetadas → %s', (pessoasAfetadas, nivel) => {
    expect(interrupcao({ pessoasAfetadas })).toBe(nivel)
  })

  it('atinge hospital, escola ou abastecimento crítico → Crítico', () => {
    expect(interrupcao({ atingeServicoCritico: true })).toBe('Crítico')
  })

  it('situação Normalizado → Baixo, mesmo com outros critérios', () => {
    expect(interrupcao({ situacao: 'Normalizado', atingeServicoCritico: true, pessoasAfetadas: 50000 })).toBe('Baixo')
  })

  it('duração e afetados: vale o maior', () => {
    expect(interrupcao({ previsaoNormalizacao: horas(3), pessoasAfetadas: 20000 })).toBe('Alto')
  })

  it('duração = previsão − início', () => {
    expect(duracaoInterrupcaoHoras({ inicio: horas(-1), previsaoNormalizacao: horas(3) }, AGORA)).toBe(4)
  })

  it('previsão já passou e continua: vale o tempo desde o início', () => {
    const medicoes = { inicio: horas(-7), previsaoNormalizacao: horas(-2) }
    expect(duracaoInterrupcaoHoras(medicoes, AGORA)).toBe(7)
    expect(interrupcao(medicoes)).toBe('Alto') // 7 h > 6 h
  })
})

describe('auxiliares', () => {
  it('peso R: Baixo 1 … Crítico 4', () => {
    expect(['Baixo', 'Moderado', 'Alto', 'Crítico'].map(pesoRisco)).toEqual([1, 2, 3, 4])
  })
  it('maiorRisco', () => {
    expect(maiorRisco(['Moderado', 'Crítico', 'Alto'])).toBe('Crítico')
    expect(maiorRisco([])).toBe('Baixo')
  })
  it('tipo desconhecido lança erro', () => {
    expect(() => classificarRisco('Deslizamento', {}, AGORA)).toThrow()
  })
})
