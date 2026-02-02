import { create } from 'zustand'

export const useOSStore = create((set) => ({
    mode: 'locked', // 'locked' | 'home' | 'app'
    activeApp: null,
    volume: 50,
    brightness: 100,

    setMode: (mode) => set({ mode }),
    setVolume: (volume) => set({ volume }),
    setBrightness: (brightness) => set({ brightness }),

    // Helper actions
    unlock: () => set({ mode: 'home' }),
    lock: () => set({ mode: 'locked', activeApp: null }),
    openApp: (appName) => set({ mode: 'app', activeApp: appName }),
    closeApp: () => set({ mode: 'home', activeApp: null }),

    isListening: false,
    toggleListening: () => set((state) => ({ isListening: !state.isListening })),
    setIsListening: (isListening) => set({ isListening }),
}))
