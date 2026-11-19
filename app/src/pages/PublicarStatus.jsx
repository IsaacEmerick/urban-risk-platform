// Publicar status (RF18, Juliana): a operadora informa uma interrupção de serviço. O status vira um dado de
// origem Base pública (concessionária), base 80, que segue o mesmo caminho dos outros dados
// (confiança → risco → estados → notificação, RN06). Em "Meus status", ela troca a situação enquanto
// o evento está ativo; "Normalizado" leva o risco a Baixo e a RN05 encerra o evento em 30 min.
import { useState } from 'react'
import Campo from '../components/Campo.jsx'
import CardAlerta from '../components/CardAlerta.jsx'
import MapaSeletor from '../components/MapaSeletor.jsx'
import SeloRisco from '../components/SeloRisco.jsx'
import { usePerfil } from '../contexto/PerfilContext.jsx'
import { useAgora } from '../hooks/useAgora.js'
import { useFocoNoResumo } from '../hooks/useFocoNoResumo.js'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { eventoAtivo, passouPorAlerta } from '../services/eventos.js'
import { formatarDataHora } from '../services/formatar.js'
import { SITUACOES_INTERRUPCAO, TIPOS } from '../services/parametros.js'
import { rotuloRaio } from '../services/conta.js'
import { classificarRisco } from '../services/risco.js'
import { RAIOS_PONTO_M, atualizarSituacao, criarDadoStatus, statusPublicados, validarStatus } from '../services/status.js'

const doisDigitos = (n) => String(n).padStart(2, '0')
// Date ↔ valor do campo datetime-local ("2026-11-17T18:05", no horário local)
const paraCampo = (d) =>
  d ? `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}T${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}` : ''
const deCampo = (valor) => (valor ? new Date(valor) : null)

function formularioInicial(agora, bairros) {
  const inicio = new Date(agora)
  inicio.setSeconds(0, 0)
  return {
    tipoArea: 'bairro',
    bairro: '',
    posicao: { lat: bairros[0].lat, lng: bairros[0].lng },
    raioM: RAIOS_PONTO_M[0],
    situacao: SITUACOES_INTERRUPCAO.IDENTIFICADA,
    inicio: paraCampo(inicio),
    previsao: '',
    pessoasAfetadas: '',
    atingeServicoCritico: null,
  }
}

