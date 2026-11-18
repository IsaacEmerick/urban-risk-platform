// Mapa Leaflet (OpenStreetMap) com um marcador por evento.
// A posição de todo marcador passa por posicaoPublicaEvento() (RNF08): registro de morador vira ~100 m.
// Marcador = cor do risco + ícone com forma própria + borda escura (o amarelo precisa de contraste no mapa claro).
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { posicaoPublicaEvento } from '../services/privacidade.js'
import { svgDoIcone } from './Icone.jsx'
import SeloRisco from './SeloRisco.jsx'
import { classeRisco } from './apresentacao.js'

// Centro do cenário: entre o Parque Viana e o Jardim Maria Helena (data/bairros.json)
const CENTRO_PADRAO = [-23.5352, -46.8655]

// Um ícone por nível de risco, criado uma vez só
const ICONES_MARCADOR = Object.fromEntries(
  ['Baixo', 'Moderado', 'Alto', 'Crítico'].map((risco) => [
    risco,
    L.divIcon({
      className: 'marcador-leaflet',
      html: `<span class="marcador risco--${classeRisco(risco)}">${svgDoIcone(risco)}</span>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    }),
  ]),
)

export default function MapaEventos({ eventos, centro, zoom = 15, mini = false }) {
  const posicoes = eventos.map((evento) => ({ evento, posicao: posicaoPublicaEvento(evento) }))
  const centroInicial = centro ?? (mini && posicoes[0] ? [posicoes[0].posicao.lat, posicoes[0].posicao.lng] : CENTRO_PADRAO)
  // No Painel, o mapa abre enquadrando todos os eventos (com folga para os marcadores não ficarem na borda)
  const enquadrar = !mini && posicoes.length > 1
  const limites = enquadrar ? L.latLngBounds(posicoes.map(({ posicao }) => [posicao.lat, posicao.lng])) : undefined

  return (
    <MapContainer
      className={mini ? 'mapa mapa--mini' : 'mapa'}
      {...(enquadrar ? { bounds: limites, boundsOptions: { padding: [40, 40] } } : { center: centroInicial, zoom })}
      scrollWheelZoom={false}
      dragging={!mini}
      zoomControl={!mini}
      doubleClickZoom={!mini}
      touchZoom={!mini}
      keyboard={!mini}
    >
      <TileLayer
        attribution='&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {posicoes.map(({ evento, posicao }) => (
        <Marker
          // a chave inclui o risco: quando o risco muda, o marcador é recriado e o título (leitor de tela) acompanha
          key={`${evento.id}-${evento.risco}`}
          position={[posicao.lat, posicao.lng]}
          icon={ICONES_MARCADOR[evento.risco]}
          title={`${evento.titulo} – risco ${evento.risco}`}
          alt={`${evento.titulo} – risco ${evento.risco}`}
          keyboard={!mini}
          interactive={!mini}
        >
          {!mini && (
            <Popup>
              <div className="popup-evento">
                <SeloRisco risco={evento.risco} />
                <p className="popup-evento__titulo">{evento.titulo}</p>
                <Link to={`/alertas/${evento.id}`}>Ver detalhe</Link>
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  )
}
