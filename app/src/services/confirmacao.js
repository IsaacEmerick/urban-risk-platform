// "Também vejo isso" (RF17): confirmação de morador a uma ocorrência já registrada.
// Regras (docs/01-requisitos.md, Interpretações adotadas):
// - uma confirmação por usuário por evento;
// - quem tem registro no evento não confirma (nem o próprio, nem o evento ao qual o seu foi agrupado);
// - a confirmação vale para o primeiro registro da Comunidade do evento (o registro original).
import { PERFIS } from '../navegacao.js'
import { eventoAtivo } from './eventos.js'
import { ORIGENS } from './parametros.js'

export const MOTIVOS = {
  NAO_MORADOR: 'naoMorador',
  EVENTO_ENCERRADO: 'eventoEncerrado',
  SEM_REGISTRO_COMUNITARIO: 'semRegistroComunitario',
  PROPRIO_REGISTRO: 'proprioRegistro',
  JA_CONFIRMOU: 'jaConfirmou',
}

function registroOriginal(evento) {
  return evento.dados.find((d) => d.origem === ORIGENS.COMUNIDADE) ?? null
}

// Devolve { pode: true } ou { pode: false, motivo } (o motivo decide o que a tela mostra)
export function podeConfirmar(evento, usuario) {
  if (usuario.perfil !== PERFIS.MORADOR) return { pode: false, motivo: MOTIVOS.NAO_MORADOR }
  if (!eventoAtivo(evento)) return { pode: false, motivo: MOTIVOS.EVENTO_ENCERRADO }
  if (!registroOriginal(evento)) return { pode: false, motivo: MOTIVOS.SEM_REGISTRO_COMUNITARIO }
  if (evento.dados.some((d) => d.autorPseudonimo === usuario.pseudonimo)) {
    return { pode: false, motivo: MOTIVOS.PROPRIO_REGISTRO }
  }
  if ((evento.confirmadoPor ?? []).includes(usuario.id)) return { pode: false, motivo: MOTIVOS.JA_CONFIRMOU }
  return { pode: true }
}

// +1 confirmação no registro original e anota quem confirmou. A confiança só soma até 3
// confirmações (calcularConfianca); a contagem continua para aparecer em Meus registros.
export function aplicarConfirmacao(evento, usuario) {
  const { pode, motivo } = podeConfirmar(evento, usuario)
  if (!pode) throw new Error(`Confirmação não permitida: ${motivo}`)
  const original = registroOriginal(evento)
  return {
    ...evento,
    confirmadoPor: [...(evento.confirmadoPor ?? []), usuario.id],
    dados: evento.dados.map((d) => (d.id === original.id ? { ...d, confirmacoes: (d.confirmacoes ?? 0) + 1 } : d)),
  }
}

// Meus registros: os dados que o usuário registrou (pelo pseudônimo), com o evento atual de cada um
export function registrosDoUsuario(eventos, usuario) {
  return eventos
    .flatMap((evento) => evento.dados.filter((d) => d.autorPseudonimo === usuario.pseudonimo).map((dado) => ({ evento, dado })))
    .sort((a, b) => b.dado.registradoEm - a.dado.registradoEm)
}
