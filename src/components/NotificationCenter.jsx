import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOSStore } from '../store'

const ICONS = {
    info: { icon: 'info', color: 'var(--accent-cyan)', bg: 'rgba(0,229,255,0.10)', border: 'rgba(0,229,255,0.20)' },
    success: { icon: 'check_circle', color: 'var(--accent-green)', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.20)' },
    warning: { icon: 'warning', color: 'var(--accent-yellow)', bg: 'rgba(234,179,8,0.10)', border: 'rgba(234,179,8,0.20)' },
    error: { icon: 'error', color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.20)' },
}

const DURATION = 4000

const Toast = ({ notif, onDismiss }) => {
    const meta = ICONS[notif.type] || ICONS.info

    useEffect(() => {
        const t = setTimeout(() => onDismiss(notif.id), DURATION)
        return () => clearTimeout(t)
    }, [notif.id, onDismiss])

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.92, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            style={{
                background: meta.bg,
                border: `1px solid ${meta.border}`,
                borderRadius: 14,
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                padding: '12px 14px',
                width: 300,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                userSelect: 'none',
            }}
            onClick={() => onDismiss(notif.id)}
        >
            {/* Progress bar */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                background: 'rgba(255,255,255,0.07)'
            }}>
                <div style={{
                    height: '100%',
                    background: meta.color,
                    animation: `progress-shrink ${DURATION}ms linear forwards`,
                    borderRadius: 2,
                    opacity: 0.7,
                }} />
            </div>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                    className="material-symbols-outlined filled"
                    style={{ fontSize: 18, color: meta.color, flexShrink: 0 }}
                >
                    {meta.icon}
                </span>
                <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.95)',
                    fontFamily: 'Outfit, sans-serif',
                    flex: 1,
                }}>
                    {notif.title || notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                </span>
                <button
                    onClick={e => { e.stopPropagation(); onDismiss(notif.id) }}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex',
                        fontSize: 16,
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
            </div>

            {/* Message */}
            <p style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.65)',
                fontFamily: 'Outfit, Inter, sans-serif',
                margin: 0,
                paddingLeft: 26,
                lineHeight: 1.4,
            }}>
                {notif.message}
            </p>
        </motion.div>
    )
}

export const NotificationCenter = () => {
    const { notifications, dismissNotification } = useOSStore()

    return (
        <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            pointerEvents: 'auto',
        }}>
            <AnimatePresence mode="popLayout">
                {notifications.map(n => (
                    <Toast key={n.id} notif={n} onDismiss={dismissNotification} />
                ))}
            </AnimatePresence>
        </div>
    )
}

export default NotificationCenter
