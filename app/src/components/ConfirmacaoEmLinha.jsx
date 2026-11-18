// Botões de ação do agente com confirmação em linha: o botão vira a pergunta "Sim, <ação>" / "Não, manter"
// no mesmo lugar, sem janela modal. Usado no Detalhe do alerta e em cada card da Fila de validação.
import { useId, useState } from 'react'

export default function ConfirmacaoEmLinha({ acoes, aoExecutar, contexto = '' }) {
  const [pendente, setPendente] = useState(null) // ação aguardando "Sim"
  const idTexto = useId()

  const executar = (acao) => {
    setPendente(null)
    aoExecutar(acao)
  }

  if (pendente) {
    return (
      <div className="confirmacao" role="alertdialog" aria-labelledby={idTexto}>
        <p id={idTexto}>{pendente.confirmacao}</p>
        <div className="confirmacao__botoes">
          <button type="button" className={pendente.perigo ? 'botao botao--perigo' : 'botao botao--primario'} onClick={() => executar(pendente)} autoFocus>
            Sim, {pendente.rotulo.toLowerCase()}
          </button>
          <button type="button" className="botao botao--secundario" onClick={() => setPendente(null)}>
            Não, manter
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="acoes-agente__botoes">
      {acoes.map((acao) => (
        <button
          key={acao.id}
          type="button"
          className={`botao botao--${acao.estilo}`}
          // contexto: o nome do evento para o leitor de tela ("Confirmar: Água na altura do meio-fio...")
          aria-label={contexto ? `${acao.rotulo}: ${contexto}` : undefined}
          onClick={() => (acao.confirmacao ? setPendente(acao) : executar(acao))}
        >
          {acao.rotulo}
        </button>
      ))}
    </div>
  )
}
