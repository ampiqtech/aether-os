import { useState } from 'react'
import { motion } from 'framer-motion'
import { GestureApp } from '../UIKit'
import { useOSStore } from '../../store'

const platforms = [
    {
        name: 'Twitter / X',
        icon: 'flutter_dash',
        color: 'from-slate-700 to-slate-900',
        border: 'border-slate-600/30',
        url: 'https://x.com',
        description: 'Trending conversations',
    },
    {
        name: 'Instagram',
        icon: 'photo_camera',
        color: 'from-pink-600 to-purple-600',
        border: 'border-pink-500/30',
        url: 'https://instagram.com',
        description: 'Photos & reels',
    },
    {
        name: 'Discord',
        icon: 'chat_bubble',
        color: 'from-indigo-600 to-blue-700',
        border: 'border-indigo-500/30',
        url: 'https://discord.com/app',
        description: 'Voice & community',
    },
    {
        name: 'Reddit',
        icon: 'forum',
        color: 'from-orange-600 to-red-600',
        border: 'border-orange-500/30',
        url: 'https://reddit.com',
        description: 'Communities & memes',
    },
    {
        name: 'YouTube',
        icon: 'play_circle',
        color: 'from-red-600 to-rose-700',
        border: 'border-red-500/30',
        url: 'https://youtube.com',
        description: 'Videos & streams',
    },
    {
        name: 'LinkedIn',
        icon: 'work',
        color: 'from-blue-700 to-blue-900',
        border: 'border-blue-500/30',
        url: 'https://linkedin.com',
        description: 'Professional network',
    },
]

const trending = [
    { tag: '#AetherOS', count: '12.4K posts', platform: 'Twitter' },
    { tag: 'Spatial Computing', count: '8.1K posts', platform: 'Reddit' },
    { tag: '#GestureUI', count: '5.6K posts', platform: 'Twitter' },
    { tag: 'Next Gen Interfaces', count: '3.2K posts', platform: 'LinkedIn' },
]

export const Social = ({ onClose }) => {
    const launchApp = useOSStore(s => s.launchApp)

    const openPlatform = (platform) => {
        // Open inside the Browser (Journey) app — not an external tab
        launchApp('Journey', { initialUrl: platform.url })
    }

    return (
        <GestureApp>
            <div className="w-full h-full bg-black/90 backdrop-blur-3xl rounded-3xl overflow-hidden relative flex flex-col font-sans border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-300" style={{ fontFamily: 'var(--font-body)' }}>
                {/* Header */}
                <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-1">Social Hub</h2>
                        <p className="text-white/40 text-sm">Stay connected across the verse.</p>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white mt-1">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div data-scroll className="flex-1 p-6 overflow-y-auto space-y-6">
                    {/* Platform Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {platforms.map((p, i) => (
                            <motion.button
                                key={p.name}
                                data-gesture-target
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.06 }}
                                onClick={() => openPlatform(p)}
                                className={`bg-white/5 hover:bg-white/10 rounded-2xl p-4 border ${p.border} hover:border-white/20 transition-all cursor-pointer group flex flex-col items-center gap-3 hover:-translate-y-1 hover:shadow-xl`}
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                                    <span className="material-symbols-outlined text-2xl text-white">{p.icon}</span>
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-sm text-white/90">{p.name}</p>
                                    <p className="text-[10px] text-white/40 mt-0.5">{p.description}</p>
                                </div>
                                <span className="text-[9px] text-white/30 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                    Open
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Trending */}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-pink-500 text-sm">trending_up</span>
                            Trending Now
                        </h3>
                        <div className="space-y-3">
                            {trending.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.08 }}
                                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm text-white">tag</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">{item.tag}</p>
                                            <p className="text-white/40 text-xs">{item.count} · {item.platform}</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-white/20">chevron_right</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </GestureApp>
    )
}
