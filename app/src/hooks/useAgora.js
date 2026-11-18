// Relógio para os carimbos "atualizado há X s": devolve a hora atual e se renova a cada intervalo
import { useEffect, useState } from 'react'

export function useAgora(intervaloMs = 1000) {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), intervaloMs)
    return () => clearInterval(id)
  }, [intervaloMs])
  return agora
}
