// Telas do protótipo e navegação inferior por perfil (CLAUDE.md e docs/01-requisitos.md, seção 1).
// Fonte única: as rotas (App.jsx), a barra inferior e a guarda de acesso leem daqui.

export const PERFIS = {
  MORADOR: 'morador',
  AGENTE: 'agente',
  OPERADOR: 'operador',
}

// Nome do perfil exibido nas telas (Login, Perfil, Privacidade)
export const ROTULO_PERFIL = {
  [PERFIS.MORADOR]: 'Morador',
  [PERFIS.AGENTE]: 'Agente da Defesa Civil',
  [PERFIS.OPERADOR]: 'Operador de serviço público',
}

const TODOS = [PERFIS.MORADOR, PERFIS.AGENTE, PERFIS.OPERADOR]

// As 14 telas da tabela de rastreabilidade
export const TELAS = {
  login: { caminho: '/login', titulo: 'Login / Cadastro', rfs: ['RF15', 'RF16'], perfis: TODOS },
  painel: { caminho: '/painel', titulo: 'Painel', rfs: ['RF01', 'RF02', 'RF07'], perfis: TODOS },
  alertas: { caminho: '/alertas', titulo: 'Lista de alertas', rfs: ['RF08'], perfis: TODOS },
  detalhe: { caminho: '/alertas/:id', titulo: 'Detalhe do alerta', rfs: ['RF06', 'RF08', 'RF12', 'RF17'], perfis: TODOS },
  origem: { caminho: '/alertas/:id/origem', titulo: 'Origem e confiança', rfs: ['RF01', 'RF02', 'RF05', 'RF09'], perfis: TODOS },
  notificacoes: { caminho: '/notificacoes', titulo: 'Central de notificações', rfs: ['RF10', 'RF11'], perfis: [PERFIS.MORADOR] },
  registrar: { caminho: '/registrar', titulo: 'Registro comunitário', rfs: ['RF03'], perfis: [PERFIS.MORADOR] },
  meusRegistros: { caminho: '/perfil/meus-registros', titulo: 'Meus registros', rfs: ['RF03', 'RF17'], perfis: [PERFIS.MORADOR] },
  fila: { caminho: '/fila', titulo: 'Fila de validação', rfs: ['RF04', 'RF12'], perfis: [PERFIS.AGENTE] },
  analises: { caminho: '/analises', titulo: 'Análises', rfs: ['RF14'], perfis: [PERFIS.AGENTE, PERFIS.OPERADOR] },
  privacidade: { caminho: '/perfil/privacidade', titulo: 'Privacidade e meus dados', rfs: ['RF16'], perfis: TODOS },
  publicarStatus: { caminho: '/publicar-status', titulo: 'Publicar status', rfs: ['RF18'], perfis: [PERFIS.OPERADOR] },
  perfil: { caminho: '/perfil', titulo: 'Perfil', rfs: ['RF15'], perfis: TODOS },
  preferencias: { caminho: '/perfil/preferencias', titulo: 'Preferências', rfs: ['RF13'], perfis: TODOS },
}

// Navegação inferior por perfil — rótulos exatamente como no CLAUDE.md
export const ABAS = {
  [PERFIS.MORADOR]: [
    { rotulo: 'Painel', tela: 'painel' },
    { rotulo: 'Alertas', tela: 'alertas' },
    { rotulo: 'Registrar', tela: 'registrar' },
    { rotulo: 'Notificações', tela: 'notificacoes' },
    { rotulo: 'Perfil', tela: 'perfil' },
  ],
  [PERFIS.AGENTE]: [
    { rotulo: 'Painel', tela: 'painel' },
    { rotulo: 'Fila', tela: 'fila' }, // rótulo curto na barra; a tela se chama Fila de validação
    { rotulo: 'Alertas', tela: 'alertas' },
    { rotulo: 'Análises', tela: 'analises' },
    { rotulo: 'Perfil', tela: 'perfil' },
  ],
  [PERFIS.OPERADOR]: [
    { rotulo: 'Painel', tela: 'painel' },
    { rotulo: 'Publicar status', tela: 'publicarStatus' },
    { rotulo: 'Alertas', tela: 'alertas' },
    { rotulo: 'Análises', tela: 'analises' },
    { rotulo: 'Perfil', tela: 'perfil' },
  ],
}

export function podeAcessar(perfil, idTela) {
  return TELAS[idTela].perfis.includes(perfil)
}
