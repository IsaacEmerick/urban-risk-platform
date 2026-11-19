// Sessão 6b: cadastro, preferências (RF13), consentimentos e direitos do titular (RF16, RNF09),
// a RN06 com o consentimento ativo e a sessão (Sair não reinicia os dados).
import { describe, expect, it } from 'vitest'
import usuariosJson from '../data/usuarios.json'
import { criarRepositorio } from './repositorio.js'
import { criarLeitura } from './simulador.js'
import {
  ACOES_ACESSO,
  BASE_LEGAL_EXECUCAO,
  FINALIDADES,
  consentimentoAtivo,
  criarMorador,
  podeReceberNotificacoes,
  rotuloArea,
  validarCadastro,
  validarPreferencias,
} from './conta.js'
import { entrarNaSessao, lerSessao, sairDaSessao } from './sessao.js'

const AGORA = new Date('2026-11-17T18:00:00-03:00')
const DEPOIS = new Date(AGORA.getTime() + 60_000)

// Rio na cota de alerta (falta 0,50 m): o evt-01 vira Alto e alerta (RN01)
function alertaDoRio(repo, momento = DEPOIS) {
  repo.receberDado(criarLeitura(repo.obterSensor('sensor-cotia-01'), 3.7, momento), momento)
}
const notificacoesDe = (repo, usuarioId, eventoId) => repo.listarNotificacoes(usuarioId).filter((n) => n.eventoId === eventoId)

// Armazenamento falso (no lugar do localStorage)
function armazenamentoFalso() {
  const dados = new Map()
  return { getItem: (k) => dados.get(k) ?? null, setItem: (k, v) => dados.set(k, v), removeItem: (k) => dados.delete(k) }
}

describe('a Ana padrão não muda', () => {
  it('áreas, tipos, canais e os dois consentimentos com data e finalidade', () => {
    const ana = criarRepositorio({ agora: AGORA }).obterUsuario('usr-ana')
    expect(ana.areasInteresse.map((a) => a.bairro)).toEqual(['Parque Viana', 'Jardim Maria Helena'])
    expect(ana.tiposRisco).toEqual(['Alagamento', 'Ilha de calor', 'Interrupção de serviço'])
    expect(ana.canais).toEqual(['Push', 'SMS'])
    expect(ana.consentimentos.map((c) => c.finalidade)).toEqual([FINALIDADES.CADASTRO, FINALIDADES.NOTIFICACOES])
    ana.consentimentos.forEach((c) => {
      expect(c.concedidoEm).toBeInstanceOf(Date)
      expect(c.revogadoEm).toBeNull()
    })
  })

  it('Carlos e Juliana não têm consentimento: a base legal é execução de políticas públicas', () => {
    usuariosJson.filter((u) => u.perfil !== 'morador').forEach((u) => expect(u.consentimentos).toBeUndefined())
    const repo = criarRepositorio({ agora: AGORA })
    expect(podeReceberNotificacoes(repo.obterUsuario('usr-carlos'))).toBe(true)
    expect(BASE_LEGAL_EXECUCAO).toBe('Execução de políticas públicas (art. 7º, III)')
  })
})

