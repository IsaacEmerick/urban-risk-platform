// Conta do usuário e direitos do titular (RF13, RF15, RF16, RNF09, seção LGPD do 01-requisitos.md):
// cadastro do morador, consentimentos por finalidade, validação das preferências e exportação dos dados.
import { CANAIS, ORIGENS, TIPOS } from './parametros.js'
import { bairroMaisProximo } from './registro.js'

// Finalidades do consentimento — os mesmos nomes do usuarios.json
export const FINALIDADES = {
  CADASTRO: 'Cadastro e autenticação', // obrigatório; só sai com a exclusão da conta
  NOTIFICACOES: 'Áreas de interesse e notificações de risco', // opcional; pode ser revogado
}

// Base legal de agente e operador (LGPD, art. 7º, III): não é consentimento, então não se revoga.
// O operador acessa pelo convênio entre a Defesa Civil e a concessionária.
export const BASE_LEGAL_EXECUCAO = 'Execução de políticas públicas (art. 7º, III)'

export const PERFIL_COM_CONSENTIMENTO = 'morador'

export function usaConsentimento(usuario) {
  return usuario.perfil === PERFIL_COM_CONSENTIMENTO
}

// Consentimento ativo = o registro mais recente daquela finalidade não foi revogado.
// Cada autorização ou revogação fica guardada com data e finalidade (RNF09).
export function consentimentoAtivo(usuario, finalidade) {
  const ultimo = (usuario.consentimentos ?? []).filter((c) => c.finalidade === finalidade).at(-1)
  return Boolean(ultimo && !ultimo.revogadoEm)
}

// RN06 + LGPD: sem o consentimento "Áreas de interesse e notificações de risco" ativo, o morador
// não recebe nenhuma notificação (Alerta, Alerta confirmado ou Alerta cancelado).
// Agente e operador recebem pela base legal de execução de políticas públicas.
export function podeReceberNotificacoes(usuario) {
  return !usaConsentimento(usuario) || consentimentoAtivo(usuario, FINALIDADES.NOTIFICACOES)
}

export function revogar(consentimentos, finalidade, agora) {
  if (finalidade === FINALIDADES.CADASTRO) {
    throw new Error('“Cadastro e autenticação” não se revoga sozinho: para isso existe excluir a conta.')
  }
  const indice = consentimentos.findLastIndex((c) => c.finalidade === finalidade && !c.revogadoEm)
  if (indice < 0) throw new Error(`Consentimento não está ativo: ${finalidade}`)
  return consentimentos.map((c, i) => (i === indice ? { ...c, revogadoEm: agora } : c))
}

