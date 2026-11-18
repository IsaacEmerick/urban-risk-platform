// Origem do dado com o nome exato do glossário: Sensor, Base pública, Base pública (concessionária), Comunidade
import Icone from './Icone.jsx'

export default function SeloOrigem({ origem }) {
  return (
    <span className="selo-origem" aria-label={`Origem: ${origem}`}>
      <Icone nome={origem} />
      <span>{origem}</span>
    </span>
  )
}
