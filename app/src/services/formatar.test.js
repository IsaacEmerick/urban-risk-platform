import { describe, expect, it } from 'vitest'
import { formatarDataHora, formatarMetros, tempoDecorrido } from './formatar.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')
const antes = (ms) => new Date(AGORA.getTime() - ms)

describe('tempoDecorrido (carimbo "atualizado há X s")', () => {
  it('segundos, minutos, horas e dias', () => {
    expect(tempoDecorrido(antes(0), AGORA)).toBe('há 0 s')
    expect(tempoDecorrido(antes(59_999), AGORA)).toBe('há 59 s')
    expect(tempoDecorrido(antes(60_000), AGORA)).toBe('há 1 min')
    expect(tempoDecorrido(antes(3 * 3600_000), AGORA)).toBe('há 3 h')
    expect(tempoDecorrido(antes(24 * 3600_000), AGORA)).toBe('há 1 dia')
    expect(tempoDecorrido(antes(72 * 3600_000), AGORA)).toBe('há 3 dias')
  })
  it('data no futuro (relógio adiantado) vira "há 0 s"', () => {
    expect(tempoDecorrido(new Date(AGORA.getTime() + 5000), AGORA)).toBe('há 0 s')
  })
})

describe('formatarDataHora e formatarMetros', () => {
  it('hoje, ontem e data', () => {
    expect(formatarDataHora(antes(2 * 3600_000), AGORA)).toBe('hoje, 16:00')
    expect(formatarDataHora(antes(24 * 3600_000), AGORA)).toBe('ontem, 18:00')
    expect(formatarDataHora(antes(72 * 3600_000), AGORA)).toBe('14/11, 18:00')
  })
  it('metros com vírgula', () => {
    expect(formatarMetros(3.3)).toBe('3,30')
  })
})
