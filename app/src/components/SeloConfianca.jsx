// Selo de confiança "Alta • 82". O medidor tem 1, 2 ou 3 segmentos (Baixa, Média, Alta):
// a faixa aparece pela quantidade, sem usar cor, para não competir com a cor do risco.
// Com eventoId, o selo é um link para a tela Origem e confiança (o cálculo explicado).
import { Link } from 'react-router-dom'

const SEGMENTOS = { Baixa: 1, Média: 2, Alta: 3 }

export default function SeloConfianca({ valor, faixa, eventoId, grande = false }) {
  const ativos = SEGMENTOS[faixa] ?? 0
  const conteudo = (
    <>
      <span className="medidor" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= ativos ? 'medidor__segmento medidor__segmento--ativo' : 'medidor__segmento'} />
        ))}
      </span>
      <span className="selo-confianca__texto">
        {faixa} • {valor}
      </span>
    </>
  )
  const classe = `selo-confianca${grande ? ' selo-confianca--grande' : ''}`
  const rotulo = `Confiança ${faixa}, ${valor} de 100`

  if (!eventoId) {
    return (
      <span className={classe} role="img" aria-label={rotulo}>
        {conteudo}
      </span>
    )
  }
  return (
    <Link to={`/alertas/${eventoId}/origem`} className={`${classe} selo-confianca--link`} aria-label={`${rotulo}. Ver origem e cálculo`}>
      {conteudo}
    </Link>
  )
}
