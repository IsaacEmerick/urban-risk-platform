import { describe, expect, it } from 'vitest'
import { deveNotificar, raioAfetado } from './notificacao.js'
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

  it('área por bairro: notifica se o evento é naquele bairro', () => {
    const ana = { areasInteresse: [{ tipo: 'bairro', bairro: 'Parque Viana' }, { tipo: 'bairro', bairro: 'Jardim Maria Helena' }] }
    expect(deveNotificar(ana, evento(), { agora: AGORA })).toBe(true)
    expect(deveNotificar(ana, evento({ bairro: 'Vila Lourdes' }), { agora: AGORA })).toBe(false)
  })

  it('respeita os tipos de risco escolhidos nas Preferências (RF13)', () => {
    expect(deveNotificar(usuarioEm(0, { tiposRisco: ['Ilha de calor'] }), evento(), { agora: AGORA })).toBe(false)
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
