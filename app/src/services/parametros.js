// Parâmetros das regras de negócio (docs/01-requisitos.md, seção 4).
// São os mesmos números do documento: se um mudar lá, muda aqui também.

export const ORIGENS = {
  SENSOR: 'Sensor',
  BASE_PUBLICA: 'Base pública',
  CONCESSIONARIA: 'Base pública (concessionária)',
  COMUNIDADE: 'Comunidade',
}

export const TIPOS = {
  ALAGAMENTO: 'Alagamento',
  ILHA_DE_CALOR: 'Ilha de calor',
  INTERRUPCAO: 'Interrupção de serviço',
}

// Ordem crescente: o índice + 1 é o peso R da prioridade (seção 4.3)
export const NIVEIS_RISCO = ['Baixo', 'Moderado', 'Alto', 'Crítico']

export const ESTADOS = {
  REPORTADO: 'Reportado',
  EM_VALIDACAO: 'Em validação',
  CONFIRMADO: 'Confirmado',
  ALERTA_EMITIDO: 'Alerta emitido',
  EM_MONITORAMENTO: 'Em monitoramento',
  ENCERRADO: 'Encerrado',
  DESCARTADO: 'Descartado',
}

export const SITUACOES_INTERRUPCAO = {
  IDENTIFICADA: 'Interrupção identificada',
  EM_ATENDIMENTO: 'Em atendimento',
  NORMALIZACAO_PARCIAL: 'Normalização parcial',
  NORMALIZADO: 'Normalizado',
}

// 4.1 Confiança
export const BASE_CONFIANCA = {
  [ORIGENS.SENSOR]: 90,
  [ORIGENS.BASE_PUBLICA]: 85,
  [ORIGENS.CONCESSIONARIA]: 80,
  [ORIGENS.COMUNIDADE]: 40,
}

export const AJUSTES_CONFIANCA = {
  porConfirmacao: 10,
  maxConfirmacoes: 3,
  corroborado: 15,
  fotoGeolocalizada: 5,
  desatualizado: -20,
  sensorComFalha: -30,
}

// Corroboração: dado de Sensor ou Base pública a até 500 m e 30 min
export const CORROBORACAO = { raioMetros: 500, janelaMinutos: 30 }

// Intervalo esperado de atualização por origem (min); null = não se aplica
export const INTERVALO_ESPERADO_MIN = {
  [ORIGENS.SENSOR]: 5,
  [ORIGENS.BASE_PUBLICA]: 15,
  [ORIGENS.CONCESSIONARIA]: 15,
  [ORIGENS.COMUNIDADE]: null,
}
export const FATOR_DESATUALIZADO = 2

export const FAIXAS_CONFIANCA = { alta: 75, media: 50 } // Alta ≥ 75, Média 50–74, Baixa < 50

// 4.2 Risco
export const LIMIARES_RISCO = {
  chuvaMmH: { moderado: 10, alto: 25, critico: 50 }, // Crítico é > 50
  laminaCm: { alto: 10, critico: 30 }, // Crítico é > 30
  // Nível do rio: quanto falta (m) para a cota de transbordamento. Valores fictícios do protótipo.
  faltaTransbordarM: { moderado: 1.0, alto: 0.5 }, // Crítico: falta < 0 (transbordou)
  sensacaoTermicaC: { moderado: 32, alto: 38, critico: 42 },
  duracaoHoras: { moderado: 2, alto: 6 }, // Moderado ≥ 2 e ≤ 6; Alto > 6
  pessoasAfetadas: { moderado: 1000, alto: 10000 }, // Moderado 1 mil–10 mil; Alto > 10 mil
}

// 4.3 Prioridade
export const BONUS_AREA_VULNERAVEL = 10

// RN01–RN07
export const REGRAS = {
  descarteSemConfirmacaoHoras: 2, // RN03
  agrupamentoRaioMetros: 300, // RN04
  agrupamentoJanelaMinutos: 60, // RN04
  encerramentoRiscoBaixoMinutos: 30, // RN05
  renotificacaoMinutos: 15, // RN06
}

// Canais de alerta (RF13). No protótipo, todos os avisos aparecem na Central de notificações.
export const CANAIS = { PUSH: 'Push', SMS: 'SMS', EMAIL: 'E-mail' }

// Raios do ponto no mapa (área de interesse e área do status publicado)
export const RAIOS_PONTO_M = [500, 1000, 2000]

// RN06: raio afetado por tipo (Interrupção usa a área informada pelo operador)
export const RAIO_AFETADO_METROS = {
  [TIPOS.ALAGAMENTO]: 500,
  [TIPOS.ILHA_DE_CALOR]: 1000,
}

// Simulador do sensor do rio Cotia (demonstração)
export const SIMULADOR = {
  intervaloMs: 15000,
  intervaloDemoMs: 2000, // modo demonstração (?demo=1): Alto em ~16 s e Crítico em ~38 s, para o vídeo
  subidaPorLeituraM: 0.05, // o nível sobe ~5 cm por leitura
  oscilacaoM: 0.01, // variação aleatória de ±1 cm
  limiteAcimaDaMargemM: 0.15, // depois de transbordar, oscila até 15 cm acima da margem
}

export const MINUTO = 60 * 1000
export const HORA = 60 * MINUTO
