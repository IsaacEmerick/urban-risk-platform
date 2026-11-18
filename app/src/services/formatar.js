// Formatação de textos exibidos nas telas (tempo, horário, metros). Sem regra de negócio.
const SEGUNDO = 1000
const MINUTO_MS = 60 * SEGUNDO
const HORA_MS = 60 * MINUTO_MS
const DIA_MS = 24 * HORA_MS

// "há 12 s", "há 3 min", "há 2 h", "há 1 dia" — usado no carimbo "atualizado há X s"
export function tempoDecorrido(desde, agora = new Date()) {
  const ms = Math.max(0, agora - desde)
  if (ms < MINUTO_MS) return `há ${Math.floor(ms / SEGUNDO)} s`
  if (ms < HORA_MS) return `há ${Math.floor(ms / MINUTO_MS)} min`
  if (ms < DIA_MS) return `há ${Math.floor(ms / HORA_MS)} h`
  const dias = Math.floor(ms / DIA_MS)
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

const doisDigitos = (n) => String(n).padStart(2, '0')

export function formatarHorario(data) {
  return `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`
}

// "hoje, 14:32", "ontem, 09:10" ou "15/11, 18:05"
export function formatarDataHora(data, agora = new Date()) {
  const inicioDoDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dias = Math.round((inicioDoDia(agora) - inicioDoDia(data)) / DIA_MS)
  const dia = dias === 0 ? 'hoje' : dias === 1 ? 'ontem' : `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}`
  return `${dia}, ${formatarHorario(data)}`
}

// 3.85 → "3,85" (metros com 2 casas, vírgula decimal)
export function formatarMetros(valor) {
  return valor.toFixed(2).replace('.', ',')
}
