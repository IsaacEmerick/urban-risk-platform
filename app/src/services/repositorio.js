// Repositório em memória: carrega os dados simulados (src/data), calcula confiança e risco com os
// serviços e segue o caminho do Diagrama de Sequência quando chega um dado novo:
// confiança → risco → agrupamento (RN04) → consolidação (RN07) → estados → notificação (RN06).
import bairrosJson from '../data/bairros.json'
import eventosJson from '../data/eventos.json'
import eventosHistoricosJson from '../data/eventos-historicos.json'
import sensoresJson from '../data/sensores.json'
import usuariosJson from '../data/usuarios.json'
import { ESTADOS, MINUTO } from './parametros.js'
import { agruparDado, consolidarEvento, dadoPrincipal, eventoAtivo, eventoDaMesmaFonte, mesmaFonte } from './eventos.js'
import { faixaConfianca } from './confianca.js'
import {
  EFEITOS,
  EFEITOS_DE_ALERTA,
  agenteConfirma,
  agenteEncerra,
  agenteRejeita,
  avaliar,
  notificacaoEnviada,
  reavaliarPorTempo,
} from './estados.js'
import { deveNotificar, resolverAreas } from './notificacao.js'
import { aplicarConfirmacao } from './confirmacao.js'
import { ACOES_ACESSO, autorizar, exportarDadosTitular, podeReceberNotificacoes, revogar } from './conta.js'

const MAX_LEITURAS_GUARDADAS = 40

const minutosAtras = (agora, minutos) => new Date(agora.getTime() - minutos * MINUTO)

// Os JSON guardam horários relativos ("minutosAtras"); aqui viram datas a partir de "agora".
function prepararDado(dadoJson, evento, sensores, agora) {
  const { minutosAtras: min, atualizadoMinutosAtras, medicoes = {}, ...resto } = dadoJson
  const { inicioMinutosAtras, previsaoMinutosAdiante, ...outrasMedicoes } = medicoes
  const sensor = sensores.find((s) => s.id === dadoJson.fonteId)
  return {
    confirmacoes: 0,
    fotoGeolocalizada: false,
    falhaSensor: false,
    ...resto,
    tipo: evento.tipo,
    bairro: evento.bairro,
    registradoEm: minutosAtras(agora, min),
    atualizadoEm: minutosAtras(agora, atualizadoMinutosAtras ?? min),
    medicoes: {
      ...outrasMedicoes,
      ...(sensor?.cotaTransbordamentoM != null && { cotaTransbordamentoM: sensor.cotaTransbordamentoM }),
      ...(inicioMinutosAtras != null && { inicio: minutosAtras(agora, inicioMinutosAtras) }),
      ...(previsaoMinutosAdiante != null && { previsaoNormalizacao: minutosAtras(agora, -previsaoMinutosAdiante) }),
    },
  }
}

// Usuário: áreas por bairro ganham centro e raio do catálogo (RF13, RN06); datas dos consentimentos viram Date
function prepararUsuario(usuario, bairros) {
  return {
    ...usuario,
    areasInteresse: resolverAreas(usuario.areasInteresse ?? [], bairros),
    consentimentos: (usuario.consentimentos ?? []).map((c) => ({
      ...c,
      concedidoEm: new Date(c.concedidoEm),
      revogadoEm: c.revogadoEm ? new Date(c.revogadoEm) : null,
    })),
  }
}

function prepararEvento(eventoJson, sensores, agora) {
  const { criadoMinutosAtras, historico, dados, ...resto } = eventoJson
  return {
    naoConfirmado: false,
    riscoAlertado: null,
    confiancaAlertada: null,
    riscoBaixoDesde: null,
    confirmadoPor: [], // ids dos moradores que tocaram em "Também vejo isso" (RF17)
    ...resto,
    criadoEm: minutosAtras(agora, criadoMinutosAtras),
    historico: historico.map((h) => ({ estado: h.estado, em: minutosAtras(agora, h.minutosAtras) })),
    dados: dados.map((d) => prepararDado(d, eventoJson, sensores, agora)),
  }
}

