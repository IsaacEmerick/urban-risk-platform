import { describe, expect, it } from 'vitest'
import { agruparDado, alertasAtivos, consolidarEvento, dadoPrincipal, taxaAlertasConfiancaAlta, taxaFalsoAlerta } from './eventos.js'
import { riscoRelatado } from './eventos.js'
import { deslocarParaNorte } from './geo.js'
import { MINUTO } from './parametros.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')
const PONTO = { lat: -23.5293, lng: -46.8638 } // Jardim Maria Helena
const antes = (min) => new Date(AGORA.getTime() - min * MINUTO)

const dado = (extras = {}) => ({
  id: `d-${Math.random()}`,
  tipo: 'Alagamento',
  origem: 'Comunidade',
  ...PONTO,
  registradoEm: AGORA,
  atualizadoEm: AGORA,
  medicoes: {},
  ...extras,
})
const evento = (extras = {}) => ({ id: 'e1', tipo: 'Alagamento', estado: 'Em monitoramento', historico: [], dados: [dado()], ...extras })

describe('RN04 — agrupamento (mesmo tipo, 300 m, 60 min)', () => {
  it('300 m entra no evento; 301 m cria evento novo', () => {
    const eventos = [evento()]
    expect(agruparDado(dado(deslocarParaNorte(PONTO, 300)), eventos)?.id).toBe('e1')
    expect(agruparDado(dado(deslocarParaNorte(PONTO, 301)), eventos)).toBeNull()
  })

  it('60 min entra; 61 min não', () => {
    const eventos = [evento({ dados: [dado({ registradoEm: antes(60) })] })]
    expect(agruparDado(dado(), eventos)?.id).toBe('e1')
    const eventosAntigos = [evento({ dados: [dado({ registradoEm: antes(61) })] })]
    expect(agruparDado(dado(), eventosAntigos)).toBeNull()
  })

  it('tipo diferente não agrupa', () => {
    expect(agruparDado(dado({ tipo: 'Ilha de calor' }), [evento()])).toBeNull()
  })

  it('evento Encerrado ou Descartado não recebe dados novos', () => {
    expect(agruparDado(dado(), [evento({ estado: 'Encerrado' })])).toBeNull()
    expect(agruparDado(dado(), [evento({ estado: 'Descartado' })])).toBeNull()
  })
})

describe('RN07 — risco e confiança do evento = maior valor entre os dados', () => {
  it('pega a maior confiança e o maior risco, mesmo vindos de dados diferentes', () => {
    const e = evento({
      vulnerabilidades: [],
      dados: [
        dado({ id: 'a', origem: 'Comunidade', medicoes: { laminaCm: 35 } }), // 40, Crítico
        dado({ id: 'b', origem: 'Base pública', fonteId: 'cemaden', ...deslocarParaNorte(PONTO, 2000), medicoes: { chuvaMmH: 12 } }), // 85, Moderado
      ],
    })
    const consolidado = consolidarEvento(e, { agora: AGORA })
    expect(consolidado.confianca).toBe(85)
    expect(consolidado.faixaConfianca).toBe('Alta')
    expect(consolidado.risco).toBe('Crítico')
    expect(consolidado.prioridade).toBe(85) // 4 × 25 × 0,85
    expect(consolidado.dados[0].confianca.valor).toBe(40)
  })
})

