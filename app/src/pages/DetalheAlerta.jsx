import { useParams } from 'react-router-dom'
import TelaPlaceholder from '../components/TelaPlaceholder.jsx'

export default function DetalheAlerta() {
  const { id } = useParams()
  return (
    <TelaPlaceholder tela="detalhe" atalhos={[{ rotulo: 'Origem e confiança', para: `/alertas/${id}/origem` }]}>
      <p>Evento: {id}</p>
    </TelaPlaceholder>
  )
}
