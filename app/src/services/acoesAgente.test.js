import { describe, expect, it } from 'vitest'
import { acoesDisponiveis } from './acoesAgente.js'

const evento = (estado, extras = {}, estadosAnteriores = []) => ({
  estado,
  naoConfirmado: false,
  historico: [...estadosAnteriores, estado].map((e) => ({ estado: e, em: new Date() })),
  ...extras,
})
const rotulos = (e, perfil = 'agente') => acoesDisponiveis(e, perfil).map((a) => a.rotulo)

describe('acoesDisponiveis — botões do agente no Detalhe do alerta (RF12)', () => {
  it('morador e operador não veem botões', () => {
    const e = evento('Em monitoramento', {}, ['Alerta emitido'])
    expect(rotulos(e, 'morador')).toEqual([])
    expect(rotulos(e, 'operador')).toEqual([])
  })

  it('alerta preliminar (não confirmado): Confirmar alerta, Encerrar e Cancelar alerta', () => {
    const e = evento('Em monitoramento', { naoConfirmado: true }, ['Em validação', 'Alerta emitido'])
    expect(rotulos(e)).toEqual(['Confirmar alerta', 'Encerrar', 'Cancelar alerta'])
  })

  it('alerta comum já emitido: Encerrar e Cancelar alerta', () => {
    expect(rotulos(evento('Em monitoramento', {}, ['Confirmado', 'Alerta emitido']))).toEqual(['Encerrar', 'Cancelar alerta'])
  })

  it('Em monitoramento sem nunca ter alertado: Encerrar e Descartar evento', () => {
    const e = evento('Em monitoramento', {}, ['Reportado', 'Confirmado'])
    expect(rotulos(e)).toEqual(['Encerrar', 'Descartar evento'])
    expect(acoesDisponiveis(e, 'agente').at(-1).acao).toBe('agenteRejeita')
  })

  it('Alerta emitido: só Cancelar alerta', () => {
    expect(rotulos(evento('Alerta emitido', {}, ['Confirmado']))).toEqual(['Cancelar alerta'])
  })

  it('Em validação, Reportado, Encerrado e Descartado: nenhum botão no Detalhe', () => {
    ;['Em validação', 'Reportado', 'Encerrado', 'Descartado'].forEach((estado) => {
      expect(rotulos(evento(estado)), estado).toEqual([])
    })
  })
})
