import { Canvas } from '@react-three/fiber'
import { Experience } from './components/Experience'
import { NotificationCenter } from './components/NotificationCenter'
import { ContextMenu } from './components/ContextMenu'
import { WindowManager } from './components/WindowManager'
import './App.css'

function App() {
  return (
    <div className="w-full h-screen" style={{ background: 'var(--color-bg-deep)', position: 'relative' }}>
      {/* 3D Spatial Canvas */}
      <Canvas
        shadows
        camera={{
          position: [0, 0, 5],
          fov: 45,
          near: 0.1,
          far: 200
        }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Experience />
      </Canvas>

      {/* 2D Overlay Layer — always on top */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9000 }}>
        {/* App Windows — rendered outside Canvas so position:fixed works correctly */}
        <WindowManager />

        {/* Notification Center (top-right toasts) */}
        <NotificationCenter />

        {/* Right-click Context Menu */}
        <ContextMenu />
      </div>

      {/* Build info */}
      <div style={{
        position: 'absolute', bottom: 6, left: 12,
        color: 'rgba(255,255,255,0.12)',
        fontSize: 10,
        fontFamily: 'Outfit, monospace',
        letterSpacing: '0.08em',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 1,
      }}>
        Aether OS v0.2.0 · Pre-Alpha
      </div>
    </div>
  )
}

export default App
