import { useState, useEffect, useRef } from 'react'
import { useGesture } from '../../hooks/useGesture'

export const Browser = ({ onClose, initialUrl }) => {
    const [url, setUrl] = useState('')
    const [currentUrl, setCurrentUrl] = useState(initialUrl || '')
    const [history, setHistory] = useState([])
    const [historyIndex, setHistoryIndex] = useState(-1)
    const iframeRef = useRef(null)
    const containerRef = useRef(null)

    useEffect(() => {
        if (initialUrl) {
            setUrl(initialUrl)
            navigate(initialUrl)
        }
    }, [initialUrl])

    const navigate = (target) => {
        if (!target) return
        // Trim history forward if we went back
        const newHistory = [...history.slice(0, historyIndex + 1), target]
        setHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
        setCurrentUrl(target)
        setUrl(target)
    }

    const goBack = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1
            setHistoryIndex(newIndex)
            setCurrentUrl(history[newIndex])
            setUrl(history[newIndex])
        }
    }

    const goForward = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1
            setHistoryIndex(newIndex)
            setCurrentUrl(history[newIndex])
            setUrl(history[newIndex])
        }
    }

    const handleNavigate = (e) => {
        e.preventDefault()
        let target = url
        if (!target.startsWith('http://') && !target.startsWith('https://')) {
            target = `https://www.google.com/search?q=${encodeURIComponent(target)}&igu=1`
        }
        navigate(target)
    }

    const goHome = () => {
        setCurrentUrl('')
        setUrl('')
    }

    // ── Gesture Control ──
    useGesture({
        onSwipeLeft: () => goBack(),
        onSwipeRight: () => goForward(),
    }, containerRef)

    const canBack = historyIndex > 0
    const canForward = historyIndex < history.length - 1

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-black/90 backdrop-blur-3xl rounded-3xl overflow-hidden relative flex flex-col animate-in fade-in zoom-in duration-300 border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] font-sans"
            style={{ fontFamily: 'var(--font-body)' }}
        >
            {/* Browser Toolbar */}
            <div className="bg-white/5 p-3 flex items-center gap-3 border-b border-white/5 backdrop-blur-md">
                <div className="flex gap-2">
                    <div onClick={onClose} className="w-3 h-3 rounded-full bg-[var(--color-accent)] cursor-pointer hover:bg-red-400 shadow-[0_0_10px_rgba(255,0,0,0.4)] transition-colors"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>

                <div className="flex gap-2 ml-2">
                    <button
                        onClick={goBack}
                        disabled={!canBack}
                        data-gesture-target
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Back (or swipe left)"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                    </button>
                    <button
                        onClick={goForward}
                        disabled={!canForward}
                        data-gesture-target
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/70 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Forward (or swipe right)"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                    <button onClick={goHome} data-gesture-target className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/70">
                        <span className="material-symbols-outlined text-sm">home</span>
                    </button>
                    <button onClick={() => navigate(currentUrl)} data-gesture-target className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/70">
                        <span className="material-symbols-outlined text-sm">refresh</span>
                    </button>
                </div>

                <form onSubmit={handleNavigate} className="flex-1 bg-black/20 rounded-full px-4 py-1.5 text-xs text-blue-200/90 shadow-inner mx-2 font-mono flex items-center gap-2 border border-white/5 hover:border-white/10 transition-colors focus-within:border-[var(--color-primary)]/50 focus-within:bg-black/40">
                    <span className="material-symbols-outlined text-[10px] opacity-50">public</span>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Search or enter website..."
                        className="bg-transparent border-none outline-none w-full text-white placeholder-white/30"
                    />
                </form>

                {/* Gesture hint badge */}
                <div style={{
                    fontSize: 9, color: 'rgba(0,255,200,0.4)',
                    letterSpacing: '0.05em', whiteSpace: 'nowrap',
                    fontFamily: 'Outfit, sans-serif',
                }}>
                    ← swipe →
                </div>
            </div>

            {/* Browser Content */}
            <div className="flex-1 bg-white flex items-center justify-center relative overflow-hidden">
                {currentUrl ? (
                    <>
                        <iframe
                            ref={iframeRef}
                            src={currentUrl}
                            className="w-full h-full border-none bg-white"
                            title="Browser View"
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
                            onError={(e) => console.error("Iframe Error:", e)}
                        />
                        <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                            <div className="bg-black/70 backdrop-blur-md text-white/70 text-[10px] px-3 py-1 rounded-full pointer-events-none">
                                If site refuses to connect, use external
                            </div>
                            <a
                                href={currentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                Open External
                            </a>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                        <div className="text-center z-10 p-8">
                            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-400 mb-6 tracking-tighter drop-shadow-lg">JOURNEY</h1>
                            <div className="w-[30rem] h-14 bg-white/5 border border-white/10 rounded-full shadow-lg mx-auto flex items-center px-6 text-white/50 hover:bg-white/10 hover:border-white/20 transition-all duration-300 focus-within:bg-black/40 focus-within:border-[var(--color-primary)]">
                                <span className="material-symbols-outlined mr-3">rocket_launch</span>
                                <input
                                    className="bg-transparent border-none outline-none w-full text-white placeholder-white/30 font-light tracking-wide h-full"
                                    placeholder="Search the cosmos..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate(e)}
                                />
                            </div>
                            <p className="mt-6 text-white/20 text-xs font-mono max-w-md mx-auto">
                                Note: Many Earth websites (Google, YouTube) block internal access via X-Frame protocols.
                                <br />Please use "Open External" for restricted frequencies.
                            </p>
                            <p className="mt-3 text-[rgba(0,255,200,0.3)] text-[10px]">
                                ✦ Gesture: swipe left = back · swipe right = forward · swipe up/down = scroll
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
