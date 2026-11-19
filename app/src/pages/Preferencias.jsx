// Preferências (RF13): áreas de interesse (bairro ou ponto no mapa com raio de 500 m, 1 km ou 2 km),
// tipos de risco e canais. O que for salvo passa a valer na RN06 na hora (repositorio.atualizarPreferencias).
// Para salvar: pelo menos 1 área, 1 tipo de risco e 1 canal.
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Campo from '../components/Campo.jsx'
import Icone from '../components/Icone.jsx'
import MapaSeletor from '../components/MapaSeletor.jsx'
import { usePerfil } from '../contexto/PerfilContext.jsx'
import { useFocoNoResumo } from '../hooks/useFocoNoResumo.js'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { PERFIS, TELAS } from '../navegacao.js'
import { FINALIDADES, podeReceberNotificacoes, rotuloArea, rotuloRaio, validarPreferencias } from '../services/conta.js'
import { CANAIS, RAIOS_PONTO_M, TIPOS } from '../services/parametros.js'

const chaveArea = (a) => (a.tipo === 'bairro' ? a.bairro : `${a.lat.toFixed(5)},${a.lng.toFixed(5)},${a.raioM}`)
const alternar = (lista, item) => (lista.includes(item) ? lista.filter((i) => i !== item) : [...lista, item])

// Grupo de chips marcáveis (tipos de risco, canais), com ✓ na opção escolhida (não só cor)
function GrupoEscolhas({ id, legenda, opcoes, escolhidas, aoMudar, erro, children }) {
  return (
    <fieldset className={erro ? 'bloco grupo campo--erro' : 'bloco grupo'} aria-describedby={erro ? `${id}-erro` : undefined}>
      <legend className="grupo__legenda grupo__legenda--bloco">{legenda}</legend>
      <div className="filtros">
        {opcoes.map((opcao) => (
          <button key={opcao} type="button" className="chip-escolha" aria-pressed={escolhidas.includes(opcao)} onClick={() => aoMudar(alternar(escolhidas, opcao))}>
            {escolhidas.includes(opcao) && <Icone nome="marcado" className="icone chip-escolha__marca" />}
            {opcao}
          </button>
        ))}
      </div>
      {erro && (
        <p id={`${id}-erro`} className="campo__erro">
          {erro}
        </p>
      )}
      {children}
    </fieldset>
  )
}

