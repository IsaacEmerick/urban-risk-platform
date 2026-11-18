// Detalhe do alerta (RF06, RF08, RF12): risco, descrição, origem, confiança, mapa, linha do tempo
// dos estados e, para o agente, os botões Confirmar alerta, Encerrar, Cancelar alerta / Descartar evento.
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import CarimboAtualizacao from '../components/CarimboAtualizacao.jsx'
import EtiquetaNaoConfirmado from '../components/EtiquetaNaoConfirmado.jsx'
import Icone from '../components/Icone.jsx'
import MapaEventos from '../components/MapaEventos.jsx'
import ReguaRio from '../components/ReguaRio.jsx'
import SeloConfianca from '../components/SeloConfianca.jsx'
import SeloOrigem from '../components/SeloOrigem.jsx'
import SeloRisco from '../components/SeloRisco.jsx'
import { usePerfil } from '../contexto/PerfilContext.jsx'
import { useAgora } from '../hooks/useAgora.js'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { PERFIS } from '../navegacao.js'
import { acoesDisponiveis } from '../services/acoesAgente.js'
import { dadoPrincipal } from '../services/eventos.js'
import { formatarDataHora } from '../services/formatar.js'
import { ESTADOS, ORIGENS } from '../services/parametros.js'

// Mensagem mostrada depois de cada ação (mesmo verbo do botão)
const RESULTADOS = {
  confirmarAlerta: 'Alerta confirmado. A marca "não confirmado" foi removida.',
  encerrar: 'Evento encerrado.',
  cancelarAlerta: 'Alerta cancelado. Quem recebeu foi avisado com "Alerta cancelado".',
  descartarEvento: 'Evento descartado.',
}

export default function DetalheAlerta() {
  const { id } = useParams()
  const navegar = useNavigate()
  const repositorio = useRepositorio()
  const { usuario } = usePerfil()
  const agora = useAgora(30_000)
  const [pendente, setPendente] = useState(null) // ação aguardando "Sim"
  const [resultado, setResultado] = useState('')

  const evento = repositorio.obterEvento(id)
  if (!evento) {
    return (
      <div className="vazio">
        <h1>Alerta não encontrado</h1>
        <p>Este evento não existe mais ou o endereço está errado.</p>
        <Link to="/painel">Ir para o Painel</Link>
      </div>
    )
  }

  const dado = dadoPrincipal(evento)
  const leituraRio = evento.dados.find((d) => d.medicoes?.nivelRioM != null)
  const soComunidade = evento.dados.every((d) => d.origem === ORIGENS.COMUNIDADE)
  const acoes = acoesDisponiveis(evento, usuario.perfil)

  const executar = (acao) => {
    repositorio.executarAcao(evento.id, acao.acao)
    setPendente(null)
    setResultado(RESULTADOS[acao.id])
  }

  return (
    <article className="detalhe">
      <button type="button" className="botao-voltar" onClick={() => navegar(-1)}>
        <Icone nome="voltar" />
        Voltar
      </button>

      <SeloRisco risco={evento.risco} variante="tarja" />

      <header className="detalhe__cabecalho">
        <h1>{evento.titulo}</h1>
        <p className="detalhe__local">
          {evento.tipo} em {evento.bairro}
        </p>
        <div className="linha-selos">
          <span className="estado">{evento.estado}</span>
          {evento.naoConfirmado && <EtiquetaNaoConfirmado />}
        </div>
        <div className="linha-selos">
          <SeloOrigem origem={dado.origem} />
          <SeloConfianca valor={evento.confianca} faixa={evento.faixaConfianca} eventoId={evento.id} />
          <CarimboAtualizacao em={evento.atualizadoEm} />
        </div>
      </header>

      {evento.naoConfirmado && (
        <p className="aviso">
          Alerta preliminar: o risco é Crítico, mas a confiança ainda é {evento.faixaConfianca}. A Defesa Civil está
          verificando.
        </p>
      )}

      <section className="bloco" aria-labelledby="titulo-descricao">
        <h2 id="titulo-descricao" className="titulo-secao">
          O que está acontecendo
        </h2>
        {/* Evento do sensor do rio: a régua já diz o nível e quanto falta, sem repetir a descrição */}
        {leituraRio ? <ReguaRio dado={leituraRio} /> : <p className="detalhe__descricao">{dado.descricao}</p>}
        <Link to={`/alertas/${evento.id}/origem`} className="link-forte">
          Ver de onde vêm os dados e como a confiança é calculada
          <Icone nome="seguir" />
        </Link>
      </section>

      <section className="bloco" aria-labelledby="titulo-local">
        <h2 id="titulo-local" className="titulo-secao">
          Onde
        </h2>
        <MapaEventos eventos={[evento]} mini zoom={16} />
        {soComunidade && <p className="nota">Posição aproximada (cerca de 100 m) para proteger quem registrou.</p>}
      </section>

      <section className="bloco" aria-labelledby="titulo-linha">
        <h2 id="titulo-linha" className="titulo-secao">
          Linha do tempo
        </h2>
        <ol className="linha-tempo">
          {evento.historico.map((h, i) => (
            <li key={`${h.estado}-${i}`} className={i === evento.historico.length - 1 ? 'linha-tempo__item linha-tempo__item--atual' : 'linha-tempo__item'}>
              <span className="linha-tempo__estado">{h.estado}</span>
              <time dateTime={h.em.toISOString()}>{formatarDataHora(h.em, agora)}</time>
            </li>
          ))}
        </ol>
        {evento.motivoDescarte && <p className="nota">{evento.motivoDescarte}</p>}
      </section>

      {usuario.perfil === PERFIS.AGENTE && evento.estado === ESTADOS.EM_VALIDACAO && (
        <p className="aviso">
          Este evento aguarda validação. Confirme ou descarte na <Link to="/fila">Fila de validação</Link>.
        </p>
      )}

      {acoes.length > 0 && (
        <section className="bloco acoes-agente" aria-labelledby="titulo-acoes">
          <h2 id="titulo-acoes" className="titulo-secao">
            Ações da Defesa Civil
          </h2>
          {pendente ? (
            <div className="confirmacao" role="alertdialog" aria-labelledby="texto-confirmacao">
              <p id="texto-confirmacao">{pendente.confirmacao}</p>
              <div className="confirmacao__botoes">
                <button
                  type="button"
                  className={pendente.id === 'cancelarAlerta' ? 'botao botao--perigo' : 'botao botao--primario'}
                  onClick={() => executar(pendente)}
                  autoFocus
                >
                  Sim, {pendente.rotulo.toLowerCase()}
                </button>
                <button type="button" className="botao botao--secundario" onClick={() => setPendente(null)}>
                  Não, manter
                </button>
              </div>
            </div>
          ) : (
            <div className="acoes-agente__botoes">
              {acoes.map((acao) => (
                <button
                  key={acao.id}
                  type="button"
                  className={acao.id === 'confirmarAlerta' ? 'botao botao--primario' : acao.id === 'cancelarAlerta' ? 'botao botao--perigo-contorno' : 'botao botao--secundario'}
                  onClick={() => (acao.confirmacao ? setPendente(acao) : executar(acao))}
                >
                  {acao.rotulo}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <p className="resultado-acao" role="status">
        {resultado}
      </p>
    </article>
  )
}
