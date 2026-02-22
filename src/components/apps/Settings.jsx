import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOSStore } from '../../store'
import { GestureApp } from '../UIKit'

export const Settings = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('connectivity')

    // Global State
    const { isTracking, toggleTracking, wallpaper, setWallpaper } = useOSStore()

    // Local Simulation State
    const [wifi, setWifi] = useState(true)
    const [bluetooth, setBluetooth] = useState(true)
    const [brightness, setBrightness] = useState(80)

    const tabs = [
        { id: 'connectivity', icon: 'wifi', label: 'Connectivity' },
        { id: 'display', icon: 'brightness_6', label: 'Display' },
        { id: 'spatial', icon: 'view_in_ar', label: 'Spatial' },
        { id: 'system', icon: 'info', label: 'System' },
    ]

    const switchTabBy = (delta) => {
        const idx = tabs.findIndex(t => t.id === activeTab)
        const next = tabs[(idx + delta + tabs.length) % tabs.length]
        setActiveTab(next.id)
    }

    return (
        <GestureApp gestures={{ onSwipeLeft: () => switchTabBy(1), onSwipeRight: () => switchTabBy(-1) }}>
            <div className="flex h-full w-full bg-[rgba(5,5,16,0.6)] backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/10 text-white animate-in fade-in zoom-in duration-300 shadow-[0_0_50px_rgba(112,0,255,0.1)] font-sans" style={{ fontFamily: 'var(--font-body)' }}>
                {/* Sidebar */}
                <div className="w-1/4 bg-white/5 border-r border-white/5 flex flex-col backdrop-blur-3xl">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-bold tracking-wider text-[var(--color-primary)] uppercase flex items-center gap-2">
                            <span className="material-symbols-outlined">settings</span>
                            Settings
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {tabs.map(tab => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                                    : 'hover:bg-white/5 opacity-60 hover:opacity-100 hover:translate-x-1'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                                <span className="font-medium">{tab.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-white/5">
                        <button
                            onClick={onClose}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 text-[var(--color-accent)] rounded-xl border border-[var(--color-accent)]/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,60,0.2)]"
                        >
                            <span className="material-symbols-outlined">power_settings_new</span>
                            <span>Close System</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 bg-gradient-to-br from-white/5 to-transparent overflow-y-auto relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-secondary)]/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

                    <div className="max-w-2xl mx-auto relative z-10">
                        <h3 className="text-4xl font-light mb-8 border-b border-white/5 pb-4 tracking-tight drop-shadow-md">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h3>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {/* CONNECTIVITY */}
                                {activeTab === 'connectivity' && (
                                    <>
                                        <ToggleItem
                                            label="Wi-Fi"
                                            sublabel="Connected to Aether_5G"
                                            icon="wifi"
                                            active={wifi}
                                            onToggle={() => setWifi(!wifi)}
                                            color="var(--color-primary)"
                                        />
                                        <ToggleItem
                                            label="Bluetooth"
                                            sublabel="Discoverable as Aether Device"
                                            icon="bluetooth"
                                            active={bluetooth}
                                            onToggle={() => setBluetooth(!bluetooth)}
                                            color="var(--color-secondary)"
                                        />
                                    </>
                                )}

                                {/* DISPLAY */}
                                {activeTab === 'display' && (
                                    <>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                                            <h4 className="text-lg font-medium mb-4">Wallpaper & Environment</h4>
                                            <div className="grid grid-cols-3 gap-4">
                                                {['city', 'sunset', 'nebula'].map(w => (
                                                    <div
                                                        key={w}
                                                        onClick={() => setWallpaper(w)}
                                                        className={`aspect-video rounded-lg cursor-pointer border-2 transition-all overflow-hidden relative group ${wallpaper === w ? 'border-[var(--color-primary)] shadow-[0_0_15px_var(--color-primary)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                                    >
                                                        <div className={`absolute inset-0 bg-gradient-to-br ${w === 'city' ? 'from-blue-900 to-black' : w === 'sunset' ? 'from-orange-900 to-purple-900' : 'from-indigo-900 to-black'}`}></div>
                                                        <div className="absolute inset-0 flex items-center justify-center font-bold uppercase tracking-widest text-xs shadow-black drop-shadow-md z-10">
                                                            {w}
                                                        </div>
                                                        {wallpaper === w && (
                                                            <div className="absolute top-1 right-1 bg-[var(--color-primary)] text-black rounded-full w-4 h-4 flex items-center justify-center">
                                                                <span className="material-symbols-outlined text--[10px] font-bold">check</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-4 mb-4">
                                                <span className="material-symbols-outlined text-2xl opacity-70">brightness_5</span>
                                                <span className="text-lg font-medium">Hologram Brightness</span>
                                                <span className="ml-auto text-sm font-mono text-[var(--color-primary)]">{brightness}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={brightness}
                                                onChange={(e) => setBrightness(e.target.value)}
                                                className="w-full appearance-none bg-white/10 h-1.5 rounded-full outline-none"
                                                style={{ accentColor: 'var(--color-primary)' }}
                                            />
                                        </div>
                                        <ToggleItem
                                            label="Glass Mode"
                                            sublabel="Enable high-fidelity transparency effects"
                                            icon="blur_on"
                                            active={true}
                                            onToggle={() => { }}
                                            color="var(--color-primary)"
                                        />
                                    </>
                                )}

                                {/* SPATIAL */}
                                {activeTab === 'spatial' && (
                                    <>
                                        <ToggleItem
                                            label="Hand Tracking"
                                            sublabel="Enable gesture controls via camera"
                                            icon="videocam"
                                            active={isTracking}
                                            onToggle={toggleTracking}
                                            highlight
                                            color="var(--color-accent)"
                                        />
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:bg-white/10 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-full bg-white/5 text-[var(--color-primary)]">
                                                    <span className="material-symbols-outlined">accessibility_new</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-medium">Recalibrate Spaces</h4>
                                                    <p className="text-sm opacity-50">Reset spatial anchors</p>
                                                </div>
                                            </div>
                                            <button className="px-5 py-2.5 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 rounded-lg text-sm border border-[var(--color-primary)]/30 text-[var(--color-primary)] transition-all font-medium tracking-wide">
                                                CALIBRATE
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* SYSTEM */}
                                {activeTab === 'system' && (
                                    <div className="text-center py-12">
                                        <div className="w-32 h-32 mx-auto bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-secondary)] rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(0,240,255,0.3)] animate-pulse">
                                            <span className="material-symbols-outlined text-6xl text-white">deployed_code</span>
                                        </div>
                                        <h4 className="text-4xl font-bold mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">AETHER OS</h4>
                                        <p className="text-[var(--color-primary)] mb-10 font-mono tracking-widest text-sm">VERSION 1.0.0 ALPHA</p>

                                        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-[var(--color-primary)]/30 transition-colors">
                                                <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Build Identifier</div>
                                                <div className="font-mono text-xl">24.0.1</div>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors">
                                                <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">System Status</div>
                                                <div className="text-green-400 flex justify-center items-center gap-2">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                                    ONLINE
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex justify-center">
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/10 hover:border-white/30 active:scale-95"
                                            >
                                                <span className="material-symbols-outlined">update</span>
                                                Check for Updates
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </GestureApp>
    )
}

// Reusable Toggle Component
const ToggleItem = ({ label, sublabel, icon, active, onToggle, highlight = false }) => (
    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${highlight
        ? 'bg-blue-500/10 border-blue-500/30'
        : 'bg-white/5 border-white/10 hover:bg-white/10'
        }`}>
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${highlight ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5'}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div>
                <h4 className="text-lg font-medium">{label}</h4>
                <p className="text-sm opacity-50">{sublabel}</p>
            </div>
        </div>

        <div
            onClick={onToggle}
            className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${active ? 'bg-blue-500' : 'bg-white/20'}`}
        >
            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`} />
        </div>
    </div>
)
