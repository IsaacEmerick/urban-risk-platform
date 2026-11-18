// Proteção de dados pessoais (RNF08, LGPD)
import { ORIGENS } from './parametros.js'

// Casas decimais da localização pública: 3 casas = 0,001°, cerca de 111 m de latitude e
// cerca de 102 m de longitude em Barueri (latitude −23,5°). Ou seja, uma grade de ~100 m.
const CASAS_LOCALIZACAO_PUBLICA = 3

// Raio do círculo que o mapa público desenha no lugar de um pino quando a posição é aproximada
export const RAIO_POSICAO_APROXIMADA_M = 100

const arredondar = (valor) => {
  const fator = 10 ** CASAS_LOCALIZACAO_PUBLICA
  return Math.round(valor * fator) / fator
}

// Localização exibida no mapa público para registros da Comunidade: a posição exata de quem
// registrou não sai da camada de aplicação, só o ponto da grade de ~100 m.
export function localizacaoPublica({ lat, lng }) {
  return { lat: arredondar(lat), lng: arredondar(lng) }
}

// Posição do evento no mapa público (Painel e mini mapa do Detalhe).
// Se o evento tem dado de Sensor ou Base pública, usa a posição dessa fonte (equipamento público).
// Se só tem registros da Comunidade, a posição passa por localizacaoPublica() (~100 m) e vem marcada
// como aproximada: o mapa desenha um círculo de ~100 m em vez de um pino.
export function posicaoPublicaEvento(evento) {
  const fontePublica = evento.dados.find((d) => d.origem !== ORIGENS.COMUNIDADE)
  if (fontePublica) return { lat: fontePublica.lat, lng: fontePublica.lng, aproximada: false }
  return { ...localizacaoPublica(evento), aproximada: true }
}

// Posição de um dado na tela Origem e confiança: registro de morador nunca aparece com precisão
export function posicaoPublicaDado(dado) {
  return dado.origem === ORIGENS.COMUNIDADE ? localizacaoPublica(dado) : { lat: dado.lat, lng: dado.lng }
}
