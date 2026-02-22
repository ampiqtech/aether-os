import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOSStore } from '../store'

const MENU_ITEMS = (store) => [
    { label: 'Home', icon: 'home', action: () => store.setMode('home') },
    { label: 'Settings', icon: 'settings', action: () => store.launchApp('Settings') },
    { label: 'Assistant', icon: 'smart_toy', action: () => store.launchApp('Assistant') },
    null, // separator
    { label: 'Lock Screen', icon: 'lock', action: () => store.lock() },
    { label: 'Close All', icon: 'close_all', action: () => { store.processes.forEach(p => store.closeApp(p.pid)) }, danger: true },
]

export const ContextMenu = () => {
    const [menu, setMenu] = useState(null) // { x, y }
    const menuRef = useRef(null)
    const store = useOSStore()

    useEffect(() => {
        const onContext = (e) => {
            // Don't intercept clicks inside windows (pointerEvents content)
            const inWindow = e.target.closest('.window-content-area')
            if (inWindow) return

            e.preventDefault()
            // Clamp to viewport
            const x = Math.min(e.clientX, window.innerWidth - 200)
            const y = Math.min(e.clientY, window.innerHeight - 260)
            setMenu({ x, y })
        }

        const onClose = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenu(null)
            }
        }

        window.addEventListener('contextmenu', onContext)
        window.addEventListener('mousedown', onClose)
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(null) })

        return () => {
            window.removeEventListener('contextmenu', onContext)
            window.removeEventListener('mousedown', onClose)
        }
    }, [])

    const items = MENU_ITEMS(store)

    return (
        <AnimatePresence>
            {menu && (
                <motion.div
                    ref={menuRef}
                    className="context-menu"
                    style={{ left: menu.x, top: menu.y }}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.12 } }}
                    transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '6px 12px 4px',
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        color: 'rgba(255,255,255,0.3)',
                        fontFamily: 'Outfit, sans-serif',
                        textTransform: 'uppercase',
                    }}>
                        Aether OS
                    </div>
                    <div className="context-menu-separator" />

                    {items.map((item, i) =>
                        item === null ? (
                            <div key={`sep-${i}`} className="context-menu-separator" />
                        ) : (
                            <div
                                key={item.label}
                                className={`context-menu-item ${item.danger ? 'danger' : ''}`}
                                onClick={() => { item.action(); setMenu(null) }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </div>
                        )
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default ContextMenu
