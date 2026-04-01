import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'

// Register the PWA service worker
const updateSW = registerSW({
  onNeedRefresh() {
    // We can add a toast notification here later, but for autoUpdate this is mostly quiet
  },
  onOfflineReady() {
    console.log("App is ready to work offline.")
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
