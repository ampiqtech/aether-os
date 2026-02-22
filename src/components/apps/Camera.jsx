import { FileSystem } from '../../services/filesystem'
import { useState, useRef, useEffect } from 'react'
import { GestureApp } from '../UIKit'

export const Camera = ({ onClose }) => {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const [stream, setStream] = useState(null)
    const [lastPhoto, setLastPhoto] = useState(null)
    const [filter, setFilter] = useState('none')
    const [flash, setFlash] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        startCamera()
        return () => stopCamera()
    }, [])

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
        }
    }

    const takePhoto = async () => {
        if (videoRef.current && canvasRef.current) {
            // Flash Effect
            setFlash(true)
            setTimeout(() => setFlash(false), 200)

            const video = videoRef.current
            const canvas = canvasRef.current
            const context = canvas.getContext('2d')

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            // Draw video frame to canvas
            if (filter !== 'none') {
                context.filter = filter
            }
            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            // Get data URL
            const dataUrl = canvas.toDataURL('image/png')
            setLastPhoto(dataUrl)

            // Save to File System
            try {
                setSaving(true)
                const blob = await (await fetch(dataUrl)).blob()
                const name = `photo_${Date.now()}.png`
                const file = new File([blob], name, { type: 'image/png' })
                await FileSystem.writeFile(file)
            } catch (err) {
                console.error('Failed to save photo', err)
            } finally {
                setSaving(false)
            }
        }
    }

    const filters = [
        { id: 'none', label: 'Normal', css: 'none' },
        { id: 'grayscale(100%)', label: 'B&W', css: 'grayscale' },
        { id: 'sepia(100%)', label: 'Sepia', css: 'sepia' },
        { id: 'hue-rotate(90deg)', label: 'Alien', css: 'hue-rotate' },
    ]

    const cycleFilter = (dir) => {
        const idx = filters.findIndex(f => f.id === filter)
        const next = filters[(idx + dir + filters.length) % filters.length]
        setFilter(next.id)
    }

    return (
        <GestureApp gestures={{ onSwipeLeft: () => cycleFilter(1), onSwipeRight: () => cycleFilter(-1), onPinch: takePhoto }}>
            <div className="w-full h-full bg-black/90 backdrop-blur-3xl rounded-3xl overflow-hidden relative flex flex-col animate-in fade-in zoom-in duration-300 border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] font-sans" style={{ fontFamily: 'var(--font-body)' }}>
                {/* Viewfinder */}
                <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                    {!stream && <div className="text-white/50">Initializing Camera...</div>}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover transform scale-x-[-1]" // Mirror effect
                        style={{ filter: filter === 'none' ? 'none' : filter }}
                    />

                    {/* Flash Overlay */}
                    <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-200 ${flash ? 'opacity-100' : 'opacity-0'}`} />
                </div>

                {/* Controls Bar */}
                <div className="h-32 bg-black/40 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-12 z-10 relative">

                    {/* Gallery Preview / Last Photo */}
                    <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/20 overflow-hidden cursor-pointer hover:scale-105 transition-transform">
                        {lastPhoto ? (
                            <img src={lastPhoto} alt="Last capture" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30">
                                <span className="material-symbols-outlined">image</span>
                            </div>
                        )}
                    </div>

                    {/* Shutter Button */}
                    <div className="relative group cursor-pointer" onClick={takePhoto}>
                        <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all group-hover:bg-white/10 group-active:scale-95">
                            <div className="w-16 h-16 rounded-full bg-white transition-all group-active:scale-90" />
                        </div>
                    </div>

                    {/* Filter / Close Toggle */}
                    <div className="flex flex-col gap-4 items-center">
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-500/20 hover:text-red-200 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Filter Selector Overlay */}
                <div className="absolute bottom-36 left-0 right-0 flex justify-center gap-4 z-20">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            data-gesture-target
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md border transition-all ${filter === f.id
                                ? 'bg-yellow-400 text-black border-yellow-400'
                                : 'bg-black/30 text-white border-white/20 hover:bg-black/50'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <p style={{ position: 'absolute', top: 12, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: 'rgba(0,255,200,0.3)', letterSpacing: '0.05em', zIndex: 30 }}>
                    ← swipe for filters · pinch = shoot
                </p>

                {/* Hidden Canvas for Capture */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </GestureApp>
    )
}