describe('RN06 com as preferências salvas (RF13)', () => {
  it('Ana padrão recebe o alerta do rio', () => {
    const repo = criarRepositorio({ agora: AGORA })
    alertaDoRio(repo)
    expect(notificacoesDe(repo, 'usr-ana', 'evt-01').map((n) => n.tipo)).toEqual(['Alerta'])
  })

  it('Ana sem Alagamento nos tipos não recebe', () => {
    const repo = criarRepositorio({ agora: AGORA })
    const ana = repo.obterUsuario('usr-ana')
    repo.atualizarPreferencias('usr-ana', { ...ana, tiposRisco: ['Ilha de calor', 'Interrupção de serviço'] }, AGORA)
    alertaDoRio(repo)
    expect(notificacoesDe(repo, 'usr-ana', 'evt-01')).toEqual([])
  })

  it('Ana só com um ponto de 500 m longe do rio (~2,2 km ao norte) não recebe', () => {
    const repo = criarRepositorio({ agora: AGORA })
    const ana = repo.obterUsuario('usr-ana')
    const evt01 = repo.obterEvento('evt-01')
    const longe = { tipo: 'ponto', lat: evt01.lat + 0.02, lng: evt01.lng, raioM: 500 }
    repo.atualizarPreferencias('usr-ana', { ...ana, areasInteresse: [longe] }, AGORA)
    expect(repo.obterUsuario('usr-ana').areasInteresse).toEqual([longe])
    alertaDoRio(repo)
    expect(notificacoesDe(repo, 'usr-ana', 'evt-01')).toEqual([])
    expect(notificacoesDe(repo, 'usr-carlos', 'evt-01')).toHaveLength(1) // o Carlos continua recebendo
  })

  it('a área por bairro salva vira círculo (centro + raio) na hora', () => {
    const repo = criarRepositorio({ agora: AGORA })
    const ana = repo.obterUsuario('usr-ana')
    repo.atualizarPreferencias('usr-ana', { ...ana, areasInteresse: [{ tipo: 'bairro', bairro: 'Jardim Maria Helena' }] }, AGORA)
    const [area] = repo.obterUsuario('usr-ana').areasInteresse
    const jmh = repo.listarBairros().find((b) => b.nome === 'Jardim Maria Helena')
    expect(area).toMatchObject({ tipo: 'bairro', lat: jmh.lat, lng: jmh.lng, raioM: jmh.raioM })
  })
})

describe('revogar "Áreas de interesse e notificações de risco": nenhuma notificação (LGPD, RN06)', () => {
  const revogada = () => {
    const repo = criarRepositorio({ agora: AGORA })
    repo.revogarConsentimento('usr-ana', FINALIDADES.NOTIFICACOES, AGORA)
    return repo
  }

  it('nem Alerta (rio)', () => {
    const repo = revogada()
    alertaDoRio(repo)
    expect(notificacoesDe(repo, 'usr-ana', 'evt-01')).toEqual([])
    expect(notificacoesDe(repo, 'usr-carlos', 'evt-01')).toHaveLength(1)
  })

  it('nem "Alerta cancelado", mesmo tendo recebido o alerta do evt-05 antes de revogar', () => {
    const repo = revogada()
    expect(notificacoesDe(repo, 'usr-ana', 'evt-05').map((n) => n.tipo)).toEqual(['Alerta'])
    repo.executarAcao('evt-05', 'agenteRejeita', DEPOIS)
    expect(notificacoesDe(repo, 'usr-ana', 'evt-05').map((n) => n.tipo)).toEqual(['Alerta'])
    expect(notificacoesDe(repo, 'usr-carlos', 'evt-05').map((n) => n.tipo)).toContain('Alerta cancelado')
  })

  it('nem "Alerta confirmado", mesmo tendo recebido o preliminar do evt-03', () => {
    const repo = revogada()
    expect(notificacoesDe(repo, 'usr-ana', 'evt-03')).toMatchObject([{ tipo: 'Alerta', naoConfirmado: true }])
    repo.executarAcao('evt-03', 'agenteConfirma', DEPOIS)
    expect(notificacoesDe(repo, 'usr-ana', 'evt-03').map((n) => n.tipo)).toEqual(['Alerta'])
    expect(notificacoesDe(repo, 'usr-carlos', 'evt-03').map((n) => n.tipo)).toContain('Alerta confirmado')
  })

  it('a revogação fica guardada com data; autorizar de novo grava outra data e volta a notificar', () => {
    const repo = revogada()
    const [, revogado] = repo.obterUsuario('usr-ana').consentimentos
    expect(revogado.revogadoEm).toEqual(AGORA)
    repo.autorizarConsentimento('usr-ana', FINALIDADES.NOTIFICACOES, DEPOIS)
    const ana = repo.obterUsuario('usr-ana')
    expect(ana.consentimentos).toHaveLength(3)
    expect(ana.consentimentos.at(-1)).toMatchObject({ finalidade: FINALIDADES.NOTIFICACOES, concedidoEm: DEPOIS, revogadoEm: null })
    expect(consentimentoAtivo(ana, FINALIDADES.NOTIFICACOES)).toBe(true)
    alertaDoRio(repo)
    expect(notificacoesDe(repo, 'usr-ana', 'evt-01')).toHaveLength(1)
  })

  it('"Cadastro e autenticação" não se revoga sozinho', () => {
    const repo = criarRepositorio({ agora: AGORA })
    expect(() => repo.revogarConsentimento('usr-ana', FINALIDADES.CADASTRO, AGORA)).toThrow(/excluir a conta/)
  })
})

