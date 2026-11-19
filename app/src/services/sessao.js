// Sessão do protótipo (RF15): quem está logado. Não há senha real: as contas de demonstração entram
// com um toque. Sair só esquece o usuário logado; os dados em memória (eventos, notificações) continuam.
import { ACOES_ACESSO } from './conta.js'

const CHAVE = 'urp:usuarioId'

// Armazenamento do navegador, se existir (janela anônima pode bloquear)
function armazenamentoPadrao() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function lerSessao(armazenamento = armazenamentoPadrao()) {
  try {
    return armazenamento?.getItem(CHAVE) ?? null
  } catch {
    return null
  }
}

function gravar(armazenamento, id) {
  try {
    if (id) armazenamento?.setItem(CHAVE, id)
    else armazenamento?.removeItem(CHAVE)
  } catch {
    // sem armazenamento: o login vale só até recarregar
  }
}

export function entrarNaSessao(repositorio, usuarioId, { armazenamento = armazenamentoPadrao(), momento = new Date() } = {}) {
  gravar(armazenamento, usuarioId)
  repositorio.registrarAcesso(usuarioId, ACOES_ACESSO.ENTROU, momento)
}

export function sairDaSessao(repositorio, usuarioId, { armazenamento = armazenamentoPadrao(), momento = new Date() } = {}) {
  // Depois de excluir a conta não há mais o que registrar
  if (usuarioId && repositorio.obterUsuario(usuarioId)) repositorio.registrarAcesso(usuarioId, ACOES_ACESSO.SAIU, momento)
  gravar(armazenamento, null)
}
