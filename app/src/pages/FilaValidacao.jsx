// Fila de validação (RF04, RF12): só eventos Em validação (confiança 50–74, RN02), do mais prioritário
// para o menos; no empate, o que está Em validação há mais tempo vem antes (seção 4.3).
// Cada card mostra os selos, a prioridade, o resumo do cálculo da confiança e os botões Confirmar e
// Descartar, com confirmação em linha (como no Detalhe do alerta).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import CardAlerta from '../components/CardAlerta.jsx'
import ConfirmacaoEmLinha from '../components/ConfirmacaoEmLinha.jsx'
import { useAgora } from '../hooks/useAgora.js'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { ACOES_FILA } from '../services/acoesAgente.js'
import { resumoConfianca } from '../services/confianca.js'
import { dadoPrincipal, filaDeValidacao, passouPorAlerta } from '../services/eventos.js'
import { tempoDecorrido } from '../services/formatar.js'
import { ESTADOS } from '../services/parametros.js'

const formatarPrioridade = (p) => p.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// Mensagem depois da ação: o que aconteceu com o evento (alerta ou não)
function mensagemResultado(acao, evento) {
  if (acao.id === 'descartar') return `Evento descartado: “${evento.titulo}”. Ninguém foi notificado.`
  if (passouPorAlerta(evento)) return `Evento confirmado: “${evento.titulo}”. Alerta emitido (risco ${evento.riscoAlertado}) para quem acompanha a região.`
  return `Evento confirmado: “${evento.titulo}”. Fica em monitoramento, sem alerta (risco ${evento.risco}).`
}

export default function FilaValidacao() {
  const repositorio = useRepositorio()
  const agora = useAgora(30_000)
  const [resultado, setResultado] = useState(null) // { texto, eventoId }

  const fila = filaDeValidacao(repositorio.listarEventos())
  const entrouEmValidacao = (evento) => evento.historico.findLast((h) => h.estado === ESTADOS.EM_VALIDACAO).em

  const executar = (evento, acao) => {
    const depois = repositorio.executarAcao(evento.id, acao.acao)
    setResultado({ texto: mensagemResultado(acao, depois), eventoId: depois.id })
  }

  return (
    <div className="fila">
      <header className="cabecalho-tela">
        <h1>Fila de validação</h1>
        <p className="cabecalho-tela__sub" aria-live="polite">
          {fila.length === 0
            ? 'Nenhum evento aguardando'
            : `${fila.length} ${fila.length === 1 ? 'evento aguardando' : 'eventos aguardando'} confirmação, do mais prioritário para o menos`}
        </p>
      </header>

      <div className="resultado-acao" role="status">
        {resultado && (
          <>
            {resultado.texto} <Link to={`/alertas/${resultado.eventoId}`}>Ver o evento</Link>
          </>
        )}
      </div>

      {fila.length === 0 ? (
        <div className="vazio">
          <p>Nenhum evento aguardando validação.</p>
          <Link to="/alertas">Ver a lista de alertas</Link>
        </div>
      ) : (
        <div className="lista-cards">
          {fila.map((evento) => (
            <CardAlerta
              key={evento.id}
              evento={evento}
              titulo="h2"
              rodape={
                <div className="fila__acoes">
                  <ConfirmacaoEmLinha acoes={ACOES_FILA} aoExecutar={(acao) => executar(evento, acao)} contexto={evento.titulo} />
                </div>
              }
            >
              <p className="fila__fatos">
                Prioridade <strong>{formatarPrioridade(evento.prioridade)}</strong>
                <span aria-hidden="true"> · </span>
                <span>em validação {tempoDecorrido(entrouEmValidacao(evento), agora)}</span>
              </p>
              <p className="fila__calculo">
                <span className="fila__calculo-rotulo">Confiança: </span>
                {resumoConfianca(dadoPrincipal(evento).confianca)}
              </p>
            </CardAlerta>
          ))}
        </div>
      )}
    </div>
  )
}
