// Repositório em memória: carrega os dados simulados (src/data), calcula confiança e risco com os
// serviços e segue o caminho do Diagrama de Sequência quando chega um dado novo:
// confiança → risco → agrupamento (RN04) → consolidação (RN07) → estados → notificação (RN06).
import bairrosJson from '../data/bairros.json'
import eventosJson from '../data/eventos.json'
import eventosHistoricosJson from '../data/eventos-historicos.json'
import sensoresJson from '../data/sensores.json'
import usuariosJson from '../data/usuarios.json'
import { ESTADOS, MINUTO } from './parametros.js'
import { agruparDado, consolidarEvento, dadoPrincipal, eventoAtivo } from './eventos.js'
import { faixaConfianca } from './confianca.js'
import {
  EFEITOS,
  EFEITOS_DE_ALERTA,
  agenteConfirma,
  agenteEncerra,
  agenteRejeita,
  avaliar,
  notificacaoEnviada,
} from './estados.js'
import { deveNotificar, resolverAreas } from './notificacao.js'

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
      ...(sensor && { cotaTransbordamentoM: sensor.cotaTransbordamentoM }),
      ...(inicioMinutosAtras != null && { inicio: minutosAtras(agora, inicioMinutosAtras) }),
      ...(previsaoMinutosAdiante != null && { previsaoNormalizacao: minutosAtras(agora, -previsaoMinutosAdiante) }),
    },
  }
}

function prepararEvento(eventoJson, sensores, agora) {
  const { criadoMinutosAtras, historico, dados, ...resto } = eventoJson
  return {
    naoConfirmado: false,
    riscoAlertado: null,
    confiancaAlertada: null,
    riscoBaixoDesde: null,
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
    // Áreas por bairro ganham centro e raio do catálogo (RF13, RN06)
    usuarios: usuarios.map((u) => ({ ...u, areasInteresse: resolverAreas(u.areasInteresse ?? [], bairros) })),
    eventos: [],
    notificacoes: [],
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
        // Só avisa do cancelamento quem recebeu o alerta (RF10)
        if (anteriores.length === 0) return
      } else {
        const ultima = anteriores.at(-1)
        const ultimaNotificacao = ultima ? { em: ultima.em, risco: ultima.risco } : null
        if (!deveNotificar(usuario, evento, { agora: momento, ultimaNotificacao })) return
      }
      adicionarNotificacao(usuario, evento, tipo, { em: momento, lida: false })
    })
  }

  // A notificação é um registro do passado: guarda o risco, a confiança e a origem do momento do
  // envio (riscoAlertado / confiancaAlertada do último alerta), e não os valores recalculados depois.
  // O "Alerta cancelado" repete os valores do alerta que foi cancelado.
  function adicionarNotificacao(usuario, evento, tipo, { em, lida }) {
    const risco = evento.riscoAlertado ?? evento.risco
    const confianca = evento.confiancaAlertada ?? evento.confianca
    estado.notificacoes.push({
      id: `ntf-${proximoId++}`,
      usuarioId: usuario.id,
      eventoId: evento.id,
      tipo,
      titulo: `${evento.tipo} – risco ${risco}`,
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

  // Executa os efeitos devolvidos pela máquina de estados
  function aplicarEfeitos(evento, efeitos, momento) {
    let atual = evento
    if (efeitos.some((ef) => EFEITOS_DE_ALERTA.includes(ef))) {
      notificar(atual, 'Alerta', momento)
      atual = notificacaoEnviada(atual, momento).evento // Alerta emitido → Em monitoramento
    }
    if (efeitos.includes(EFEITOS.NOTIFICAR_CANCELAMENTO)) notificar(atual, 'Alerta cancelado', momento)
    return atual
  }

  // Recebe um dado novo (sensor, base pública ou comunidade)
  function receberDado(dado, momento = new Date()) {
    const existente = agruparDado(dado, estado.eventos) // RN04
    let evento
    if (existente) {
      // Uma leitura nova da mesma fonte (ex.: o mesmo sensor) atualiza o dado anterior
      const semDadoAntigo = existente.dados.filter((d) => !(dado.fonteId && d.fonteId === dado.fonteId))
      evento = { ...existente, dados: [...semDadoAntigo, dado] }
    } else {
      evento = {
        id: `evt-${Date.now()}-${proximoId++}`,
        tipo: dado.tipo,
        titulo: dado.descricao,
        bairro: dado.bairro,
        lat: dado.lat,
        lng: dado.lng,
        estado: 'Reportado',
        naoConfirmado: false,
        riscoAlertado: null,
        confiancaAlertada: null,
        riscoBaixoDesde: null,
        vulnerabilidades: [],
        criadoEm: momento,
        historico: [{ estado: 'Reportado', em: momento }],
        dados: [dado],
      }
      estado.eventos = [...estado.eventos, evento]
    }
    substituirEvento(evento)
    recalcularTodos(momento) // confiança, risco e RN07
    const resultado = avaliar(estado.eventos.find((e) => e.id === evento.id), momento)
    substituirEvento(aplicarEfeitos(resultado.evento, resultado.efeitos, momento))
    avisarInscritos()
    return estado.eventos.find((e) => e.id === evento.id)
  }

  // Ações do agente (Fila de validação e Detalhe do alerta)
  const ACOES = { agenteConfirma, agenteRejeita, agenteEncerra }
  function executarAcao(eventoId, acao, momento = new Date()) {
    const evento = estado.eventos.find((e) => e.id === eventoId)
    if (!evento) throw new Error(`Evento não encontrado: ${eventoId}`)
    const resultado = ACOES[acao](evento, momento)
    substituirEvento(aplicarEfeitos(resultado.evento, resultado.efeitos, momento))
    avisarInscritos()
    return estado.eventos.find((e) => e.id === eventoId)
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
    receberDado,
    executarAcao,
    registrarLeituraSensor,
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
