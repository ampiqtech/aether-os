import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Html, Instance, Instances, Environment } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { useOSStore } from '../store'
import { useVoiceCommands } from '../hooks/useVoiceCommands'
import { useHandTracking, gestureEventBus, emitGestureEvent } from '../hooks/useHandTracking'
import { Browser } from './apps/Browser'
import { Settings } from './apps/Settings'
import { Camera } from './apps/Camera'
import { Files } from './apps/Files'
import { Music } from './apps/Music'
import { Phone } from './apps/Phone'
import { Social } from './apps/Social'
import { AppStore } from './apps/AppStore'
import { Assistant } from './apps/Assistant'
import { DevConsole } from './apps/DevConsole'
import { PaymentSystem } from './apps/PaymentSystem'
import { Window } from './Window'
import { VirtualKeyboard } from './VirtualKeyboard'
import { Background } from './Background'
import { Dock } from './Dock'
import { LMS } from './apps/LMS'
import { LibraryShowcase } from './apps/LibraryShowcase'

// ──────────────────────────────────────────────
// Hand Skeleton
// ──────────────────────────────────────────────

const CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20]
]

const SingleHandSkeleton = ({ landmarks, handIndex }) => {
    const jointMeshes = useRef([])
    const boneLines = useRef([])

    const jointGeo = useMemo(() => new THREE.SphereGeometry(0.015, 16, 16), [])
    const jointMat = useMemo(() => new THREE.MeshBasicMaterial({
        color: handIndex === 0 ? new THREE.Color('#00ffff') : new THREE.Color('#ff00ff'),
        transparent: true, opacity: 0.9, toneMapped: false
    }), [handIndex])
    const tipMat = useMemo(() => new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffffff'), transparent: true, opacity: 1.0, toneMapped: false
    }), [])
    const boneGeo = useMemo(() => new THREE.CylinderGeometry(0.005, 0.005, 1, 8), [])
    const boneMat = useMemo(() => new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.5, 0.8, 1), transparent: true, opacity: 0.6, toneMapped: false
    }), [])

    useFrame(() => {
        if (!landmarks || landmarks.length === 0) {
            jointMeshes.current.forEach(m => m && (m.visible = false))
            boneLines.current.forEach(b => b && (b.visible = false))
            return
        }
        landmarks.forEach((lm, i) => {
            if (jointMeshes.current[i]) {
                const mesh = jointMeshes.current[i]
                mesh.visible = true
                mesh.position.set((1 - lm.x - 0.5) * 4, (lm.y - 0.5) * -2.5, lm.z * -2)
            }
        })
        CONNECTIONS.forEach((conn, i) => {
            if (boneLines.current[i] && jointMeshes.current[conn[0]] && jointMeshes.current[conn[1]]) {
                const bone = boneLines.current[i]
                const start = jointMeshes.current[conn[0]].position
                const end = jointMeshes.current[conn[1]].position
                bone.position.copy(start).lerp(end, 0.5)
                bone.lookAt(end)
                bone.scale.set(1, 1, start.distanceTo(end))
                bone.rotateX(Math.PI / 2)
                bone.visible = true
            }
        })
    })

    return (
        <group>
            {Array.from({ length: 21 }).map((_, i) => (
                <mesh key={`joint-${i}`} ref={el => jointMeshes.current[i] = el}
                    geometry={jointGeo} material={[4, 8, 12, 16, 20].includes(i) ? tipMat : jointMat} />
            ))}
            {CONNECTIONS.map((_, i) => (
                <mesh key={`bone-${i}`} ref={el => boneLines.current[i] = el}
                    geometry={boneGeo} material={boneMat} />
            ))}
        </group>
    )
}

// ──────────────────────────────────────────────
// Live Clock Hook
// ──────────────────────────────────────────────
const useClock = () => {
    const [now, setNow] = useState(new Date())
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(id)
    }, [])
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')
    const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    return { hours, minutes, seconds, date }
}