export default function Preferencias() {
  const repositorio = useRepositorio()
  const { usuario } = usePerfil()
  const local = useLocation()
  const bairros = repositorio.listarBairros()

  // Rascunho: só vale depois de "Salvar preferências"
  const [areas, setAreas] = useState(usuario.areasInteresse)
  const [tipos, setTipos] = useState(usuario.tiposRisco)
  const [canais, setCanais] = useState(usuario.canais)
  const [tentou, setTentou] = useState(false)
  const [refResumo, focarResumo] = useFocoNoResumo()
  const [resultado, setResultado] = useState('')

  // Formulário "Adicionar área"
  const [modoArea, setModoArea] = useState('bairro')
  const [bairroEscolhido, setBairroEscolhido] = useState('')
  const [posicao, setPosicao] = useState(() => ({ lat: (usuario.areasInteresse[0] ?? bairros[0]).lat, lng: (usuario.areasInteresse[0] ?? bairros[0]).lng }))
  const [raioM, setRaioM] = useState(RAIOS_PONTO_M[1])

  const preferencias = { areasInteresse: areas, tiposRisco: tipos, canais }
  const errosAtuais = validarPreferencias(preferencias)
  const erros = tentou ? errosAtuais : {}
  const bairrosLivres = bairros.filter((b) => !areas.some((a) => a.tipo === 'bairro' && a.bairro === b.nome))
  const morador = usuario.perfil === PERFIS.MORADOR

  const mudou = (fn) => (valor) => {
    fn(valor)
    setResultado('')
  }

  const adicionarBairro = () => {
    if (!bairroEscolhido) return
    mudou(setAreas)([...areas, { tipo: 'bairro', bairro: bairroEscolhido }])
    setBairroEscolhido('')
  }
  const adicionarPonto = () => {
    const ponto = { tipo: 'ponto', lat: posicao.lat, lng: posicao.lng, raioM }
    if (areas.some((a) => chaveArea(a) === chaveArea(ponto))) return
    mudou(setAreas)([...areas, ponto])
  }
  const remover = (area) => mudou(setAreas)(areas.filter((a) => chaveArea(a) !== chaveArea(area)))

  const salvar = (e) => {
    e.preventDefault()
    setTentou(true)
    if (Object.keys(errosAtuais).length > 0) {
      setResultado('')
      focarResumo()
      return
    }
    repositorio.atualizarPreferencias(usuario.id, preferencias)
    setTentou(false)
    setResultado(
      podeReceberNotificacoes(usuario)
        ? 'Preferências salvas. Os próximos alertas já seguem estas áreas, tipos e canais.'
        : 'Preferências salvas. Você só recebe notificações depois de autorizar “Áreas de interesse e notificações de risco”.',
    )
  }

  return (
    <div className="preferencias">
      <Link to={TELAS.perfil.caminho} className="botao-voltar">
        <Icone nome="voltar" />
        Perfil
      </Link>
      <header className="cabecalho-tela">
        <h1>Preferências</h1>
        <p className="cabecalho-tela__sub">Onde, sobre o quê e por onde você quer ser avisado.</p>
      </header>

      {local.state?.contaNova && (
        <p className="aviso" role="status">
          Conta criada. Adicione pelo menos uma área de interesse e salve para começar.
        </p>
      )}
      {!podeReceberNotificacoes(usuario) && (
        <p className="aviso aviso--atencao">
          Você não autorizou “{FINALIDADES.NOTIFICACOES}”: não vai receber notificações.{' '}
          <Link to={TELAS.privacidade.caminho}>Autorizar em Privacidade e meus dados</Link>
        </p>
      )}

      <form className="preferencias__form" onSubmit={salvar} noValidate>
        <fieldset className={erros.areas ? 'bloco grupo campo--erro' : 'bloco grupo'} aria-describedby={erros.areas ? 'areas-erro' : undefined}>
          <legend className="grupo__legenda grupo__legenda--bloco">Áreas de interesse</legend>
          {areas.length === 0 ? (
            <p className="nota">Nenhuma área ainda.</p>
          ) : (
            <ul className="lista-areas">
              {areas.map((a) => (
                <li key={chaveArea(a)} className="lista-areas__item">
                  <Icone nome="local" />
                  <span className="lista-areas__nome">{rotuloArea(a, bairros)}</span>
                  <button type="button" className="botao-link" onClick={() => remover(a)} aria-label={`Remover ${rotuloArea(a, bairros)}`}>
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
          {erros.areas && (
            <p id="areas-erro" className="campo__erro">
              {erros.areas}
            </p>
          )}

          <div className="adicionar-area">
            <h2 className="adicionar-area__titulo">Adicionar área</h2>
            <div className="filtros" role="group" aria-label="Como escolher a área">
              <button type="button" className="chip-escolha" aria-pressed={modoArea === 'bairro'} onClick={() => setModoArea('bairro')}>
                Bairro
              </button>
              <button type="button" className="chip-escolha" aria-pressed={modoArea === 'ponto'} onClick={() => setModoArea('ponto')}>
                Ponto no mapa com raio
              </button>
            </div>
            {modoArea === 'bairro' ? (
              <div className="adicionar-area__linha">
                <Campo id="pref-bairro" rotulo="Bairro">
                  <select id="pref-bairro" value={bairroEscolhido} onChange={(e) => setBairroEscolhido(e.target.value)} disabled={bairrosLivres.length === 0}>
                    <option value="">{bairrosLivres.length === 0 ? 'Todos os bairros já foram adicionados' : 'Escolha o bairro'}</option>
                    {bairrosLivres.map((b) => (
                      <option key={b.nome} value={b.nome}>
                        {b.nome}
                      </option>
                    ))}
                  </select>
                </Campo>
                <button type="button" className="botao botao--secundario" onClick={adicionarBairro} disabled={!bairroEscolhido}>
                  Adicionar bairro
                </button>
              </div>
            ) : (
              <>
                <p className="nota">Toque no mapa ou arraste o pino até o centro da área.</p>
                <MapaSeletor posicao={posicao} aoMudar={setPosicao} raioM={raioM} rotulo="Centro da área de interesse" />
                <div className="adicionar-area__linha">
                  <Campo id="pref-raio" rotulo="Raio">
                    <select id="pref-raio" value={raioM} onChange={(e) => setRaioM(Number(e.target.value))}>
                      {RAIOS_PONTO_M.map((m) => (
                        <option key={m} value={m}>
                          {rotuloRaio(m)}
                        </option>
                      ))}
                    </select>
                  </Campo>
                  <button type="button" className="botao botao--secundario" onClick={adicionarPonto}>
                    Adicionar ponto
                  </button>
                </div>
              </>
            )}
          </div>
        </fieldset>

        <GrupoEscolhas id="tipos" legenda="Tipos de risco" opcoes={Object.values(TIPOS)} escolhidas={tipos} aoMudar={mudou(setTipos)} erro={erros.tipos} />

        <GrupoEscolhas id="canais" legenda="Canais de alerta" opcoes={Object.values(CANAIS)} escolhidas={canais} aoMudar={mudou(setCanais)} erro={erros.canais}>
          <p className="nota">
            {morador
              ? 'No protótipo, nenhum SMS ou e-mail é enviado: os avisos de todos os canais aparecem na Central de notificações.'
              : 'No protótipo, nenhum SMS ou e-mail é enviado.'}
          </p>
        </GrupoEscolhas>

        {tentou && Object.keys(erros).length > 0 && (
          <p className="campo__erro" role="alert" ref={refResumo} tabIndex={-1}>
            Corrija {Object.keys(erros).length === 1 ? 'o item marcado' : 'os itens marcados'} para salvar.
          </p>
        )}
        <p className="resultado-acao" role="status">
          {resultado}
        </p>
        <button type="submit" className="botao botao--primario botao--largo">
          Salvar preferências
        </button>
      </form>
    </div>
  )
}
