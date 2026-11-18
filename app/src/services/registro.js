// Registro comunitário (RF03, RNF06): monta o dado de origem Comunidade que entra no mesmo caminho
// dos outros dados (confiança → risco → RN04 → estados). Sem tela aqui: só a regra, para testar.
import { distanciaMetros } from './geo.js'
import { ORIGENS, TIPOS } from './parametros.js'

// "Até onde a água chegou?" — referências do corpo e da rua, que qualquer morador consegue avaliar.
// O valor em cm vai para laminaCm e é classificado pela seção 4.2 (Alto ≥ 10 cm, Crítico > 30 cm).
export const ALTURAS_AGUA = [
  // ‑ = hífen que não quebra linha: o botão não mostra "meio-" numa linha e "fio" na outra
  { id: 'abaixoMeioFio', rotulo: 'Abaixo do meio‑fio', noTitulo: 'abaixo do meio-fio', cm: 5 }, // Baixo
  { id: 'meioFio', rotulo: 'Na altura do meio‑fio', noTitulo: 'na altura do meio-fio', cm: 15 }, // Alto
  { id: 'canela', rotulo: 'Na canela', noTitulo: 'na altura da canela', cm: 35 }, // Crítico
  { id: 'joelho', rotulo: 'Acima do joelho', noTitulo: 'acima do joelho', cm: 50 }, // Crítico
]

// Sugestões de um toque para a descrição (opcional) de um alagamento
export const SUGESTOES_DESCRICAO = ['Rua alagada', 'Carro ilhado', 'Água entrando em casa', 'Bueiro entupido']

// "Posição atual" da Ana no protótipo: um ponto fixo no Parque Viana. O GPS real do navegador
// colocaria o registro fora do cenário simulado. Fica na rua Jatobá (OpenStreetMap), a mais de
// 300 m dos eventos atuais, para o registro da demonstração virar um evento novo (RN04).
export const POSICAO_ATUAL_SIMULADA = { lat: -23.5433, lng: -46.8713 }

export function obterAlturaAgua(id) {
  return ALTURAS_AGUA.find((a) => a.id === id) ?? null
}

// Bairro do registro = o bairro cujo centro está mais perto (data/bairros.json)
export function bairroMaisProximo(posicao, bairros) {
  return bairros.reduce((maisPerto, bairro) =>
    distanciaMetros(posicao, bairro) < distanciaMetros(posicao, maisPerto) ? bairro : maisPerto,
  ).nome
}

// Título gerado: tipo + altura da água (só Alagamento) + bairro.
// Ex.: "Alagamento na altura do meio-fio – Parque Viana"; "Ilha de calor – Parque Viana".
export function tituloDoRegistro({ tipo, alturaAgua, bairro }) {
  const altura = tipo === TIPOS.ALAGAMENTO ? obterAlturaAgua(alturaAgua) : null
  return altura ? `${tipo} ${altura.noTitulo} – ${bairro}` : `${tipo} – ${bairro}`
}

// Junta as sugestões tocadas e o texto livre: "Rua alagada. Carro ilhado. Água subindo rápido."
export function montarDescricao(sugestoes = [], textoLivre = '') {
  const partes = [...sugestoes, textoLivre.trim()].filter(Boolean)
  return partes.map((p) => (/[.!?]$/.test(p) ? p : `${p}.`)).join(' ')
}

let sequencia = 1

// Dado de origem Comunidade. Guarda só o pseudônimo de quem registrou, nunca o id ou o nome (LGPD).
// A posição exata fica no dado; o mapa público mostra a aproximada (localizacaoPublica, RNF08).
export function criarDadoComunitario({ tipo, posicao, alturaAgua, descricao = '', comFoto = false, usuario, bairros, agora = new Date() }) {
  if (!Object.values(TIPOS).includes(tipo)) throw new Error(`Tipo de risco desconhecido: ${tipo}`)
  const altura = tipo === TIPOS.ALAGAMENTO ? obterAlturaAgua(alturaAgua) : null
  if (tipo === TIPOS.ALAGAMENTO && !altura) throw new Error('Informe até onde a água chegou')

  const bairro = bairroMaisProximo(posicao, bairros)
  const titulo = tituloDoRegistro({ tipo, alturaAgua, bairro })
  return {
    id: `dado-reg-${agora.getTime()}-${sequencia++}`,
    origem: ORIGENS.COMUNIDADE,
    fonte: 'Registro de morador (app)',
    autorPseudonimo: usuario.pseudonimo,
    tipo,
    bairro,
    titulo,
    // Descrição é opcional: sem ela, o detalhe mostra o próprio título
    descricao: descricao.trim() || `${titulo}.`,
    lat: posicao.lat,
    lng: posicao.lng,
    registradoEm: agora,
    atualizadoEm: agora,
    // Só o alagamento tem medição informada pelo morador; os outros tipos ficam Baixo até
    // se juntarem a um dado de Sensor ou Base pública (RN04, RN07)
    medicoes: altura ? { laminaCm: altura.cm } : {},
    confirmacoes: 0,
    // No protótipo, a foto tirada pelo app guarda a posição: conta como foto geolocalizada (+5)
    fotoGeolocalizada: Boolean(comFoto),
    falhaSensor: false,
  }
}