// ──────────────────────────────────────────────
// Lock Screen Component
// ──────────────────────────────────────────────
const LockScreen = ({ unlock, toggleListening, isListening, toggleTracking, isTracking }) => {
    const { hours, minutes, seconds, date } = useClock()

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', position: 'relative',
            overflow: 'hidden', pointerEvents: 'auto',
        }}>
            {/* Ambient Blobs */}
            <div className="lock-blob lock-blob-1" />
            <div className="lock-blob lock-blob-2" />
            <div className="lock-blob lock-blob-3" />

            {/* Clock */}
            <div className="animate-in fade-in" style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
                <div style={{
                    fontSize: 96,
                    fontWeight: 200,
                    letterSpacing: '-0.02em',
                    fontFamily: 'Outfit, sans-serif',
                    lineHeight: 1,
                    color: 'rgba(255,255,255,0.95)',
                    textShadow: '0 0 40px rgba(61,134,242,0.3)',
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    <span>{hours}</span>
                    <span className="lock-colon-blink" style={{ opacity: 0.8, marginBottom: 8 }}>:</span>
                    <span>{minutes}</span>
                </div>
                <div style={{
                    fontSize: 14, fontWeight: 400,
                    color: 'rgba(255,255,255,0.45)',
                    letterSpacing: '0.15em',
                    fontFamily: 'Outfit, sans-serif',
                    marginTop: 8, textTransform: 'uppercase',
                }}>
                    {date}
                </div>
            </div>

            {/* Unlock Card */}
            <div
                className="animate-in slide-up-fade delay-200 glass-heavy"
                style={{
                    borderRadius: 28,
                    padding: '28px 36px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 20,
                    position: 'relative', zIndex: 1,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
            >
                <p style={{
                    fontSize: 12, fontWeight: 500,
                    color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    fontFamily: 'Outfit, sans-serif',
                }}>
                    Unlock Aether
                </p>

                <div style={{ display: 'flex', gap: 16 }}>
                    {/* Mic */}
                    <LockButton
                        icon={isListening ? 'mic' : 'mic_off'}
                        label="Voice"
                        active={isListening}
                        activeColor="rgba(239,68,68,0.8)"
                        glowColor="rgba(239,68,68,0.5)"
                        onClick={toggleListening}
                    />
                    {/* Fingerprint unlock */}
                    <LockButton
                        icon="fingerprint"
                        label="Unlock"
                        onClick={unlock}
                        highlight
                    />
                    {/* Camera */}
                    <LockButton
                        icon="videocam"
                        label="Gesture"
                        active={isTracking}
                        activeColor="rgba(34,197,94,0.8)"
                        glowColor="rgba(34,197,94,0.5)"
                        onClick={toggleTracking}
                    />
                </div>

                <p style={{
                    fontSize: 11, color: 'rgba(255,255,255,0.2)',
                    fontFamily: 'Outfit, sans-serif',
                }}>
                    Tap fingerprint or use gesture
                </p>
            </div>

            {/* AETHER wordmark */}
            <div className="animate-in fade-in delay-400" style={{
                position: 'absolute', bottom: 28,
                fontSize: 11, fontWeight: 700,
                color: 'rgba(255,255,255,0.12)',
                letterSpacing: '0.5em',
                fontFamily: 'Outfit, sans-serif',
                textTransform: 'uppercase',
            }}>
                AETHER OS · PRE-ALPHA
            </div>
        </div>
    )
}

const LockButton = ({ icon, label, active, activeColor, glowColor, onClick, highlight }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div
            onClick={onClick}
            style={{
                width: 64, height: 64,
                borderRadius: '50%',
                background: highlight
                    ? 'linear-gradient(135deg, rgba(61,134,242,0.6), rgba(168,85,247,0.6))'
                    : active ? activeColor : 'rgba(255,255,255,0.07)',
                border: '1px solid',
                borderColor: highlight ? 'rgba(61,134,242,0.5)' : active ? glowColor || 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                boxShadow: highlight
                    ? '0 0 24px rgba(61,134,242,0.4)'
                    : active ? `0 0 20px ${glowColor}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                backdropFilter: 'blur(16px)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: 26, color: 'rgba(255,255,255,0.9)' }}>
                {icon}
            </span>
        </div>
        <span style={{
            fontSize: 10, color: 'rgba(255,255,255,0.35)',
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
            {label}
        </span>
    </div>
)

// ──────────────────────────────────────────────
// Home Status Bar
// ──────────────────────────────────────────────
const HomeStatusBar = ({ setMode, isListening, isTracking, aiState }) => {
    const { hours, minutes } = useClock()

    const aiColors = {
        idle: 'rgba(255,255,255,0.4)',
        listening: '#ef4444',
        thinking: '#a855f7',
        speaking: '#22c55e',
    }

    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 4px', marginBottom: 8, pointerEvents: 'auto',
        }}>
            {/* Left: mode label */}
            <div style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: 11, fontWeight: 500,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontFamily: 'Outfit, sans-serif',
            }}>
                Desktop
            </div>

            {/* Center: time */}
            <div style={{
                fontSize: 14, fontWeight: 300,
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'Outfit, sans-serif',
                letterSpacing: '0.05em',
            }}>
                {hours}:{minutes}
            </div>

            {/* Right: indicators + lock */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '4px 12px',
            }}>
                {/* AI state dot */}
                <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: aiColors[aiState] || aiColors.idle,
                    boxShadow: `0 0 8px ${aiColors[aiState] || aiColors.idle}`,
                    transition: 'all 0.3s ease',
                }} title={`AI: ${aiState}`} />

                {/* Voice */}
                <span className="material-symbols-outlined" style={{
                    fontSize: 14,
                    color: isListening ? '#ef4444' : 'rgba(255,255,255,0.3)',
                }}>
                    {isListening ? 'mic' : 'mic_off'}
                </span>

                {/* Camera */}
                <span className="material-symbols-outlined" style={{
                    fontSize: 14,
                    color: isTracking ? '#22c55e' : 'rgba(255,255,255,0.3)',
                }}>
                    {isTracking ? 'videocam' : 'videocam_off'}
                </span>

                {/* Lock */}
                <button
                    onClick={() => setMode('locked')}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.4)', padding: '2px',
                        display: 'flex', alignItems: 'center',
                        transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>lock</span>
                </button>
            </div>
        </div>
    )
}

// ──────────────────────────────────────────────
// Main SpatialInterface
// ──────────────────────────────────────────────
export const SpatialInterface = () => {
    const panelRef = useRef()
    const { mode, unlock, setMode, isListening, toggleListening, aiState, aiMessage,
        processes, launchApp, activePid, installedApps } = useOSStore()

    useVoiceCommands()
    const { videoRef, isTracking, toggleTracking, cursorRef } = useHandTracking()
    const visualCursorRef = useRef()

    // Track element currently hovered by gesture cursor for glow highlight
    const hoveredElementRef = useRef(null)

    const apps = installedApps
    const APPS_PER_PAGE = 8
    const [page, setPage] = useState(0)
    const totalPages = Math.ceil(apps.length / APPS_PER_PAGE)
    const { updateWindowPosition } = useOSStore()
    const dragState = useRef({
        activePid: null,
        startPos: new THREE.Vector3(),
        startCursor: new THREE.Vector3()
    })

    // ── Cursor + Drag Frame Loop ──
    useFrame((state) => {
        if (cursorRef.current && visualCursorRef.current) {
            const { x, y, active, clicked, isDragging, gesture } = cursorRef.current

            const currentX = visualCursorRef.current.position.x
            const currentY = visualCursorRef.current.position.y
            const targetX = (x - 0.5) * 4
            const targetY = (y - 0.5) * -2.5

            visualCursorRef.current.position.x = THREE.MathUtils.lerp(currentX, active ? targetX : currentX, 0.5)
            visualCursorRef.current.position.y = THREE.MathUtils.lerp(currentY, active ? targetY : currentY, 0.5)
            visualCursorRef.current.visible = active

            // ── Compute screen position of cursor ──
            const vector = new THREE.Vector3()
            visualCursorRef.current.getWorldPosition(vector)
            vector.project(state.camera)
            const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth
            const screenY = (-vector.y * 0.5 + 0.5) * window.innerHeight

            // ── Hover Glow — highlight element under cursor ──
            if (active) {
                const hovered = document.elementFromPoint(screenX, screenY)
                const interactive = hovered?.closest('button, a, [role="button"], [data-gesture-target], input, select, [onClick]')
                if (interactive !== hoveredElementRef.current) {
                    hoveredElementRef.current?.classList.remove('gesture-hover')
                    if (interactive) interactive.classList.add('gesture-hover')
                    hoveredElementRef.current = interactive || null
                }
            } else {
                hoveredElementRef.current?.classList.remove('gesture-hover')
                hoveredElementRef.current = null
            }

            // ── Scroll Injection — swipe_up/down scrolls app content ──
            if (gesture === 'swipe_up' || gesture === 'swipe_down') {
                const scrollEl = document.elementFromPoint(screenX, screenY)
                if (scrollEl) {
                    // Walk up DOM to find a scrollable ancestor
                    let target = scrollEl
                    while (target && target !== document.body) {
                        const { overflow, overflowY } = getComputedStyle(target)
                        const canScroll = /(auto|scroll)/.test(overflow + overflowY)
                        const hasScroll = target.scrollHeight > target.clientHeight
                        if (canScroll && hasScroll) break
                        target = target.parentElement
                    }
                    const scrollAmount = gesture === 'swipe_up' ? -120 : 120
                    target?.scrollBy?.({ top: scrollAmount, behavior: 'smooth' })
                    // Also fire a wheel event for iframes / custom scroll handlers
                    try {
                        const wheelEvt = new WheelEvent('wheel', {
                            bubbles: true, cancelable: true,
                            deltaY: scrollAmount, deltaMode: 0,
                            clientX: screenX, clientY: screenY,
                            view: window
                        })
                        scrollEl.dispatchEvent(wheelEvt)
                    } catch (_) { }
                }
            }

            // ── Emit gesture to bus (apps can subscribe) ──
            if (gesture) {
                emitGestureEvent(gesture, { screenX, screenY, gesture })
            }

            if (active && isDragging) {
                if (dragState.current.activePid) {
                    const dx = targetX - dragState.current.startCursor.x
                    const dy = targetY - dragState.current.startCursor.y
                    updateWindowPosition(dragState.current.activePid, {
                        x: (dragState.current.startPos.x + dx) / 4,
                        y: (dragState.current.startPos.y + dy) / -2.5,
                        z: 0
                    })
                    visualCursorRef.current.material.color.set('#00ffff')
                } else {
                    const el = document.elementFromPoint(screenX, screenY)
                    const header = el?.closest('[data-window-header="true"]')
                    if (header) {
                        const pid = parseInt(header.getAttribute('data-pid'))
                        const proc = processes.find(p => p.pid === pid)
                        if (proc) {
                            dragState.current.activePid = pid
                            dragState.current.startPos.set(proc.position.x * 4, proc.position.y * -2.5, 0)
                            dragState.current.startCursor.set(targetX, targetY, 0)
                        }
                    }
                }
            } else {
                dragState.current.activePid = null
            }

            const wasClicked = visualCursorRef.current.userData.wasClicked || false
            if (active && clicked && !wasClicked && !dragState.current.activePid) {
                const el = document.elementFromPoint(screenX, screenY)
                if (el) {
                    const evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: screenX, clientY: screenY })
                    el.dispatchEvent(evt)
                    const ripple = document.getElementById('gesture-feedback')
                    if (ripple) {
                        ripple.style.left = `${screenX}px`
                        ripple.style.top = `${screenY}px`
                        ripple.style.opacity = '1'
                        ripple.style.transform = 'scale(1)'
                        setTimeout(() => { ripple.style.opacity = '0'; ripple.style.transform = 'scale(2)' }, 300)
                    }
                }
            }
            visualCursorRef.current.userData.wasClicked = clicked

            // Home screen pagination (only when no app is focused and gesture is horizontal)
            if (gesture === 'swipe_left' && page < totalPages - 1) setPage(p => p + 1)
            else if (gesture === 'swipe_right' && page > 0) setPage(p => p - 1)

            if (panelRef.current) {
                const targetScale = cursorRef.current.zoomFactor || 1
                panelRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
                panelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
                panelRef.current.rotation.x = THREE.MathUtils.lerp(panelRef.current.rotation.x, (state.mouse.y * Math.PI) / 40, 0.05)
                panelRef.current.rotation.y = THREE.MathUtils.lerp(panelRef.current.rotation.y, (state.mouse.x * Math.PI) / 40, 0.05)
            }

            if (active) {
                if (clicked) visualCursorRef.current.material.color.set('#ff3366')
                else if (isDragging) visualCursorRef.current.material.color.set('#ffcc00')
                else visualCursorRef.current.material.color.set('#00ffcc')
            }
        }
    })

    // ── AI Orb ──
    const orbRef = useRef()
    useFrame((state) => {
        if (orbRef.current) {
            const time = state.clock.elapsedTime
            orbRef.current.position.y = -1.5 + Math.sin(time) * 0.1
            if (aiState === 'listening') {
                orbRef.current.scale.setScalar(1 + Math.sin(time * 10) * 0.1)
                orbRef.current.material.color.setHSL(0.6, 1, 0.5)
            } else if (aiState === 'thinking') {
                orbRef.current.rotation.y += 0.1
                orbRef.current.rotation.z += 0.05
                orbRef.current.material.color.setHSL(0.8, 1, 0.5)
            } else if (aiState === 'speaking') {
                orbRef.current.scale.setScalar(1 + Math.sin(time * 20) * 0.2)
                orbRef.current.material.color.setHSL(0.3, 1, 0.5)
            } else {
                orbRef.current.scale.setScalar(1)
                orbRef.current.material.color.setHSL(0.6, 0.5, 0.1)
                orbRef.current.rotation.y += 0.01
            }
        }
    })

    return (
        <group ref={panelRef}>
            <Background mode={mode} />

            <pointLight position={[10, 10, 10]} intensity={1.2} />
            <ambientLight intensity={0.4} />

            {/* AI Orb */}
            <mesh ref={orbRef} position={[0, -3.5, 2]} onClick={toggleListening}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}>
                <sphereGeometry args={[0.2, 32, 32]} />
                <meshStandardMaterial emissive={new THREE.Color(0, 0.4, 1)} emissiveIntensity={aiState === 'idle' ? 0.5 : 2.5} roughness={0.05} metalness={0.9} />
            </mesh>

            {/* Mic status */}
            <Html position={[0, -4.0, 2]} center transform>
                <div onClick={toggleListening} style={{
                    cursor: 'pointer', padding: '6px', borderRadius: '50%',
                    background: isListening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isListening ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`,
                    color: isListening ? '#ef4444' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        {isListening ? 'mic' : 'mic_off'}
                    </span>
                </div>
            </Html>

            {/* AI Caption */}
            {aiMessage && (
                <Html position={[0, -2.5, 2]} center transform>
                    <div style={{
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 9999,
                        padding: '8px 24px',
                        color: 'white',
                        fontSize: 15,
                        fontWeight: 500,
                        fontFamily: 'Outfit, sans-serif',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        animation: 'slideUpFade 0.3s ease both',
                    }}>
                        {aiMessage}
                    </div>
                </Html>
            )}

            {/* Virtual Cursor */}
            <mesh ref={visualCursorRef} position={[0, 0, 0.5]}>
                <sphereGeometry args={[0.025, 16, 16]} />
                <meshBasicMaterial color="#00ffcc" transparent opacity={0.75} depthTest={false} />
            </mesh>

            {/* Gesture Feedback Ring */}
            <Html position={[0, 0, 0]} style={{ pointerEvents: 'none' }}>
                <div id="gesture-feedback" style={{
                    position: 'fixed', top: 0, left: 0,
                    width: 56, height: 56,
                    pointerEvents: 'none',
                    opacity: 0,
                    borderRadius: '50%',
                    background: 'rgba(0,255,200,0.15)',
                    border: '1px solid rgba(0,255,200,0.4)',
                    transform: 'translate(-50%,-50%) scale(1)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                }} />
            </Html>

            {/* Virtual Keyboard */}
            <VirtualKeyboard />


            {/* ── 2D Desktop Layer ── */}
            <Html
                transform occlude
                distanceFactor={1.5}
                position={[0, 0, 0]}
                style={{ width: '800px', height: '500px', padding: '16px', color: 'white', pointerEvents: 'none', zIndex: -1 }}
                className="select-none"
            >
                {mode === 'locked' ? (
                    <LockScreen
                        unlock={unlock}
                        toggleListening={toggleListening}
                        isListening={isListening}
                        toggleTracking={toggleTracking}
                        isTracking={isTracking}
                    />
                ) : (
                    <div style={{ height: '100%', width: '100%', pointerEvents: 'none', display: 'flex', flexDirection: 'column' }}>
                        {/* Status Bar */}
                        <HomeStatusBar
                            setMode={setMode}
                            isListening={isListening}
                            isTracking={isTracking}
                            aiState={aiState}
                        />

                        {/* Page indicator dots */}
                        {totalPages > 1 && (
                            <div style={{
                                display: 'flex', justifyContent: 'center', gap: 6,
                                marginTop: 8, pointerEvents: 'auto',
                            }}>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setPage(i)}
                                        style={{
                                            width: i === page ? 20 : 6,
                                            height: 6,
                                            borderRadius: 3,
                                            background: i === page ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)',
                                            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                                            cursor: 'pointer',
                                            boxShadow: i === page ? '0 0 8px rgba(255,255,255,0.4)' : 'none',
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Dock */}
                {mode === 'home' && (
                    <div style={{
                        position: 'fixed', bottom: 0, left: 0, width: '100%', height: 90,
                        pointerEvents: 'auto', display: 'flex', justifyContent: 'center', zIndex: 9990,
                    }}>
                        <Dock />
                    </div>
                )}

                {/* Hand tracking video */}
                <video ref={videoRef} style={{
                    position: 'fixed', bottom: 0, right: 0,
                    width: '128px', height: '96px',
                    opacity: 0, pointerEvents: 'none', zIndex: 50,
                }} />
            </Html>
        </group>
    )
}

export default SpatialInterface
