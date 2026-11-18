import { useNavigate } from 'react-router-dom'
import TelaPlaceholder from '../components/TelaPlaceholder.jsx'
import { usePerfil } from '../contexto/PerfilContext.jsx'
import { repositorio } from '../services/repositorio.js'

// Provisório: escolher a persona para navegar pelo protótipo. A tela real vem na sessão 6.
export default function Login() {
  const { entrar } = usePerfil()
  const navegar = useNavigate()

  const entrarComo = (id) => {
    entrar(id)
    navegar('/painel')
  }

  return (
    <TelaPlaceholder tela="login">
      <div className="placeholder-botoes">
        {repositorio.listarUsuarios().map((u) => (
          <button key={u.id} type="button" onClick={() => entrarComo(u.id)}>
            Entrar como {u.nome} ({u.descricao})
          </button>
        ))}
      </div>
    </TelaPlaceholder>
  )
}
