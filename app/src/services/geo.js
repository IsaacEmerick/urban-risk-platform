// Distância entre dois pontos (lat/lng) em metros, pela fórmula de haversine.
// Arredondada ao centímetro, para que 500 m não vire 500,0000001 m e erre a comparação "≤ 500 m".
const RAIO_TERRA_M = 6371000

export function distanciaMetros(a, b) {
  const rad = (graus) => (graus * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  const metros = 2 * RAIO_TERRA_M * Math.asin(Math.sqrt(h))
  return Math.round(metros * 100) / 100
}

// Ponto deslocado N metros para o norte (usado nos testes para montar distâncias exatas)
export function deslocarParaNorte(ponto, metros) {
  return { lat: ponto.lat + (metros / RAIO_TERRA_M) * (180 / Math.PI), lng: ponto.lng }
}
