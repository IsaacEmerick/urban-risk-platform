import { describe, expect, it } from 'vitest'
import { calcularPrioridade } from './prioridade.js'

describe('calcularPrioridade — P = R × 25 × (C/100) + V', () => {
  it('exemplo do documento: Alto (3), confiança 80, perto de escola → 70', () => {
    expect(calcularPrioridade({ risco: 'Alto', confianca: 80, vulnerabilidades: ['escola'] })).toBe(70)
  })

  it('mínimo 0 e máximo 110', () => {
    expect(calcularPrioridade({ risco: 'Baixo', confianca: 0 })).toBe(0)
    expect(calcularPrioridade({ risco: 'Crítico', confianca: 100, vulnerabilidades: ['hospital'] })).toBe(110)
  })

  it('peso R de cada nível com confiança 100 e sem bônus', () => {
    expect(['Baixo', 'Moderado', 'Alto', 'Crítico'].map((risco) => calcularPrioridade({ risco, confianca: 100 }))).toEqual([
      25, 50, 75, 100,
    ])
  })

  it('bônus V de área vulnerável é aplicado uma vez só', () => {
    const umMotivo = calcularPrioridade({ risco: 'Moderado', confianca: 60, vulnerabilidades: ['escola'] })
    const variosMotivos = calcularPrioridade({
      risco: 'Moderado',
      confianca: 60,
      vulnerabilidades: ['escola', 'hospital', 'suscetivel_sgb'],
    })
    expect(umMotivo).toBe(40) // 2 × 25 × 0,6 + 10
    expect(variosMotivos).toBe(40)
  })

  it('arredonda para 1 casa decimal: Alto, 65, escola → 58,8', () => {
    expect(calcularPrioridade({ risco: 'Alto', confianca: 65, vulnerabilidades: ['escola'] })).toBe(58.8)
  })
})