describe('cadastro do morador (RF15, RF16)', () => {
  const usuarios = criarRepositorio({ agora: AGORA }).listarUsuarios()

  it('valida nome, e-mail (formato e repetido) e o consentimento obrigatório', () => {
    expect(validarCadastro({ nome: '', email: 'x', aceitaCadastro: false }, usuarios)).toEqual({
      nome: expect.any(String),
      email: expect.any(String),
      aceitaCadastro: expect.any(String),
    })
    expect(validarCadastro({ nome: 'Rita', email: 'ANA@exemplo.com', aceitaCadastro: true }, usuarios).email).toMatch(/Já existe/)
    expect(validarCadastro({ nome: 'Rita', email: 'rita@exemplo.com', aceitaCadastro: true }, usuarios)).toEqual({})
  })

  it('morador novo: sem área, 3 tipos, Push e consentimentos com data e finalidade', () => {
    const rita = criarMorador({ nome: ' Rita ', email: 'Rita@Exemplo.com', autorizaNotificacoes: false }, { usuariosExistentes: usuarios, agora: AGORA })
    expect(rita).toMatchObject({ nome: 'Rita', email: 'rita@exemplo.com', perfil: 'morador', areasInteresse: [], canais: ['Push'] })
    expect(rita.tiposRisco).toHaveLength(3)
    expect(rita.pseudonimo).toMatch(/^p-[0-9a-f]{4}$/)
    expect(usuarios.map((u) => u.pseudonimo)).not.toContain(rita.pseudonimo)
    expect(rita.consentimentos).toEqual([{ finalidade: FINALIDADES.CADASTRO, concedidoEm: AGORA, revogadoEm: null }])
  })

  it('o pseudônimo nunca repete um que já existe', () => {
    const sequencia = [0x7f3a / 0x10000, 0x0001 / 0x10000] // o primeiro sorteio é o da Ana
    const novo = criarMorador({ nome: 'Rita', email: 'r@e.com', autorizaNotificacoes: false }, { usuariosExistentes: usuarios, agora: AGORA, aleatorio: () => sequencia.shift() })
    expect(novo.pseudonimo).toBe('p-0001')
  })

  it('cadastro → Preferências: sem o consentimento opcional não recebe; com ele, recebe', () => {
    const repo = criarRepositorio({ agora: AGORA })
    const evt01 = repo.obterEvento('evt-01')
    const area = { tipo: 'ponto', lat: evt01.lat, lng: evt01.lng, raioM: 500 }
    const semNotificacoes = criarMorador({ nome: 'Rita', email: 'rita@exemplo.com', autorizaNotificacoes: false }, { usuariosExistentes: repo.listarUsuarios(), agora: AGORA })
    repo.criarUsuario(semNotificacoes, AGORA)
    const comNotificacoes = criarMorador({ nome: 'Beto', email: 'beto@exemplo.com', autorizaNotificacoes: true }, { usuariosExistentes: repo.listarUsuarios(), agora: AGORA })
    repo.criarUsuario(comNotificacoes, AGORA)
    ;[semNotificacoes, comNotificacoes].forEach((u) => repo.atualizarPreferencias(u.id, { ...u, areasInteresse: [area] }, AGORA))
    alertaDoRio(repo)
    expect(notificacoesDe(repo, semNotificacoes.id, 'evt-01')).toEqual([])
    expect(notificacoesDe(repo, comNotificacoes.id, 'evt-01')).toHaveLength(1)
    expect(repo.historicoDeAcesso(comNotificacoes.id).map((a) => a.acao)).toEqual([ACOES_ACESSO.CRIOU_CONTA, ACOES_ACESSO.ALTEROU_PREFERENCIAS])
  })
})

