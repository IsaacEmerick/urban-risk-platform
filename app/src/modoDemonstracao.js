// Modo demonstração (?demo=1): lido uma vez ao abrir o app e guardado na sessão do navegador,
// para não se perder ao navegar entre as telas. ?demo=0 desliga.
import { emModoDemonstracao } from './services/simulador.js'

const CHAVE = 'urp:demo'

function lerModo() {
  const parametro = new URLSearchParams(window.location.search).get('demo')
  try {
    if (parametro != null) {
      if (emModoDemonstracao(window.location.search)) sessionStorage.setItem(CHAVE, '1')
      else sessionStorage.removeItem(CHAVE)
    }
    return sessionStorage.getItem(CHAVE) === '1'
  } catch {
    return emModoDemonstracao(window.location.search) // sem armazenamento: vale só a URL
  }
}

export const MODO_DEMONSTRACAO = lerModo()
