import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useOSStore } from '../store'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Window — renders directly into document.body via a React Portal.
 * This bypasses Three.js transforms so position:fixed works correctly,
 * giving true viewport-relative centering and free drag anywhere on screen.
 */
export const Window = ({ pid, children, title, icon, size }) => {
    const { closeApp, focusApp, minimizeApp, processes, activePid, pushNotification } = useOSStore()
    const proc = processes.find(p => p.pid === pid)
    const isMinimized = proc?.minimized || false
    const isActive = activePid === pid

    const w = size?.width || 800
    const h = size?.height || 600

    // Perfectly centered on screen
    const [pos, setPos] = useState(() => ({
        x: Math.max(0, (window.innerWidth - w) / 2),
        y: Math.max(0, (window.innerHeight - h) / 2),
    }))

    const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 })

    const onPointerMove = useCallback((e) => {
        if (!dragRef.current.active) return
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        setPos({
            x: Math.max(0, Math.min(window.innerWidth - w, dragRef.current.originX + dx)),
            y: Math.max(0, Math.min(window.innerHeight - 42, dragRef.current.originY + dy)),
        })
    }, [w])

    const onPointerUp = useCallback(() => {
        dragRef.current.active = false
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
    }, [onPointerMove])

    const onGripDown = useCallback((e) => {
        e.preventDefault()
        focusApp(pid)
        dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y }
        window.addEventListener('pointermove', onPointerMove, { passive: false })
        window.addEventListener('pointerup', onPointerUp)
    }, [pos, pid, onPointerMove, onPointerUp])

    useEffect(() => () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
    }, [])

    const handleClose = (e) => {
        e.stopPropagation()
        pushNotification?.(`${title} closed`, 'info', 'Window Manager')
        closeApp(pid)
    }

    const handleMinimize = (e) => {
        e.stopPropagation()
        minimizeApp(pid)
    }

    const zIndex = isActive ? 9000 + pid : 8000 + pid

    return createPortal(
        <AnimatePresence>
            {!isMinimized && (
                <motion.div
                    key={pid}
                    initial={{ opacity: 0, scale: 0.5, filter: 'blur(16px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.5, filter: 'blur(16px)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    onClick={() => focusApp(pid)}
                    style={{
                        position: 'fixed',
                        left: pos.x,
                        top: pos.y,
                        width: w,
                        height: h,
                        zIndex,
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'rgba(8,8,24,0.88)',
                        backdropFilter: 'blur(32px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                        borderRadius: 16,
                        border: isActive
                            ? '1px solid rgba(255,255,255,0.18)'
                            : '1px solid rgba(255,255,255,0.07)',
                        boxShadow: isActive
                            ? '0 32px 96px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.07)'
                            : '0 16px 48px rgba(0,0,0,0.55)',
                        overflow: 'hidden',
                        transition: 'border 0.2s ease, box-shadow 0.2s ease',
                        willChange: 'transform',
                        fontFamily: 'Outfit, system-ui, sans-serif',
                    }}
                >
                    {/* ── Title Bar ── */}
                    <div style={{
                        height: 42,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 14px',
                        cursor: 'default',
                        userSelect: 'none',
                        flexShrink: 0,
                        background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                        transition: 'background 0.2s ease',
                    }}>
                        {/* Traffic Lights */}
                        <TrafficLights onClose={handleClose} onMinimize={handleMinimize} />

                        {/* Centered Title */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                            pointerEvents: 'none',
                        }}>
                            {icon && (
                                <span className="material-symbols-outlined"
                                    style={{ fontSize: 14, opacity: 0.5 }}>{icon}</span>
                            )}
                            <span style={{
                                fontSize: 13, fontWeight: 500,
                                color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
                                letterSpacing: '0.02em',
                                transition: 'color 0.2s ease',
                            }}>{title}</span>
                        </div>

                        {/* Drag Grip */}
                        <div
                            onPointerDown={onGripDown}
                            title="Drag window"
                            style={{
                                width: 28, height: 28,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'grab',
                                borderRadius: 6,
                                color: 'rgba(255,255,255,0.25)',
                                fontSize: 16,
                                transition: 'background 0.15s, color 0.15s',
                                flexShrink: 0,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                                e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = 'rgba(255,255,255,0.25)'
                            }}
                        >⠿</div>
                    </div>

                    {/* Divider */}
                    <div style={{
                        height: 1,
                        background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)',
                        flexShrink: 0,
                    }} />

                    {/* Content */}
                    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

/* ── Traffic Lights ── */
const TrafficLights = ({ onClose, onMinimize }) => {
    const [hovered, setHovered] = useState(false)
    return (
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}>
            <button className="traffic-light tl-close" onClick={onClose} title="Close"
                style={{ position: 'relative' }}>
                {hovered && <span style={{ position: 'absolute', fontSize: 9, lineHeight: 1, fontWeight: 700 }}>✕</span>}
            </button>
            <button className="traffic-light tl-minimize" onClick={onMinimize} title="Minimize"
                style={{ position: 'relative' }}>
                {hovered && <span style={{ position: 'absolute', fontSize: 11, lineHeight: 1, fontWeight: 700 }}>−</span>}
            </button>
            <button className="traffic-light tl-maximize" title="Maximize"
                style={{ position: 'relative' }}>
                {hovered && <span style={{ position: 'absolute', fontSize: 9, lineHeight: 1, fontWeight: 700 }}>+</span>}
            </button>
        </div>
    )
}

export default Window
