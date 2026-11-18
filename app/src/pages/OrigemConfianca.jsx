// Origem e confiança (RF05, RF09): de onde vem cada dado do evento, quando foi atualizado e
// o cálculo da confiança, igual à seção 4.1: base da origem + cada ajuste = total (limitado a 0–100).
import { Link, useParams } from 'react-router-dom'
import CarimboAtualizacao from '../components/CarimboAtualizacao.jsx'
import Icone from '../components/Icone.jsx'
import SeloConfianca from '../components/SeloConfianca.jsx'
import SeloOrigem from '../components/SeloOrigem.jsx'
import { useAgora } from '../hooks/useAgora.js'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { dadoPrincipal } from '../services/eventos.js'
import { formatarDataHora } from '../services/formatar.js'
import { FAIXAS_CONFIANCA, ORIGENS } from '../services/parametros.js'

// Pontos com sinal: a base aparece sem sinal; ajustes com + ou − (sinal de menos tipográfico)
const comSinal = (pontos) => (pontos > 0 ? `+${pontos}` : `−${Math.abs(pontos)}`)

function CalculoConfianca({ confianca }) {
  const [base, ...ajustes] = confianca.ajustes
  const soma = confianca.ajustes.reduce((total, a) => total + a.pontos, 0)
  return (
    <table className="calculo">
      <caption className="sr-only">Cálculo da confiança deste dado</caption>
      <tbody>
        <tr>
          <th scope="row">{base.descricao}</th>
          <td>{base.pontos}</td>
        </tr>
        {ajustes.map((a) => (
          <tr key={a.descricao} className={a.pontos < 0 ? 'calculo__negativo' : undefined}>
            <th scope="row">{a.descricao}</th>
            <td>{comSinal(a.pontos)}</td>
          </tr>
        ))}
        {soma !== confianca.valor && (
          <tr>
            <th scope="row">Soma {soma}, limitada a 0–100</th>
            <td />
          </tr>
        )}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Confiança {confianca.faixa}</th>
          <td>{confianca.valor}</td>
        </tr>
      </tfoot>
    </table>
  )
}

export default function OrigemConfianca() {
  const { id } = useParams()
  const repositorio = useRepositorio()
  const agora = useAgora(30_000)
  const evento = repositorio.obterEvento(id)
  if (!evento) {
    return (
      <div className="vazio">
        <h1>Evento não encontrado</h1>
        <Link to="/painel">Ir para o Painel</Link>
      </div>
    )
  }
  const principal = dadoPrincipal(evento)
  const totalDados = evento.dados.length

  return (
    <article className="origem">
      <Link to={`/alertas/${evento.id}`} className="botao-voltar">
        <Icone nome="voltar" />
        Voltar ao alerta
      </Link>

      <header className="cabecalho-tela">
        <h1>Origem e confiança</h1>
        <p className="cabecalho-tela__sub">{evento.titulo}</p>
      </header>

      <section className="resumo-confianca" aria-label="Confiança do evento">
        <SeloConfianca valor={evento.confianca} faixa={evento.faixaConfianca} grande />
        <p>
          {totalDados === 1
            ? 'O evento tem um dado; a confiança do evento é a desse dado.'
            : `O evento reúne ${totalDados} dados; vale a confiança do mais confiável.`}
        </p>
        <ul className="faixas" aria-label="Faixas de confiança">
          <li>
            <SeloConfianca valor={`≥ ${FAIXAS_CONFIANCA.alta}`} faixa="Alta" />
          </li>
          <li>
            <SeloConfianca valor={`${FAIXAS_CONFIANCA.media}–${FAIXAS_CONFIANCA.alta - 1}`} faixa="Média" />
          </li>
          <li>
            <SeloConfianca valor={`< ${FAIXAS_CONFIANCA.media}`} faixa="Baixa" />
          </li>
        </ul>
      </section>

      <h2 className="titulo-secao">{totalDados === 1 ? 'Dado recebido' : 'Dados recebidos'}</h2>
      <ol className="lista-dados">
        {evento.dados.map((dado) => (
          <li key={dado.id} className={dado.id === principal.id ? 'dado dado--principal' : 'dado'}>
            <div className="dado__topo">
              <SeloOrigem origem={dado.origem} />
              {totalDados > 1 && dado.id === principal.id && <span className="nota">dá a confiança do evento</span>}
            </div>
            <dl className="dado__fatos">
              <div>
                <dt>Fonte</dt>
                <dd>{dado.origem === ORIGENS.COMUNIDADE ? `Morador (pseudônimo ${dado.autorPseudonimo ?? 'anônimo'})` : dado.fonte}</dd>
              </div>
              <div>
                <dt>Última atualização</dt>
                <dd>
                  {formatarDataHora(dado.atualizadoEm, agora)} <CarimboAtualizacao em={dado.atualizadoEm} prefixo="" />
                </dd>
              </div>
              <div>
                <dt>Local</dt>
                <dd>
                  {dado.bairro}
                  {dado.origem === ORIGENS.COMUNIDADE && ', posição aproximada (cerca de 100 m)'}
                </dd>
              </div>
              <div>
                <dt>O que informa</dt>
                <dd>{dado.descricao}</dd>
              </div>
            </dl>
            <CalculoConfianca confianca={dado.confianca} />
          </li>
        ))}
      </ol>
    </article>
  )
}
