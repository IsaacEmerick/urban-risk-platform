// Privacidade e meus dados (RF16, RNF09), para todos os perfis (todos são titulares na LGPD):
// consultar os dados pessoais, ver os consentimentos (morador) ou a base legal (agente e operador),
// exportar um JSON só com os dados do titular, revogar ou autorizar o consentimento opcional,
// excluir a conta (morador) ou solicitar a exclusão ao órgão (agente e operador) e ver o histórico de acesso.
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConfirmacaoEmLinha from '../components/ConfirmacaoEmLinha.jsx'
import Icone from '../components/Icone.jsx'
import { usePerfil } from '../contexto/PerfilContext.jsx'
import { useAgora } from '../hooks/useAgora.js'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { PERFIS, ROTULO_PERFIL, TELAS } from '../navegacao.js'
import { registrosDoUsuario } from '../services/confirmacao.js'
import { ACOES_ACESSO, BASE_LEGAL_EXECUCAO, FINALIDADES, consentimentoAtivo, rotuloArea, usaConsentimento } from '../services/conta.js'
import { formatarDataHora } from '../services/formatar.js'

const MAX_ACESSOS_NA_TELA = 10

// Data completa para registros com valor legal (consentimento): "02/10/2026, 19:15"
const formatarData = (d) =>
  d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const DESCRICAO_FINALIDADE = {
  [FINALIDADES.CADASTRO]: 'Guardar nome e e-mail para você entrar no app. Obrigatório: para retirar, exclua a conta.',
  [FINALIDADES.NOTIFICACOES]: 'Guardar as áreas que você acompanha e avisar dos riscos nelas (RN06).',
}

const ACAO_REVOGAR = {
  id: 'revogar',
  rotulo: 'Revogar',
  estilo: 'perigo-contorno',
  perigo: true,
  confirmacao: 'Revogar? Você deixa de receber notificações na hora: Alerta, Alerta confirmado e Alerta cancelado.',
}
const ACAO_EXCLUIR = {
  id: 'excluir',
  rotulo: 'Excluir minha conta',
  estilo: 'perigo',
  perigo: true,
  confirmacao: 'Excluir a conta? Seus dados pessoais serão apagados e você sai do app.',
}

// Um consentimento do morador, com cada autorização e revogação (data e finalidade, RNF09)
function LinhaConsentimento({ usuario, finalidade, aoRevogar, aoAutorizar }) {
  const registros = usuario.consentimentos.filter((c) => c.finalidade === finalidade)
  const ativo = consentimentoAtivo(usuario, finalidade)
  const opcional = finalidade === FINALIDADES.NOTIFICACOES
  return (
    <li className="consentimento-item">
      <div className="consentimento-item__topo">
        <h3 className="consentimento-item__nome">{finalidade}</h3>
        <span className={ativo ? 'situacao-consentimento situacao-consentimento--ativo' : 'situacao-consentimento'}>
          {ativo && <Icone nome="confirmado" />}
          {ativo ? 'Ativo' : registros.length ? 'Revogado' : 'Não autorizado'}
        </span>
      </div>
      <p className="nota">{DESCRICAO_FINALIDADE[finalidade]}</p>
      {registros.length > 0 && (
        <ul className="consentimento-item__datas">
          {registros.map((c) => (
            <li key={c.concedidoEm.getTime()}>
              Autorizado em {formatarData(c.concedidoEm)}
              {c.revogadoEm && ` · revogado em ${formatarData(c.revogadoEm)}`}
            </li>
          ))}
        </ul>
      )}
      {opcional &&
        (ativo ? (
          <ConfirmacaoEmLinha acoes={[ACAO_REVOGAR]} aoExecutar={aoRevogar} contexto={finalidade} />
        ) : (
          <button type="button" className="botao botao--secundario" onClick={aoAutorizar}>
            Autorizar
          </button>
        ))}
    </li>
  )
}

