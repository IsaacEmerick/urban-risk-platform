// "Também vejo isso" (RF17): regras da confirmação e a demonstração do evt-02 (65 → 75 → alerta)
import { describe, expect, it } from 'vitest'
import bairros from '../data/bairros.json'
import { criarRepositorio } from './repositorio.js'
import { MOTIVOS, podeConfirmar, registrosDoUsuario } from './confirmacao.js'
import { criarDadoComunitario } from './registro.js'
import { foiAlertaPreliminar, resumoAlertasPreliminares } from './eventos.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')

describe('demonstração: Ana confirma o evt-02', () => {
  it('65 → 75 → Confirmado → Alerta emitido → Em monitoramento, com notificação para a Ana', () => {
    const r = criarRepositorio({ agora: AGORA })
    const antes = r.obterEvento('evt-02')
    expect(antes).toMatchObject({ confianca: 65, estado: 'Em validação' })

    const depois = r.confirmarOcorrencia('evt-02', 'usr-ana', AGORA)
    expect(depois).toMatchObject({
      confianca: 75,
      faixaConfianca: 'Alta',
      risco: 'Alto',
      estado: 'Em monitoramento',
      riscoAlertado: 'Alto',
      confiancaAlertada: 75, // conta a favor da 2ª meta do RNF11
      prioridade: 66.3, // 3 × 25 × 0,75 + 10 (escola)
      confirmadoPor: ['usr-ana'],
    })
    expect(depois.historico.slice(-3).map((h) => h.estado)).toEqual(['Confirmado', 'Alerta emitido', 'Em monitoramento'])
    expect(depois.dados[0].confirmacoes).toBe(3)

    const notificacoes = r.listarNotificacoes('usr-ana').filter((n) => n.eventoId === 'evt-02')
    expect(notificacoes).toHaveLength(1)
    expect(notificacoes[0]).toMatchObject({ tipo: 'Alerta', risco: 'Alto', confianca: 75, naoConfirmado: false, lida: false })
  })
})

describe('podeConfirmar()', () => {
  const r = criarRepositorio({ agora: AGORA })
  const ana = r.obterUsuario('usr-ana')
  const carlos = r.obterUsuario('usr-carlos')

  it('uma confirmação por usuário por evento', () => {
    const r2 = criarRepositorio({ agora: AGORA })
    r2.confirmarOcorrencia('evt-02', 'usr-ana', AGORA)
    expect(podeConfirmar(r2.obterEvento('evt-02'), ana)).toEqual({ pode: false, motivo: MOTIVOS.JA_CONFIRMOU })
    expect(() => r2.confirmarOcorrencia('evt-02', 'usr-ana', AGORA)).toThrow()
  })

  it('quem registrou não confirma o próprio registro (evt-04 é da Ana)', () => {
    expect(podeConfirmar(r.obterEvento('evt-04'), ana)).toEqual({ pode: false, motivo: MOTIVOS.PROPRIO_REGISTRO })
  })

  it('evento só de sensor não tem registro para confirmar', () => {
    expect(podeConfirmar(r.obterEvento('evt-01'), ana).motivo).toBe(MOTIVOS.SEM_REGISTRO_COMUNITARIO)
  })

  it('evento encerrado e perfil que não é morador não confirmam', () => {
    expect(podeConfirmar(r.obterEvento('evt-07'), ana).motivo).toBe(MOTIVOS.EVENTO_ENCERRADO)
    expect(podeConfirmar(r.obterEvento('evt-02'), carlos).motivo).toBe(MOTIVOS.NAO_MORADOR)
    expect(podeConfirmar(r.obterEvento('evt-02'), ana)).toEqual({ pode: true })
  })

  it('se o registro da Ana foi agrupado no evt-02 (RN04), ela não confirma o evt-02', () => {
    const r2 = criarRepositorio({ agora: AGORA })
    const evt02 = r2.obterEvento('evt-02')
    const dado = criarDadoComunitario({
      tipo: 'Alagamento',
      posicao: { lat: evt02.lat + 0.0005, lng: evt02.lng },
      alturaAgua: 'meioFio',
      usuario: ana,
      bairros,
      agora: AGORA,
    })
    r2.registrarOcorrencia(dado, AGORA)
    expect(podeConfirmar(r2.obterEvento('evt-02'), ana).motivo).toBe(MOTIVOS.PROPRIO_REGISTRO)
  })

  it('acima de 3 confirmações a contagem continua, mas a confiança não soma mais', () => {
    const r2 = criarRepositorio({ agora: AGORA })
    const vizinho = { id: 'usr-teste', perfil: 'morador', pseudonimo: 'p-0000' }
    r2.confirmarOcorrencia('evt-02', 'usr-ana', AGORA) // 3 confirmações → 75
    r2.listarUsuarios().push(vizinho)
    const depois = r2.confirmarOcorrencia('evt-02', 'usr-teste', AGORA)
    expect(depois.dados[0].confirmacoes).toBe(4)
    expect(depois.confianca).toBe(75)
  })
})

