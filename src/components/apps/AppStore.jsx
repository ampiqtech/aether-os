import { useOSStore } from '../../store'
import { GestureApp } from '../UIKit'

export const AppStore = ({ onClose }) => {
    const { installedApps, installApp, uninstallApp, launchApp } = useOSStore()

    const allApps = [
        { name: 'Music', category: 'Media', color: 'from-pink-500 to-rose-500', icon: 'music_note' },
        { name: 'Camera', category: 'Utilities', color: 'from-gray-700 to-gray-600', icon: 'photo_camera' },
        { name: 'Social', category: 'Social', color: 'from-blue-500 to-indigo-500', icon: 'groups' },
        { name: 'Phone', category: 'Communications', color: 'from-green-500 to-emerald-500', icon: 'call' },
        { name: 'Nebula Notes', category: 'Productivity', color: 'from-blue-500 to-cyan-500', icon: 'edit_note', placeholder: true },
        { name: 'Cosmic Canvas', category: 'Creativity', color: 'from-purple-500 to-fuchsia-500', icon: 'palette', placeholder: true },
    ]

    const handleAction = (app) => {
        if (installedApps.includes(app.name)) {
            // Open
            launchApp(app.name)
        } else {
            // Install
            installApp(app.name)
        }
    }

    return (
        <GestureApp>
            <div className="w-full h-full bg-black/90 backdrop-blur-3xl rounded-3xl overflow-hidden relative flex flex-col font-sans border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-300" style={{ fontFamily: 'var(--font-body)' }}>
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">App Store</h2>
                        <p className="text-white/40 text-xs uppercase tracking-widest mt-1">Discover &amp; Install</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/50">search</span>
                    </div>
                </div>

                {/* Content */}
                <div data-scroll className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    {/* Hero Banner */}
                    <div className="w-full h-48 rounded-2xl bg-gradient-to-r from-indigo-900 to-purple-900 mb-8 relative overflow-hidden group cursor-pointer border border-white/10 shadow-lg" onClick={() => handleAction(allApps[4])}>
                        <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                            <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-[10px] w-fit mb-2 border border-white/10">FEATURED</span>
                            <h3 className="text-2xl font-bold mb-1">Cyber Security Suite</h3>
                            <p className="text-sm text-white/70">Protect your data in the expanse.</p>
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-500">star</span>
                        Recommended Apps
                    </h3>

                    <div className="space-y-4">
                        {allApps.map((app) => {
                            const isInstalled = installedApps.includes(app.name)
                            return (
                                <div key={app.name} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all cursor-pointer group">
                                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                                        <span className="material-symbols-outlined text-3xl text-white drop-shadow-md">{app.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg">{app.name}</h4>
                                        <p className="text-xs text-white/50">{app.category}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {isInstalled ? (
                                            <>
                                                <button
                                                    data-gesture-target
                                                    onClick={() => launchApp(app.name)}
                                                    className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold tracking-wide transition-colors"
                                                >
                                                    OPEN
                                                </button>
                                                <button
                                                    data-gesture-target
                                                    onClick={() => uninstallApp(app.name)}
                                                    className="px-3 py-1.5 rounded-full hover:bg-red-500/20 hover:text-red-300 border border-transparent hover:border-red-500/30 text-xs font-semibold tracking-wide transition-colors"
                                                    title="Uninstall"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                data-gesture-target
                                                onClick={() => installApp(app.name)}
                                                className="px-6 py-1.5 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-black text-xs font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                                            >
                                                GET
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </GestureApp>
    )
}
