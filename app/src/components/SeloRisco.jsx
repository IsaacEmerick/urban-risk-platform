// Risco sempre com cor + ícone + texto (RNF07). Variante "tarja" é a faixa larga do Detalhe do alerta.
// cancelado: selo apagado (cinza) no cartão "Alerta cancelado" — o ícone mantém a forma do nível.
import Icone from './Icone.jsx'
import { classeRisco } from './apresentacao.js'

export default function SeloRisco({ risco, variante = 'selo', cancelado = false }) {
  const cor = cancelado ? 'risco--cancelado' : `risco--${classeRisco(risco)}`
  const classe = `${variante === 'tarja' ? 'tarja-risco' : 'selo-risco'} ${cor}`
  return (
    <span className={classe}>
      <Icone nome={risco} className="icone icone--risco" />
      <span>
        Risco {risco}
        {cancelado && ' (cancelado)'}
      </span>
    </span>
  )
}
