// Card de evento/alerta: risco, estado, origem, confiança e "atualizado há X s".
// O card inteiro leva ao Detalhe; o selo de confiança leva à tela Origem e confiança.
import { Link } from 'react-router-dom'
import { dadoPrincipal, riscoRelatado } from '../services/eventos.js'
import CarimboEvento from './CarimboEvento.jsx'
import EtiquetaNaoConfirmado from './EtiquetaNaoConfirmado.jsx'
import SeloConfianca from './SeloConfianca.jsx'
import SeloOrigem from './SeloOrigem.jsx'
import SeloRisco from './SeloRisco.jsx'
import { classeRisco } from './apresentacao.js'

// children: linha extra opcional (ex.: em Meus registros, "Registrado hoje, 17:42 · 2 confirmações")
export default function CardAlerta({ evento, titulo = 'h3', children }) {
  const Titulo = titulo
  const dado = dadoPrincipal(evento)
  return (
    <article className={`card-alerta risco-faixa--${classeRisco(evento.risco)}${riscoRelatado(evento) ? ' card-alerta--relatado' : ''}`}>
      <div className="card-alerta__topo">
        <SeloRisco risco={evento.risco} relatado={riscoRelatado(evento)} />
        {evento.naoConfirmado && <EtiquetaNaoConfirmado />}
        <span className="estado">{evento.estado}</span>
      </div>
      <Titulo className="card-alerta__titulo">
        <Link to={`/alertas/${evento.id}`} className="link-esticado">
          {evento.titulo}
        </Link>
      </Titulo>
      <p className="card-alerta__local">
        {evento.tipo} em {evento.bairro}
      </p>
      <div className="linha-selos">
        <SeloOrigem origem={dado.origem} />
        <SeloConfianca valor={evento.confianca} faixa={evento.faixaConfianca} eventoId={evento.id} />
      </div>
      {children}
      {/* carimbo numa linha própria: fica sempre no mesmo lugar, qualquer que seja a largura dos selos */}
      <CarimboEvento evento={evento} />
    </article>
  )
}
