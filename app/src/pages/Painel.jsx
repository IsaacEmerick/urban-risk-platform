// Painel (RF07): mapa dos eventos ativos coloridos por risco, indicadores e filtros por tipo e bairro.
// Atualiza sozinho quando o simulador manda leitura nova (useRepositorio).
import { useState } from 'react'
import CardAlerta from '../components/CardAlerta.jsx'
import CarimboAtualizacao from '../components/CarimboAtualizacao.jsx'
import Icone from '../components/Icone.jsx'
import MapaEventos from '../components/MapaEventos.jsx'
import { classeRisco } from '../components/apresentacao.js'
import { useRepositorio } from '../hooks/useRepositorio.js'
import { alertasAtivos, eventoAtivo } from '../services/eventos.js'
import { NIVEIS_RISCO, TIPOS } from '../services/parametros.js'

const TODOS = 'todos'

export default function Painel() {
  const repositorio = useRepositorio()
  const [tipo, setTipo] = useState(TODOS)
  const [bairro, setBairro] = useState(TODOS)

  const ativos = repositorio
    .listarEventos()
    .filter(eventoAtivo)
    .filter((e) => tipo === TODOS || e.tipo === tipo)
    .filter((e) => bairro === TODOS || e.bairro === bairro)
    .sort((a, b) => b.prioridade - a.prioridade) // seção 4.3
  const alertas = alertasAtivos(ativos)
  const ultimaAtualizacao = ativos.length ? new Date(Math.max(...ativos.map((e) => e.atualizadoEm))) : null

  return (
    <div className="painel">
      <header className="cabecalho-tela">
        <h1>Painel</h1>
        <p className="cabecalho-tela__sub">Parque Viana e Jardim Maria Helena, Barueri</p>
      </header>

      <div className="filtros" role="group" aria-label="Filtrar por tipo de risco">
        {[TODOS, ...Object.values(TIPOS)].map((t) => (
          <button key={t} type="button" className="filtro" aria-pressed={tipo === t} onClick={() => setTipo(t)}>
            {t === TODOS ? 'Todos os tipos' : t}
          </button>
        ))}
      </div>
      <label className="campo-bairro">
        <span>Bairro</span>
        <select value={bairro} onChange={(e) => setBairro(e.target.value)}>
          <option value={TODOS}>Todos os bairros</option>
          {repositorio.listarBairros().map((b) => (
            <option key={b.nome} value={b.nome}>
              {b.nome}
            </option>
          ))}
        </select>
      </label>

      <section className="indicadores" aria-label="Indicadores">
        <div className="indicador">
          <span className="indicador__valor">{alertas.length}</span>
          <span className="indicador__rotulo">{alertas.length === 1 ? 'alerta ativo' : 'alertas ativos'}</span>
        </div>
        <div className="indicador">
          <span className="indicador__rotulo">Última atualização</span>
          {ultimaAtualizacao ? <CarimboAtualizacao em={ultimaAtualizacao} prefixo="" /> : <span>sem dados</span>}
        </div>
      </section>

      <section aria-label="Mapa dos eventos ativos" className="bloco-mapa">
        <MapaEventos eventos={ativos} />
        <ul className="legenda" aria-label="Legenda de risco">
          {NIVEIS_RISCO.map((risco) => (
            <li key={risco}>
              <span className={`marcador marcador--legenda risco--${classeRisco(risco)}`}>
                <Icone nome={risco} />
              </span>
              {risco}
            </li>
          ))}
          <li>
            <span className="marcador marcador--legenda marcador--area" aria-hidden="true" />
            Posição aproximada (cerca de 100 m): só registros de moradores
          </li>
        </ul>
      </section>

      <section aria-labelledby="titulo-eventos">
        <h2 id="titulo-eventos" className="titulo-secao">
          Eventos ativos, por prioridade
        </h2>
        {ativos.length === 0 ? (
          <p className="vazio">Nenhum evento ativo com esses filtros. Escolha outro tipo ou bairro.</p>
        ) : (
          <div className="lista-cards">
            {ativos.map((evento) => (
              <CardAlerta key={evento.id} evento={evento} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
