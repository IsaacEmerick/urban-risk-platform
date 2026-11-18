// Registro comunitário (RF03): dado de origem Comunidade e o caminho que ele percorre no repositório
import { describe, expect, it } from 'vitest'
import bairros from '../data/bairros.json'
import { criarRepositorio } from './repositorio.js'
import { classificarRisco } from './risco.js'
import { distanciaMetros } from './geo.js'
import {
  ALTURAS_AGUA,
  POSICAO_ATUAL_SIMULADA,
  bairroMaisProximo,
  criarDadoComunitario,
  montarDescricao,
  tituloDoRegistro,
} from './registro.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')
const ANA = { id: 'usr-ana', pseudonimo: 'p-7f3a', perfil: 'morador' }

describe('altura da água → laminaCm → risco (seção 4.2 sem mudança)', () => {
  it.each([
    ['abaixoMeioFio', 5, 'Baixo'],
    ['meioFio', 15, 'Alto'],
    ['canela', 35, 'Crítico'],
    ['joelho', 50, 'Crítico'],
  ])('%s = %i cm → %s', (id, cm, risco) => {
    const altura = ALTURAS_AGUA.find((a) => a.id === id)
    expect(altura.cm).toBe(cm)
    expect(classificarRisco('Alagamento', { laminaCm: altura.cm })).toBe(risco)
  })
})

describe('título, descrição e bairro', () => {
  it('título = tipo + altura + bairro; sem altura para os outros tipos', () => {
    expect(tituloDoRegistro({ tipo: 'Alagamento', alturaAgua: 'meioFio', bairro: 'Parque Viana' })).toBe(
      'Alagamento na altura do meio-fio – Parque Viana',
    )
    expect(tituloDoRegistro({ tipo: 'Ilha de calor', alturaAgua: 'meioFio', bairro: 'Parque Viana' })).toBe('Ilha de calor – Parque Viana')
  })

  it('descrição junta sugestões e texto livre com ponto final', () => {
    expect(montarDescricao(['Rua alagada', 'Carro ilhado'], ' água subindo rápido ')).toBe('Rua alagada. Carro ilhado. água subindo rápido.')
    expect(montarDescricao([], '')).toBe('')
  })

  it('posição atual simulada fica no Parque Viana e longe (> 300 m) dos eventos atuais', () => {
    expect(bairroMaisProximo(POSICAO_ATUAL_SIMULADA, bairros)).toBe('Parque Viana')
    const r = criarRepositorio({ agora: AGORA })
    ;['evt-02', 'evt-04'].forEach((id) => expect(distanciaMetros(POSICAO_ATUAL_SIMULADA, r.obterEvento(id))).toBeGreaterThan(300))
  })
})

describe('criarDadoComunitario()', () => {
  const base = { tipo: 'Alagamento', posicao: POSICAO_ATUAL_SIMULADA, alturaAgua: 'canela', usuario: ANA, bairros, agora: AGORA }

  it('guarda só o pseudônimo, nunca o id do usuário (LGPD)', () => {
    const dado = criarDadoComunitario(base)
    expect(dado).toMatchObject({ origem: 'Comunidade', autorPseudonimo: 'p-7f3a', medicoes: { laminaCm: 35 }, confirmacoes: 0 })
    expect(JSON.stringify(dado)).not.toContain('usr-ana')
  })

  it('sem descrição, usa o título; foto conta como geolocalizada', () => {
    const dado = criarDadoComunitario({ ...base, comFoto: true })
    expect(dado.descricao).toBe('Alagamento na altura da canela – Parque Viana.')
    expect(dado.fotoGeolocalizada).toBe(true)
  })

  it('Ilha de calor e Interrupção não levam medição', () => {
    expect(criarDadoComunitario({ ...base, tipo: 'Ilha de calor' }).medicoes).toEqual({})
  })

  it('alagamento sem altura da água é recusado', () => {
    expect(() => criarDadoComunitario({ ...base, alturaAgua: null })).toThrow()
  })
})

describe('repositório — registro comunitário percorre o caminho dos dados', () => {
  it('registro novo longe dos eventos: evento novo, 40 + 5 (foto) = 45, Crítico, Reportado, sem alerta', () => {
    const r = criarRepositorio({ agora: AGORA })
    const antes = r.listarNotificacoes('usr-ana').length
    const evento = r.registrarOcorrencia(criarDadoComunitario({ ...base(), comFoto: true }), AGORA)
    expect(evento).toMatchObject({
      titulo: 'Alagamento na altura da canela – Parque Viana',
      bairro: 'Parque Viana',
      confianca: 45,
      faixaConfianca: 'Baixa',
      risco: 'Crítico',
      estado: 'Reportado', // RN03: aguarda confirmações
    })
    expect(r.listarNotificacoes('usr-ana')).toHaveLength(antes) // RN01: confiança < 75, sem alerta
  })

  it('registro a ≤ 300 m do evt-02 entra no evt-02 (RN04)', () => {
    const r = criarRepositorio({ agora: AGORA })
    const evt02 = r.obterEvento('evt-02')
    const evento = r.registrarOcorrencia(
      criarDadoComunitario({ ...base(), posicao: { lat: evt02.lat + 0.0005, lng: evt02.lng }, alturaAgua: 'meioFio' }),
      AGORA,
    )
    expect(evento.id).toBe('evt-02')
    expect(evento.dados).toHaveLength(2)
  })

  function base() {
    return { tipo: 'Alagamento', posicao: POSICAO_ATUAL_SIMULADA, alturaAgua: 'canela', usuario: ANA, bairros, agora: AGORA }
  }
})
