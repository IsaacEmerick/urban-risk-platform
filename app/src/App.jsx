// Rotas do protótipo e guarda de acesso por perfil (RF15)
import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { usePerfil } from './contexto/PerfilContext.jsx'
import { TELAS, podeAcessar } from './navegacao.js'
import { repositorio } from './services/repositorio.js'
import { iniciarSimulador, intervaloDoSimulador } from './services/simulador.js'
import { MODO_DEMONSTRACAO } from './modoDemonstracao.js'

import Analises from './pages/Analises.jsx'
import CentralNotificacoes from './pages/CentralNotificacoes.jsx'
import DetalheAlerta from './pages/DetalheAlerta.jsx'
import FilaValidacao from './pages/FilaValidacao.jsx'
import ListaAlertas from './pages/ListaAlertas.jsx'
import Login from './pages/Login.jsx'
import MeusRegistros from './pages/MeusRegistros.jsx'
import OrigemConfianca from './pages/OrigemConfianca.jsx'
import Painel from './pages/Painel.jsx'
import Perfil from './pages/Perfil.jsx'
import Preferencias from './pages/Preferencias.jsx'
import PrivacidadeDados from './pages/PrivacidadeDados.jsx'
import PublicarStatus from './pages/PublicarStatus.jsx'
import RegistroComunitario from './pages/RegistroComunitario.jsx'

// Componente de cada tela (exceto Login, que fica fora da moldura)
const COMPONENTES = {
  painel: Painel,
  alertas: ListaAlertas,
  detalhe: DetalheAlerta,
  origem: OrigemConfianca,
  notificacoes: CentralNotificacoes,
  registrar: RegistroComunitario,
  meusRegistros: MeusRegistros,
  fila: FilaValidacao,
  analises: Analises,
  privacidade: PrivacidadeDados,
  publicarStatus: PublicarStatus,
  perfil: Perfil,
  preferencias: Preferencias,
}

// Sem usuário → Login; tela de outro perfil → Painel
function RotaProtegida({ tela, children }) {
  const { usuario } = usePerfil()
  if (!usuario) return <Navigate to={TELAS.login.caminho} replace />
  if (!podeAcessar(usuario.perfil, tela)) return <Navigate to={TELAS.painel.caminho} replace />
  return children
}

function ExigeLogin({ children }) {
  const { usuario } = usePerfil()
  return usuario ? children : <Navigate to={TELAS.login.caminho} replace />
}

export default function App() {
  // Liga o simulador do sensor do rio Cotia enquanto o app está aberto (2 s no modo demonstração)
  useEffect(() => iniciarSimulador({ repositorio, intervaloMs: intervaloDoSimulador(MODO_DEMONSTRACAO) }), [])

  return (
    <Routes>
      <Route path={TELAS.login.caminho} element={<Login />} />
      <Route
        element={
          <ExigeLogin>
            <Layout />
          </ExigeLogin>
        }
      >
        {Object.entries(COMPONENTES).map(([tela, Componente]) => (
          <Route
            key={tela}
            path={TELAS[tela].caminho}
            element={
              <RotaProtegida tela={tela}>
                <Componente />
              </RotaProtegida>
            }
          />
        ))}
      </Route>
      <Route path="*" element={<Navigate to={TELAS.painel.caminho} replace />} />
    </Routes>
  )
}
