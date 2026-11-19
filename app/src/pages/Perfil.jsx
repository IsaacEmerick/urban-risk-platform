// Perfil (RF15), para todos: dados do usuário e atalhos para Preferências, Privacidade e meus dados,
// Meus registros (só morador) e Sair. Sair volta para o Login sem reiniciar os dados em memória.
import { Link, useNavigate } from 'react-router-dom'
import Icone from '../components/Icone.jsx'
import { usePerfil } from '../contexto/PerfilContext.jsx'
import { PERFIS, ROTULO_PERFIL, TELAS } from '../navegacao.js'

const DETALHE_ATALHO = {
  preferencias: 'Áreas de interesse, tipos de risco e canais',
  privacidade: 'Consultar, exportar e excluir seus dados',
  meusRegistros: 'Ocorrências que você registrou',
}

export default function Perfil() {
  const { usuario, sair } = usePerfil()
  const navegar = useNavigate()

  const atalhos = ['preferencias', 'privacidade', ...(usuario.perfil === PERFIS.MORADOR ? ['meusRegistros'] : [])]

  return (
    <div className="perfil">
      <header className="cabecalho-tela">
        <h1>{usuario.nome}</h1>
        <p className="cabecalho-tela__sub">{usuario.descricao ?? ROTULO_PERFIL[usuario.perfil]}</p>
      </header>

      <section className="bloco" aria-labelledby="titulo-conta">
        <h2 id="titulo-conta" className="titulo-secao">
          Conta
        </h2>
        <dl className="dados-pessoais">
          <div>
            <dt>Perfil</dt>
            <dd>{ROTULO_PERFIL[usuario.perfil]}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{usuario.email}</dd>
          </div>
          {usuario.servico && (
            <div>
              <dt>Serviço</dt>
              <dd>{usuario.servico}</dd>
            </div>
          )}
        </dl>
      </section>

      <nav aria-label="Opções do perfil">
        <ul className="atalhos">
          {atalhos.map((tela) => (
            <li key={tela}>
              <Link to={TELAS[tela].caminho} className="atalho">
                <span className="atalho__texto">
                  <span className="atalho__nome">{TELAS[tela].titulo}</span>
                  <span className="atalho__detalhe">{DETALHE_ATALHO[tela]}</span>
                </span>
                <Icone nome="seguir" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        className="botao botao--secundario botao--largo"
        onClick={() => {
          sair()
          navegar(TELAS.login.caminho)
        }}
      >
        Sair
      </button>
    </div>
  )
}
