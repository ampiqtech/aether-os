import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOSStore } from '../store'
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
import { LMS } from './apps/LMS'
import { LibraryShowcase } from './apps/LibraryShowcase'

/** Maps process name → app component */
const renderApp = (proc, onClose) => {
    const p = { onClose, ...proc.props }
    switch (proc.name) {
        case 'Browser':
        case 'Journey': return <Browser {...p} />
        case 'Settings': return <Settings {...p} />
        case 'Camera': return <Camera {...p} />
        case 'Files': return <Files {...p} />
        case 'Music': return <Music {...p} />
        case 'Phone': return <Phone {...p} />
        case 'Social': return <Social {...p} />
        case 'AppStore': return <AppStore {...p} />
        case 'Assistant': return <Assistant {...p} />
        case 'DevConsole': return <DevConsole {...p} />
        case 'Wallet': return <PaymentSystem {...p} />
        case 'LMS': return <LMS {...p} />
        case 'LibraryShowcase': return <LibraryShowcase {...p} />
        default: return null
    }
}

/** Single draggable window */
const AppWindow = ({ proc }) => {
    const { closeApp, focusApp, minimizeApp, activePid, pushNotification } = useOSStore()
    const isActive = activePid === proc.pid
    const w = proc.size?.width || 820
    const h = proc.size?.height || 620

    const [pos, setPos] = useState(() => ({
        x: Math.max(0, (window.innerWidth - w) / 2),
        y: Math.max(0, (window.innerHeight - h) / 2),
    }))

    const dragRef = useRef({ active: false, startX: 0, startY: 0, ox: 0, oy: 0 })

    const onMove = useCallback((e) => {
        if (!dragRef.current.active) return
        setPos({
            x: Math.max(0, Math.min(window.innerWidth - w, dragRef.current.ox + e.clientX - dragRef.current.startX)),
            y: Math.max(0, Math.min(window.innerHeight - 42, dragRef.current.oy + e.clientY - dragRef.current.startY)),
        })
    }, [w])

    const onUp = useCallback(() => {
        dragRef.current.active = false
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
    }, [onMove])

    const onGripDown = useCallback((e) => {
        e.preventDefault()
        focusApp(proc.pid)
        dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, ox: pos.x, oy: pos.y }
        window.addEventListener('pointermove', onMove, { passive: false })
        window.addEventListener('pointerup', onUp)
    }, [pos, proc.pid, onMove, onUp])

    useEffect(() => () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
    }, [])

    const handleClose = (e) => {
        e.stopPropagation()
        pushNotification?.(`${proc.title} closed`, 'info', 'Window Manager')
        closeApp(proc.pid)
    }
    const handleMinimize = (e) => { e.stopPropagation(); minimizeApp(proc.pid) }

    if (proc.minimized) return null

    return (
        <motion.div
            key={proc.pid}
            initial={{ opacity: 0, scale: 0.5, filter: 'blur(16px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.5, filter: 'blur(16px)' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            onClick={() => focusApp(proc.pid)}
            style={{
                position: 'fixed',
                left: pos.x, top: pos.y,
                width: w, height: h,
                zIndex: isActive ? 9000 + proc.pid : 8000 + proc.pid,
                display: 'flex', flexDirection: 'column',
                background: 'rgba(8,8,24,0.88)',
                backdropFilter: 'blur(32px) saturate(180%)',
                WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                borderRadius: 16,
                border: isActive ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.07)',
                boxShadow: isActive
                    ? '0 32px 96px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.07)'
                    : '0 16px 48px rgba(0,0,0,0.55)',
                overflow: 'hidden',
                fontFamily: 'Outfit, system-ui, sans-serif',
            }}
        >
            {/* Title Bar */}
            <div style={{
                height: 42, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '0 14px',
                userSelect: 'none', flexShrink: 0, cursor: 'default',
                background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
            }}>
                <TrafficLights onClose={handleClose} onMinimize={handleMinimize} />

                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                    pointerEvents: 'none',
                }}>
                    {proc.icon && (
                        <span className="material-symbols-outlined" style={{ fontSize: 14, opacity: 0.5 }}>
                            {proc.icon}
                        </span>
                    )}
                    <span style={{
                        fontSize: 13, fontWeight: 500, letterSpacing: '0.02em',
                        color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
                    }}>{proc.title}</span>
                </div>

                {/* Drag Grip */}
                <div
                    onPointerDown={onGripDown}
                    title="Drag window"
                    style={{
                        width: 28, height: 28, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'grab', borderRadius: 6,
                        color: 'rgba(255,255,255,0.2)', fontSize: 16, flexShrink: 0,
                        transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.2)' }}
                >⠿</div>
            </div>

            <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)', flexShrink: 0 }} />

            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {renderApp(proc, () => closeApp(proc.pid))}
            </div>
        </motion.div>
    )
}

const TrafficLights = ({ onClose, onMinimize }) => {
    const [hovered, setHovered] = useState(false)
    return (
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <button className="traffic-light tl-close" onClick={onClose} title="Close" style={{ position: 'relative' }}>
                {hovered && <span style={{ position: 'absolute', fontSize: 9, lineHeight: 1, fontWeight: 700 }}>✕</span>}
            </button>
            <button className="traffic-light tl-minimize" onClick={onMinimize} title="Minimize" style={{ position: 'relative' }}>
                {hovered && <span style={{ position: 'absolute', fontSize: 11, lineHeight: 1, fontWeight: 700 }}>−</span>}
            </button>
            <button className="traffic-light tl-maximize" title="Maximize" style={{ position: 'relative' }}>
                {hovered && <span style={{ position: 'absolute', fontSize: 9, lineHeight: 1, fontWeight: 700 }}>+</span>}
            </button>
        </div>
    )
}

/** Renders all open windows outside the Three.js canvas */
export const WindowManager = () => {
    const processes = useOSStore(s => s.processes)
    return (
        <AnimatePresence>
            {processes.map(proc => (
                <AppWindow key={proc.pid} proc={proc} />
            ))}
        </AnimatePresence>
    )
}
