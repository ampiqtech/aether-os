import { useState } from 'react'
import { GestureApp } from '../UIKit'

export const Phone = ({ onClose }) => {
    const [number, setNumber] = useState('')
    const [calling, setCalling] = useState(false)

    const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

    const pressKey = (key) => {
        setNumber(prev => prev + key)
    }

    const backspace = () => {
        setNumber(prev => prev.slice(0, -1))
    }

    const call = () => {
        if (!number) return
        setCalling(true)
        // Open the device's real phone dialer
        window.open(`tel:${number}`, '_self')
        setTimeout(() => setCalling(false), 2000)
    }

    return (
        <GestureApp>
            <div className="w-full h-full bg-black/90 backdrop-blur-3xl rounded-3xl overflow-hidden relative flex flex-col font-sans border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-300" style={{ fontFamily: 'var(--font-body)' }}>
                {/* Header */}
                <div className="p-6 pb-2">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 mb-1">Phone</h2>
                    <div className="flex gap-4 text-sm font-medium text-white/50 border-b border-white/5 pb-4">
                        <span className="text-white border-b-2 border-green-500 pb-4 -mb-4.5 cursor-pointer">Keypad</span>
                        <span className="hover:text-white transition-colors cursor-pointer">Recents</span>
                        <span className="hover:text-white transition-colors cursor-pointer">Contacts</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    {/* Number Display */}
                    <div className="flex items-center gap-2 mb-8 h-14 w-full justify-center">
                        <span className="text-4xl font-light tracking-widest text-white min-h-[1em]">
                            {number || <span className="text-white/20">Enter number</span>}
                        </span>
                        {number && (
                            <button onClick={backspace}
                                className="text-white/40 hover:text-white transition-colors ml-2">
                                <span className="material-symbols-outlined">backspace</span>
                            </button>
                        )}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {keypad.map((key) => (
                            <button
                                data-gesture-target
                                key={key}
                                onClick={() => pressKey(key)}
                                className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-white/5 hover:bg-white/15 active:bg-green-500/20 active:scale-95 transition-all duration-150 flex items-center justify-center text-2xl font-medium border border-white/5 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                            >
                                {key}
                            </button>
                        ))}
                    </div>

                    {/* Call / End Buttons */}
                    <div className="flex items-center gap-6">
                        <button
                            data-gesture-target
                            onClick={call}
                            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,255,0,0.3)] transition-all hover:scale-105 active:scale-95 group ${calling ? 'bg-red-500 shadow-[0_0_30px_rgba(255,0,0,0.4)]' : 'bg-green-500 hover:bg-green-400'}`}
                        >
                            <span className="material-symbols-outlined text-4xl text-black">
                                {calling ? 'call_end' : 'call'}
                            </span>
                        </button>
                    </div>

                    {calling && (
                        <p className="mt-4 text-green-400 text-sm animate-pulse">
                            Dialing {number}…
                        </p>
                    )}
                </div>
            </div>
        </GestureApp>
    )
}
