// Moldura das telas logadas: aviso do modo demonstração + conteúdo + navegação inferior do perfil
import { Outlet } from 'react-router-dom'
import BarraNavegacao from './BarraNavegacao.jsx'
import { usePerfil } from '../contexto/PerfilContext.jsx'
import { MODO_DEMONSTRACAO } from '../modoDemonstracao.js'

export default function Layout() {
  const { usuario } = usePerfil()
  return (
    <div className="layout">
      {MODO_DEMONSTRACAO && (
        <p className="aviso-demo" role="note">
          Modo demonstração: o sensor do rio Cotia envia uma leitura a cada 2 s.
        </p>
      )}
      <main className="conteudo">
        <Outlet />
      </main>
      <BarraNavegacao usuario={usuario} />
    </div>
  )
}
