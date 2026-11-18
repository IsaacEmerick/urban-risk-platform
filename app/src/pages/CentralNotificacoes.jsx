// Central de notificações (RF10, RF11): histórico, lidas e não lidas, filtro por tipo
// (Alerta e Alerta cancelado) e etiqueta "não confirmado" no alerta preliminar (RN02).
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CarimboAtualizacao from '../components/CarimboAtualizacao.jsx'
import EtiquetaNaoConfirmado from '../components/EtiquetaNaoConfirmado.jsx'
import SeloConfianca from '../components/SeloConfianca.jsx'
import SeloOrigem from '../components/SeloOrigem.jsx'
import SeloRisco from '../components/SeloRisco.jsx'
import { classeRisco } from '../components/apresentacao.js'
import { usePerfil } from '../contexto/PerfilContext.jsx'
import { useAgora } from '../hooks/useAgora.js'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { dadoPrincipal } from '../services/eventos.js'
import { formatarDataHora } from '../services/formatar.js'

const FILTROS = [
  { id: 'todas', rotulo: 'Todas', aceita: () => true },
  { id: 'naoLidas', rotulo: 'Não lidas', aceita: (n) => !n.lida },
  { id: 'alerta', rotulo: 'Alerta', aceita: (n) => n.tipo === 'Alerta' },
  { id: 'cancelado', rotulo: 'Alerta cancelado', aceita: (n) => n.tipo === 'Alerta cancelado' },
]

export default function CentralNotificacoes() {
  const repositorio = useRepositorio()
  const { usuario } = usePerfil()
  const agora = useAgora(30_000)
  const [filtro, setFiltro] = useState('todas')
  // Notificações que já existiam ao abrir a tela; as que chegarem depois ganham destaque de "nova"
  const vistasAoAbrir = useRef(null)

  const todas = [...repositorio.listarNotificacoes(usuario.id)].sort((a, b) => b.em - a.em)
  if (vistasAoAbrir.current === null) vistasAoAbrir.current = new Set(todas.map((n) => n.id))
  const naoLidas = todas.filter((n) => !n.lida).length
  const visiveis = todas.filter(FILTROS.find((f) => f.id === filtro).aceita)

  return (
    <div className="central">
      <header className="cabecalho-tela cabecalho-tela--com-acao">
        <div>
          <h1>Notificações</h1>
          <p className="cabecalho-tela__sub" aria-live="polite">
            {naoLidas === 0 ? 'Tudo lido' : `${naoLidas} ${naoLidas === 1 ? 'não lida' : 'não lidas'}`}
          </p>
        </div>
        <button type="button" className="botao botao--secundario" disabled={naoLidas === 0} onClick={() => repositorio.marcarTodasComoLidas(usuario.id)}>
          Marcar todas como lidas
        </button>
      </header>

      <div className="filtros" role="group" aria-label="Filtrar notificações">
        {FILTROS.map((f) => (
          <button key={f.id} type="button" className="filtro" aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
            {f.rotulo}
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <div className="vazio">
          <p>Nenhuma notificação neste filtro.</p>
          {filtro !== 'todas' && (
            <button type="button" className="botao botao--secundario" onClick={() => setFiltro('todas')}>
              Ver todas
            </button>
          )}
        </div>
      ) : (
        <ol className="lista-notificacoes">
          {visiveis.map((n) => {
            const evento = repositorio.obterEvento(n.eventoId)
            const nova = !vistasAoAbrir.current.has(n.id)
            const classes = [
              'notificacao',
              `risco-faixa--${classeRisco(n.risco)}`,
              n.lida ? 'notificacao--lida' : 'notificacao--nao-lida',
              n.tipo === 'Alerta cancelado' && 'notificacao--cancelado',
              nova && 'notificacao--nova',
            ]
            return (
              <li key={n.id} className={classes.filter(Boolean).join(' ')}>
                <div className="notificacao__topo">
                  {!n.lida && <span className="ponto-nao-lida" aria-hidden="true" />}
                  <span className="notificacao__tipo">{n.tipo}</span>
                  {n.naoConfirmado && <EtiquetaNaoConfirmado />}
                  <time className="notificacao__hora" dateTime={n.em.toISOString()}>
                    {formatarDataHora(n.em, agora)}
                  </time>
                </div>
                <h2 className="notificacao__titulo">
                  <Link to={`/alertas/${n.eventoId}`} className="link-esticado" onClick={() => repositorio.marcarComoLida(n.id)}>
                    {n.lida ? '' : <span className="sr-only">Não lida: </span>}
                    {n.titulo}
                  </Link>
                </h2>
                {evento && <p className="notificacao__evento">{evento.titulo}</p>}
                <div className="linha-selos">
                  <SeloRisco risco={n.risco} />
                  {evento && <SeloOrigem origem={dadoPrincipal(evento).origem} />}
                  {evento && <SeloConfianca valor={evento.confianca} faixa={evento.faixaConfianca} eventoId={evento.id} />}
                  {evento && <CarimboAtualizacao em={evento.atualizadoEm} />}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
