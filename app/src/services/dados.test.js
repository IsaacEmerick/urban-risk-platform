// Coerência dos dados simulados com as regras: confiança e risco calculados batem com o estado gravado
import { describe, expect, it } from 'vitest'
import { criarRepositorio } from './repositorio.js'
import { avaliar, agenteConfirma, agenteRejeita } from './estados.js'
import { taxaFalsoAlerta } from './eventos.js'
import { ESTADOS, NIVEIS_RISCO, ORIGENS, TIPOS } from './parametros.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')
const repo = criarRepositorio({ agora: AGORA })
const eventos = repo.listarEventos()

describe('dados simulados', () => {
  it('cobrem os 3 tipos de risco e as 3 origens', () => {
    const tipos = new Set(eventos.map((e) => e.tipo))
    expect([...tipos].sort()).toEqual(Object.values(TIPOS).sort())
    const origens = new Set(eventos.flatMap((e) => e.dados.map((d) => d.origem.split(' (')[0])))
    expect(origens).toEqual(new Set([ORIGENS.SENSOR, ORIGENS.BASE_PUBLICA, ORIGENS.COMUNIDADE]))
  })

  it.each([
    ['evt-01', 90, 'Moderado', 'Em monitoramento'],
    ['evt-02', 65, 'Alto', 'Em validação'], // exemplo da seção 4.1
    ['evt-03', 60, 'Crítico', 'Em monitoramento'], // alerta preliminar
    ['evt-04', 40, 'Baixo', 'Reportado'],
    ['evt-05', 85, 'Alto', 'Em monitoramento'],
    ['evt-06', 80, 'Moderado', 'Em monitoramento'],
  ])('%s: confiança %i, risco %s, estado %s', (id, confianca, risco, estado) => {
    expect(repo.obterEvento(id)).toMatchObject({ confianca, risco, estado })
  })

  it('cada evento ativo está estável: avaliar() não muda o estado nem gera efeitos', () => {
    eventos.forEach((e) => {
      const r = avaliar(e, AGORA)
      expect(r.evento.estado, e.id).toBe(e.estado)
      expect(r.efeitos, e.id).toEqual([])
    })
  })

  it('estados, níveis de risco e origens usam só nomes do glossário', () => {
    const estados = Object.values(ESTADOS)
    eventos.forEach((e) => {
      expect(estados).toContain(e.estado)
      e.historico.forEach((h) => expect(estados).toContain(h.estado))
      expect(NIVEIS_RISCO).toContain(e.risco)
      e.dados.forEach((d) => expect(Object.values(ORIGENS)).toContain(d.origem))
    })
  })

  it('evt-03 tem o alerta preliminar "não confirmado"', () => {
    expect(repo.obterEvento('evt-03').naoConfirmado).toBe(true)
  })

  it('prioridade do evt-02 (Alto, 65, perto de escola) = 58,8', () => {
    expect(repo.obterEvento('evt-02').prioridade).toBe(58.8)
  })

  it('registros da Ana aparecem só pelo pseudônimo (LGPD)', () => {
    const ana = repo.obterUsuario('usr-ana')
    const registros = eventos.flatMap((e) => e.dados).filter((d) => d.autorPseudonimo === ana.pseudonimo)
    expect(registros.map((d) => d.id).sort()).toEqual(['dado-02-ana', 'dado-07-ana'])
    eventos.flatMap((e) => e.dados).forEach((d) => expect(d).not.toHaveProperty('autorId'))
  })

  it('taxa de falso alerta dos dados simulados (RNF11)', () => {
    expect(taxaFalsoAlerta(eventos)).toMatchObject({ emitidos: 4, falsos: 1 })
  })

  it('as ações do agente funcionam sobre os dados simulados', () => {
    // Alto + confirmado → Alerta emitido (o repositório leva a Em monitoramento depois de notificar)
    expect(agenteConfirma(repo.obterEvento('evt-02'), AGORA).evento.estado).toBe('Alerta emitido')
    expect(agenteConfirma(repo.obterEvento('evt-03'), AGORA).evento.naoConfirmado).toBe(false)
    expect(agenteRejeita(repo.obterEvento('evt-05'), AGORA).efeitos).toEqual(['notificarCancelamento'])
  })
})

describe('repositório — ações do agente com notificações', () => {
  it('Confirmar na fila: evt-02 vira alerta e notifica a Ana; cancelar avisa com "Alerta cancelado"', () => {
    const r = criarRepositorio({ agora: AGORA })
    const confirmado = r.executarAcao('evt-02', 'agenteConfirma', AGORA)
    expect(confirmado.estado).toBe('Em monitoramento')
    expect(r.listarNotificacoes('usr-ana').map((n) => n.tipo)).toEqual(['Alerta'])

    r.executarAcao('evt-02', 'agenteRejeita', AGORA)
    expect(r.obterEvento('evt-02').estado).toBe('Descartado')
    expect(r.listarNotificacoes('usr-ana').map((n) => n.tipo)).toEqual(['Alerta', 'Alerta cancelado'])
  })
})
