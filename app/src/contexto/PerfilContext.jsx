// Usuário logado no protótipo. O id fica no navegador só por conveniência (services/sessao.js).
// Inscrito no repositório: quando as preferências ou os consentimentos mudam, as telas veem na hora.
import { createContext, useContext, useState } from 'react'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { entrarNaSessao, lerSessao, sairDaSessao } from '../services/sessao.js'

const PerfilContext = createContext(null)

export function PerfilProvider({ children }) {
  const repositorio = useRepositorio()
  const [usuarioId, setUsuarioId] = useState(() => lerSessao())
  // Aviso para o Login depois de sair (ex.: conta excluída); some ao entrar de novo
  const [avisoSaida, setAvisoSaida] = useState(null)
  const usuario = usuarioId ? (repositorio.obterUsuario(usuarioId) ?? null) : null

  const entrar = (id) => {
    entrarNaSessao(repositorio, id)
    setAvisoSaida(null)
    setUsuarioId(id)
  }
  // Sair não reinicia os dados em memória: só esquece quem está logado
  const sair = (aviso = null) => {
    sairDaSessao(repositorio, usuarioId)
    setAvisoSaida(aviso)
    setUsuarioId(null)
  }

  return <PerfilContext.Provider value={{ usuario, entrar, sair, avisoSaida }}>{children}</PerfilContext.Provider>
}

export function usePerfil() {
  return useContext(PerfilContext)
}
