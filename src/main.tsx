import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { loadState } from './lib/storage'
import { routeFromDocument } from './lib/router'
import { mountContactForm } from './forms/contact-form'

// Paint the persisted theme before React mounts so there is no light flash.
document.documentElement.classList.toggle('dark', loadState().theme === 'dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialRoute={routeFromDocument()} />
  </StrictMode>,
)

// El formulario de contacto es JavaScript nativo: se monta aparte de React y
// espera a que el contenedor exista si la vista todavía no se renderizó.
mountContactForm()
