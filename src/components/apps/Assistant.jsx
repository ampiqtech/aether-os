import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOSStore } from '../../store'
import { AIOrchestrator } from '../../services/aiOrchestrator'
import { GestureApp } from '../UIKit'

const GEMINI_KEY_STORAGE = 'aether_gemini_api_key'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

// ─── API Key Setup Modal ─────────────────────────────────────────────────────
const ApiKeyModal = ({ onSave }) => {
    const [keyInput, setKeyInput] = useState('')
    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-8">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm bg-slate-900 border border-purple-500/30 rounded-3xl p-8 shadow-2xl"
            >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-3xl text-white">key</span>
                </div>
                <h2 className="text-xl font-bold text-white text-center mb-2">Connect Gemini AI</h2>
                <p className="text-white/50 text-sm text-center mb-6">
                    Enter your free API key from{' '}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                        className="text-purple-400 underline">aistudio.google.com</a>
                </p>
                <input
                    autoFocus
                    type="text"
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && keyInput.trim() && onSave(keyInput.trim())}
                    placeholder="AIzaSy..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 mb-4 font-mono text-sm"
                />
                <button
                    onClick={() => keyInput.trim() && onSave(keyInput.trim())}
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors"
                >
                    Connect
                </button>
            </motion.div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const Assistant = ({ onClose }) => {
    const { isListening, launchApp, closeApp, processes, setVolume, setBrightness, setWallpaper } = useOSStore()
    const [apiKey, setApiKey] = useState(() => localStorage.getItem(GEMINI_KEY_STORAGE) || '')
    const [showKeyModal, setShowKeyModal] = useState(false)
    const [messages, setMessages] = useState([
        { role: 'model', content: "Hello! I'm Aether AI, powered by Gemini. How can I help you today?" }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        if (!apiKey) setShowKeyModal(true)
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const saveKey = (key) => {
        localStorage.setItem(GEMINI_KEY_STORAGE, key)
        setApiKey(key)
        setShowKeyModal(false)
    }

    // Try Gemini first, fall back to AIOrchestrator
    const handleSend = async () => {
        if (!input.trim() || loading) return
        const userText = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userText }])
        setLoading(true)

        // OS commands still work
        const result = AIOrchestrator.processCommand(userText)
        if (result.type === 'LAUNCH_APP') launchApp(result.payload.appName)
        else if (result.type === 'CLOSE_APP') {
            const target = processes.find(p => p.name.toLowerCase() === result.payload.appName.toLowerCase())
            if (target) closeApp(target.pid)
        } else if (result.type === 'SET_VOLUME') setVolume(result.payload.level)
        else if (result.type === 'SET_BRIGHTNESS') setBrightness(result.payload.level)
        else if (result.type === 'SET_WALLPAPER') setWallpaper(result.payload.id)

        if (apiKey) {
            try {
                // Build conversation history for Gemini
                const geminiHistory = messages
                    .filter(m => m.role !== 'model' || messages.indexOf(m) > 0)
                    .map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }))

                const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            ...geminiHistory,
                            { role: 'user', parts: [{ text: userText }] }
                        ],
                        systemInstruction: {
                            parts: [{ text: 'You are Aether AI, a helpful assistant built into Aether OS, a futuristic spatial operating system. Keep answers concise and friendly. You can help with anything.' }]
                        },
                        generationConfig: { temperature: 0.9, maxOutputTokens: 1024 }
                    })
                })
                const data = await res.json()
                if (data.error) throw new Error(data.error.message)
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.'
                setMessages(prev => [...prev, { role: 'model', content: reply }])
            } catch (err) {
                setMessages(prev => [...prev, { role: 'model', content: `⚠️ Gemini error: ${err.message}. Check your API key in Settings → AI.` }])
            }
        } else {
            // Fallback: local AI orchestrator
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'model', content: result.response }])
            }, 400)
        }
        setLoading(false)
    }

    return (
        <GestureApp>
            <div className="w-full h-full bg-black/80 backdrop-blur-3xl rounded-3xl overflow-hidden flex flex-col font-sans border border-purple-500/30 shadow-[0_0_80px_rgba(168,85,247,0.2)] animate-in fade-in zoom-in duration-300 relative">
                {showKeyModal && <ApiKeyModal onSave={saveKey} />}

                {/* Header */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 animate-pulse" />
                            <div className="absolute inset-0 rounded-full bg-white blur-md opacity-30 animate-ping" />
                        </div>
                        <span className="font-bold text-white tracking-wider">AETHER AI</span>
                        <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">
                            {apiKey ? 'Gemini 2.0' : 'Local'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowKeyModal(true)} title="API Key"
                            className="text-white/40 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-sm">key</span>
                        </button>
                        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Chat Area */}
                <div data-scroll className="flex-1 overflow-y-auto p-6 space-y-4">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-purple-600 text-white rounded-br-none shadow-lg'
                                    : 'bg-white/10 text-white/90 rounded-bl-none border border-white/5'}`}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                        {loading && (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                <div className="bg-white/10 border border-white/5 rounded-2xl rounded-bl-none px-5 py-4 flex gap-1.5 items-center">
                                    {[0, 1, 2].map(i => (
                                        <div key={i} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                                            style={{ animationDelay: `${i * 0.15}s` }} />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-6 bg-white/5 border-t border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${isListening ? 'bg-red-500/80 animate-pulse' : 'bg-white/10'}`}>
                            <span className="material-symbols-outlined text-white">{isListening ? 'mic' : 'mic_off'}</span>
                        </div>
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder={apiKey ? 'Ask Gemini anything...' : 'Ask Aether...'}
                            disabled={loading}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-all disabled:opacity-50"
                        />
                        <button data-gesture-target onClick={handleSend} disabled={loading}
                            className="w-12 h-12 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 flex items-center justify-center text-white transition-colors shrink-0">
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </GestureApp>
    )
}
