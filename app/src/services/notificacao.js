// RN06: quem deve ser notificado sobre um evento
import { MINUTO, RAIO_AFETADO_METROS, REGRAS, TIPOS } from './parametros.js'
import { distanciaMetros } from './geo.js'
import { compararRisco } from './risco.js'

// Raio afetado: 500 m (Alagamento), 1 km (Ilha de calor), área informada pelo operador (Interrupção)
export function raioAfetado(evento) {
  if (evento.tipo === TIPOS.INTERRUPCAO) return evento.raioAfetadoM ?? 0
  return RAIO_AFETADO_METROS[evento.tipo]
}

// Área de interesse (RF13): por bairro ou por ponto no mapa com raio. As duas são círculos
// (centro lat/lng + raioM; o bairro usa centro e raio aproximados de data/bairros.json).
// Alcança se distância(centro da área, evento) ≤ raio da área + raio afetado do evento.
export function areaAlcancada(area, evento) {
  if (area.lat == null || area.lng == null || area.raioM == null) {
    throw new Error(`Área de interesse sem centro e raio: ${area.bairro ?? area.tipo}`)
  }
  return distanciaMetros(area, evento) <= area.raioM + raioAfetado(evento)
}

// Completa as áreas por bairro com o centro e o raio do catálogo de bairros
export function resolverAreas(areas, bairros) {
  return areas.map((area) => {
    if (area.tipo !== 'bairro') return area
    const bairro = bairros.find((b) => b.nome === area.bairro)
    if (!bairro) throw new Error(`Bairro não cadastrado: ${area.bairro}`)
    return { ...area, lat: bairro.lat, lng: bairro.lng, raioM: bairro.raioM }
  })
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
