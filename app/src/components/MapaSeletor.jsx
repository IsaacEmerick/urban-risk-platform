// Mapa do passo 2 do Registro comunitário: um pino na posição atual, que pode ser arrastado ou
// reposicionado com um toque no mapa. A posição exata fica só no registro; o mapa público mostra
// a aproximada (~100 m, RNF08).
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
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

export default function MapaSeletor({ posicao, aoMudar }) {
  return (
    <MapContainer className="mapa mapa--seletor" center={[posicao.lat, posicao.lng]} zoom={17} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ToqueNoMapa aoMudar={aoMudar} />
      <Marker
        position={[posicao.lat, posicao.lng]}
        icon={ICONE_PINO}
        draggable
        title="Local da ocorrência (arraste para ajustar)"
        alt="Local da ocorrência"
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
