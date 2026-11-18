import { describe, expect, it } from 'vitest'
import { deveNotificar, raioAfetado, resolverAreas } from './notificacao.js'
import BAIRROS from '../data/bairros.json'
import { deslocarParaNorte } from './geo.js'
import { MINUTO } from './parametros.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')
const PONTO = { lat: -23.5293, lng: -46.8638 }
const antes = (min) => new Date(AGORA.getTime() - min * MINUTO)

const evento = (extras = {}) => ({ tipo: 'Alagamento', bairro: 'Jardim Maria Helena', risco: 'Alto', ...PONTO, ...extras })
// Usuário com área de interesse = ponto com raio 0, para testar só o raio afetado
const usuarioEm = (metros, extras = {}) => ({
  areasInteresse: [{ tipo: 'ponto', ...deslocarParaNorte(PONTO, metros), raioM: 0 }],
  ...extras,
})

describe('RN06 — raio afetado', () => {
  it('Alagamento: 500 m notifica, 501 m não', () => {
    expect(deveNotificar(usuarioEm(500), evento(), { agora: AGORA })).toBe(true)
    expect(deveNotificar(usuarioEm(501), evento(), { agora: AGORA })).toBe(false)
  })

  it('Ilha de calor: 1 km', () => {
    const calor = evento({ tipo: 'Ilha de calor' })
    expect(deveNotificar(usuarioEm(1000), calor, { agora: AGORA })).toBe(true)
    expect(deveNotificar(usuarioEm(1001), calor, { agora: AGORA })).toBe(false)
  })

  it('Interrupção de serviço: área informada pelo operador', () => {
    const interrupcao = evento({ tipo: 'Interrupção de serviço', raioAfetadoM: 800 })
    expect(raioAfetado(interrupcao)).toBe(800)
    expect(deveNotificar(usuarioEm(800), interrupcao, { agora: AGORA })).toBe(true)
    expect(deveNotificar(usuarioEm(801), interrupcao, { agora: AGORA })).toBe(false)
  })

  it('área por ponto soma o raio da área do usuário (ex.: 1 km)', () => {
    const usuario = { areasInteresse: [{ tipo: 'ponto', ...deslocarParaNorte(PONTO, 1500), raioM: 1000 }] }
    expect(deveNotificar(usuario, evento(), { agora: AGORA })).toBe(true) // 1500 ≤ 1000 + 500
  })


  it('respeita os tipos de risco escolhidos nas Preferências (RF13)', () => {
    expect(deveNotificar(usuarioEm(0, { tiposRisco: ['Ilha de calor'] }), evento(), { agora: AGORA })).toBe(false)
  })
})

describe('RN06 — área por bairro (centro e raio aproximados, RF13)', () => {
  const PARQUE_VIANA = BAIRROS.find((b) => b.nome === 'Parque Viana')
  const soParqueViana = { areasInteresse: resolverAreas([{ tipo: 'bairro', bairro: 'Parque Viana' }], BAIRROS) }

  it('resolverAreas completa o bairro com centro e raio do catálogo', () => {
    expect(soParqueViana.areasInteresse[0]).toMatchObject({ lat: PARQUE_VIANA.lat, lng: PARQUE_VIANA.lng, raioM: 500 })
    expect(() => resolverAreas([{ tipo: 'bairro', bairro: 'Alphaville' }], BAIRROS)).toThrow()
  })

  it('alagamento no Jd. Maria Helena perto da divisa alcança quem só tem Parque Viana', () => {
    const pertoDaDivisa = evento({ bairro: 'Jardim Maria Helena', lat: -23.534, lng: -46.865 }) // ~800 m do centro do Parque Viana
    expect(deveNotificar(soParqueViana, pertoDaDivisa, { agora: AGORA })).toBe(true)
  })

  it('alagamento no centro do Jd. Maria Helena (~1,3 km) não alcança quem só tem Parque Viana', () => {
    const centroJmh = evento({ bairro: 'Jardim Maria Helena', lat: -23.5293, lng: -46.8638 })
    expect(deveNotificar(soParqueViana, centroJmh, { agora: AGORA })).toBe(false)
  })

  it('limite exato: raio do bairro (500) + raio afetado (500) = 1000 m alcança; 1001 m não', () => {
    const naBorda = evento(deslocarParaNorte(PARQUE_VIANA, 1000))
    const foraDaBorda = evento(deslocarParaNorte(PARQUE_VIANA, 1001))
    expect(deveNotificar(soParqueViana, naBorda, { agora: AGORA })).toBe(true)
    expect(deveNotificar(soParqueViana, foraDaBorda, { agora: AGORA })).toBe(false)
  })

  it('Ilha de calor usa raio afetado de 1 km: até 1500 m do centro do bairro', () => {
    const calor = (metros) => evento({ tipo: 'Ilha de calor', ...deslocarParaNorte(PARQUE_VIANA, metros) })
    expect(deveNotificar(soParqueViana, calor(1500), { agora: AGORA })).toBe(true)
    expect(deveNotificar(soParqueViana, calor(1501), { agora: AGORA })).toBe(false)
  })

  it('área sem centro e raio é um erro de dados', () => {
    expect(() => deveNotificar({ areasInteresse: [{ tipo: 'bairro', bairro: 'Parque Viana' }] }, evento(), { agora: AGORA })).toThrow()
  })
})

describe('RN06 — sem renotificar em menos de 15 min, salvo escalada', () => {
  it('14 min depois não renotifica; 15 min depois renotifica', () => {
    expect(deveNotificar(usuarioEm(0), evento(), { agora: AGORA, ultimaNotificacao: { em: antes(14), risco: 'Alto' } })).toBe(false)
    expect(deveNotificar(usuarioEm(0), evento(), { agora: AGORA, ultimaNotificacao: { em: antes(15), risco: 'Alto' } })).toBe(true)
  })

  it('escalada (Alto → Crítico) renotifica mesmo antes de 15 min', () => {
    const critico = evento({ risco: 'Crítico' })
    expect(deveNotificar(usuarioEm(0), critico, { agora: AGORA, ultimaNotificacao: { em: antes(1), risco: 'Alto' } })).toBe(true)
  })
})
