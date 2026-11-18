import { useParams } from 'react-router-dom'
import TelaPlaceholder from '../components/TelaPlaceholder.jsx'

export default function OrigemConfianca() {
  const { id } = useParams()
  return (
    <TelaPlaceholder tela="origem">
      <p>Evento: {id}</p>
    </TelaPlaceholder>
  )
}