describe('validarPreferencias (RF13): ≥ 1 área, ≥ 1 tipo, ≥ 1 canal', () => {
  it('aponta cada lista vazia e aceita a Ana padrão', () => {
    expect(validarPreferencias({ areasInteresse: [], tiposRisco: [], canais: [] })).toEqual({
      areas: expect.any(String),
      tipos: expect.any(String),
      canais: expect.any(String),
    })
    expect(validarPreferencias(criarRepositorio({ agora: AGORA }).obterUsuario('usr-ana'))).toEqual({})
  })

  it('rótulo da área: bairro pelo nome; ponto pelo bairro mais perto e o raio', () => {
    const bairros = criarRepositorio({ agora: AGORA }).listarBairros()
    const jmh = bairros.find((b) => b.nome === 'Jardim Maria Helena')
    expect(rotuloArea({ tipo: 'bairro', bairro: 'Parque Viana' }, bairros)).toBe('Parque Viana')
    expect(rotuloArea({ tipo: 'ponto', lat: jmh.lat, lng: jmh.lng, raioM: 1000 }, bairros)).toBe('Ponto perto de Jardim Maria Helena, raio de 1 km')
  })
})

describe('exportar os dados (RF16): só os do titular', () => {
  it('o JSON da Ana não traz id, nome, e-mail nem pseudônimo de outras pessoas', () => {
    const repo = criarRepositorio({ agora: AGORA })
    repo.confirmarOcorrencia('evt-02', 'usr-ana', AGORA) // confirmadoPor do evt-02 passa a ter a Ana
    const json = JSON.stringify(repo.exportarDados('usr-ana', AGORA))
    const outros = repo.listarUsuarios().filter((u) => u.id !== 'usr-ana')
    outros.forEach((u) => {
      expect(json).not.toContain(u.id)
      expect(json).not.toContain(u.nome)
      expect(json).not.toContain(u.email)
      expect(json).not.toContain(u.pseudonimo)
    })
    // Autores de outros registros e quem confirmou (confirmadoPor) também ficam de fora
    const pseudonimosDeOutros = repo
      .listarEventos()
      .flatMap((e) => e.dados.map((d) => d.autorPseudonimo))
      .filter((p) => p && p !== 'p-7f3a')
    expect(pseudonimosDeOutros.length).toBeGreaterThan(0)
    pseudonimosDeOutros.forEach((p) => expect(json).not.toContain(p))
    expect(json).not.toContain('confirmadoPor')
    expect(json).not.toContain('usr-')
  })

  it('traz identificação, preferências, consentimentos, os dois registros, as notificações e o histórico', () => {
    const repo = criarRepositorio({ agora: AGORA })
    const dados = repo.exportarDados('usr-ana', AGORA)
    expect(dados.titular).toEqual({ nome: 'Ana', email: 'ana@exemplo.com', pseudonimo: 'p-7f3a', perfil: 'morador' })
    expect(dados.preferencias.areasInteresse.map((a) => a.descricao)).toEqual(['Parque Viana', 'Jardim Maria Helena'])
    expect(dados.consentimentos).toHaveLength(2)
    expect(dados.registros.map((r) => r.eventoId).sort()).toEqual(['evt-04', 'evt-07'])
    expect(dados.notificacoes).toHaveLength(repo.listarNotificacoes('usr-ana').length)
    expect(dados.historicoDeAcesso.map((a) => a.acao)).toEqual([ACOES_ACESSO.EXPORTOU])
  })

  it('agente: base legal no lugar dos consentimentos, sem registros', () => {
    const dados = criarRepositorio({ agora: AGORA }).exportarDados('usr-carlos', AGORA)
    expect(dados.baseLegal).toBe(BASE_LEGAL_EXECUCAO)
    expect(dados).not.toHaveProperty('consentimentos')
    expect(dados).not.toHaveProperty('registros')
  })
})

