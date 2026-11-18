// "atualizado há X s", ao vivo: o próprio carimbo se renova a cada segundo
import { useAgora } from '../hooks/useAgora.js'
import { formatarDataHora, tempoDecorrido } from '../services/formatar.js'
import Icone from './Icone.jsx'

export default function CarimboAtualizacao({ em, prefixo = 'atualizado' }) {
  const agora = useAgora(1000)
  return (
    <time className="carimbo" dateTime={em.toISOString()} title={formatarDataHora(em, agora)}>
      <Icone nome="relogio" />
      {prefixo ? `${prefixo} ` : ''}{tempoDecorrido(em, agora)}
    </time>
  )
}
