// A navegação deve bater com o CLAUDE.md e com a tabela de telas do 01-requisitos.md
import { describe, expect, it } from 'vitest'
import { ABAS, PERFIS, TELAS, podeAcessar } from './navegacao.js'

describe('navegação por perfil', () => {
  it('há 14 telas', () => {
    expect(Object.keys(TELAS)).toHaveLength(14)
  })

  it('abas exatamente como no CLAUDE.md', () => {
    const rotulos = (perfil) => ABAS[perfil].map((a) => a.rotulo)
    expect(rotulos(PERFIS.MORADOR)).toEqual(['Painel', 'Alertas', 'Registrar', 'Notificações', 'Perfil'])
    expect(rotulos(PERFIS.AGENTE)).toEqual(['Painel', 'Fila de validação', 'Alertas', 'Análises', 'Perfil'])
    expect(rotulos(PERFIS.OPERADOR)).toEqual(['Painel', 'Publicar status', 'Alertas', 'Análises', 'Perfil'])
  })

  it('toda aba leva a uma tela que o perfil pode acessar', () => {
    Object.entries(ABAS).forEach(([perfil, abas]) => {
      abas.forEach((aba) => expect(podeAcessar(perfil, aba.tela), `${perfil} → ${aba.tela}`).toBe(true))
    })
  })

  it('telas restritas', () => {
    expect(podeAcessar(PERFIS.AGENTE, 'registrar')).toBe(false)
    expect(podeAcessar(PERFIS.OPERADOR, 'fila')).toBe(false)
    expect(podeAcessar(PERFIS.MORADOR, 'analises')).toBe(false)
    expect(podeAcessar(PERFIS.MORADOR, 'publicarStatus')).toBe(false)
    expect(podeAcessar(PERFIS.AGENTE, 'meusRegistros')).toBe(false)
    expect(podeAcessar(PERFIS.OPERADOR, 'privacidade')).toBe(true) // todos são titulares (LGPD)
  })
})
