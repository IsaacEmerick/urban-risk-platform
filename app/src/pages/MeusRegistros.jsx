// Meus registros (RF03, RF17): cada registro do morador com o estado atual do evento, a confiança
// atual e as confirmações que recebeu ("Também vejo isso"). Encontrados pelo pseudônimo (LGPD).
import { Link } from 'react-router-dom'
import CardAlerta from '../components/CardAlerta.jsx'
import Icone from '../components/Icone.jsx'
import { usePerfil } from '../contexto/PerfilContext.jsx'
import { useAgora } from '../hooks/useAgora.js'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { TELAS } from '../navegacao.js'
import { registrosDoUsuario } from '../services/confirmacao.js'
import { formatarDataHora } from '../services/formatar.js'

const textoConfirmacoes = (n) => (n === 0 ? 'nenhuma confirmação ainda' : n === 1 ? '1 confirmação recebida' : `${n} confirmações recebidas`)

export default function MeusRegistros() {
  const repositorio = useRepositorio()
  const { usuario } = usePerfil()
  const agora = useAgora(30_000)
  const registros = registrosDoUsuario(repositorio.listarEventos(), usuario)

  return (
    <div className="meus-registros">
      <Link to={TELAS.perfil.caminho} className="botao-voltar">
        <Icone nome="voltar" />
        Perfil
      </Link>
      <header className="cabecalho-tela">
        <h1>Meus registros</h1>
        <p className="cabecalho-tela__sub">Seu nome não aparece para os vizinhos: eles veem só a ocorrência.</p>
      </header>

      {registros.length === 0 ? (
        <div className="vazio">
          <p>Você ainda não registrou nenhuma ocorrência.</p>
          <Link to={TELAS.registrar.caminho} className="botao botao--primario">
            Registrar ocorrência
          </Link>
        </div>
      ) : (
        <div className="lista-cards">
          {registros.map(({ evento, dado }) => (
            <CardAlerta key={dado.id} evento={evento} titulo="h2">
              <p className="card-alerta__registro">
                Registrado {formatarDataHora(dado.registradoEm, agora)} · <strong>{textoConfirmacoes(dado.confirmacoes ?? 0)}</strong>
              </p>
            </CardAlerta>
          ))}
        </div>
      )}
    </div>
  )
}
