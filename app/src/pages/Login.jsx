// Login / Cadastro (RF15, RF16). "Entrar": contas de demonstração com um toque (o protótipo não tem
// senha real). "Criar conta": só morador — as contas de agente e operador são criadas pelo órgão
// (seção LGPD do 01-requisitos.md). Consentimentos separados por finalidade, desmarcados por padrão,
// guardados com data e finalidade (RNF09). Depois de criar, a conta vai para Preferências.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Campo from '../components/Campo.jsx'
import Icone from '../components/Icone.jsx'
import { usePerfil } from '../contexto/PerfilContext.jsx'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { ROTULO_PERFIL, TELAS } from '../navegacao.js'
import { FINALIDADES, criarMorador, validarCadastro } from '../services/conta.js'

const IDS_DEMONSTRACAO = ['usr-ana', 'usr-carlos', 'usr-juliana']

function BotaoConta({ usuario, aoEntrar }) {
  return (
    <button type="button" className="conta-demo" onClick={() => aoEntrar(usuario.id)}>
      <span className="conta-demo__nome">{usuario.nome}</span>
      <span className="conta-demo__perfil">{usuario.descricao ?? ROTULO_PERFIL[usuario.perfil]}</span>
      <Icone nome="seguir" className="icone conta-demo__seta" />
    </button>
  )
}

