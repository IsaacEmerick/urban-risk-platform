// Proteção de dados pessoais (RNF08, LGPD)

// Casas decimais da localização pública: 3 casas = 0,001°, cerca de 111 m de latitude e
// cerca de 102 m de longitude em Barueri (latitude −23,5°). Ou seja, uma grade de ~100 m.
const CASAS_LOCALIZACAO_PUBLICA = 3

const arredondar = (valor) => {
  const fator = 10 ** CASAS_LOCALIZACAO_PUBLICA
  return Math.round(valor * fator) / fator
}

// Localização exibida no mapa público para registros da Comunidade: a posição exata de quem
// registrou não sai da camada de aplicação, só o ponto da grade de ~100 m.
export function localizacaoPublica({ lat, lng }) {
  return { lat: arredondar(lat), lng: arredondar(lng) }
}
