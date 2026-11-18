// Navegação inferior: as abas mudam conforme o perfil (navegacao.js)
import { NavLink } from 'react-router-dom'
import { ABAS, TELAS } from '../navegacao.js'

export default function BarraNavegacao({ perfil }) {
  return (
    <nav className="barra-navegacao" aria-label="Navegação principal">
      {ABAS[perfil].map((aba) => (
        <NavLink key={aba.tela} to={TELAS[aba.tela].caminho} end={aba.tela !== 'perfil' && aba.tela !== 'alertas'}>
          {aba.rotulo}
        </NavLink>
      ))}
    </nav>
  )
}
