import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { PerfilProvider } from './contexto/PerfilContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PerfilProvider>
        <App />
      </PerfilProvider>
    </BrowserRouter>
  </StrictMode>,
)