describe('RNF11 — taxa de falso alerta', () => {
  const comHistorico = (estados, estado) => ({ estado, historico: estados.map((e) => ({ estado: e })) })
  it('descartados que passaram por Alerta emitido ÷ alertas emitidos', () => {
    const eventos = [
      comHistorico(['Reportado', 'Confirmado', 'Alerta emitido', 'Em monitoramento', 'Descartado'], 'Descartado'),
      comHistorico(['Reportado', 'Confirmado', 'Alerta emitido', 'Em monitoramento', 'Encerrado'], 'Encerrado'),
      comHistorico(['Reportado', 'Confirmado', 'Alerta emitido', 'Em monitoramento'], 'Em monitoramento'),
      comHistorico(['Reportado', 'Confirmado', 'Alerta emitido', 'Em monitoramento'], 'Em monitoramento'),
      comHistorico(['Reportado', 'Em validação', 'Descartado'], 'Descartado'), // não foi alerta: não conta
    ]
    expect(taxaFalsoAlerta(eventos)).toEqual({ emitidos: 4, falsos: 1, taxa: 0.25 })
  })
  it('sem alertas, taxa 0', () => {
    expect(taxaFalsoAlerta([]).taxa).toBe(0)
  })
})

describe('RNF11 (2ª meta) — alertas Alto/Crítico com confiança Alta no momento do alerta', () => {
  const alertado = (riscoAlertado, confiancaAlertada, extras = {}) => ({
    estado: 'Em monitoramento',
    historico: [{ estado: 'Alerta emitido' }],
    riscoAlertado,
    confiancaAlertada,
    confianca: 50, // confiança de agora (ex.: dado desatualizado): não deve ser usada
    ...extras,
  })

  it('usa confiancaAlertada: 75 conta como Alta, 74 não', () => {
    const r = taxaAlertasConfiancaAlta([alertado('Alto', 75), alertado('Crítico', 90), alertado('Alto', 74), alertado('Crítico', 60)])
    expect(r).toEqual({ alertas: 4, comConfiancaAlta: 2, taxa: 0.5 })
  })

  it('ignora eventos que nunca alertaram', () => {
    const semAlerta = { estado: 'Em monitoramento', historico: [{ estado: 'Confirmado' }], riscoAlertado: null, confiancaAlertada: null }
    expect(taxaAlertasConfiancaAlta([alertado('Alto', 90), semAlerta])).toEqual({ alertas: 1, comConfiancaAlta: 1, taxa: 1 })
  })

  it('conta alertas descartados depois (também foram alertas emitidos)', () => {
    const r = taxaAlertasConfiancaAlta([alertado('Alto', 85, { estado: 'Descartado' })])
    expect(r.alertas).toBe(1)
  })

  it('sem alertas, taxa 0', () => {
    expect(taxaAlertasConfiancaAlta([]).taxa).toBe(0)
  })
})

describe('dadoPrincipal e alertasAtivos (telas)', () => {
  const dado = (id, valor) => ({ id, confianca: { valor } })
  it('dadoPrincipal = o dado de maior confiança (RN07); empate fica com o primeiro', () => {
    expect(dadoPrincipal({ dados: [dado('a', 65), dado('b', 90), dado('c', 80)] }).id).toBe('b')
    expect(dadoPrincipal({ dados: [dado('a', 80), dado('b', 80)] }).id).toBe('a')
  })
  it('alertasAtivos: ativo e já passou por Alerta emitido', () => {
    const ev = (id, estado, estados) => ({ id, estado, historico: estados.map((e) => ({ estado: e })) })
    const eventos = [
      ev('alertou', 'Em monitoramento', ['Confirmado', 'Alerta emitido', 'Em monitoramento']),
      ev('sem-alerta', 'Em monitoramento', ['Confirmado', 'Em monitoramento']),
      ev('encerrado', 'Encerrado', ['Alerta emitido', 'Encerrado']),
    ]
    expect(alertasAtivos(eventos).map((e) => e.id)).toEqual(['alertou'])
  })
})

describe('riscoRelatado() — selo vazado enquanto o evento não foi confirmado (RF06, RF07)', () => {
  it.each([
    ['Reportado', true],
    ['Em validação', true],
    ['Confirmado', false],
    ['Alerta emitido', false],
    ['Em monitoramento', false],
    ['Encerrado', false],
    ['Descartado', false],
  ])('%s → relatado = %s', (estado, esperado) => {
    expect(riscoRelatado({ estado })).toBe(esperado)
  })
})
