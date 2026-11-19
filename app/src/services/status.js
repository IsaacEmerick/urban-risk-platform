// Publicar status (RF18): monta o dado de origem Base pública (concessionária) que a operadora publica.
// Ele entra no mesmo caminho dos outros dados (confiança → risco → RN04 → estados → notificação).
// Cada status publicado tem o seu fonteId: atualizar a situação manda uma leitura nova da mesma
// fonte, que substitui a anterior no evento (receberDado).
import { bairroMaisProximo } from './registro.js'
import { eventoAtivo } from './eventos.js'
import { ORIGENS, SITUACOES_INTERRUPCAO, TIPOS } from './parametros.js'

// Raios oferecidos para "ponto no mapa" (o bairro usa o raio aproximado de data/bairros.json)
export { RAIOS_PONTO_M } from './parametros.js'

let sequencia = 1

// Área informada pela operadora → círculo (centro + raio), como as áreas de interesse (RF13)
export function resolverAreaStatus(area, bairros) {
  if (area.tipo === 'bairro') {
    const bairro = bairros.find((b) => b.nome === area.bairro)
    if (!bairro) throw new Error(`Bairro desconhecido: ${area.bairro}`)
    return { bairro: bairro.nome, lat: bairro.lat, lng: bairro.lng, raioM: bairro.raioM }
  }
  return { bairro: bairroMaisProximo(area.posicao, bairros), lat: area.posicao.lat, lng: area.posicao.lng, raioM: area.raioM }
}

// Validação do formulário (RF04: formato e faixa de valores). Devolve { campo: mensagem }; vazio = válido.
export function validarStatus({ area, situacao, inicio, previsao, pessoasAfetadas, atingeServicoCritico }, agora = new Date()) {
  const erros = {}
  if (!area || (area.tipo === 'bairro' && !area.bairro) || (area.tipo === 'ponto' && (!area.posicao || !area.raioM))) {
    erros.area = 'Escolha um bairro ou marque um ponto no mapa com o raio.'
  }
  if (!Object.values(SITUACOES_INTERRUPCAO).includes(situacao)) erros.situacao = 'Escolha a situação.'
  if (!(inicio instanceof Date) || isNaN(inicio)) erros.inicio = 'Informe o início.'
  else if (inicio > agora) erros.inicio = 'O início não pode estar no futuro.'
  if (!(previsao instanceof Date) || isNaN(previsao)) erros.previsao = 'Informe a previsão de normalização.'
  else if (!erros.inicio && previsao <= inicio) erros.previsao = 'A previsão tem de ser depois do início.'
  if (pessoasAfetadas === '' || pessoasAfetadas == null || !Number.isInteger(Number(pessoasAfetadas)) || Number(pessoasAfetadas) < 0) {
    erros.pessoasAfetadas = 'Informe um número inteiro, 0 ou mais.'
  }
  if (typeof atingeServicoCritico !== 'boolean') erros.atingeServicoCritico = 'Responda sim ou não.'
  return erros
}

// "Interrupção de energia elétrica – Jardim Maria Helena"
export function tituloDoStatus(servico, bairro) {
  return `Interrupção de ${servico.toLowerCase()} – ${bairro}`
}

function descricaoDoStatus({ servico, situacao, pessoasAfetadas, atingeServicoCritico }) {
  const pessoas = Number(pessoasAfetadas).toLocaleString('pt-BR')
  return `${servico}: ${situacao}. Cerca de ${pessoas} pessoas afetadas${atingeServicoCritico ? '; atinge hospital, escola ou abastecimento crítico' : ''}.`
}

// Dado novo de origem Base pública (concessionária), base de confiança 80 (seção 4.1)
export function criarDadoStatus({ servico, area, situacao, inicio, previsao, pessoasAfetadas, atingeServicoCritico, usuario, bairros, agora = new Date() }) {
  const erros = validarStatus({ area, situacao, inicio, previsao, pessoasAfetadas, atingeServicoCritico }, agora)
  if (Object.keys(erros).length > 0) throw new Error(Object.values(erros)[0])

  const local = resolverAreaStatus(area, bairros)
  const n = sequencia++
  const medicoes = {
    servico,
    situacao,
    inicio,
    previsaoNormalizacao: previsao,
    pessoasAfetadas: Number(pessoasAfetadas),
    atingeServicoCritico,
  }
  return {
    id: `dado-status-${agora.getTime()}-${n}`,
    origem: ORIGENS.CONCESSIONARIA,
    fonte: `Concessionária de energia (simulada) – status publicado por ${usuario.nome}`,
    fonteId: `status-${agora.getTime()}-${n}`, // um fonteId por status publicado
    publicadoPor: usuario.id,
    tipo: TIPOS.INTERRUPCAO,
    bairro: local.bairro,
    titulo: tituloDoStatus(servico, local.bairro),
    descricao: descricaoDoStatus(medicoes),
    lat: local.lat,
    lng: local.lng,
    raioAfetadoM: local.raioM, // RN06: Interrupção = área informada pela operadora
    registradoEm: agora,
    atualizadoEm: agora,
    medicoes,
    confirmacoes: 0,
    fotoGeolocalizada: false,
    falhaSensor: false,
  }
}

// Atualizar a situação: leitura nova da mesma fonte (mesmo fonteId), com a hora da atualização.
// A situação pode ser trocada livremente enquanto o evento estiver ativo.
export function atualizarSituacao(dado, situacao, agora = new Date()) {
  if (!Object.values(SITUACOES_INTERRUPCAO).includes(situacao)) throw new Error(`Situação desconhecida: ${situacao}`)
  const medicoes = { ...dado.medicoes, situacao }
  return {
    ...dado,
    id: `dado-status-${agora.getTime()}-${sequencia++}`,
    descricao: descricaoDoStatus(medicoes),
    atualizadoEm: agora,
    medicoes,
  }
}

// "Meus status": eventos com status publicado por esta operadora; ativos primeiro, depois os mais recentes
export function statusPublicados(eventos, usuarioId) {
  return eventos
    .map((evento) => ({ evento, dado: evento.dados.find((d) => d.publicadoPor === usuarioId) }))
    .filter(({ dado }) => dado)
    .sort((a, b) => eventoAtivo(b.evento) - eventoAtivo(a.evento) || b.dado.atualizadoEm - a.dado.atualizadoEm)
}
