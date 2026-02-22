import { useState, useEffect, useRef } from 'react'
import { get, keys } from 'idb-keyval'
import { GestureApp } from '../UIKit'

// Extract YouTube video ID from any YT URL format
const extractYTId = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com.*[?&]v=)([\w-]{11})/)
    return match ? match[1] : null
}

export const Music = ({ onClose, file }) => {
    const [tab, setTab] = useState('youtube')
    const [songs, setSongs] = useState([])
    const [currentSong, setCurrentSong] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [loading, setLoading] = useState(true)
    const audioRef = useRef(null)
    const [ytUrl, setYtUrl] = useState('')
    const [ytId, setYtId] = useState('jfKfPfyJRdk') // lofi hip hop radio as default

    useEffect(() => {
        loadSongs()
        if (file) playSong(file)
    }, [file])

    const loadSongs = async () => {
        setLoading(true)
        try {
            const allKeys = await keys()
            const songList = []
            for (const key of allKeys) {
                if (key.startsWith('file_')) {
                    const fileData = await get(key)
                    if (fileData?.type?.startsWith('audio/')) songList.push(fileData)
                }
            }
            setSongs(songList)
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const playSong = (song) => {
        if (currentSong?.id === song.id) { togglePlay() } else {
            setCurrentSong(song)
            setIsPlaying(true)
            if (audioRef.current) {
                audioRef.current.src = URL.createObjectURL(song.data)
                audioRef.current.play()
            }
        }
    }

    const togglePlay = () => {
        if (audioRef.current) {
            isPlaying ? audioRef.current.pause() : audioRef.current.play()
            setIsPlaying(!isPlaying)
        }
    }

    const prevSong = () => {
        if (!songs.length) return
        const idx = currentSong ? songs.findIndex(s => s.id === currentSong.id) : 0
        playSong(songs[(idx - 1 + songs.length) % songs.length])
    }

    const nextSong = () => {
        if (!songs.length) return
        const idx = currentSong ? songs.findIndex(s => s.id === currentSong.id) : -1
        playSong(songs[(idx + 1) % songs.length])
    }

    const handleYtLoad = () => {
        const id = extractYTId(ytUrl)
        if (id) setYtId(id)
    }

    return (
        <GestureApp gestures={{ onSwipeLeft: tab === 'library' ? prevSong : undefined, onSwipeRight: tab === 'library' ? nextSong : undefined }}>
            <div className="h-full w-full bg-slate-900/90 backdrop-blur-xl rounded-xl p-6 text-white flex flex-col font-sans">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-pink-400">music_note</span>
                        Music
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-4">
                    {[{ id: 'youtube', label: '▶ YouTube' }, { id: 'library', label: '🎵 Local Files' }].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${tab === t.id ? 'bg-pink-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* YouTube Tab */}
                {tab === 'youtube' && (
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={ytUrl}
                                onChange={e => setYtUrl(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleYtLoad()}
                                placeholder="Paste YouTube URL to load any video..."
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-pink-500 text-sm"
                            />
                            <button data-gesture-target onClick={handleYtLoad}
                                className="px-4 py-2 bg-pink-500 hover:bg-pink-400 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap">
                                Load ▶
                            </button>
                        </div>
                        <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-black min-h-0">
                            <iframe
                                key={ytId}
                                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                                title="YouTube Player"
                                style={{ minHeight: 280 }}
                            />
                        </div>
                    </div>
                )}

                {/* Local Library Tab */}
                {tab === 'library' && (
                    <div className="flex-1 flex gap-6 overflow-hidden">
                        {/* Playlist */}
                        <div data-scroll className="w-1/3 border-r border-white/10 pr-4 overflow-y-auto custom-scrollbar">
                            <h3 className="text-sm font-light opacity-50 mb-4 uppercase tracking-wider">Library</h3>
                            {loading ? (
                                <div className="opacity-50 text-center mt-10">Loading...</div>
                            ) : songs.length === 0 ? (
                                <div className="opacity-30 text-center mt-10 text-sm">
                                    <p>No music found.</p>
                                    <p className="mt-1">Upload audio files in the Files app.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {songs.map(song => (
                                        <div key={song.id} onClick={() => playSong(song)}
                                            className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${currentSong?.id === song.id ? 'bg-pink-500/20 border border-pink-500/50' : 'hover:bg-white/5 border border-transparent'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentSong?.id === song.id ? 'bg-pink-500' : 'bg-white/10'}`}>
                                                <span className="material-symbols-outlined text-sm">
                                                    {currentSong?.id === song.id && isPlaying ? 'equalizer' : 'play_arrow'}
                                                </span>
                                            </div>
                                            <div className="truncate text-sm font-medium">{song.name}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Player */}
                        <div className="flex-1 flex flex-col items-center justify-center bg-black/40 rounded-xl relative overflow-hidden border border-white/5">
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-secondary)]/30 to-[var(--color-accent)]/20 blur-[80px] opacity-60" />
                            {currentSong ? (
                                <div className="z-10 text-center w-full max-w-sm px-4">
                                    <div className="w-48 h-48 bg-gradient-to-tr from-gray-900 to-gray-800 rounded-full shadow-[0_0_50px_rgba(112,0,255,0.4)] mb-8 flex items-center justify-center mx-auto relative animate-[spin_10s_linear_infinite]">
                                        <div className="absolute inset-2 border border-white/10 rounded-full" />
                                        <span className="material-symbols-outlined text-6xl opacity-20">album</span>
                                        {isPlaying && <div className="absolute inset-[-10px] border-2 border-[var(--color-secondary)]/50 rounded-full animate-pulse" />}
                                    </div>
                                    <h2 className="text-2xl font-bold mb-6 truncate tracking-tight">{currentSong.name}</h2>
                                    <div className="flex items-center justify-center gap-6">
                                        <button data-gesture-target onClick={prevSong} className="p-3 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-all hover:scale-110">
                                            <span className="material-symbols-outlined text-3xl">skip_previous</span>
                                        </button>
                                        <button data-gesture-target onClick={togglePlay}
                                            className="w-16 h-16 rounded-full bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/80 flex items-center justify-center shadow-[0_0_30px_rgba(112,0,255,0.5)] transition-all hover:scale-110">
                                            <span className="material-symbols-outlined text-3xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
                                        </button>
                                        <button data-gesture-target onClick={nextSong} className="p-3 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-all hover:scale-110">
                                            <span className="material-symbols-outlined text-3xl">skip_next</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center opacity-40 z-10 flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-4xl">headphones</span>
                                    </div>
                                    <p className="text-lg font-light">Select a track</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
            </div>
        </GestureApp>
    )
}