describe('excluir a conta (RF16)', () => {
  it('apaga o usuário e as notificações; os eventos guardam só o pseudônimo, que não aponta para ninguém', () => {
    const repo = criarRepositorio({ agora: AGORA })
    repo.excluirUsuario('usr-ana')
    expect(repo.obterUsuario('usr-ana')).toBeUndefined()
    expect(repo.listarNotificacoes('usr-ana')).toEqual([])
    expect(repo.obterEvento('evt-04').dados[0].autorPseudonimo).toBe('p-7f3a')
    expect(repo.listarUsuarios().some((u) => u.pseudonimo === 'p-7f3a')).toBe(false)
    alertaDoRio(repo) // a RN06 segue funcionando sem ela
    expect(notificacoesDe(repo, 'usr-carlos', 'evt-01')).toHaveLength(1)
  })

  it('recarregar restaura: um repositório novo tem a Ana de volta', () => {
    criarRepositorio({ agora: AGORA }).excluirUsuario('usr-ana')
    expect(criarRepositorio({ agora: AGORA }).obterUsuario('usr-ana')).toBeDefined()
  })
})

describe('sessão (RF15) e histórico de acesso (RNF09)', () => {
  it('Sair volta ao Login sem reiniciar os dados em memória', () => {
    const repo = criarRepositorio({ agora: AGORA })
    const armazenamento = armazenamentoFalso()
    entrarNaSessao(repo, 'usr-ana', { armazenamento, momento: AGORA })
    expect(lerSessao(armazenamento)).toBe('usr-ana')
    repo.confirmarOcorrencia('evt-02', 'usr-ana', AGORA)
    const eventosAntes = repo.listarEventos()
    const notificacoesAntes = repo.listarNotificacoes('usr-ana')
    sairDaSessao(repo, 'usr-ana', { armazenamento, momento: DEPOIS })
    expect(lerSessao(armazenamento)).toBeNull()
    expect(repo.listarEventos()).toBe(eventosAntes)
    expect(repo.obterEvento('evt-02').estado).toBe('Em monitoramento')
    expect(repo.listarNotificacoes('usr-ana')).toEqual(notificacoesAntes)
  })

  it('registra entrou, consultou, exportou, revogou, solicitação de exclusão e saiu, com data', () => {
    const repo = criarRepositorio({ agora: AGORA })
    const armazenamento = armazenamentoFalso()
    entrarNaSessao(repo, 'usr-ana', { armazenamento, momento: AGORA })
    repo.registrarAcesso('usr-ana', ACOES_ACESSO.CONSULTOU, AGORA)
    repo.exportarDados('usr-ana', AGORA)
    repo.revogarConsentimento('usr-ana', FINALIDADES.NOTIFICACOES, AGORA)
    repo.registrarAcesso('usr-juliana', ACOES_ACESSO.SOLICITOU_EXCLUSAO, AGORA)
    sairDaSessao(repo, 'usr-ana', { armazenamento, momento: DEPOIS })
    expect(repo.historicoDeAcesso('usr-ana').map((a) => a.acao)).toEqual([
      'Entrou',
      'Consultou os dados',
      'Exportou os dados',
      'Revogou o consentimento “Áreas de interesse e notificações de risco”',
      'Saiu',
    ])
    expect(repo.historicoDeAcesso('usr-ana').at(-1).em).toEqual(DEPOIS)
    expect(repo.historicoDeAcesso('usr-juliana').map((a) => a.acao)).toEqual(['Solicitação de exclusão enviada ao órgão responsável'])
    expect(repo.obterUsuario('usr-juliana')).toBeDefined() // a solicitação não apaga nada
  })
})
