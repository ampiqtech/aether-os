import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileSystem } from '../../services/filesystem'
import { useOSStore } from '../../store'
import { GestureApp } from '../UIKit'

export const Files = ({ onClose }) => {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [dragActive, setDragActive] = useState(false)

    useEffect(() => {
        loadFiles()
    }, [])

    const loadFiles = async () => {
        setLoading(true)
        const fileList = await FileSystem.listFiles()
        setFiles(fileList)
        setLoading(false)
    }

    const handleDrop = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            await FileSystem.writeFile(file)
            loadFiles()
        }
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDelete = async (id) => {
        await FileSystem.deleteFile(id)
        loadFiles()
    }

    // Format bytes
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes'
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

    // App Launching
    const { launchApp } = useOSStore()

    const handleOpenFile = (file) => {
        if (file.type.startsWith('audio/')) {
            launchApp('Music', { file })
        } else if (file.type.startsWith('image/')) {
            // For now, let's open images in the Browser as a data URL
            const url = URL.createObjectURL(file.data)
            launchApp('Browser', { initialUrl: url })
        } else {
            // console.log('Unknown file type')
        }
    }

    return (
        <GestureApp>
            <div
                className="h-full w-full bg-[rgba(5,5,16,0.6)] backdrop-blur-2xl rounded-2xl p-8 border border-white/10 shadow-[0_0_50px_rgba(0,240,255,0.1)] flex flex-col font-sans select-none overflow-hidden"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{ fontFamily: 'var(--font-body)' }}
            >
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                    <h2 className="text-3xl font-light tracking-wide flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">
                        <span className="material-symbols-outlined text-4xl text-[var(--color-primary)]">folder_open</span>
                        Files
                    </h2>
                    <div className="flex gap-3">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-[var(--color-primary)]/20 hover:text-[var(--color-primary)] transition-all duration-300 border border-white/5" title="Upload">
                            <span className="material-symbols-outlined">cloud_upload</span>
                        </button>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-[var(--color-accent)]/20 hover:text-[var(--color-accent)] transition-all duration-300 border border-white/5">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Drag Overlay */}
                <div className={`absolute inset-0 z-50 flex items-center justify-center bg-[rgba(0,240,255,0.1)] backdrop-blur-md border-2 border-dashed border-[var(--color-primary)] rounded-2xl transition-all duration-300 pointer-events-none ${dragActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    <div className="text-center animate-bounce">
                        <span className="material-symbols-outlined text-6xl text-[var(--color-primary)] mb-4">file_upload</span>
                        <p className="text-2xl font-light text-white tracking-widest">DROP FILES HERE</p>
                    </div>
                </div>

                <div data-scroll className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {loading ? (
                        <div className="flex justify-center items-center h-full opacity-50">
                            <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-full opacity-30 gap-4">
                            <span className="material-symbols-outlined text-8xl font-thin">folder_off</span>
                            <p className="text-lg font-light tracking-wide text-center">Your expanse is empty.<br />Upload data to begin.</p>
                        </div>
                    ) : (
                        <motion.div layout className="grid grid-cols-4 gap-6">
                            <AnimatePresence>
                                {files.map((file) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        key={file.id}
                                        onDoubleClick={() => handleOpenFile(file)}
                                        className="group relative bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-colors duration-300 border border-white/5 hover:border-[var(--color-primary)]/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] flex flex-col gap-3 cursor-pointer"
                                    >
                                        <div className="aspect-square flex items-center justify-center bg-black/20 rounded-lg overflow-hidden relative">
                                            {file.type.startsWith('image/') ? (
                                                <img src={URL.createObjectURL(file.data)} alt={file.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <span className="material-symbols-outlined text-5xl opacity-50 group-hover:text-[var(--color-primary)] transition-colors">
                                                    {file.type.startsWith('audio/') ? 'music_note' :
                                                        file.type.startsWith('video/') ? 'movie' : 'description'}
                                                </span>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium text-gray-200 group-hover:text-white transition-colors" title={file.name}>{file.name}</div>
                                            <div className="text-xs text-[var(--color-primary)] opacity-60 font-mono mt-1">{formatBytes(file.size)}</div>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                                            className="absolute top-2 right-2 p-1.5 bg-[var(--color-accent)]/80 hover:bg-[var(--color-accent)] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0"
                                        >
                                            <span className="material-symbols-outlined text-xs text-white">delete</span>
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>
        </GestureApp>
    )
}
