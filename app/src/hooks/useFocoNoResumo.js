// Formulários (Cadastro, Preferências, Publicar status): depois de um envio com erro, o foco vai para o
// resumo de erros, para quem usa teclado ou leitor de tela saber que o envio não foi feito.
// Uso: const [refResumo, focarResumo] = useFocoNoResumo(); chame focarResumo() no envio com erro e
// ponha ref={refResumo} tabIndex={-1} no resumo.
import { useEffect, useRef, useState } from 'react'

export function useFocoNoResumo() {
  const ref = useRef(null)
  const [pedidos, setPedidos] = useState(0)

  // Roda depois da renderização, quando o resumo já está na tela (também em envios repetidos)
  useEffect(() => {
    if (pedidos > 0) ref.current?.focus()
  }, [pedidos])

  return [ref, () => setPedidos((n) => n + 1)]
}
