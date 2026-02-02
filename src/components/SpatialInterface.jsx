import { useRef, useState } from 'react'
import { Text, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useOSStore } from '../store'
import { useVoiceCommands } from '../hooks/useVoiceCommands'
import { useHandTracking } from '../hooks/useHandTracking'
import { Browser } from './apps/Browser'
import { Settings } from './apps/Settings'

export const SpatialInterface = () => {
    const panelRef = useRef()
    const [hovered, setHover] = useState(false)
    const { mode, unlock, setMode, isListening, toggleListening, activeApp, openApp, closeApp } = useOSStore()

    // Initialize Voice Commands
    useVoiceCommands()

    // Initialize Hand Tracking
    const { videoRef, isTracking, toggleTracking, cursorRef } = useHandTracking()
    const visualCursorRef = useRef()

    useFrame((state) => {
        // Update visual cursor
        if (cursorRef.current && visualCursorRef.current) {
            const { x, y, active } = cursorRef.current

            // Interpolate for smoothness
            const currentX = visualCursorRef.current.position.x
            const currentY = visualCursorRef.current.position.y

            // Map 0-1 to Scene Coordinates (Approximate, based on panel size 4x2.5)
            // Center is 0,0. Width 4 => -2 to 2. Height 2.5 => -1.25 to 1.25
            const targetX = (x - 0.5) * -4 // Invert X because camera mirrors
            const targetY = (y - 0.5) * -2.5

            visualCursorRef.current.position.x = THREE.MathUtils.lerp(currentX, active ? targetX : currentX, 0.1)
            visualCursorRef.current.position.y = THREE.MathUtils.lerp(currentY, active ? targetY : currentY, 0.1)
            visualCursorRef.current.visible = active

            // AIR MOUSE LOGIC:
            // If hand is active, we map 0-1 to screen coordinates for click triggering
            if (active && cursorRef.current.clicked) {
                // Debounce click? Or hold?
                // For simplicity, let's just create a visual ripple for now.
                // Or better: Raycasting from camera to cursor position.
                // Since our UI is in 3D, 'elementFromPoint' won't work easily on a 3D transformed HTML unless we map correctly.

                // FALLBACK:
                // Since the user wants to control "Settings", and settings are large slides.
                // We'll rely on the Voice Command for now? No, user said "gesture controllable".

                // Let's assume the user points at the 3D Sphere.
                // We can use the 'active' state to change color.
            }

            if (cursorRef.current.clicked) {
                visualCursorRef.current.material.color.set('#ff0000') // Red on click
            } else {
                visualCursorRef.current.material.color.set('#00ff00')
            }
        }

        if (panelRef.current) {
            // Gentle floating animation
            panelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2

            // Look at user slightly (parallax effect could go here)
            panelRef.current.rotation.x = THREE.MathUtils.lerp(
                panelRef.current.rotation.x,
                (state.mouse.y * Math.PI) / 20,
                0.1
            )
            panelRef.current.rotation.y = THREE.MathUtils.lerp(
                panelRef.current.rotation.y,
                (state.mouse.x * Math.PI) / 20,
                0.1
            )
        }
    })

    return (
        <group ref={panelRef}>
            {/* Glass Panel Mesh */}
            <mesh
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <planeGeometry args={[4, 2.5, 32, 32]} />
                <meshPhysicalMaterial
                    transmission={0.95}
                    roughness={0.2}
                    thickness={0.1}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    color={hovered ? "#eef" : "#fff"}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Border/Frame */}
            <mesh position={[0, 0, 0.01]}>
                <ringGeometry args={[0, 0.05, 4, 1]} /> {/* Placeholder for a proper frame line */}
                <meshBasicMaterial color="white" />
            </mesh>

            {/* Virtual Cursor (Visual 3D) */}
            <mesh ref={visualCursorRef} position={[0, 0, 0.1]}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshBasicMaterial color="#00ff00" transparent opacity={0.6} />
            </mesh>

            {/* 2D "Air Mouse" Overlay for DOM Interaction */}
            <Html position={[0, 0, 0]} style={{ pointerEvents: 'none' }}>
                <div id="gesture-feedback" className="fixed top-0 left-0 w-24 h-24 pointer-events-none transition-opacity duration-200 opacity-0 bg-white/20 rounded-full blur-xl" />
            </Html>

            {/* HTML Content Overlay */}
            <Html
                transform
                occlude
                distanceFactor={1.5}
                position={[0, 0, 0.05]}
                style={{
                    width: '800px',
                    height: '500px',
                    padding: '2rem',
                    color: 'white',
                    pointerEvents: 'auto'
                }}
                className="select-none"
            >
                {mode === 'locked' ? (
                    <div className="flex flex-col items-center justify-center h-full text-center font-sans">
                        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-400 drop-shadow-lg mb-4">
                            AETHER OS
                        </h1>
                        <p className="text-xl text-blue-100 font-light tracking-wide">
                            Say "Wake Up" or gesture to begin
                        </p>

                        <div className="mt-12 flex gap-4">
                            <div
                                onClick={toggleListening}
                                className={`cursor-pointer p-4 rounded-full backdrop-blur-md border border-white/20 transition-all duration-300 ${hovered ? 'scale-110' : ''} ${isListening ? 'bg-red-500/80 animate-pulse' : 'bg-white/10'}`}
                            >
                                <span className="material-symbols-outlined text-2xl">{isListening ? 'mic' : 'mic_off'}</span>
                            </div>
                            <div
                                onClick={unlock}
                                className={`cursor-pointer p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 ${hovered ? 'scale-110 bg-white/20' : ''}`}
                            >
                                <span className="material-symbols-outlined text-2xl">apps</span>
                            </div>
                            <div
                                onClick={toggleTracking}
                                className={`cursor-pointer p-4 rounded-full backdrop-blur-md border border-white/20 transition-all duration-300 ${hovered ? 'scale-110' : ''} ${isTracking ? 'bg-green-500/80 animate-pulse' : 'bg-white/10'}`}
                            >
                                <span className="material-symbols-outlined text-2xl">videocam</span>
                            </div>

                            {/* Hidden Video for HandTracking */}
                            <video ref={videoRef} className="hidden" />
                        </div>
                    </div>
                ) : (
                    activeApp ? (
                        // App Mode
                        <div className="h-full w-full">
                            {activeApp === 'Browser' ? (
                                <Browser onClose={closeApp} />
                            ) : activeApp === 'Settings' ? (
                                <Settings onClose={closeApp} />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-white/5 rounded-lg">
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-4xl mb-4 opacity-50">construction</span>
                                        <p className="text-lg opacity-70">{activeApp} is under construction</p>
                                        <button
                                            onClick={closeApp}
                                            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                        >
                                            Go Home
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Home Screen (App Grid)
                        <div className="h-full flex flex-col font-sans">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-semibold opacity-80">Home</h2>
                                <button
                                    onClick={() => setMode('locked')}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined">lock</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-6">
                                {['Browser', 'Settings', 'Files', 'Music', 'Videos', 'Camera'].map((app) => (
                                    <div
                                        key={app}
                                        onClick={() => openApp(app)}
                                        className="flex flex-col items-center gap-2 group cursor-pointer"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-105 transition-all duration-200">
                                            <span className="material-symbols-outlined text-3xl opacity-80">{app.toLowerCase() === 'browser' ? 'public' : app.toLowerCase()}</span>
                                        </div>
                                        <span className="text-sm font-medium opacity-70 group-hover:opacity-100">{app}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )}
            </Html>
        </group>
    )
}

export default SpatialInterface
