import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { loadState } from './lib/storage'

// Paint the persisted theme before React mounts so there is no light flash.
document.documentElement.classList.toggle('dark', loadState().theme === 'dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
