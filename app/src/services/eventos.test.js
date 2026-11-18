import { describe, expect, it } from 'vitest'
import { agruparDado, consolidarEvento, taxaFalsoAlerta } from './eventos.js'
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
