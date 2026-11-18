// Registro comunitário (RF03, RNF06): no máximo 3 passos e 60 s.
// 1) tipo de risco · 2) local (posição atual já marcada, ajuste opcional) · 3) altura da água (Alagamento),
// descrição e foto opcionais → Enviar. O registro segue o mesmo caminho dos outros dados
// (confiança, risco, RN04, estados) e aparece no Painel. Depois do envio, a mesma tela mostra a confirmação.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import CardAlerta from '../components/CardAlerta.jsx'
import Icone from '../components/Icone.jsx'
import MapaSeletor from '../components/MapaSeletor.jsx'
import { usePerfil } from '../contexto/PerfilContext.jsx'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { TELAS } from '../navegacao.js'
import { ESTADOS, TIPOS } from '../services/parametros.js'
import {
  ALTURAS_AGUA,
  POSICAO_ATUAL_SIMULADA,
  SUGESTOES_DESCRICAO,
  bairroMaisProximo,
  criarDadoComunitario,
  montarDescricao,
} from '../services/registro.js'

const TOTAL_PASSOS = 3
const TITULOS_PASSO = { 1: 'O que está acontecendo?', 2: 'Onde?', 3: 'Como está?' }

// O que acontece com o registro agora, conforme o estado em que o evento ficou (RN01–RN03)
function proximoPasso(evento) {
  switch (evento.estado) {
    case ESTADOS.REPORTADO:
      return `Confiança ${evento.faixaConfianca}: o registro aguarda a confirmação de vizinhos ("Também vejo isso"). Sem nenhuma confirmação em 2 h, ele é descartado.`
    case ESTADOS.EM_VALIDACAO:
      return `Confiança ${evento.faixaConfianca}: a Defesa Civil vai analisar o registro na Fila de validação.`
    case ESTADOS.ALERTA_EMITIDO:
    case ESTADOS.EM_MONITORAMENTO:
    case ESTADOS.CONFIRMADO:
      return evento.riscoAlertado
        ? 'Ocorrência confirmada: quem acompanha a região já recebeu o alerta.'
        : 'Ocorrência confirmada e em monitoramento.'
    default:
      return `Estado atual: ${evento.estado}.`
  }
}

function IndicadorPasso({ passo }) {
  return (
    <div className="passos" aria-label={`Passo ${passo} de ${TOTAL_PASSOS}`}>
      <p className="passos__texto" aria-hidden="true">
        Passo {passo} de {TOTAL_PASSOS}
      </p>
      <div className="passos__trilho" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= passo ? 'passos__segmento passos__segmento--feito' : 'passos__segmento'} />
        ))}
      </div>
    </div>
  )
}

