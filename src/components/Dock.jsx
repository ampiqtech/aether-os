
import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { useOSStore } from '../store'

const APP_ICON_MAP = {
    'browser': 'rocket_launch',
    'journey': 'rocket_launch',
    'files': 'folder',
    'settings': 'settings',
    'camera': 'photo_camera',
    'music': 'music_note',
    'phone': 'call',
    'social': 'groups',
    'appstore': 'storefront',
    'devconsole': 'terminal',
    'libraryshowcase': 'auto_stories',
    'wallet': 'account_balance_wallet',
    'lms': 'school',
    'assistant': 'smart_toy',
}

const APP_COLORS = {
    'journey': 'from-blue-500 to-indigo-600',
    'browser': 'from-blue-500 to-indigo-600',
    'files': 'from-yellow-500 to-amber-600',
    'settings': 'from-gray-500 to-slate-600',
    'camera': 'from-rose-500 to-pink-600',
    'music': 'from-purple-500 to-violet-600',
    'phone': 'from-green-500 to-emerald-600',
    'social': 'from-cyan-500 to-teal-600',
    'appstore': 'from-blue-400 to-sky-500',
    'devconsole': 'from-stone-500 to-zinc-600',
    'libraryshowcase': 'from-orange-500 to-amber-600',
    'wallet': 'from-emerald-500 to-green-600',
    'lms': 'from-indigo-500 to-blue-600',
    'assistant': 'from-violet-500 to-purple-600',
}

export const Dock = () => {
    const { installedApps, launchApp, processes } = useOSStore()
    const mouseX = useMotionValue(Infinity)

    return (
        <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className="dock-container"
            style={{
                position: 'fixed',
                bottom: 16,
                left: '50%',
                x: '-50%',
                height: 68,
                paddingLeft: 12,
                paddingRight: 12,
                paddingBottom: 10,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 6,
                zIndex: 9990,
            }}
        >
            {installedApps.map((app, i) => (
                <DockIcon
                    key={app}
                    app={app}
                    mouseX={mouseX}
                    launchApp={launchApp}
                    processes={processes}
                    index={i}
                />
            ))}
        </motion.div>
    )
}

const DockIcon = ({ app, mouseX, launchApp, processes, index }) => {
    const ref = useRef(null)
    const [showTooltip, setShowTooltip] = useState(false)

    const distance = useTransform(mouseX, (val) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
        return val - bounds.x - bounds.width / 2
    })

    const sizeSync = useTransform(distance, [-120, 0, 120], [42, 68, 42])
    const size = useSpring(sizeSync, { mass: 0.08, stiffness: 200, damping: 14 })

    const ySync = useTransform(distance, [-120, 0, 120], [0, -10, 0])
    const y = useSpring(ySync, { mass: 0.08, stiffness: 200, damping: 14 })

    const isOpen = processes.some(p =>
        p.name?.toLowerCase() === app.toLowerCase() ||
        (app === 'Journey' && p.name === 'Browser')
    )
    const lowerApp = app.toLowerCase()
    const icon = APP_ICON_MAP[lowerApp] || 'apps'
    const gradientClass = APP_COLORS[lowerApp] || 'from-slate-500 to-slate-600'

    return (
        <div
            className="dock-icon-wrapper"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Tooltip */}
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            bottom: '100%',
                            marginBottom: 8,
                            background: 'rgba(12,12,28,0.92)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 8,
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.9)',
                            whiteSpace: 'nowrap',
                            fontFamily: 'Outfit, sans-serif',
                            pointerEvents: 'none',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                            zIndex: 9999,
                        }}
                    >
                        {app}
                        {/* Tooltip arrow */}
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0, height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: '5px solid rgba(12,12,28,0.92)',
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Icon */}
            <motion.div
                ref={ref}
                style={{ width: size, y }}
                onClick={() => launchApp(app)}
                whileTap={{ scale: 0.88 }}
                className="dock-icon"
                title={app}
            >
                {/* Gradient background */}
                <div
                    className={`bg-gradient-to-br ${gradientClass}`}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        opacity: 0.7,
                    }}
                />
                {/* Icon */}
                <span
                    className="material-symbols-outlined"
                    style={{
                        fontSize: '1.35rem',
                        color: 'rgba(255,255,255,0.95)',
                        position: 'relative',
                        zIndex: 1,
                        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
                    }}
                >
                    {icon}
                </span>

                {/* Open app glow ring */}
                {isOpen && (
                    <motion.div
                        style={{
                            position: 'absolute',
                            inset: -2,
                            borderRadius: 16,
                            border: '1px solid rgba(255,255,255,0.35)',
                            boxShadow: '0 0 10px rgba(255,255,255,0.15)',
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                )}
            </motion.div>

            {/* Active dot */}
            <div style={{
                width: 4, height: 4,
                borderRadius: '50%',
                background: isOpen ? 'rgba(255,255,255,0.85)' : 'transparent',
                boxShadow: isOpen ? '0 0 6px rgba(255,255,255,0.6)' : 'none',
                transition: 'all 0.2s ease',
                flexShrink: 0,
            }} />
        </div>
    )
}

export default Dock
