import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AetherEngine } from './engine/index.js'
import { useOSStore } from './store.js'

// ─── Orientation Lock ─────────────────────────────────────────────────────────
if (screen?.orientation?.lock) {
  screen.orientation.lock('portrait').catch(() => { /* desktop — ignore */ })
}
const updateOrientation = () => {
  document.body.dataset.orientationAngle = screen?.orientation?.angle ?? 0
}
screen?.orientation?.addEventListener('change', updateOrientation)
updateOrientation()

// ─── Boot Aether Engine ───────────────────────────────────────────────────────
// Engine boots async but React mounts immediately.
// Kernel syncs into store once ready (non-blocking).
AetherEngine.boot(useOSStore).catch(console.error)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