export default function PublicarStatus() {
  const repositorio = useRepositorio()
  const { usuario } = usePerfil()
  const agora = useAgora(30_000)
  const bairros = repositorio.listarBairros()
  const servico = usuario.servico // fixo, do perfil da operadora (concessionária de energia)

  const [aba, setAba] = useState('novo')
  const [form, setForm] = useState(() => formularioInicial(new Date(), bairros))
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [refResumo, focarResumo] = useFocoNoResumo()
  const [resultado, setResultado] = useState('')
  const [novaSituacao, setNovaSituacao] = useState({}) // eventoId → situação escolhida no card

  const meus = statusPublicados(repositorio.listarEventos(), usuario.id)
  const mudar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const area = form.tipoArea === 'bairro' ? { tipo: 'bairro', bairro: form.bairro } : { tipo: 'ponto', posicao: form.posicao, raioM: form.raioM }
  const entrada = {
    area,
    situacao: form.situacao,
    inicio: deCampo(form.inicio),
    previsao: deCampo(form.previsao),
    pessoasAfetadas: form.pessoasAfetadas,
    atingeServicoCritico: form.atingeServicoCritico,
  }
  const erros = tentouEnviar ? validarStatus(entrada, new Date()) : {}
  const errosAtuais = validarStatus(entrada, new Date())

  // Prévia: o risco que classificarRisco() daria com estes dados (seção 4.2)
  const previa =
    Object.keys(errosAtuais).length === 0
      ? classificarRisco(
          TIPOS.INTERRUPCAO,
          {
            situacao: entrada.situacao,
            inicio: entrada.inicio,
            previsaoNormalizacao: entrada.previsao,
            pessoasAfetadas: Number(entrada.pessoasAfetadas),
            atingeServicoCritico: entrada.atingeServicoCritico,
          },
          new Date(),
        )
      : null

  const publicar = (e) => {
    e.preventDefault()
    setTentouEnviar(true)
    if (Object.keys(errosAtuais).length > 0) {
      focarResumo()
      return
    }
    const momento = new Date()
    const dado = criarDadoStatus({ ...entrada, servico, usuario, bairros, agora: momento })
    const evento = repositorio.publicarStatus(dado, momento)
    setResultado(
      `Status publicado: “${evento.titulo}”. Risco ${evento.risco}, confiança ${evento.faixaConfianca} • ${evento.confianca}; estado: ${evento.estado}.` +
        (passouPorAlerta(evento) ? ' Alerta enviado para quem acompanha a área.' : ''),
    )
    setForm(formularioInicial(momento, bairros))
    setTentouEnviar(false)
    setAba('meus')
  }

  const atualizar = (evento, dado) => {
    const situacao = novaSituacao[evento.id] ?? dado.medicoes.situacao
    const momento = new Date()
    const depois = repositorio.publicarStatus(atualizarSituacao(dado, situacao, momento), momento)
    setResultado(`Situação atualizada para “${situacao}”: “${depois.titulo}”. Risco ${depois.risco}; estado: ${depois.estado}.`)
  }

  return (
    <div className="publicar">
      <header className="cabecalho-tela">
        <h1>Publicar status</h1>
        <p className="cabecalho-tela__sub">Interrupções de {servico.toLowerCase()} informadas pela concessionária</p>
      </header>

      <div className="filtros" role="group" aria-label="Ver">
        <button type="button" className="filtro" aria-pressed={aba === 'novo'} onClick={() => setAba('novo')}>
          Novo status
        </button>
        <button type="button" className="filtro" aria-pressed={aba === 'meus'} onClick={() => setAba('meus')}>
          Meus status ({meus.length})
        </button>
      </div>

      <p className="resultado-acao" role="status">
        {resultado}
      </p>

      {aba === 'novo' && (
        <form className="publicar__form" onSubmit={publicar} noValidate>
          <p className="publicar__servico">
            Serviço: <strong>{servico}</strong> <span className="nota">(do seu perfil)</span>
          </p>

          <fieldset className="grupo">
            <legend className="grupo__legenda">Área afetada</legend>
            <div className="filtros" role="group" aria-label="Como informar a área">
              <button type="button" className="chip-escolha" aria-pressed={form.tipoArea === 'bairro'} onClick={() => mudar('tipoArea')('bairro')}>
                Bairro
              </button>
              <button type="button" className="chip-escolha" aria-pressed={form.tipoArea === 'ponto'} onClick={() => mudar('tipoArea')('ponto')}>
                Ponto no mapa com raio
              </button>
            </div>
            {form.tipoArea === 'bairro' ? (
              <Campo id="status-bairro" rotulo="Bairro" erro={erros.area}>
                <select
                  id="status-bairro"
                  value={form.bairro}
                  onChange={(e) => mudar('bairro')(e.target.value)}
                  aria-invalid={Boolean(erros.area)}
                  aria-describedby={erros.area ? 'status-bairro-erro' : undefined}
                >
                  <option value="">Escolha o bairro</option>
                  {bairros.map((b) => (
                    <option key={b.nome} value={b.nome}>
                      {b.nome}
                    </option>
                  ))}
                </select>
              </Campo>
            ) : (
              <>
                <p className="nota">Toque no mapa ou arraste o pino até o centro da área.</p>
                <MapaSeletor posicao={form.posicao} aoMudar={mudar('posicao')} />
                <Campo id="status-raio" rotulo="Raio">
                  <select id="status-raio" value={form.raioM} onChange={(e) => mudar('raioM')(Number(e.target.value))}>
                    {RAIOS_PONTO_M.map((m) => (
                      <option key={m} value={m}>
                        {rotuloRaio(m)}
                      </option>
                    ))}
                  </select>
                </Campo>
              </>
            )}
          </fieldset>

          <Campo id="status-situacao" rotulo="Situação" erro={erros.situacao}>
            <select id="status-situacao" value={form.situacao} onChange={(e) => mudar('situacao')(e.target.value)}>
              {Object.values(SITUACOES_INTERRUPCAO).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Campo>

          <div className="publicar__datas">
            <Campo id="status-inicio" rotulo="Início" erro={erros.inicio}>
              <input
                id="status-inicio"
                type="datetime-local"
                value={form.inicio}
                onChange={(e) => mudar('inicio')(e.target.value)}
                aria-invalid={Boolean(erros.inicio)}
                aria-describedby={erros.inicio ? 'status-inicio-erro' : undefined}
              />
            </Campo>
            <Campo id="status-previsao" rotulo="Previsão de normalização" erro={erros.previsao}>
              <input
                id="status-previsao"
                type="datetime-local"
                value={form.previsao}
                onChange={(e) => mudar('previsao')(e.target.value)}
                aria-invalid={Boolean(erros.previsao)}
                aria-describedby={erros.previsao ? 'status-previsao-erro' : undefined}
              />
            </Campo>
          </div>

          <Campo id="status-afetados" rotulo="Nº estimado de afetados (pessoas)" erro={erros.pessoasAfetadas}>
            <input
              id="status-afetados"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={form.pessoasAfetadas}
              onChange={(e) => mudar('pessoasAfetadas')(e.target.value)}
              aria-invalid={Boolean(erros.pessoasAfetadas)}
              aria-describedby={erros.pessoasAfetadas ? 'status-afetados-erro' : undefined}
            />
          </Campo>

          <fieldset className={erros.atingeServicoCritico ? 'grupo campo--erro' : 'grupo'} aria-describedby={erros.atingeServicoCritico ? 'status-critico-erro' : undefined}>
            <legend className="campo__rotulo">Atinge hospital, escola ou abastecimento crítico?</legend>
            <div className="filtros">
              {[
                [true, 'Sim'],
                [false, 'Não'],
              ].map(([valor, rotulo]) => (
                <button
                  key={rotulo}
                  type="button"
                  className="chip-escolha"
                  aria-pressed={form.atingeServicoCritico === valor}
                  onClick={() => mudar('atingeServicoCritico')(valor)}
                >
                  {rotulo}
                </button>
              ))}
            </div>
            {erros.atingeServicoCritico && (
              <p id="status-critico-erro" className="campo__erro">
                {erros.atingeServicoCritico}
              </p>
            )}
          </fieldset>

          <div className="publicar__previa" aria-live="polite">
            {previa ? (
              <>
                <span>Com esses dados, o risco fica</span>
                <SeloRisco risco={previa} />
              </>
            ) : (
              <span className="nota">Preencha os campos para ver o risco calculado.</span>
            )}
          </div>

          {tentouEnviar && Object.keys(erros).length > 0 && (
            <p className="campo__erro" role="alert" ref={refResumo} tabIndex={-1}>
              Corrija {Object.keys(erros).length === 1 ? 'o campo marcado' : 'os campos marcados'} para publicar.
            </p>
          )}
          <button type="submit" className="botao botao--primario botao--largo">
            Publicar status
          </button>
          <p className="nota">O status entra como origem Base pública (concessionária), com confiança 80.</p>
        </form>
      )}

      {aba === 'meus' &&
        (meus.length === 0 ? (
          <div className="vazio">
            <p>Você ainda não publicou nenhum status.</p>
          </div>
        ) : (
          <div className="lista-cards">
            {meus.map(({ evento, dado }) => {
              const m = dado.medicoes
              const ativo = eventoAtivo(evento)
              const idSelect = `situacao-${evento.id}`
              return (
                <CardAlerta
                  key={evento.id}
                  evento={evento}
                  titulo="h2"
                  rodape={
                    ativo && (
                      <div className="fila__acoes publicar__atualizar">
                        <label htmlFor={idSelect} className="campo__rotulo">
                          Nova situação
                        </label>
                        <select id={idSelect} value={novaSituacao[evento.id] ?? m.situacao} onChange={(e) => setNovaSituacao((s) => ({ ...s, [evento.id]: e.target.value }))}>
                          {Object.values(SITUACOES_INTERRUPCAO).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="botao botao--primario"
                          disabled={(novaSituacao[evento.id] ?? m.situacao) === m.situacao}
                          onClick={() => atualizar(evento, dado)}
                        >
                          Atualizar situação
                        </button>
                      </div>
                    )
                  }
                >
                  <dl className="publicar__fatos">
                    <div>
                      <dt>Situação</dt>
                      <dd>{m.situacao}</dd>
                    </div>
                    <div>
                      <dt>Início</dt>
                      <dd>{formatarDataHora(m.inicio, agora)}</dd>
                    </div>
                    <div>
                      <dt>Previsão</dt>
                      <dd>{formatarDataHora(m.previsaoNormalizacao, agora)}</dd>
                    </div>
                    <div>
                      <dt>Afetados</dt>
                      <dd>{m.pessoasAfetadas.toLocaleString('pt-BR')}</dd>
                    </div>
                  </dl>
                  {ativo && m.situacao === SITUACOES_INTERRUPCAO.NORMALIZADO && (
                    <p className="nota">Normalizado: risco Baixo. O evento é encerrado após 30 min com risco Baixo (RN05).</p>
                  )}
                </CardAlerta>
              )
            })}
          </div>
        ))}

    </div>
  )
}
