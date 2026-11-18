// Simulador do sensor de nível do rio Cotia: gera uma leitura nova a cada 15 s (2 s no modo demonstração).
// O nível sobe aos poucos (cota de atenção → cota de alerta → transbordamento) para demonstrar
// o alerta antecipado. Depois de transbordar, oscila um pouco acima da margem.
// No mesmo tique, o sensor de temperatura do Jardim Maria Helena (evt-09, com falha recente) manda
// uma leitura nova, para não ficar desatualizado (a leitura substitui a anterior no evento).
import { ORIGENS, SIMULADOR, TIPOS } from './parametros.js'
import { faltaParaTransbordar } from './risco.js'
import { formatarMetros } from './formatar.js'

const arredondar = (valor) => Math.round(valor * 100) / 100 // centímetros

// Próximo nível: sobe ~5 cm com oscilação de ±1 cm, até no máximo 15 cm acima da margem
export function proximoNivel(nivelAtual, cotaTransbordamentoM, aleatorio = Math.random) {
  const oscilacao = (aleatorio() * 2 - 1) * SIMULADOR.oscilacaoM
  const teto = arredondar(cotaTransbordamentoM + SIMULADOR.limiteAcimaDaMargemM)
  const proximo = nivelAtual >= teto ? teto - SIMULADOR.oscilacaoM + oscilacao : nivelAtual + SIMULADOR.subidaPorLeituraM + oscilacao
  return arredondar(Math.min(proximo, teto))
}

// Modo demonstração: ?demo=1 na URL acelera o simulador (uma leitura a cada 2 s, para o vídeo)
export function emModoDemonstracao(search = '') {
  return new URLSearchParams(search).get('demo') === '1'
}

export function intervaloDoSimulador(modoDemonstracao) {
  return modoDemonstracao ? SIMULADOR.intervaloDemoMs : SIMULADOR.intervaloMs
}

// Monta o dado no mesmo formato dos outros (origem Sensor), pronto para o repositório
export function criarLeitura(sensor, nivelRioM, agora) {
  const falta = faltaParaTransbordar(nivelRioM, sensor.cotaTransbordamentoM)
  const descricao =
    falta < 0
      ? `Nível do rio em ${formatarMetros(nivelRioM)} m: transbordou ${formatarMetros(-falta)} m acima da margem`
      : `Nível do rio em ${formatarMetros(nivelRioM)} m (faltam ${formatarMetros(falta)} m para a cota de transbordamento)`
  return {
    id: `leitura-${sensor.id}-${agora.getTime()}`,
    tipo: TIPOS.ALAGAMENTO,
    origem: ORIGENS.SENSOR,
    fonte: 'Sensor de nível – Rio Cotia',
    fonteId: sensor.id,
    bairro: sensor.bairro,
    lat: sensor.lat,
    lng: sensor.lng,
    descricao,
    registradoEm: agora,
    atualizadoEm: agora,
    medicoes: { nivelRioM, cotaTransbordamentoM: sensor.cotaTransbordamentoM },
    confirmacoes: 0,
    fotoGeolocalizada: false,
    falhaSensor: false,
  }
}

// Sensação térmica do sensor de temperatura: entre 38,5 e 39,5 °C (sempre Alto: ≥ 38 e < 42)
export function proximaSensacao(sensor, aleatorio = Math.random) {
  const valor = sensor.sensacaoMinC + aleatorio() * (sensor.sensacaoMaxC - sensor.sensacaoMinC)
  return Math.round(valor * 10) / 10
}

export function criarLeituraTemperatura(sensor, sensacaoTermicaC, agora) {
  const graus = sensacaoTermicaC.toLocaleString('pt-BR', { minimumFractionDigits: 1 })
  return {
    id: `leitura-${sensor.id}-${agora.getTime()}`,
    tipo: TIPOS.ILHA_DE_CALOR,
    origem: ORIGENS.SENSOR,
    fonte: sensor.nome,
    fonteId: sensor.id,
    bairro: sensor.bairro,
    lat: sensor.lat,
    lng: sensor.lng,
    descricao:
      `Sensação térmica de ${graus} °C.` +
      (sensor.falhaRecente ? ' O sensor teve falha recente: leituras fora da faixa na última hora.' : ''),
    registradoEm: agora,
    atualizadoEm: agora,
    medicoes: { sensacaoTermicaC },
    confirmacoes: 0,
    fotoGeolocalizada: false,
    falhaSensor: Boolean(sensor.falhaRecente), // −30 na confiança enquanto a falha for recente
  }
}

// Inicia o simulador; devolve a função que o para.
export function iniciarSimulador({
  repositorio,
  sensorId = 'sensor-cotia-01',
  sensorTemperaturaId = 'sensor-temp-jmh-01',
  intervaloMs = SIMULADOR.intervaloMs,
  aleatorio = Math.random,
  relogio = () => new Date(),
} = {}) {
  const sensor = repositorio.obterSensor(sensorId)
  if (!sensor) throw new Error(`Sensor não encontrado: ${sensorId}`)
  let nivel = sensor.nivelInicialM
  const sensorTemperatura = sensorTemperaturaId ? repositorio.obterSensor(sensorTemperaturaId) : null

  const id = setInterval(() => {
    const agora = relogio()
    nivel = proximoNivel(nivel, sensor.cotaTransbordamentoM, aleatorio)
    repositorio.registrarLeituraSensor(sensorId, { nivelRioM: nivel, em: agora })
    repositorio.receberDado(criarLeitura(sensor, nivel, agora), agora)
    if (sensorTemperatura) {
      const sensacao = proximaSensacao(sensorTemperatura, aleatorio)
      repositorio.receberDado(criarLeituraTemperatura(sensorTemperatura, sensacao, agora), agora)
    }
  }, intervaloMs)

  return () => clearInterval(id)
}