describe('alerta preliminar + confirmações de moradores (RN02)', () => {
  const vizinho = { id: 'usr-vizinho', perfil: 'morador', pseudonimo: 'p-0001' }

  it('evt-03 (40 + 20 = 60) chega no máximo a 70 só com moradores: a marca continua', () => {
    const r = criarRepositorio({ agora: AGORA })
    r.listarUsuarios().push(vizinho)
    r.confirmarOcorrencia('evt-03', 'usr-ana', AGORA)
    const depois = r.confirmarOcorrencia('evt-03', 'usr-vizinho', AGORA)
    expect(depois).toMatchObject({ confianca: 70, naoConfirmado: true, estado: 'Em monitoramento' }) // 3 confirmações no máximo
  })

  it('preliminar com foto (65) + 1 confirmação = 75: perde a marca, "Alerta confirmado", confiancaAlertada fica 65', () => {
    const r = criarRepositorio({ agora: AGORA })
    // registro de morador novo no Jardim Maria Helena, longe dos eventos: 40 + 20 + 5 (foto) = 65, Crítico
    const preliminar = r.receberDado(
      {
        id: 'novo-preliminar',
        tipo: 'Alagamento',
        origem: 'Comunidade',
        autorPseudonimo: 'p-0002',
        bairro: 'Jardim Maria Helena',
        lat: -23.5235,
        lng: -46.8665,
        registradoEm: AGORA,
        atualizadoEm: AGORA,
        medicoes: { laminaCm: 40 },
        confirmacoes: 2,
        fotoGeolocalizada: true,
      },
      AGORA,
    )
    expect(preliminar).toMatchObject({ confianca: 65, naoConfirmado: true, estado: 'Em monitoramento' })
    const doEvento = () => r.listarNotificacoes('usr-ana').filter((n) => n.eventoId === preliminar.id)
    expect(doEvento().map((n) => n.tipo)).toEqual(['Alerta'])

    const depois = r.confirmarOcorrencia(preliminar.id, 'usr-ana', AGORA)
    expect(depois).toMatchObject({ confianca: 75, naoConfirmado: false, estado: 'Em monitoramento', confiancaAlertada: 65 })
    // Nenhum alerta novo: só o aviso "Alerta confirmado", com a confiança do momento (75); o preliminar continua igual
    const [antigo, confirmacao] = doEvento()
    expect(antigo).toMatchObject({ tipo: 'Alerta', naoConfirmado: true, confianca: 65 })
    expect(confirmacao).toMatchObject({ tipo: 'Alerta confirmado', risco: 'Crítico', confianca: 75, faixaConfianca: 'Alta', naoConfirmado: false, lida: false })
    expect(confirmacao.motivo).toBe('Confirmado: a confiança chegou a Alta')
    expect(doEvento()).toHaveLength(2)
    // Análises: conta como "preliminar confirmado depois", igual à confirmação do agente
    expect(foiAlertaPreliminar(depois)).toBe(true)
    expect(resumoAlertasPreliminares([depois])).toEqual({ houve: 1, confirmadosDepois: 1 })
  })
})

describe('registrosDoUsuario() — Meus registros', () => {
  it('Ana começa com evt-04 (Reportado) e evt-07 (Encerrado), do mais recente para o mais antigo', () => {
    const r = criarRepositorio({ agora: AGORA })
    const registros = registrosDoUsuario(r.listarEventos(), r.obterUsuario('usr-ana'))
    expect(registros.map(({ evento }) => [evento.id, evento.estado])).toEqual([
      ['evt-04', 'Reportado'],
      ['evt-07', 'Encerrado'],
    ])
    expect(registros[1].dado.confirmacoes).toBe(3)
  })
})