export function criarRepositorio({
  agora = new Date(),
  // Eventos atuais + histórico dos últimos 30 dias (base da tela Análises e do RNF11)
  eventos = [...eventosJson, ...eventosHistoricosJson],
  sensores = sensoresJson,
  usuarios = usuariosJson,
  bairros = bairrosJson,
  // Eventos atuais cujos alertas já emitidos aparecem na central ao abrir o app (o histórico de 30 dias não entra)
  idsComNotificacaoInicial = eventosJson.map((e) => e.id),
} = {}) {
  const estado = {
    bairros,
    sensores: sensores.map((s) => ({ ...s, leituras: [] })),
    usuarios: usuarios.map((u) => prepararUsuario(u, bairros)),
    eventos: [],
    notificacoes: [],
    // Histórico de acesso a dados pessoais (RNF09): { usuarioId, em, acao }. Guardado por 12 meses,
    // inclusive depois da exclusão da conta (log de auditoria).
    acessos: [],
  }
  estado.eventos = eventos.map((e) => prepararEvento(e, estado.sensores, agora))
  const inscritos = new Set()
  let proximoId = 1

  const todosDados = () => estado.eventos.flatMap((e) => e.dados)
  const avisarInscritos = () => inscritos.forEach((fn) => fn())

  function recalcularTodos(momento) {
    const dados = todosDados()
    estado.eventos = estado.eventos.map((e) => consolidarEvento(e, { agora: momento, todosDados: dados }))
  }

  function substituirEvento(evento) {
    estado.eventos = estado.eventos.map((e) => (e.id === evento.id ? evento : e))
  }

  // Serviço de Notificação (simulado): grava na central de notificações de cada usuário
  function notificar(evento, tipo, momento) {
    estado.usuarios.forEach((usuario) => {
      const anteriores = estado.notificacoes.filter((n) => n.usuarioId === usuario.id && n.eventoId === evento.id)
      if (tipo === 'Alerta cancelado') {
        // Só avisa do cancelamento quem recebeu o alerta (RF10) e ainda tem o consentimento ativo (LGPD)
        if (anteriores.length === 0 || !podeReceberNotificacoes(usuario)) return
      } else {
        const ultima = anteriores.at(-1)
        const ultimaNotificacao = ultima ? { em: ultima.em, risco: ultima.risco } : null
        if (!deveNotificar(usuario, evento, { agora: momento, ultimaNotificacao })) return
      }
      adicionarNotificacao(usuario, evento, tipo, { em: momento, lida: false })
    })
  }

  // "Alerta confirmado" (RN02): quando o alerta preliminar perde a marca "não confirmado" (pelo agente
  // ou pela confiança), quem recebeu o preliminar ganha uma notificação nova, com o risco e a confiança
  // do momento. A notificação antiga não muda: continua um registro do que foi enviado.
  // A notificação diz quem confirmou: o agente ("Confirmar alerta") ou a confiança que chegou a 75.
  const MOTIVOS_CONFIRMACAO = {
    agente: 'Confirmado pela Defesa Civil',
    confianca: 'Confirmado: a confiança chegou a Alta',
  }
  function notificarConfirmacao(evento, momento, porQuem) {
    estado.usuarios.forEach((usuario) => {
      const preliminar = estado.notificacoes.find(
        (n) => n.usuarioId === usuario.id && n.eventoId === evento.id && n.tipo === 'Alerta' && n.naoConfirmado,
      )
      // Sem o consentimento ativo (LGPD), nem o "Alerta confirmado" chega, mesmo para quem recebeu o preliminar
      if (!preliminar || !podeReceberNotificacoes(usuario)) return
      adicionarNotificacao(usuario, evento, 'Alerta confirmado', {
        em: momento,
        lida: false,
        risco: evento.risco,
        confianca: evento.confianca,
        titulo: `O alerta “${preliminar.titulo}” foi confirmado`,
        motivo: MOTIVOS_CONFIRMACAO[porQuem],
      })
    })
  }

  // A notificação é um registro do passado: guarda o risco, a confiança e a origem do momento do
  // envio (riscoAlertado / confiancaAlertada do último alerta), e não os valores recalculados depois.
  // O "Alerta cancelado" repete os valores do alerta que foi cancelado.
  function adicionarNotificacao(usuario, evento, tipo, opcoes) {
    const {
      em,
      lida,
      risco = evento.riscoAlertado ?? evento.risco,
      confianca = evento.confiancaAlertada ?? evento.confianca,
      titulo = `${evento.tipo} – risco ${risco}`,
      motivo = null,
    } = opcoes
    estado.notificacoes.push({
      id: `ntf-${proximoId++}`,
      usuarioId: usuario.id,
      eventoId: evento.id,
      tipo,
      titulo,
      motivo, // só no "Alerta confirmado": quem confirmou
      risco,
      confianca,
      faixaConfianca: faixaConfianca(confianca),
      origem: dadoPrincipal(evento).origem,
      // Alerta preliminar (RN02): mesmo tipo "Alerta", com a etiqueta "não confirmado" no card
      naoConfirmado: tipo === 'Alerta' && Boolean(evento.naoConfirmado),
      em,
      lida,
    })
  }

  // Notificações que os eventos simulados já tinham gerado antes de o app abrir: um "Alerta" no
  // horário do Alerta emitido do histórico e, se o alerta foi cancelado, um "Alerta cancelado".
  // Quem recebe segue a RN06 (deveNotificar). As de eventos já terminados (Encerrado ou Descartado)
  // aparecem como lidas; as de eventos ativos, como não lidas.
  function gerarNotificacoesIniciais(idsEventos) {
    const horarioDe = (evento, estadoBuscado) => evento.historico.find((h) => h.estado === estadoBuscado)?.em
    estado.eventos
      .filter((evento) => idsEventos.includes(evento.id) && evento.riscoAlertado)
      .forEach((evento) => {
        const alertaEm = horarioDe(evento, ESTADOS.ALERTA_EMITIDO)
        if (!alertaEm) return
        const canceladoEm = evento.estado === ESTADOS.DESCARTADO ? horarioDe(evento, ESTADOS.DESCARTADO) : null
        estado.usuarios.forEach((usuario) => {
          if (!deveNotificar(usuario, evento, { agora: alertaEm })) return
          adicionarNotificacao(usuario, evento, 'Alerta', { em: alertaEm, lida: !eventoAtivo(evento) })
          if (canceladoEm) {
            adicionarNotificacao(usuario, evento, 'Alerta cancelado', { em: canceladoEm, lida: !eventoAtivo(evento) })
          }
        })
      })
  }

  // Executa os efeitos devolvidos pela máquina de estados.
  // porQuem: 'agente' (ação do agente) ou 'confianca' (transição automática) — usado no "Alerta confirmado"
  function aplicarEfeitos(evento, efeitos, momento, porQuem = 'confianca') {
    let atual = evento
    if (efeitos.some((ef) => EFEITOS_DE_ALERTA.includes(ef))) {
      notificar(atual, 'Alerta', momento)
      atual = notificacaoEnviada(atual, momento).evento // Alerta emitido → Em monitoramento
    }
    if (efeitos.includes(EFEITOS.ATUALIZAR_ALERTA)) notificarConfirmacao(atual, momento, porQuem)
    if (efeitos.includes(EFEITOS.NOTIFICAR_CANCELAMENTO)) notificar(atual, 'Alerta cancelado', momento)
    return atual
  }

  // Recebe um dado novo (sensor, base pública ou comunidade)
  function receberDado(dado, momento = new Date()) {
    // Leitura nova da mesma fonte (o mesmo sensor, o mesmo status publicado) vai para o evento ativo
    // que já tem essa fonte, mesmo fora da janela de 60 min da RN04; senão, vale a RN04.
    const existente = eventoDaMesmaFonte(dado, estado.eventos) ?? agruparDado(dado, estado.eventos)
    let evento
    if (existente) {
      // A leitura nova substitui a anterior da mesma fonte no evento
      const semDadoAntigo = existente.dados.filter((d) => !mesmaFonte(d, dado))
      evento = { ...existente, dados: [...semDadoAntigo, dado] }
    } else {
      evento = {
        id: `evt-${Date.now()}-${proximoId++}`,
        tipo: dado.tipo,
        titulo: dado.titulo ?? dado.descricao, // o registro comunitário traz um título gerado (RF03)
        bairro: dado.bairro,
        lat: dado.lat,
        lng: dado.lng,
        estado: 'Reportado',
        naoConfirmado: false,
        riscoAlertado: null,
        confiancaAlertada: null,
        riscoBaixoDesde: null,
        confirmadoPor: [],
        vulnerabilidades: [],
        // Interrupção de serviço: o raio afetado é a área informada pelo operador (RN06, RF18)
        ...(dado.raioAfetadoM != null && { raioAfetadoM: dado.raioAfetadoM }),
        criadoEm: momento,
        historico: [{ estado: 'Reportado', em: momento }],
        dados: [dado],
      }
      estado.eventos = [...estado.eventos, evento]
    }
    return reavaliar(evento, momento)
  }

  // Mesmo caminho para dado novo e confirmação: grava o evento, recalcula confiança, risco e RN07,
  // aplica as transições automáticas (RN01–RN03) e executa os efeitos (notificação, RN06)
  function reavaliar(evento, momento) {
    substituirEvento(evento)
    recalcularTodos(momento)
    const resultado = avaliar(estado.eventos.find((e) => e.id === evento.id), momento)
    substituirEvento(aplicarEfeitos(resultado.evento, resultado.efeitos, momento))
    avisarInscritos()
    return estado.eventos.find((e) => e.id === evento.id)
  }

  // "Também vejo isso" (RF17): +1 confirmação de morador e reavaliação do evento.
  // Ex.: evt-02 (65) + 1 confirmação = 75 → Confirmado → Alerta emitido (RN01).
  function confirmarOcorrencia(eventoId, usuarioId, momento = new Date()) {
    const evento = estado.eventos.find((e) => e.id === eventoId)
    if (!evento) throw new Error(`Evento não encontrado: ${eventoId}`)
    const usuario = estado.usuarios.find((u) => u.id === usuarioId)
    return reavaliar(aplicarConfirmacao(evento, usuario), momento)
  }

  // Ações do agente (Fila de validação e Detalhe do alerta)
  const ACOES = { agenteConfirma, agenteRejeita, agenteEncerra }
  function executarAcao(eventoId, acao, momento = new Date()) {
    const evento = estado.eventos.find((e) => e.id === eventoId)
    if (!evento) throw new Error(`Evento não encontrado: ${eventoId}`)
    const resultado = ACOES[acao](evento, momento)
    substituirEvento(aplicarEfeitos(resultado.evento, resultado.efeitos, momento, 'agente'))
    avisarInscritos()
    return estado.eventos.find((e) => e.id === eventoId)
  }

  // A cada tique do simulador: recalcula confiança e risco com o "agora" e aplica as transições
  // pelo tempo (RN03: descarte em 2 h; RN05: encerramento após 30 min com risco Baixo)
  function reavaliarTodosPorTempo(momento = new Date()) {
    recalcularTodos(momento)
    estado.eventos.filter(eventoAtivo).forEach((e) => {
      const resultado = reavaliarPorTempo(e, momento)
      substituirEvento(aplicarEfeitos(resultado.evento, resultado.efeitos, momento))
    })
    avisarInscritos()
  }

  function registrarLeituraSensor(sensorId, leitura) {
    estado.sensores = estado.sensores.map((s) =>
      s.id === sensorId ? { ...s, leituras: [...s.leituras, leitura].slice(-MAX_LEITURAS_GUARDADAS) } : s,
    )
  }

  // Central de notificações (RF11): status lida / não lida
  function marcarComoLida(notificacaoId) {
    estado.notificacoes = estado.notificacoes.map((n) => (n.id === notificacaoId ? { ...n, lida: true } : n))
    avisarInscritos()
  }

  function marcarTodasComoLidas(usuarioId) {
    estado.notificacoes = estado.notificacoes.map((n) => (n.usuarioId === usuarioId ? { ...n, lida: true } : n))
    avisarInscritos()
  }

  // ---- Conta e direitos do titular (RF13, RF15, RF16, RNF09) ----

  function obterUsuarioOuErro(usuarioId) {
    const usuario = estado.usuarios.find((u) => u.id === usuarioId)
    if (!usuario) throw new Error(`Usuário não encontrado: ${usuarioId}`)
    return usuario
  }

  function substituirUsuario(usuarioId, mudar) {
    estado.usuarios = estado.usuarios.map((u) => (u.id === usuarioId ? mudar(u) : u))
    avisarInscritos()
    return estado.usuarios.find((u) => u.id === usuarioId)
  }

  // Histórico de acesso (RNF09): data e ação
  function registrarAcesso(usuarioId, acao, momento = new Date()) {
    estado.acessos.push({ usuarioId, em: momento, acao })
    avisarInscritos()
  }

  // Cadastro do morador (Login / Cadastro): o usuário novo entra na lista e passa a valer na RN06
  function criarUsuario(usuario, momento = new Date()) {
    estado.usuarios = [...estado.usuarios, prepararUsuario(usuario, estado.bairros)]
    registrarAcesso(usuario.id, ACOES_ACESSO.CRIOU_CONTA, momento)
    return estado.usuarios.at(-1)
  }

  // Preferências (RF13): as áreas viram círculos de novo, para valerem na RN06 na hora
  function atualizarPreferencias(usuarioId, { areasInteresse, tiposRisco, canais }, momento = new Date()) {
    obterUsuarioOuErro(usuarioId)
    const atualizado = substituirUsuario(usuarioId, (u) => ({
      ...u,
      areasInteresse: resolverAreas(areasInteresse, estado.bairros),
      tiposRisco: [...tiposRisco],
      canais: [...canais],
    }))
    registrarAcesso(usuarioId, ACOES_ACESSO.ALTEROU_PREFERENCIAS, momento)
    return atualizado
  }

  // Revogar / autorizar o consentimento opcional (RF16). A revogação para as notificações na hora.
  function revogarConsentimento(usuarioId, finalidade, momento = new Date()) {
    const usuario = obterUsuarioOuErro(usuarioId)
    const consentimentos = revogar(usuario.consentimentos, finalidade, momento)
    const atualizado = substituirUsuario(usuarioId, (u) => ({ ...u, consentimentos }))
    registrarAcesso(usuarioId, ACOES_ACESSO.revogou(finalidade), momento)
    return atualizado
  }

  function autorizarConsentimento(usuarioId, finalidade, momento = new Date()) {
    const usuario = obterUsuarioOuErro(usuarioId)
    const consentimentos = autorizar(usuario.consentimentos, finalidade, momento)
    const atualizado = substituirUsuario(usuarioId, (u) => ({ ...u, consentimentos }))
    registrarAcesso(usuarioId, ACOES_ACESSO.autorizou(finalidade), momento)
    return atualizado
  }

  // Exportação (RF16): só os dados do titular
  function exportarDados(usuarioId, momento = new Date()) {
    const usuario = obterUsuarioOuErro(usuarioId)
    registrarAcesso(usuarioId, ACOES_ACESSO.EXPORTOU, momento)
    return exportarDadosTitular({
      usuario,
      eventos: estado.eventos,
      notificacoes: estado.notificacoes.filter((n) => n.usuarioId === usuarioId),
      acessos: estado.acessos.filter((a) => a.usuarioId === usuarioId),
      bairros: estado.bairros,
      agora: momento,
    })
  }

  // Excluir conta (RF16, morador): apaga os dados pessoais (o "cofre": usuário e notificações).
  // Os eventos ficam como estão: guardam só o pseudônimo, que deixa de apontar para alguém.
  // O histórico de acesso fica (log de auditoria, 12 meses, RNF09).
  function excluirUsuario(usuarioId, momento = new Date()) {
    obterUsuarioOuErro(usuarioId)
    registrarAcesso(usuarioId, ACOES_ACESSO.EXCLUIU_CONTA, momento)
    estado.usuarios = estado.usuarios.filter((u) => u.id !== usuarioId)
    estado.notificacoes = estado.notificacoes.filter((n) => n.usuarioId !== usuarioId)
    avisarInscritos()
  }

  recalcularTodos(agora)
  gerarNotificacoesIniciais(idsComNotificacaoInicial)

  return {
    listarEventos: () => estado.eventos,
    obterEvento: (id) => estado.eventos.find((e) => e.id === id),
    listarBairros: () => estado.bairros,
    listarSensores: () => estado.sensores,
    obterSensor: (id) => estado.sensores.find((s) => s.id === id),
    listarUsuarios: () => estado.usuarios,
    obterUsuario: (id) => estado.usuarios.find((u) => u.id === id),
    listarNotificacoes: (usuarioId) => estado.notificacoes.filter((n) => n.usuarioId === usuarioId),
    marcarComoLida,
    marcarTodasComoLidas,
    criarUsuario,
    atualizarPreferencias,
    revogarConsentimento,
    autorizarConsentimento,
    exportarDados,
    excluirUsuario,
    registrarAcesso,
    historicoDeAcesso: (usuarioId) => estado.acessos.filter((a) => a.usuarioId === usuarioId),
    receberDado,
    // Registro comunitário (RF03): o dado do morador segue o mesmo caminho dos outros dados
    registrarOcorrencia: (dado, momento = dado.registradoEm) => receberDado(dado, momento),
    // Publicar status (RF18): o status da operadora também segue o mesmo caminho
    publicarStatus: (dado, momento = dado.atualizadoEm) => receberDado(dado, momento),
    confirmarOcorrencia,
    executarAcao,
    registrarLeituraSensor,
    reavaliarTodosPorTempo,
    recalcular: (momento = new Date()) => {
      recalcularTodos(momento)
      avisarInscritos()
    },
    // As telas se inscrevem para redesenhar quando algo muda; devolve a função para cancelar
    inscrever: (fn) => {
      inscritos.add(fn)
      return () => inscritos.delete(fn)
    },
  }
}

// Instância única usada pelo app
export const repositorio = criarRepositorio()
