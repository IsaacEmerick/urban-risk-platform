// RN06: quem deve ser notificado sobre um evento
import { MINUTO, RAIO_AFETADO_METROS, REGRAS, TIPOS } from './parametros.js'
import { distanciaMetros } from './geo.js'
import { compararRisco } from './risco.js'

// Raio afetado: 500 m (Alagamento), 1 km (Ilha de calor), área informada pelo operador (Interrupção)
export function raioAfetado(evento) {
  if (evento.tipo === TIPOS.INTERRUPCAO) return evento.raioAfetadoM ?? 0
  return RAIO_AFETADO_METROS[evento.tipo]
}

// Área de interesse (RF13): por bairro, ou por ponto no mapa com raio.
// Ponto: os dois círculos (área do usuário e raio afetado) se tocam.
export function areaAlcancada(area, evento) {
  if (area.tipo === 'bairro') return area.bairro === evento.bairro
  if (area.tipo === 'ponto') return distanciaMetros(area, evento) <= area.raioM + raioAfetado(evento)
  return false
}

// ultimaNotificacao = { em, risco } da última vez que este usuário foi avisado deste evento (ou null)
export function deveNotificar(usuario, evento, { agora = new Date(), ultimaNotificacao = null } = {}) {
  if (usuario.tiposRisco && !usuario.tiposRisco.includes(evento.tipo)) return false
  const alcancado = (usuario.areasInteresse ?? []).some((area) => areaAlcancada(area, evento))
  if (!alcancado) return false
  if (!ultimaNotificacao) return true
  // Não renotifica em menos de 15 min, salvo escalada (risco subiu)
  const escalou = compararRisco(evento.risco, ultimaNotificacao.risco) > 0
  const recente = agora - ultimaNotificacao.em < REGRAS.renotificacaoMinutos * MINUTO
  return escalou || !recente
}