function Entrar({ aoEntrar }) {
  const repositorio = useRepositorio()
  const usuarios = repositorio.listarUsuarios()
  const demonstracao = IDS_DEMONSTRACAO.map((id) => usuarios.find((u) => u.id === id)).filter(Boolean)
  const criadas = usuarios.filter((u) => !IDS_DEMONSTRACAO.includes(u.id))
  return (
    <section aria-labelledby="titulo-contas" className="acesso__secao">
      <h2 id="titulo-contas" className="titulo-secao">
        Contas de demonstração
      </h2>
      <p className="aviso">Protótipo: não há senha real. Toque em uma conta para entrar.</p>
      <div className="contas-demo">
        {demonstracao.map((u) => (
          <BotaoConta key={u.id} usuario={u} aoEntrar={aoEntrar} />
        ))}
      </div>
      {criadas.length > 0 && (
        <>
          <h3 className="acesso__subtitulo">Contas criadas nesta sessão</h3>
          <div className="contas-demo">
            {criadas.map((u) => (
              <BotaoConta key={u.id} usuario={u} aoEntrar={aoEntrar} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

// Caixa de consentimento: rótulo com a finalidade, se é obrigatório e para que serve
function Consentimento({ id, finalidade, obrigatorio, descricao, marcado, aoMudar, erro }) {
  return (
    <div className={erro ? 'consentimento consentimento--erro' : 'consentimento'}>
      <input
        id={id}
        type="checkbox"
        checked={marcado}
        onChange={(e) => aoMudar(e.target.checked)}
        aria-invalid={Boolean(erro)}
        aria-describedby={[`${id}-descricao`, erro && `${id}-erro`].filter(Boolean).join(' ')}
      />
      <div className="consentimento__texto">
        <label htmlFor={id} className="consentimento__rotulo">
          {finalidade} <span className="grupo__opcional">({obrigatorio ? 'obrigatório' : 'opcional'})</span>
        </label>
        <p id={`${id}-descricao`} className="nota">
          {descricao}
        </p>
        {erro && (
          <p id={`${id}-erro`} className="campo__erro">
            {erro}
          </p>
        )}
      </div>
    </div>
  )
}

function CriarConta({ aoCriar }) {
  const repositorio = useRepositorio()
  const [form, setForm] = useState({ nome: '', email: '', aceitaCadastro: false, autorizaNotificacoes: false })
  const [tentou, setTentou] = useState(false)
  const mudar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const errosAtuais = validarCadastro(form, repositorio.listarUsuarios())
  const erros = tentou ? errosAtuais : {}

  const enviar = (e) => {
    e.preventDefault()
    setTentou(true)
    if (Object.keys(errosAtuais).length > 0) return
    const momento = new Date()
    const usuario = criarMorador(form, { usuariosExistentes: repositorio.listarUsuarios(), agora: momento })
    repositorio.criarUsuario(usuario, momento)
    aoCriar(usuario.id)
  }

  return (
    <form className="acesso__secao acesso__form" onSubmit={enviar} noValidate aria-labelledby="titulo-cadastro">
      <h2 id="titulo-cadastro" className="titulo-secao">
        Criar conta de morador
      </h2>
      <p className="nota">Contas de agente da Defesa Civil e de operador de serviço público são criadas pelo órgão responsável.</p>

      <Campo id="cadastro-nome" rotulo="Nome" erro={erros.nome}>
        <input
          id="cadastro-nome"
          type="text"
          autoComplete="name"
          value={form.nome}
          onChange={(e) => mudar('nome')(e.target.value)}
          aria-invalid={Boolean(erros.nome)}
          aria-describedby={erros.nome ? 'cadastro-nome-erro' : undefined}
        />
      </Campo>
      <Campo id="cadastro-email" rotulo="E-mail" erro={erros.email}>
        <input
          id="cadastro-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => mudar('email')(e.target.value)}
          aria-invalid={Boolean(erros.email)}
          aria-describedby={erros.email ? 'cadastro-email-erro' : undefined}
        />
      </Campo>

      <fieldset className="grupo">
        <legend className="grupo__legenda">Consentimentos</legend>
        <p className="nota">Cada autorização é guardada com a data e a finalidade. Você pode revogar a opcional depois, em Privacidade e meus dados.</p>
        <Consentimento
          id="consentimento-cadastro"
          finalidade={FINALIDADES.CADASTRO}
          obrigatorio
          descricao="Guardar seu nome e e-mail para você entrar no app."
          marcado={form.aceitaCadastro}
          aoMudar={mudar('aceitaCadastro')}
          erro={erros.aceitaCadastro}
        />
        <Consentimento
          id="consentimento-notificacoes"
          finalidade={FINALIDADES.NOTIFICACOES}
          descricao="Guardar as áreas que você acompanha para avisar você dos riscos nelas. Sem isso, você não recebe notificações."
          marcado={form.autorizaNotificacoes}
          aoMudar={mudar('autorizaNotificacoes')}
        />
      </fieldset>

      <details className="termos">
        <summary>Resumo dos termos de uso e da política de privacidade</summary>
        <ul>
          <li>
            <strong>Para que usamos seus dados:</strong> cadastro e autenticação; áreas de interesse e notificações de risco,
            se você autorizar. A base legal é o seu consentimento (LGPD, art. 7º, I).
          </li>
          <li>
            <strong>O mínimo necessário:</strong> o registro de ocorrência pede só tipo, local, descrição e foto opcional.
          </li>
          <li>
            <strong>Pseudônimo:</strong> os eventos e registros guardam só um identificador pseudonimizado, nunca seu nome. Seus
            dados pessoais ficam separados e criptografados.
          </li>
          <li>
            <strong>Mapa público:</strong> a localização de quem registra uma ocorrência aparece arredondada, a cerca de 100 m.
          </li>
          <li>
            <strong>Seus direitos (art. 18):</strong> consultar, exportar e excluir seus dados e revogar o consentimento opcional,
            em Perfil › Privacidade e meus dados.
          </li>
          <li>
            <strong>Registro de acesso:</strong> todo acesso aos seus dados pessoais fica registrado por 12 meses.
          </li>
          <li>Protótipo acadêmico: os eventos, sensores e alertas são simulados.</li>
        </ul>
      </details>

      {tentou && Object.keys(erros).length > 0 && (
        <p className="campo__erro" role="alert">
          Corrija {Object.keys(erros).length === 1 ? 'o campo marcado' : 'os campos marcados'} para criar a conta.
        </p>
      )}
      <button type="submit" className="botao botao--primario botao--largo">
        Criar conta
      </button>
    </form>
  )
}

export default function Login() {
  const { entrar, avisoSaida } = usePerfil()
  const navegar = useNavigate()
  const [aba, setAba] = useState('entrar')

  const entrarComo = (id) => {
    entrar(id)
    navegar(TELAS.painel.caminho)
  }
  const depoisDeCriar = (id) => {
    entrar(id)
    navegar(TELAS.preferencias.caminho, { state: { contaNova: true } })
  }

  return (
    <main className="acesso">
      <header className="acesso__marca">
        <p className="acesso__produto">Urban Risk Intelligence</p>
        <h1>Riscos urbanos no Parque Viana e no Jardim Maria Helena</h1>
        <p className="cabecalho-tela__sub">Alagamento, ilha de calor e interrupção de serviço, com a origem e a confiança de cada dado.</p>
      </header>

      {avisoSaida && (
        <p className="aviso" role="status">
          {avisoSaida}
        </p>
      )}

      <div className="filtros" role="group" aria-label="Entrar ou criar conta">
        <button type="button" className="filtro" aria-pressed={aba === 'entrar'} onClick={() => setAba('entrar')}>
          Entrar
        </button>
        <button type="button" className="filtro" aria-pressed={aba === 'criar'} onClick={() => setAba('criar')}>
          Criar conta
        </button>
      </div>

      {aba === 'entrar' ? <Entrar aoEntrar={entrarComo} /> : <CriarConta aoCriar={depoisDeCriar} />}
    </main>
  )
}
