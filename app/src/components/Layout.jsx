// Moldura das telas logadas: conteúdo + navegação inferior do perfil
import { Outlet } from 'react-router-dom'
import BarraNavegacao from './BarraNavegacao.jsx'
import { usePerfil } from '../contexto/PerfilContext.jsx'

export default function Layout() {
  const { usuario } = usePerfil()
  return (
    <div className="layout">
      <main className="conteudo">
        <Outlet />
      </main>
      <BarraNavegacao perfil={usuario.perfil} />
    </div>
  )
}
