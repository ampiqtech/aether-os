import { Canvas } from '@react-three/fiber'
import { Experience } from './components/Experience'
import './App.css'

function App() {
  return (
    <div className="w-full h-screen bg-[#111]">
      <Canvas
        shadows
        camera={{
          position: [0, 0, 5],
          fov: 45,
          near: 0.1,
          far: 200
        }}
      >
        <Experience />
      </Canvas>

      {/* 2D Overlay for debugging or non-spatial commands */}
      <div className="absolute bottom-4 left-4 text-white/50 text-xs font-mono">
        Aether OS v0.1.0 • Pre-Alpha
      </div>
    </div>
  )
}

export default App
