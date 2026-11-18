// Lista de alertas (RF08): cards ordenados por prioridade (seção 4.3), com filtros por tipo, risco e estado.
// Por padrão mostra os eventos ativos; Encerrado e Descartado incluem o histórico dos últimos 30 dias.
import { useState } from 'react'
import CardAlerta from '../components/CardAlerta.jsx'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { eventoAtivo, ordenarPorPrioridade } from '../services/eventos.js'
import { ESTADOS, NIVEIS_RISCO, TIPOS } from '../services/parametros.js'

const TODOS = 'todos'
const ATIVOS = 'ativos'

function aceitaEstado(evento, filtro) {
  if (filtro === TODOS) return true
  if (filtro === ATIVOS) return eventoAtivo(evento)
  return evento.estado === filtro
}

export default function ListaAlertas() {
  const repositorio = useRepositorio()
  const [tipo, setTipo] = useState(TODOS)
  const [risco, setRisco] = useState(TODOS)
  const [estado, setEstado] = useState(ATIVOS)

  const eventos = ordenarPorPrioridade(
    repositorio
      .listarEventos()
      .filter((e) => tipo === TODOS || e.tipo === tipo)
      .filter((e) => risco === TODOS || e.risco === risco)
      .filter((e) => aceitaEstado(e, estado)),
  )

  const filtrosPadrao = tipo === TODOS && risco === TODOS && estado === ATIVOS
  const limparFiltros = () => {
    setTipo(TODOS)
    setRisco(TODOS)
    setEstado(ATIVOS)
  }

  return (
    <div className="lista-alertas">
      <header className="cabecalho-tela">
        <h1>Lista de alertas</h1>
        <p className="cabecalho-tela__sub" aria-live="polite">
          {eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'}, do mais prioritário para o menos
        </p>
      </header>

      <div className="filtros" role="group" aria-label="Filtrar por tipo de risco">
        {[TODOS, ...Object.values(TIPOS)].map((t) => (
          <button key={t} type="button" className="filtro" aria-pressed={tipo === t} onClick={() => setTipo(t)}>
            {t === TODOS ? 'Todos os tipos' : t}
          </button>
        ))}
      </div>

      <div className="linha-campos">
        <div className="campo-filtro">
          <label htmlFor="filtro-risco">Risco</label>
          <select id="filtro-risco" value={risco} onChange={(e) => setRisco(e.target.value)}>
            <option value={TODOS}>Todos</option>
            {[...NIVEIS_RISCO].reverse().map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="campo-filtro">
          <label htmlFor="filtro-estado">Estado</label>
          <select id="filtro-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value={ATIVOS}>Ativos</option>
            {Object.values(ESTADOS).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value={TODOS}>Todos</option>
          </select>
        </div>
      </div>

      {eventos.length === 0 ? (
        <div className="vazio">
          <p>Nenhum evento com esses filtros.</p>
          <button type="button" className="botao botao--secundario" onClick={limparFiltros}>
            Limpar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="lista-cards">
            {eventos.map((evento) => (
              <CardAlerta key={evento.id} evento={evento} titulo="h2" />
            ))}
          </div>
          {!filtrosPadrao && (
            <button type="button" className="botao botao--secundario" onClick={limparFiltros}>
              Limpar filtros
            </button>
          )}
        </>
      )}
    </div>
  )
}
