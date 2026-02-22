import { useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useSpring, animated } from '@react-spring/web'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { GestureApp } from '../UIKit'

// --- Internal Components ---

const MotionDemo = () => (
    <div className="flex flex-col items-center justify-center p-8 gap-8">
        <motion.div
            className="w-32 h-32 bg-blue-500 rounded-xl"
            animate={{
                scale: [1, 2, 2, 1, 1],
                rotate: [0, 0, 270, 270, 0],
                borderRadius: ["20%", "20%", "50%", "50%", "20%"],
            }}
            transition={{
                duration: 2,
                ease: "easeInOut",
                times: [0, 0.2, 0.5, 0.8, 1],
                repeat: Infinity,
                repeatDelay: 1
            }}
        />
        <p className="text-blue-300">Framer Motion</p>
    </div>
)

const ChartDemo = () => {
    const data = [
        { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
        { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
        { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
        { name: 'Apr', uv: 2780, pv: 3908, amt: 2000 },
        { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
    ]
    return (
        <div className="w-full h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#222', border: 'none' }} />
                    <Line type="monotone" dataKey="pv" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
                </LineChart>
            </ResponsiveContainer>
            <p className="text-center text-gray-400 mt-2">Recharts Visualization</p>
        </div>
    )
}

const SpringDemo = () => {
    const [flipped, set] = useState(false)
    const { transform, opacity } = useSpring({
        opacity: flipped ? 1 : 0,
        transform: `perspective(600px) rotateX(${flipped ? 180 : 0}deg)`,
        config: { mass: 5, tension: 500, friction: 80 },
    })

    return (
        <div className="flex flex-col items-center justify-center p-8 gap-4" onClick={() => set(state => !state)}>
            <animated.div
                className="w-32 h-32 bg-red-500 rounded-xl flex items-center justify-center text-white cursor-pointer"
                style={{ opacity: opacity.to(o => 1 - o), transform }}
            >
                Front
            </animated.div>
            <animated.div
                className="w-32 h-32 bg-green-500 rounded-xl flex items-center justify-center text-white cursor-pointer absolute"
                style={{ opacity, transform: transform.to(t => `${t} rotateX(180deg)`) }}
            >
                Back
            </animated.div>
            <p className="text-gray-400 mt-32">Click (React Spring Physics)</p>
        </div>
    )
}

const RouterDemo = () => (
    <MemoryRouter>
        <div className="p-4 border border-white/10 rounded-lg bg-black/40">
            <nav className="flex gap-4 mb-4 border-b border-white/10 pb-2">
                <Link to="/" className="text-blue-400 hover:underline">Home</Link>
                <Link to="/about" className="text-blue-400 hover:underline">About</Link>
            </nav>
            <Routes>
                <Route path="/" element={<div className="text-white">Home Page (Memory Router)</div>} />
                <Route path="/about" element={<div className="text-yellow-300">About Page Content</div>} />
            </Routes>
        </div>
    </MemoryRouter>
)

const queryClient = new QueryClient()

const QueryContent = () => {
    // Fake query
    const { isPending, error, data } = useQuery({
        queryKey: ['repoData'],
        queryFn: () =>
            new Promise(resolve => setTimeout(() => resolve({ name: "Aether OS", stars: 9999 }), 1000)),
    })

    if (isPending) return <div className="text-yellow-500">Loading data...</div>
    if (error) return <div className="text-red-500">An error has occurred</div>

    return (
        <div className="text-green-400">
            <h1>{data.name}</h1>
            <p>Stars: {data.stars}</p>
        </div>
    )
}

const QueryDemo = () => (
    <QueryClientProvider client={queryClient}>
        <div className="p-8 text-center border border-white/10 rounded-lg">
            <QueryContent />
            <p className="text-xs text-gray-500 mt-2">TanStack Query Mock Fetch</p>
        </div>
    </QueryClientProvider>
)

// --- Main App ---

export const LibraryShowcase = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('motion')

    const tabs = [
        { id: 'motion', label: 'Motion' },
        { id: 'charts', label: 'Recharts' },
        { id: 'spring', label: 'Spring' },
        { id: 'router', label: 'Router' },
        { id: 'query', label: 'Query' },
    ]

    const cycleTab = (dir) => {
        const idx = tabs.findIndex(t => t.id === activeTab)
        const next = tabs[(idx + dir + tabs.length) % tabs.length]
        setActiveTab(next.id)
    }

    return (
        <GestureApp gestures={{ onSwipeLeft: () => cycleTab(1), onSwipeRight: () => cycleTab(-1) }}>
            <div className="w-full h-full bg-slate-900/90 backdrop-blur-3xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col text-white">
                {/* Header */}
                <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-white/5">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400">library_books</span>
                        <span className="font-semibold">Library Showcase</span>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex">
                    {/* Sidebar */}
                    <div className="w-48 border-r border-white/10 bg-black/20 p-4 flex flex-col gap-2">
                        {tabs.map(tab => (
                            <button
                                data-gesture-target
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`text-left px-4 py-3 rounded-lg transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Main View */}
                    <div className="flex-1 p-8 flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
                        {activeTab === 'motion' && <MotionDemo />}
                        {activeTab === 'charts' && <ChartDemo />}
                        {activeTab === 'spring' && <SpringDemo />}
                        {activeTab === 'router' && <RouterDemo />}
                        {activeTab === 'query' && <QueryDemo />}
                    </div>
                </div>
            </div>
        </GestureApp>
    )
}
