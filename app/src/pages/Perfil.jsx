import { useNavigate } from 'react-router-dom'
import TelaPlaceholder from '../components/TelaPlaceholder.jsx'
import { usePerfil } from '../contexto/PerfilContext.jsx'
import { PERFIS, TELAS } from '../navegacao.js'

export default function Perfil() {
  const { usuario, sair } = usePerfil()
  const navegar = useNavigate()

  // Meus registros só para o morador (RF15)
  const atalhos = [
    { rotulo: TELAS.preferencias.titulo, para: TELAS.preferencias.caminho },
    { rotulo: TELAS.privacidade.titulo, para: TELAS.privacidade.caminho },
    ...(usuario.perfil === PERFIS.MORADOR
      ? [{ rotulo: TELAS.meusRegistros.titulo, para: TELAS.meusRegistros.caminho }]
      : []),
  ]

  return (
    <TelaPlaceholder tela="perfil" atalhos={atalhos}>
      <p>
        {usuario.nome} · {usuario.descricao}
      </p>
      <button
        type="button"
        onClick={() => {
          sair()
          navegar('/login')
        }}
      >
        Sair
      </button>
    </TelaPlaceholder>
  )
}