export function autorizar(consentimentos, finalidade, agora) {
  if (consentimentos.some((c) => c.finalidade === finalidade && !c.revogadoEm)) {
    throw new Error(`Consentimento já está ativo: ${finalidade}`)
  }
  return [...consentimentos, { finalidade, concedidoEm: agora, revogadoEm: null }]
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Cadastro (só morador): nome, e-mail e "Cadastro e autenticação" marcado. Devolve { campo: mensagem }.
export function validarCadastro({ nome, email, aceitaCadastro }, usuariosExistentes = []) {
  const erros = {}
  if (nome.trim().length < 2) erros.nome = 'Informe seu nome (pelo menos 2 letras).'
  const emailLimpo = email.trim().toLowerCase()
  if (!EMAIL_VALIDO.test(emailLimpo)) erros.email = 'Informe um e-mail válido, como nome@exemplo.com.'
  else if (usuariosExistentes.some((u) => u.email?.toLowerCase() === emailLimpo)) erros.email = 'Já existe uma conta com este e-mail.'
  if (!aceitaCadastro) erros.aceitaCadastro = 'Para criar a conta, autorize “Cadastro e autenticação”.'
  return erros
}

// Pseudônimo "p-" + 4 dígitos hexadecimais, diferente dos que já existem (os eventos só guardam ele)
export function gerarPseudonimo(usuariosExistentes, aleatorio = Math.random) {
  const usados = new Set(usuariosExistentes.map((u) => u.pseudonimo))
  let pseudonimo
  do {
    pseudonimo = `p-${Math.floor(aleatorio() * 0x10000).toString(16).padStart(4, '0')}`
  } while (usados.has(pseudonimo))
  return pseudonimo
}

// Morador novo: sem área (escolhe em Preferências), os 3 tipos de risco e o canal Push
export function criarMorador({ nome, email, autorizaNotificacoes }, { usuariosExistentes = [], agora = new Date(), aleatorio } = {}) {
  const pseudonimo = gerarPseudonimo(usuariosExistentes, aleatorio)
  return {
    id: `usr-${pseudonimo.slice(2)}-${agora.getTime()}`,
    nome: nome.trim(),
    perfil: PERFIL_COM_CONSENTIMENTO,
    email: email.trim().toLowerCase(),
    pseudonimo,
    areasInteresse: [],
    tiposRisco: Object.values(TIPOS),
    canais: [CANAIS.PUSH],
    consentimentos: [
      { finalidade: FINALIDADES.CADASTRO, concedidoEm: agora, revogadoEm: null },
      ...(autorizaNotificacoes ? [{ finalidade: FINALIDADES.NOTIFICACOES, concedidoEm: agora, revogadoEm: null }] : []),
    ],
  }
}

// Preferências (RF13): pelo menos 1 área, 1 tipo de risco e 1 canal
export function validarPreferencias({ areasInteresse, tiposRisco, canais }) {
  const erros = {}
  if (areasInteresse.length === 0) erros.areas = 'Adicione pelo menos uma área de interesse.'
  if (tiposRisco.length === 0) erros.tipos = 'Escolha pelo menos um tipo de risco.'
  if (canais.length === 0) erros.canais = 'Escolha pelo menos um canal.'
  return erros
}

export const rotuloRaio = (m) => (m >= 1000 ? `${String(m / 1000).replace('.', ',')} km` : `${m} m`)

// "Parque Viana" (bairro) ou "Ponto perto de Jardim Maria Helena, raio de 500 m"
export function rotuloArea(area, bairros) {
  if (area.tipo === 'bairro') return area.bairro
  return `Ponto perto de ${bairroMaisProximo(area, bairros)}, raio de ${rotuloRaio(area.raioM)}`
}

// Exportação (RF16): um JSON só com os dados do titular. Dos eventos vão só os registros que ele
// fez (achados pelo pseudônimo), sem confirmadoPor, outros dados do evento nem pseudônimos de outras pessoas.
export function exportarDadosTitular({ usuario, eventos, notificacoes, acessos, bairros, agora = new Date() }) {
  const registros = usaConsentimento(usuario)
    ? eventos.flatMap((evento) =>
        evento.dados
          .filter((d) => d.origem === ORIGENS.COMUNIDADE && d.autorPseudonimo === usuario.pseudonimo)
          .map((d) => ({
            eventoId: evento.id,
            titulo: d.titulo ?? evento.titulo,
            tipo: d.tipo,
            bairro: d.bairro,
            lat: d.lat,
            lng: d.lng,
            registradoEm: d.registradoEm,
            descricao: d.descricao ?? null,
            medicoes: d.medicoes,
            fotoGeolocalizada: d.fotoGeolocalizada,
            confirmacoesRecebidas: d.confirmacoes ?? 0,
            estadoAtualDoEvento: evento.estado,
          })),
      )
    : []
  return {
    geradoEm: agora,
    titular: {
      nome: usuario.nome,
      email: usuario.email,
      pseudonimo: usuario.pseudonimo,
      perfil: usuario.perfil,
      ...(usuario.servico && { servico: usuario.servico }),
    },
    preferencias: {
      areasInteresse: usuario.areasInteresse.map((a) => ({ descricao: rotuloArea(a, bairros), tipo: a.tipo, lat: a.lat, lng: a.lng, raioM: a.raioM })),
      tiposRisco: usuario.tiposRisco,
      canais: usuario.canais,
    },
    ...(usaConsentimento(usuario)
      ? { consentimentos: usuario.consentimentos }
      : { baseLegal: BASE_LEGAL_EXECUCAO }),
    ...(usaConsentimento(usuario) && { registros }),
    notificacoes: notificacoes.map(({ tipo, titulo, motivo, risco, confianca, origem, eventoId, em, lida }) => ({
      tipo,
      titulo,
      motivo,
      risco,
      confianca,
      origem,
      eventoId,
      em,
      lida,
    })),
    historicoDeAcesso: acessos.map(({ em, acao }) => ({ em, acao })),
  }
}

// Ações gravadas no histórico de acesso (RNF09)
export const ACOES_ACESSO = {
  CRIOU_CONTA: 'Criou a conta',
  ENTROU: 'Entrou',
  SAIU: 'Saiu',
  CONSULTOU: 'Consultou os dados',
  EXPORTOU: 'Exportou os dados',
  ALTEROU_PREFERENCIAS: 'Alterou as preferências',
  revogou: (finalidade) => `Revogou o consentimento “${finalidade}”`,
  autorizou: (finalidade) => `Autorizou o consentimento “${finalidade}”`,
  SOLICITOU_EXCLUSAO: 'Solicitação de exclusão enviada ao órgão responsável',
  EXCLUIU_CONTA: 'Excluiu a conta',
}

