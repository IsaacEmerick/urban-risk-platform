// Mapa do passo 2 do Registro comunitário: um pino na posição atual, que pode ser arrastado ou
// reposicionado com um toque no mapa. A posição exata fica só no registro; o mapa público mostra
// a aproximada (~100 m, RNF08).
// Com raioM (área de interesse nas Preferências, RF13), desenha também o círculo da área.
import L from 'leaflet'
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { svgDoIcone } from './Icone.jsx'

const ICONE_PINO = L.divIcon({
  className: 'marcador-leaflet',
  html: `<span class="pino-posicao">${svgDoIcone('local')}</span>`,
  iconSize: [40, 40],
  iconAnchor: [20, 38],
})

function ToqueNoMapa({ aoMudar }) {
  useMapEvents({ click: (e) => aoMudar({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

export default function MapaSeletor({ posicao, aoMudar, raioM = null, rotulo = 'Local da ocorrência' }) {
  return (
    <MapContainer className="mapa mapa--seletor" center={[posicao.lat, posicao.lng]} zoom={raioM ? 14 : 17} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ToqueNoMapa aoMudar={aoMudar} />
      {raioM && <Circle center={[posicao.lat, posicao.lng]} radius={raioM} pathOptions={{ className: 'circulo-area' }} />}
      <Marker
        position={[posicao.lat, posicao.lng]}
        icon={ICONE_PINO}
        draggable
        title={`${rotulo} (arraste para ajustar)`}
        alt={rotulo}
        eventHandlers={{
          dragend: (e) => {
            const { lat, lng } = e.target.getLatLng()
            aoMudar({ lat, lng })
          },
        }}
      />
    </MapContainer>
  )
}
