// Tempo real: a tela se inscreve no repositório e redesenha sempre que ele avisa que algo mudou
// (leitura nova do simulador, ação do agente, notificação lida). Os dados são lidos no render.
import { useEffect, useState } from 'react'
import { repositorio } from '../services/repositorio.js'

export function useRepositorio() {
  const [, setVersao] = useState(0)
  useEffect(() => {
    const cancelar = repositorio.inscrever(() => setVersao((v) => v + 1))
    return () => {
      cancelar()
    }
  }, [])
  return repositorio
}
