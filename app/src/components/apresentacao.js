// Classes CSS por nível de risco (os nomes do glossário têm acento; as classes não)
const CLASSES_RISCO = { Baixo: 'baixo', Moderado: 'moderado', Alto: 'alto', Crítico: 'critico' }

export function classeRisco(risco) {
  return CLASSES_RISCO[risco] ?? 'baixo'
}
