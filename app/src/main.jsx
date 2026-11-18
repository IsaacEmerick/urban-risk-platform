import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/atkinson-hyperlegible-next'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'
import { PerfilProvider } from './contexto/PerfilContext.jsx'
import './styles/tokens.css'
import './index.css'
import './styles/componentes.css'
import './styles/telas.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PerfilProvider>
        <App />
      </PerfilProvider>
    </BrowserRouter>
  </StrictMode>,
)
