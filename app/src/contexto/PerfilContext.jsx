// Usuário logado no protótipo (Ana, Carlos ou Juliana). Guardado no navegador só por conveniência.
import { createContext, useContext, useState } from 'react'
import { repositorio } from '../services/repositorio.js'

const CHAVE = 'urp:usuarioId'
const PerfilContext = createContext(null)

function lerUsuarioSalvo() {
  try {
    return localStorage.getItem(CHAVE)
  } catch {
    return null
  }
}

function salvarUsuario(id) {
  try {
    if (id) localStorage.setItem(CHAVE, id)
    else localStorage.removeItem(CHAVE)
  } catch {
    // sem armazenamento (janela anônima etc.): o login vale só até recarregar
  }
}

export function PerfilProvider({ children }) {
  const [usuarioId, setUsuarioId] = useState(lerUsuarioSalvo)
  const usuario = usuarioId ? (repositorio.obterUsuario(usuarioId) ?? null) : null

  const entrar = (id) => {
    salvarUsuario(id)
    setUsuarioId(id)
  }
  const sair = () => {
    salvarUsuario(null)
    setUsuarioId(null)
  }

  return <PerfilContext.Provider value={{ usuario, entrar, sair }}>{children}</PerfilContext.Provider>
}

export function usePerfil() {
  return useContext(PerfilContext)
}