export default function RegistroComunitario() {
  const repositorio = useRepositorio()
  const { usuario } = usePerfil()
  const [passo, setPasso] = useState(1)
  const [tipo, setTipo] = useState(null)
  const [posicao, setPosicao] = useState(POSICAO_ATUAL_SIMULADA)
  const [alturaAgua, setAlturaAgua] = useState(null)
  const [sugestoes, setSugestoes] = useState([])
  const [texto, setTexto] = useState('')
  const [foto, setFoto] = useState(null) // nome do arquivo: a imagem não é guardada no protótipo
  const [enviado, setEnviado] = useState(null) // { eventoId, agrupado }

  const bairro = bairroMaisProximo(posicao, repositorio.listarBairros())
  const ehAlagamento = tipo === TIPOS.ALAGAMENTO
  const podeEnviar = !ehAlagamento || alturaAgua !== null

  const recomecar = () => {
    setPasso(1)
    setTipo(null)
    setPosicao(POSICAO_ATUAL_SIMULADA)
    setAlturaAgua(null)
    setSugestoes([])
    setTexto('')
    setFoto(null)
    setEnviado(null)
  }

  const alternarSugestao = (s) => setSugestoes((atuais) => (atuais.includes(s) ? atuais.filter((x) => x !== s) : [...atuais, s]))

  const enviar = (e) => {
    e.preventDefault()
    if (!podeEnviar) return
    const agora = new Date()
    const idsAntes = new Set(repositorio.listarEventos().map((ev) => ev.id))
    const dado = criarDadoComunitario({
      tipo,
      posicao,
      alturaAgua,
      descricao: montarDescricao(ehAlagamento ? sugestoes : [], texto),
      comFoto: Boolean(foto),
      usuario,
      bairros: repositorio.listarBairros(),
      agora,
    })
    const evento = repositorio.registrarOcorrencia(dado, agora)
    setEnviado({ eventoId: evento.id, agrupado: idsAntes.has(evento.id) })
  }

  // Confirmação de envio
  if (enviado) {
    const evento = repositorio.obterEvento(enviado.eventoId)
    return (
      <div className="registro">
        <header className="registro-enviado">
          <Icone nome="confirmado" className="icone registro-enviado__icone" />
          <div>
            <h1>Registro enviado</h1>
            <p className="cabecalho-tela__sub">Obrigado! Seu registro já aparece no Painel.</p>
          </div>
        </header>
        {enviado.agrupado && (
          <p className="aviso">Já havia uma ocorrência parecida a até 300 m: seu registro foi juntado a ela.</p>
        )}
        <CardAlerta evento={evento} titulo="h2" />
        <p className="registro__proximo">{proximoPasso(evento)}</p>
        <p className="nota">No mapa público, a posição aparece aproximada (cerca de 100 m) e seu nome não aparece.</p>
        <div className="registro__botoes">
          <Link to={TELAS.meusRegistros.caminho} className="botao botao--primario">
            Ver meus registros
          </Link>
          <Link to={TELAS.painel.caminho} className="botao botao--secundario">
            Ver no Painel
          </Link>
        </div>
        <button type="button" className="botao-link" onClick={recomecar}>
          Registrar outra ocorrência
        </button>
      </div>
    )
  }

  return (
    <form className="registro" onSubmit={enviar}>
      {passo > 1 && (
        <button type="button" className="botao-voltar" onClick={() => setPasso(passo - 1)}>
          <Icone nome="voltar" />
          Voltar
        </button>
      )}
      <IndicadorPasso passo={passo} />
      <h1 className="registro__titulo">{TITULOS_PASSO[passo]}</h1>

      {passo === 1 && (
        <div className="opcoes" role="group" aria-label="Tipo de risco">
          {Object.values(TIPOS).map((t) => (
            <button
              key={t}
              type="button"
              className="opcao"
              aria-pressed={tipo === t}
              onClick={() => {
                // Um toque escolhe e já avança (RNF06: menos toques)
                setTipo(t)
                setPasso(2)
              }}
            >
              <Icone nome={t} className="icone opcao__icone" />
              <span className="opcao__rotulo">{t}</span>
            </button>
          ))}
        </div>
      )}

      {passo === 2 && (
        <>
          <p className="registro__instrucao">Sua posição atual já está marcada. Ajuste no mapa se precisar.</p>
          <MapaSeletor posicao={posicao} aoMudar={setPosicao} />
          <p className="registro__local">
            <Icone nome="local" />
            {tipo} em <strong>{bairro}</strong>
          </p>
          <p className="aviso">No mapa público, sua posição aparece aproximada (cerca de 100 m). Seu nome não aparece.</p>
          <button type="button" className="botao botao--primario botao--largo" onClick={() => setPasso(3)}>
            Continuar
          </button>
        </>
      )}

      {passo === 3 && (
        <>
          {ehAlagamento && (
            <fieldset className="grupo">
              <legend className="grupo__legenda">Até onde a água chegou?</legend>
              <div className="opcoes opcoes--duas">
                {ALTURAS_AGUA.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="opcao"
                    aria-pressed={alturaAgua === a.id}
                    onClick={() => setAlturaAgua(a.id)}
                  >
                    <Icone nome={`agua-${a.id}`} className="icone opcao__icone" />
                    <span className="opcao__rotulo">{a.rotulo}</span>
                    <span className="opcao__detalhe">≈ {a.cm} cm</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="grupo">
            <legend className="grupo__legenda">
              Quer descrever? <span className="grupo__opcional">(opcional)</span>
            </legend>
            {ehAlagamento && (
              <div className="filtros" role="group" aria-label="Sugestões de descrição">
                {SUGESTOES_DESCRICAO.map((s) => (
                  <button key={s} type="button" className="filtro" aria-pressed={sugestoes.includes(s)} onClick={() => alternarSugestao(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <label className="campo-texto">
              <span className="sr-only">Descrição</span>
              <textarea rows={2} maxLength={200} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva com suas palavras" />
            </label>
          </fieldset>

          <label className="campo-foto">
            <Icone nome="camera" />
            <span>{foto ? `Foto: ${foto}` : 'Adicionar foto (opcional)'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => setFoto(e.target.files?.[0]?.name ?? null)}
            />
          </label>

          <button type="submit" className="botao botao--primario botao--largo" disabled={!podeEnviar}>
            Enviar
          </button>
          {!podeEnviar && <p className="nota">Escolha até onde a água chegou para enviar.</p>}
        </>
      )}
    </form>
  )
}
