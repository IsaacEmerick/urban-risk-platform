// Risco sempre com cor + ícone + texto (RNF07). Variante "tarja" é a faixa larga do Detalhe do alerta.
import Icone from './Icone.jsx'
import { classeRisco } from './apresentacao.js'

export default function SeloRisco({ risco, variante = 'selo' }) {
  const classe = `${variante === 'tarja' ? 'tarja-risco' : 'selo-risco'} risco--${classeRisco(risco)}`
  return (
    <span className={classe}>
      <Icone nome={risco} className="icone icone--risco" />
      <span>Risco {risco}</span>
    </span>
  )
}
