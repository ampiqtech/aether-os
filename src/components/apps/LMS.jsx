import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { GestureApp } from '../UIKit'

export const LMS = ({ onClose }) => {
    const [activeCourse, setActiveCourse] = useState(null)

    const courses = [
        {
            id: 'math101',
            title: 'Advanced Calculus',
            instructor: 'Dr. A. Vector',
            progress: 35,
            color: 'from-blue-500 to-cyan-500',
            modules: [
                { title: 'Limits and Continuity', duration: '45m', completed: true },
                { title: 'Derivatives', duration: '55m', completed: false },
                { title: 'Integrals', duration: '60m', completed: false },
            ]
        },
        {
            id: 'phys202',
            title: 'Quantum Mechanics',
            instructor: 'Prof. S. Hawking',
            progress: 10,
            color: 'from-purple-500 to-pink-500',
            modules: [
                { title: 'Wave Function', duration: '50m', completed: true },
                { title: 'Schrodinger Equation', duration: '65m', completed: false },
            ]
        },
        {
            id: 'hist303',
            title: 'History of Spaceflight',
            instructor: 'N. Armstrong',
            progress: 0,
            color: 'from-orange-500 to-red-500',
            modules: [
                { title: 'The Space Race', duration: '40m', completed: false },
                { title: 'Apollo Missions', duration: '90m', completed: false },
            ]
        }
    ]

    return (
        <GestureApp gestures={{
            onSwipeLeft: () => { if (!activeCourse) setActiveCourse(courses[0]) },
            onSwipeRight: () => { if (activeCourse) setActiveCourse(null) },
        }}>
            <div className="w-full h-full bg-slate-900/90 backdrop-blur-3xl rounded-3xl overflow-hidden flex flex-col font-sans border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="h-20 bg-white/5 border-b border-white/10 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">school</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">Aether Academy</h1>
                            <p className="text-xs text-white/50 uppercase tracking-widest">Learning Management System</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-white">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex relative">
                    {activeCourse ? (
                        // Course View
                        <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-300">
                            <div className={`h-48 bg-gradient-to-r ${activeCourse.color} p-8 relative shrink-0`}>
                                <button onClick={() => setActiveCourse(null)} className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 px-4 py-2 rounded-full backdrop-blur-md">
                                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                                    <span className="text-sm font-medium">Back to Courses</span>
                                </button>
                                <div className="absolute bottom-8 left-8">
                                    <h2 className="text-3xl font-bold text-white mb-2">{activeCourse.title}</h2>
                                    <p className="text-white/80">{activeCourse.instructor}</p>
                                </div>
                                <div className="absolute right-8 bottom-8 flex flex-col items-end">
                                    <span className="text-4xl font-bold text-white">{activeCourse.progress}%</span>
                                    <span className="text-xs text-white/60 uppercase">Completed</span>
                                </div>
                            </div>

                            <div data-scroll className="flex-1 overflow-y-auto p-8">
                                <h3 className="text-white/50 uppercase tracking-widest text-sm mb-6">Course Modules</h3>
                                <div className="space-y-4">
                                    {activeCourse.modules.map((mod, i) => (
                                        <div key={i} className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${mod.completed ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-white/20 text-white/40'}`}>
                                                    <span className="material-symbols-outlined text-sm">{mod.completed ? 'check' : 'play_arrow'}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-medium">{mod.title}</h4>
                                                    <p className="text-xs text-white/40">{mod.duration} • {mod.completed ? 'Completed' : 'Not Started'}</p>
                                                </div>
                                            </div>
                                            <button data-gesture-target className="px-4 py-2 rounded-lg bg-white/5 text-sm text-white hover:bg-white/20 transition-colors">
                                                {mod.completed ? 'Review' : 'Start'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Dashboard View
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            data-scroll
                            className="flex-1 overflow-y-auto p-8 flex flex-col gap-8"
                        >
                            {/* Progress Chart */}
                            <div className="h-64 bg-white/5 rounded-2xl p-6 border border-white/5">
                                <h3 className="text-white/50 uppercase tracking-widest text-sm mb-4">Overall Progress</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={courses}>
                                        <XAxis dataKey="id" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ backgroundColor: '#00000090', border: '1px solid #ffffff20', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                                            {courses.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.progress > 50 ? '#8b5cf6' : '#3b82f6'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {courses.map((course, i) => (
                                    <motion.div
                                        key={course.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        onClick={() => setActiveCourse(course)}
                                        className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer border border-white/10 transition-all hover:scale-[1.02] hover:shadow-xl"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                                        <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <span className="px-3 py-1 rounded-full bg-black/20 backdrop-blur-md text-xs font-medium text-white border border-white/10">COHORT 2026</span>
                                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white">arrow_forward</span>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-2xl font-bold text-white mb-1">{course.title}</h3>
                                                <p className="text-white/80 text-sm mb-4">{course.instructor}</p>

                                                <div className="w-full bg-black/20 h-1 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${course.progress}%` }}
                                                        transition={{ duration: 1, delay: 0.5 }}
                                                        className="h-full bg-white"
                                                    />
                                                </div>
                                                <div className="flex justify-between mt-2">
                                                    <span className="text-xs text-white/60">Progress</span>
                                                    <span className="text-xs text-white font-medium">{course.progress}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </GestureApp>
    )
}
