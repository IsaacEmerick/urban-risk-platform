// Coerência dos dados simulados com as regras: confiança e risco calculados batem com o estado gravado
import { describe, expect, it } from 'vitest'
import { criarRepositorio } from './repositorio.js'
import { avaliar, agenteConfirma, agenteRejeita } from './estados.js'
import { taxaAlertasConfiancaAlta, taxaFalsoAlerta } from './eventos.js'
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

  it('taxa de falso alerta dos dados simulados fica abaixo da meta de 10% (RNF11)', () => {
    const { emitidos, falsos, taxa } = taxaFalsoAlerta(eventos)
    expect({ emitidos, falsos }).toEqual({ emitidos: 22, falsos: 2 })
    expect(taxa).toBeLessThan(0.1) // 2 ÷ 22 ≈ 9,1%
  })

  it('todo evento que alertou tem confiancaAlertada', () => {
    eventos
      .filter((e) => e.riscoAlertado)
      .forEach((e) => expect(e.confiancaAlertada, e.id).toBeGreaterThan(0))
  })

  it('2ª meta do RNF11: ≥ 90% dos alertas Alto/Crítico com confiança Alta no momento do alerta', () => {
    const { alertas, comConfiancaAlta, taxa } = taxaAlertasConfiancaAlta(eventos)
    expect({ alertas, comConfiancaAlta }).toEqual({ alertas: 22, comConfiancaAlta: 21 }) // só o evt-03 (preliminar, 60)
    expect(taxa).toBeGreaterThanOrEqual(0.9) // 21 ÷ 22 ≈ 95,5%
  })

  it('as ações do agente funcionam sobre os dados simulados', () => {
    // Alto + confirmado → Alerta emitido (o repositório leva a Em monitoramento depois de notificar)
    expect(agenteConfirma(repo.obterEvento('evt-02'), AGORA).evento.estado).toBe('Alerta emitido')
    expect(agenteConfirma(repo.obterEvento('evt-03'), AGORA).evento.naoConfirmado).toBe(false)
    expect(agenteRejeita(repo.obterEvento('evt-05'), AGORA).efeitos).toEqual(['notificarCancelamento'])
  })
})

describe('eventos históricos (últimos 30 dias)', () => {
  const historicos = eventos.filter((e) => e.id.startsWith('hist-'))
  const TRINTA_DIAS = 30 * 24 * 60 * 60 * 1000

  it('são 20, todos encerrados ou descartados, criados nos últimos 30 dias', () => {
    expect(historicos).toHaveLength(20)
    historicos.forEach((e) => {
      expect(['Encerrado', 'Descartado']).toContain(e.estado)
      expect(AGORA - e.criadoEm).toBeLessThanOrEqual(TRINTA_DIAS)
    })
  })

  it('exatamente 1 deles foi descartado depois de um alerta', () => {
    const descartadosAposAlerta = historicos.filter(
      (e) => e.estado === 'Descartado' && e.historico.some((h) => h.estado === 'Alerta emitido'),
    )
    expect(descartadosAposAlerta.map((e) => e.id)).toEqual(['hist-13'])
  })

  it('cobrem os 3 tipos de risco e os 2 bairros (série para Análises)', () => {
    expect(new Set(historicos.map((e) => e.tipo))).toEqual(new Set(Object.values(TIPOS)))
    expect(new Set(historicos.map((e) => e.bairro))).toEqual(new Set(['Parque Viana', 'Jardim Maria Helena']))
  })

  it('histórico em ordem cronológica e riscoAlertado igual ao risco da medição', () => {
    historicos.forEach((e) => {
      const tempos = e.historico.map((h) => h.em.getTime())
      expect(tempos, e.id).toEqual([...tempos].sort((a, b) => a - b))
      // Interrupções já normalizadas hoje classificam como Baixo; o risco do alerta fica em riscoAlertado
      if (e.riscoAlertado && e.tipo !== TIPOS.INTERRUPCAO) expect(e.risco, e.id).toBe(e.riscoAlertado)
      if (!e.riscoAlertado) expect(['Baixo', 'Moderado'], e.id).toContain(e.risco)
    })
  })
})

describe('repositório — alerta preliminar (RN02) usa o tipo "Alerta" com a marca "não confirmado"', () => {
  it('registro Crítico com confiança Média notifica como Alerta com naoConfirmado', () => {
    const r = criarRepositorio({ agora: AGORA })
    // registro de morador novo no Jardim Maria Helena, longe dos eventos existentes: 40 + 2 confirmações = 60
    r.receberDado(
      {
        id: 'novo-1',
        tipo: 'Alagamento',
        origem: 'Comunidade',
        bairro: 'Jardim Maria Helena',
        lat: -23.5235,
        lng: -46.8665,
        registradoEm: AGORA,
        atualizadoEm: AGORA,
        medicoes: { laminaCm: 40 },
        confirmacoes: 2,
      },
      AGORA,
    )
    const notificacoes = r.listarNotificacoes('usr-ana')
    expect(notificacoes).toHaveLength(1)
    expect(notificacoes[0]).toMatchObject({ tipo: 'Alerta', naoConfirmado: true, risco: 'Crítico' })
    const tipos = new Set(r.listarUsuarios().flatMap((u) => r.listarNotificacoes(u.id).map((n) => n.tipo)))
    expect([...tipos]).toEqual(['Alerta'])
  })
})

describe('repositório — ações do agente com notificações', () => {
  it('Confirmar na fila: evt-02 vira alerta e notifica a Ana; cancelar avisa com "Alerta cancelado"', () => {
    const r = criarRepositorio({ agora: AGORA })
    const confirmado = r.executarAcao('evt-02', 'agenteConfirma', AGORA)
    expect(confirmado.estado).toBe('Em monitoramento')
    // confirmado pelo agente com confiança Média: o alerta guarda 65 (conta contra a 2ª meta do RNF11)
    expect(confirmado).toMatchObject({ riscoAlertado: 'Alto', confiancaAlertada: 65 })
    expect(r.listarNotificacoes('usr-ana').map((n) => n.tipo)).toEqual(['Alerta'])
    expect(r.listarNotificacoes('usr-ana')[0].naoConfirmado).toBe(false) // alerta comum, sem etiqueta

    r.executarAcao('evt-02', 'agenteRejeita', AGORA)
    expect(r.obterEvento('evt-02').estado).toBe('Descartado')
    expect(r.listarNotificacoes('usr-ana').map((n) => n.tipo)).toEqual(['Alerta', 'Alerta cancelado'])
  })
})
