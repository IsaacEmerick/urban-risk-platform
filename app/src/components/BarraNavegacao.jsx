// Navegação inferior: as abas mudam conforme o perfil (navegacao.js).
// A aba Notificações mostra quantas não lidas há: é assim que Ana percebe um alerta novo chegando.
import { NavLink } from 'react-router-dom'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { ABAS, TELAS } from '../navegacao.js'

export default function BarraNavegacao({ usuario }) {
  const repositorio = useRepositorio()
  const naoLidas = repositorio.listarNotificacoes(usuario.id).filter((n) => !n.lida).length

  return (
    <nav className="barra-navegacao" aria-label="Navegação principal">
      {ABAS[usuario.perfil].map((aba) => {
        const contador = aba.tela === 'notificacoes' && naoLidas > 0
        return (
          <NavLink
            key={aba.tela}
            to={TELAS[aba.tela].caminho}
            end={aba.tela !== 'perfil' && aba.tela !== 'alertas'}
            aria-label={contador ? `${aba.rotulo}, ${naoLidas} não lidas` : undefined}
          >
            <span>{aba.rotulo}</span>
            {contador && (
              <span className="contador" aria-hidden="true">
                {naoLidas}
              </span>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
