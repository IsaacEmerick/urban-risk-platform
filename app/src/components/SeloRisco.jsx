// Risco sempre com cor + ícone + texto (RNF07). Variante "tarja" é a faixa larga do Detalhe do alerta.
// cancelado: selo apagado (cinza) no cartão "Alerta cancelado" — o ícone mantém a forma do nível.
// relatado: evento Reportado ou Em validação (RF06, RF07) — selo vazado, mesma cor e ícone, texto "(relatado)".
import Icone from './Icone.jsx'
import { classeRisco } from './apresentacao.js'

export default function SeloRisco({ risco, variante = 'selo', cancelado = false, relatado = false }) {
  const nivel = classeRisco(risco)
  const cor = cancelado ? 'risco--cancelado' : relatado ? `risco-vazado risco-vazado--${nivel}` : `risco--${nivel}`
  const classe = `${variante === 'tarja' ? 'tarja-risco' : 'selo-risco'} ${cor}`
  return (
    <span className={classe}>
      <Icone nome={risco} className="icone icone--risco" />
      <span>
        Risco {risco}
        {cancelado && ' (cancelado)'}
        {relatado && !cancelado && ' (relatado)'}
      </span>
    </span>
  )
}
