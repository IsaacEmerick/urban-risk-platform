// Análises (RF14, RNF11): eventos do período (7 ou 30 dias) por tipo de risco e por bairro, e as duas metas
// do RNF11 calculadas ao vivo, sempre nos últimos 30 dias (falso alerta ≤ 10%; ≥ 90% dos alertas Alto/Crítico
// com confiança Alta no momento do alerta, confiancaAlertada), com os alertas preliminares à parte.
// Gráficos em SVG feitos à mão; cada um tem uma tabela equivalente para leitor de tela.
import { useState } from 'react'
import Icone from '../components/Icone.jsx'
import { useAgora } from '../hooks/useAgora.js'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { METAS_RNF11, PERIODOS_DIAS, formatarPercentual, resumoAnalises } from '../services/analises.js'

// Barras horizontais de uma série só: rótulo, barra e valor na mesma linha.
// A parte visual fica escondida do leitor de tela; a tabela (sr-only) diz o mesmo.
function GraficoBarras({ id, titulo, dados, rotuloCategoria }) {
  const maximo = Math.max(1, ...dados.map((d) => d.total))
  return (
    <section className="bloco grafico" aria-labelledby={id}>
      <h2 id={id} className="titulo-secao">
        {titulo}
      </h2>
      <div className="grafico__barras" aria-hidden="true">
        {dados.map((d) => (
          <div key={d.categoria} className="grafico__linha">
            <span className="grafico__rotulo">{d.categoria}</span>
            <svg className="grafico__svg" viewBox="0 0 100 10" preserveAspectRatio="none">
              <title>{`${d.categoria}: ${d.total} ${d.total === 1 ? 'evento' : 'eventos'}`}</title>
              <rect className="grafico__trilho" x="0" y="0" width="100" height="10" rx="2" />
              {d.total > 0 && <rect className="grafico__barra" x="0" y="0" width={(d.total / maximo) * 100} height="10" rx="2" />}
            </svg>
            <span className="grafico__valor">{d.total}</span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">{rotuloCategoria}</th>
            <th scope="col">Eventos</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.categoria}>
              <th scope="row">{d.categoria}</th>
              <td>{d.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

// Situação da meta: ícone + texto (nunca só cor)
function SituacaoMeta({ cumpre }) {
  if (cumpre === null) return <span className="meta__situacao">Sem alertas no período</span>
  return cumpre ? (
    <span className="meta__situacao meta__situacao--ok">
      <Icone nome="confirmado" />
      Dentro da meta
    </span>
  ) : (
    <span className="meta__situacao meta__situacao--fora">
      <Icone nome="Alto" />
      Fora da meta
    </span>
  )
}

// Medidor de uma meta: trilho de 0 a 100%, barra com o valor e um traço na meta
function MedidorMeta({ id, titulo, descricao, parte, todo, taxa, meta, textoMeta, cumpre }) {
  return (
    <section className="meta" aria-labelledby={id}>
      <h3 id={id} className="meta__titulo">
        {titulo}
      </h3>
      <p className="meta__valor">
        <strong>{todo === 0 ? '—' : formatarPercentual(taxa)}</strong>
        <span className="meta__conta">
          {parte} de {todo} {descricao}
        </span>
      </p>
      <svg className="meta__svg" viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true">
        <rect className="grafico__trilho" x="0" y="3" width="100" height="8" rx="2" />
        {todo > 0 && <rect className="grafico__barra" x="0" y="3" width={Math.max(taxa * 100, 0.5)} height="8" rx="2" />}
        <line className="meta__traco" x1={meta * 100} x2={meta * 100} y1="0" y2="14" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="meta__rodape">
        <span>{textoMeta}</span>
        <SituacaoMeta cumpre={cumpre} />
      </p>
    </section>
  )
}

export default function Analises() {
  const repositorio = useRepositorio()
  const agora = useAgora(60_000)
  const [dias, setDias] = useState(30)

  const r = resumoAnalises(repositorio.listarEventos(), { agora, dias, bairros: repositorio.listarBairros() })
  const { falsoAlerta, confiancaAlta, preliminares } = r

  return (
    <div className="analises">
      <header className="cabecalho-tela">
        <h1>Análises</h1>
        <p className="cabecalho-tela__sub">Parque Viana e Jardim Maria Helena</p>
      </header>

      <section className="bloco" aria-labelledby="titulo-metas">
        <h2 id="titulo-metas" className="titulo-secao">
          Qualidade dos alertas (RNF11)
        </h2>
        <p className="nota">Medido nos últimos 30 dias</p>
        <div className="metas">
          <MedidorMeta
            id="meta-falso"
            titulo="Falso alerta"
            descricao="alertas emitidos foram cancelados depois"
            parte={falsoAlerta.falsos}
            todo={falsoAlerta.emitidos}
            taxa={falsoAlerta.taxa}
            meta={METAS_RNF11.falsoAlertaMax}
            textoMeta="Meta: até 10%"
            cumpre={falsoAlerta.cumpre}
          />
          <MedidorMeta
            id="meta-confianca"
            titulo="Alertas Alto/Crítico com confiança Alta"
            descricao="alertas tinham confiança Alta (≥ 75) quando foram emitidos"
            parte={confiancaAlta.comConfiancaAlta}
            todo={confiancaAlta.alertas}
            taxa={confiancaAlta.taxa}
            meta={METAS_RNF11.confiancaAltaMin}
            textoMeta="Meta: 90% ou mais"
            cumpre={confiancaAlta.cumpre}
          />
        </div>
        <div className="preliminares">
          <h3 className="meta__titulo">Alertas preliminares (“não confirmado”)</h3>
          <dl className="preliminares__numeros">
            <div>
              <dt>Emitidos em 30 dias</dt>
              <dd>{preliminares.houve}</dd>
            </div>
            <div>
              <dt>Confirmados depois</dt>
              <dd>{preliminares.confirmadosDepois}</dd>
            </div>
          </dl>
          <p className="nota">
            Contam com a confiança do momento do envio: a confirmação posterior (pelo agente ou pela confiança) não muda a
            segunda meta.
          </p>
        </div>
      </section>

      <div className="filtros" role="group" aria-label="Período dos gráficos">
        {PERIODOS_DIAS.map((d) => (
          <button key={d} type="button" className="filtro" aria-pressed={dias === d} onClick={() => setDias(d)}>
            {d} dias
          </button>
        ))}
      </div>
      <p className="nota" aria-live="polite">
        {r.total} {r.total === 1 ? 'evento' : 'eventos'} nos últimos {dias} dias
      </p>

      <GraficoBarras id="grafico-tipo" titulo={`Eventos por tipo de risco (${dias} dias)`} dados={r.porTipo} rotuloCategoria="Tipo de risco" />
      <GraficoBarras id="grafico-bairro" titulo={`Eventos por bairro (${dias} dias)`} dados={r.porBairro} rotuloCategoria="Bairro" />
    </div>
  )
}