function baixarJson(dados, nomeArquivo) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function PrivacidadeDados() {
  const repositorio = useRepositorio()
  const { usuario, sair } = usePerfil()
  const navegar = useNavigate()
  const agora = useAgora(30_000)
  const [resultado, setResultado] = useState('')

  // RNF09: abrir esta tela é uma consulta aos dados pessoais (uma vez por visita)
  const consultaRegistrada = useRef(false)
  useEffect(() => {
    if (consultaRegistrada.current) return
    consultaRegistrada.current = true
    repositorio.registrarAcesso(usuario.id, ACOES_ACESSO.CONSULTOU)
  }, [repositorio, usuario.id])

  const morador = usaConsentimento(usuario)
  const bairros = repositorio.listarBairros()
  const registros = morador ? registrosDoUsuario(repositorio.listarEventos(), usuario) : []
  const acessos = [...repositorio.historicoDeAcesso(usuario.id)].reverse()
  const solicitacao = acessos.find((a) => a.acao === ACOES_ACESSO.SOLICITOU_EXCLUSAO)

  const exportar = () => {
    const dados = repositorio.exportarDados(usuario.id)
    baixarJson(dados, `meus-dados-${usuario.pseudonimo}.json`)
    setResultado('Arquivo meus-dados-' + usuario.pseudonimo + '.json baixado.')
  }
  const revogar = () => {
    repositorio.revogarConsentimento(usuario.id, FINALIDADES.NOTIFICACOES)
    setResultado(`Consentimento “${FINALIDADES.NOTIFICACOES}” revogado. Você não recebe mais notificações.`)
  }
  const autorizar = () => {
    repositorio.autorizarConsentimento(usuario.id, FINALIDADES.NOTIFICACOES)
    setResultado(`Consentimento “${FINALIDADES.NOTIFICACOES}” autorizado. Você volta a receber notificações das suas áreas.`)
  }
  const excluir = () => {
    repositorio.excluirUsuario(usuario.id)
    sair('Conta excluída: seus dados pessoais foram apagados. No protótipo, recarregar a página restaura os dados simulados.')
    navegar(TELAS.login.caminho)
  }
  const solicitarExclusao = () => {
    repositorio.registrarAcesso(usuario.id, ACOES_ACESSO.SOLICITOU_EXCLUSAO)
    setResultado('Solicitação de exclusão enviada ao órgão responsável. Nada foi apagado ainda.')
  }

  return (
    <div className="privacidade">
      <Link to={TELAS.perfil.caminho} className="botao-voltar">
        <Icone nome="voltar" />
        Perfil
      </Link>
      <header className="cabecalho-tela">
        <h1>Privacidade e meus dados</h1>
        <p className="cabecalho-tela__sub">Seus direitos como titular dos dados (LGPD, art. 18).</p>
      </header>

      <p className="resultado-acao" role="status">
        {resultado}
      </p>

      <div className="privacidade__secoes">
        <section className="bloco" aria-labelledby="titulo-meus-dados">
          <h2 id="titulo-meus-dados" className="titulo-secao">
            Meus dados
          </h2>
          <dl className="dados-pessoais">
            <div>
              <dt>Nome</dt>
              <dd>{usuario.nome}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{usuario.email}</dd>
            </div>
            <div>
              <dt>Perfil</dt>
              <dd>{ROTULO_PERFIL[usuario.perfil]}</dd>
            </div>
            {usuario.servico && (
              <div>
                <dt>Serviço</dt>
                <dd>{usuario.servico}</dd>
              </div>
            )}
            <div>
              <dt>Pseudônimo</dt>
              <dd>
                <code>{usuario.pseudonimo}</code>
                <span className="nota"> · o único identificador guardado nos eventos</span>
              </dd>
            </div>
            <div>
              <dt>Áreas de interesse</dt>
              <dd>{usuario.areasInteresse.length ? usuario.areasInteresse.map((a) => rotuloArea(a, bairros)).join('; ') : 'Nenhuma'}</dd>
            </div>
            <div>
              <dt>Tipos de risco</dt>
              <dd>{usuario.tiposRisco.join(', ')}</dd>
            </div>
            <div>
              <dt>Canais</dt>
              <dd>{usuario.canais.join(', ')}</dd>
            </div>
          </dl>
        </section>

        {morador ? (
          <section className="bloco" aria-labelledby="titulo-consentimentos">
            <h2 id="titulo-consentimentos" className="titulo-secao">
              Consentimentos
            </h2>
            <ul className="lista-consentimentos">
              {Object.values(FINALIDADES).map((f) => (
                <LinhaConsentimento key={f} usuario={usuario} finalidade={f} aoRevogar={revogar} aoAutorizar={autorizar} />
              ))}
            </ul>
          </section>
        ) : (
          <section className="bloco" aria-labelledby="titulo-base-legal">
            <h2 id="titulo-base-legal" className="titulo-secao">
              Base legal
            </h2>
            <p>
              <strong>{BASE_LEGAL_EXECUCAO}</strong>
            </p>
            <p className="nota">
              {usuario.perfil === PERFIS.OPERADOR
                ? 'Seu acesso foi concedido pelo convênio entre a Defesa Civil e a concessionária. Como não é consentimento, não há o que revogar.'
                : 'Seus dados são tratados para o trabalho da Defesa Civil. Como não é consentimento, não há o que revogar.'}
            </p>
          </section>
        )}

        {morador && (
          <section className="bloco" aria-labelledby="titulo-registros">
            <h2 id="titulo-registros" className="titulo-secao">
              Meus registros
            </h2>
            {registros.length === 0 ? (
              <p className="nota">Você ainda não registrou nenhuma ocorrência.</p>
            ) : (
              <ul className="lista-simples">
                {registros.map(({ evento, dado }) => (
                  <li key={dado.id}>
                    <span>{evento.titulo}</span>
                    <span className="nota">
                      {' '}
                      · registrado {formatarDataHora(dado.registradoEm, agora)} · {evento.estado}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link to={TELAS.meusRegistros.caminho} className="botao-link">
              Ver em Meus registros
            </Link>
          </section>
        )}

        <section className="bloco" aria-labelledby="titulo-exportar">
          <h2 id="titulo-exportar" className="titulo-secao">
            Exportar meus dados
          </h2>
          <p className="nota">
            Um arquivo JSON só com os seus dados: identificação, preferências, {morador ? 'consentimentos, seus registros' : 'base legal'},
            notificações recebidas e histórico de acesso. Não inclui dados de outras pessoas.
          </p>
          <button type="button" className="botao botao--secundario" onClick={exportar}>
            Baixar meus dados (JSON)
          </button>
        </section>

        <section className="bloco" aria-labelledby="titulo-acessos">
          <h2 id="titulo-acessos" className="titulo-secao">
            Histórico de acesso
          </h2>
          <p className="nota">Cada acesso aos seus dados pessoais, guardado por 12 meses (RNF09).</p>
          <ol className="historico-acesso">
            {acessos.slice(0, MAX_ACESSOS_NA_TELA).map((a, i) => (
              <li key={`${a.em.getTime()}-${i}`}>
                <time dateTime={a.em.toISOString()}>{formatarDataHora(a.em, agora)}</time>
                <span>{a.acao}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="bloco bloco--perigo" aria-labelledby="titulo-excluir">
          <h2 id="titulo-excluir" className="titulo-secao">
            Excluir conta
          </h2>
          {morador ? (
            <>
              <p className="nota">
                Apaga seus dados pessoais: nome, e-mail, áreas, preferências, consentimentos e notificações. Seus registros
                continuam nos eventos só com o pseudônimo <code>{usuario.pseudonimo}</code>, que deixa de apontar para alguém. O
                histórico de acesso fica guardado por 12 meses (RNF09).
              </p>
              <p className="nota">No protótipo, recarregar a página restaura os dados simulados.</p>
              <ConfirmacaoEmLinha acoes={[ACAO_EXCLUIR]} aoExecutar={excluir} />
            </>
          ) : (
            <>
              <p className="nota">Sua conta é gerida pelo órgão responsável: a exclusão é feita por ele, a pedido seu.</p>
              {solicitacao ? (
                <p className="aviso" role="status">
                  Solicitação enviada {formatarDataHora(solicitacao.em, agora)}. Aguardando o órgão responsável.
                </p>
              ) : (
                <button type="button" className="botao botao--perigo-contorno" onClick={solicitarExclusao}>
                  Solicitar exclusão ao órgão
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
