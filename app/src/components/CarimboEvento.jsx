// Carimbo de um evento: ativo → "atualizado há X s" (ao vivo); Encerrado ou Descartado → só a data
// em que terminou ("Encerrado ontem, 11:18"), porque "atualizado há 1 dia" sugere um evento ainda vivo.
import { useAgora } from '../hooks/useAgora.js'
import { eventoAtivo } from '../services/eventos.js'
import { formatarDataHora } from '../services/formatar.js'
import CarimboAtualizacao from './CarimboAtualizacao.jsx'
import Icone from './Icone.jsx'

export default function CarimboEvento({ evento }) {
  const agora = useAgora(60_000)
  if (eventoAtivo(evento)) return <CarimboAtualizacao em={evento.atualizadoEm} />
  const fim = evento.historico.at(-1).em
  return (
    <time className="carimbo" dateTime={fim.toISOString()}>
      <Icone nome="relogio" />
      {evento.estado} {formatarDataHora(fim, agora)}
    </time>
  )
}
