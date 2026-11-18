// Publicar status (RF18): validação, dado de origem Base pública (concessionária) e o caminho completo
import { describe, expect, it } from 'vitest'
import bairros from '../data/bairros.json'
import { criarRepositorio } from './repositorio.js'
import { atualizarSituacao, criarDadoStatus, resolverAreaStatus, statusPublicados, tituloDoStatus, validarStatus } from './status.js'
import { HORA, MINUTO } from './parametros.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')
const juliana = { id: 'usr-juliana', nome: 'Juliana' }

const formulario = (extras = {}) => ({
  servico: 'Energia elétrica',
  area: { tipo: 'bairro', bairro: 'Jardim Maria Helena' },
  situacao: 'Interrupção identificada',
  inicio: new Date(AGORA.getTime() - 10 * MINUTO),
  previsao: new Date(AGORA.getTime() + 3 * HORA),
  pessoasAfetadas: '2500',
  atingeServicoCritico: true,
  ...extras,
})

describe('validarStatus (RF04: formato e faixa)', () => {
  it('formulário completo é válido', () => {
    expect(validarStatus(formulario(), AGORA)).toEqual({})
  })

  it.each([
    ['início no futuro', { inicio: new Date(AGORA.getTime() + MINUTO) }, 'inicio'],
    ['previsão antes do início', { previsao: new Date(AGORA.getTime() - HORA) }, 'previsao'],
    ['previsão igual ao início', { previsao: new Date(AGORA.getTime() - 10 * MINUTO) }, 'previsao'],
    ['afetados negativo', { pessoasAfetadas: '-1' }, 'pessoasAfetadas'],
    ['afetados fracionário', { pessoasAfetadas: '2,5' }, 'pessoasAfetadas'],
    ['afetados vazio', { pessoasAfetadas: '' }, 'pessoasAfetadas'],
    ['sem resposta sobre hospital, escola ou abastecimento', { atingeServicoCritico: null }, 'atingeServicoCritico'],
    ['sem situação', { situacao: '' }, 'situacao'],
    ['ponto sem raio', { area: { tipo: 'ponto', posicao: { lat: -23.53, lng: -46.86 } } }, 'area'],
  ])('%s → erro em %s', (_, extras, campo) => {
    expect(Object.keys(validarStatus(formulario(extras), AGORA))).toEqual([campo])
  })

  it('0 afetados é válido', () => {
    expect(validarStatus(formulario({ pessoasAfetadas: '0' }), AGORA)).toEqual({})
  })
})

describe('criarDadoStatus', () => {
  it('bairro → centro e raio do catálogo; título gerado; origem Base pública (concessionária)', () => {
    const dado = criarDadoStatus({ ...formulario(), usuario: juliana, bairros, agora: AGORA })
    expect(dado).toMatchObject({
      origem: 'Base pública (concessionária)',
      tipo: 'Interrupção de serviço',
      bairro: 'Jardim Maria Helena',
      titulo: 'Interrupção de energia elétrica – Jardim Maria Helena',
      lat: -23.5293,
      lng: -46.8638,
      raioAfetadoM: 500,
      publicadoPor: 'usr-juliana',
      medicoes: { servico: 'Energia elétrica', situacao: 'Interrupção identificada', pessoasAfetadas: 2500, atingeServicoCritico: true },
    })
  })

  it('ponto no mapa → bairro mais próximo e o raio escolhido', () => {
    const area = { tipo: 'ponto', posicao: { lat: -23.5405, lng: -46.866 }, raioM: 1000 }
    expect(resolverAreaStatus(area, bairros)).toEqual({ bairro: 'Parque Viana', lat: -23.5405, lng: -46.866, raioM: 1000 })
  })

  it('um fonteId por status publicado', () => {
    const a = criarDadoStatus({ ...formulario(), usuario: juliana, bairros, agora: AGORA })
    const b = criarDadoStatus({ ...formulario(), usuario: juliana, bairros, agora: AGORA })
    expect(a.fonteId).not.toBe(b.fonteId)
  })

  it('formulário inválido não vira dado', () => {
    expect(() => criarDadoStatus({ ...formulario({ pessoasAfetadas: '-5' }), usuario: juliana, bairros, agora: AGORA })).toThrow()
  })

  it('tituloDoStatus', () => {
    expect(tituloDoStatus('Energia elétrica', 'Parque Viana')).toBe('Interrupção de energia elétrica – Parque Viana')
  })
})

describe('publicar e atualizar no repositório (mesmo caminho dos outros dados)', () => {
  it('atinge escola → Crítico; confiança 80 → Confirmado → Alerta emitido; a Ana (Jardim Maria Helena) é notificada', () => {
    const r = criarRepositorio({ agora: AGORA })
    const evento = r.publicarStatus(criarDadoStatus({ ...formulario(), usuario: juliana, bairros, agora: AGORA }), AGORA)
    expect(evento).toMatchObject({ confianca: 80, risco: 'Crítico', estado: 'Em monitoramento', riscoAlertado: 'Crítico', raioAfetadoM: 500 })
    expect(evento.historico.map((h) => h.estado)).toEqual(['Reportado', 'Confirmado', 'Alerta emitido', 'Em monitoramento'])
    expect(r.listarNotificacoes('usr-ana').filter((n) => n.eventoId === evento.id).map((n) => n.tipo)).toEqual(['Alerta'])
  })

  it('trocar a situação atualiza o mesmo evento; Normalizado leva o risco a Baixo; dá para voltar atrás enquanto ativo', () => {
    const r = criarRepositorio({ agora: AGORA })
    const dado = criarDadoStatus({ ...formulario(), usuario: juliana, bairros, agora: AGORA })
    const evento = r.publicarStatus(dado, AGORA)
    const total = r.listarEventos().length

    const t1 = new Date(AGORA.getTime() + 20 * MINUTO)
    const normalizado = r.publicarStatus(atualizarSituacao(dado, 'Normalizado', t1), t1)
    expect(normalizado.id).toBe(evento.id)
    expect(normalizado).toMatchObject({ risco: 'Baixo', estado: 'Em monitoramento' })
    expect(normalizado.dados).toHaveLength(1)
    expect(normalizado.dados[0].atualizadoEm).toEqual(t1)
    expect(r.listarEventos()).toHaveLength(total)

    // A situação pode ser trocada livremente (sem regra de "só avança")
    const t2 = new Date(AGORA.getTime() + 25 * MINUTO)
    const deVolta = r.publicarStatus(atualizarSituacao(normalizado.dados[0], 'Em atendimento', t2), t2)
    expect(deVolta.dados[0].medicoes.situacao).toBe('Em atendimento')
    expect(deVolta.id).toBe(evento.id)
  })

  it('Meus status da Juliana: o evt-06 e os publicados por ela, ativos primeiro', () => {
    const r = criarRepositorio({ agora: AGORA })
    expect(statusPublicados(r.listarEventos(), 'usr-juliana').map(({ evento }) => evento.id)).toEqual(['evt-06'])
    const novo = r.publicarStatus(criarDadoStatus({ ...formulario(), usuario: juliana, bairros, agora: AGORA }), AGORA)
    expect(statusPublicados(r.listarEventos(), 'usr-juliana').map(({ evento }) => evento.id)).toEqual([novo.id, 'evt-06'])
    expect(statusPublicados(r.listarEventos(), 'usr-carlos')).toEqual([])
  })
})
