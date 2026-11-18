// Régua do nível do rio Cotia (Detalhe do alerta): nível atual × cota de transbordamento,
// com as marcas das faixas de risco da seção 4.2 (falta ≤ 1,0 m Moderado, ≤ 0,5 m Alto, < 0 Crítico).
// Valores fictícios do protótipo, não as cotas oficiais do rio.
import { LIMIARES_RISCO } from '../services/parametros.js'
import { formatarMetros } from '../services/formatar.js'
import { faltaParaTransbordar } from '../services/risco.js'
import SeloRisco from './SeloRisco.jsx'

// Trecho mostrado na régua: de 1,5 m abaixo da cota até 0,3 m acima (só para desenhar)
const ABAIXO_DA_COTA_M = 1.5
const ACIMA_DA_COTA_M = 0.3

export default function ReguaRio({ dado }) {
  const { nivelRioM, cotaTransbordamentoM: cota } = dado.medicoes
  const min = cota - ABAIXO_DA_COTA_M
  const max = cota + ACIMA_DA_COTA_M
  const pct = (valor) => `${Math.max(0, Math.min(100, ((valor - min) / (max - min)) * 100))}%`
  const falta = faltaParaTransbordar(nivelRioM, cota)
  const marcas = [
    { rotulo: 'atenção', valor: cota - LIMIARES_RISCO.faltaTransbordarM.moderado },
    { rotulo: 'alerta', valor: cota - LIMIARES_RISCO.faltaTransbordarM.alto },
    { rotulo: 'transborda', valor: cota },
  ]

  return (
    <figure className="regua">
      <figcaption className="regua__legenda">
        <span className="regua__valor">{formatarMetros(nivelRioM)} m</span>
        <span>
          {falta < 0
            ? `transbordou ${formatarMetros(-falta)} m acima da margem`
            : `faltam ${formatarMetros(falta)} m para a cota de transbordamento (${formatarMetros(cota)} m)`}
        </span>
        <SeloRisco risco={dado.risco} />
      </figcaption>
      <div
        className="regua__trilho"
        role="meter"
        aria-label="Nível do rio Cotia"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={nivelRioM}
        aria-valuetext={`${formatarMetros(nivelRioM)} metros`}
      >
        <div className="regua__agua" style={{ width: pct(nivelRioM) }} />
        {marcas.map((m) => (
          <span key={m.rotulo} className="regua__marca" style={{ left: pct(m.valor) }}>
            <span className="regua__marca-texto">{m.rotulo}</span>
          </span>
        ))}
      </div>
      <p className="nota">Valores fictícios do protótipo, não as cotas oficiais do rio Cotia.</p>
    </figure>
  )
}
