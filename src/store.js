import { create } from 'zustand'
// AetherKernel is imported lazily to avoid circular deps at boot time
const getKernel = () => window.AetherEngine?.kernel

export const useOSStore = create((set, get) => ({
    mode: 'locked', // 'locked' | 'home'
    volume: 50,
    brightness: 100,

    // Process Management
    processes: [],
    nextPid: 1,
    activePid: null, // The focused window

    setMode: (mode) => set({ mode }),
    setVolume: (volume) => set({ volume }),
    setBrightness: (brightness) => set({ brightness }),

    // ── App Lifecycle — routed through AetherKernel ──────────────────────────
    launchApp: (appName, props = {}) => {
        const kernel = getKernel()
        if (kernel) {
            // Kernel spawns the process and calls _notifyStore() which updates processes[]
            const pid = kernel.spawn(appName, props)
            set({ activePid: pid, mode: 'home' })
            return pid
        }
        // Fallback (engine not yet booted — first render)
        const pid = get().nextPid
        const newProcess = {
            pid, name: appName, title: appName,
            icon: 'apps', minimized: false, maximized: false,
            position: { x: (Math.random() - 0.5) * 0.5, y: (Math.random() - 0.5) * 0.5, z: 0 },
            size: { width: 800, height: 600 }, props,
            state: 'running', priority: 1, cpuPercent: 0, memEstimate: 0,
        }
        set(s => ({ processes: [...s.processes, newProcess], nextPid: s.nextPid + 1, activePid: pid, mode: 'home' }))
        return pid
    },

    closeApp: (pid) => {
        const kernel = getKernel()
        if (kernel) {
            kernel.kill(pid)  // notifyStore called inside kernel
            set(s => ({ activePid: s.activePid === pid ? (s.processes.length > 1 ? s.processes[s.processes.length - 2]?.pid : null) : s.activePid }))
        } else {
            set(s => ({
                processes: s.processes.filter(p => p.pid !== pid),
                activePid: s.activePid === pid ? (s.processes.length > 1 ? s.processes[s.processes.length - 2]?.pid : null) : s.activePid
            }))
        }
    },

    focusApp: (pid) => {
        getKernel()?.focus(pid)
        set(s => {
            const proc = s.processes.find(p => p.pid === pid)
            if (!proc) return {}
            return { processes: [...s.processes.filter(p => p.pid !== pid), proc], activePid: pid }
        })
    },

    minimizeApp: (pid) => {
        set(s => {
            const proc = s.processes.find(p => p.pid === pid)
            if (!proc) return {}
            const minimized = !proc.minimized
            getKernel()?.[minimized ? 'suspend' : 'resume'](pid)
            return { processes: s.processes.map(p => p.pid === pid ? { ...p, minimized } : p) }
        })
    },

    // Window Management — kernel tracks position/size too
    updateWindowPosition: (pid, position) => {
        getKernel()?.setWindowProp(pid, 'position', position)
        set(s => ({ processes: s.processes.map(p => p.pid === pid ? { ...p, position } : p) }))
    },

    updateWindowSize: (pid, size) => {
        getKernel()?.setWindowProp(pid, 'size', size)
        set(s => ({ processes: s.processes.map(p => p.pid === pid ? { ...p, size } : p) }))
    },

    // Helper actions (Legacy support / Shortcuts)
    unlock: () => set({ mode: 'home' }),
    lock: () => set({ mode: 'locked', processes: [] }), // Close all apps on lock? Or just hide? Let's close for security/simple for now.
    openApp: (appName) => get().launchApp(appName),
    closeAppByName: () => { /* Deprecated/Unused in new system */ },

    // AI & Voice State
    aiState: 'idle', // 'idle' | 'listening' | 'thinking' | 'speaking'
    aiMessage: '',   // Caption/Response text
    setAiState: (state) => set({ aiState: state }),
    setAiMessage: (msg) => set({ aiMessage: msg }),

    // Controls
    isListening: true,
    toggleListening: () => set((state) => ({ isListening: !state.isListening, aiState: !state.isListening ? 'listening' : 'idle' })),
    setIsListening: (val) => set({ isListening: val, aiState: val ? 'listening' : 'idle' }),

    keyboard: {
        visible: false,
        text: '',
        isFloating: false
    },
    toggleKeyboard: () => set((state) => ({ keyboard: { ...state.keyboard, visible: !state.keyboard.visible } })),
    setKeyboardText: (text) => set((state) => ({ keyboard: { ...state.keyboard, text } })),
    appendKeyboardText: (char) => set((state) => ({ keyboard: { ...state.keyboard, text: state.keyboard.text + char } })),
    backspaceKeyboardText: () => set((state) => ({ keyboard: { ...state.keyboard, text: state.keyboard.text.slice(0, -1) } })),
    toggleKeyboardFloating: () => set((state) => ({ keyboard: { ...state.keyboard, isFloating: !state.keyboard.isFloating } })),

    // App Store State
    installedApps: ['Journey', 'Assistant', 'LMS', 'Settings', 'Files', 'Music', 'Camera', 'Phone', 'Social', 'AppStore', 'DevConsole', 'LibraryShowcase', 'Wallet'], // Default apps
    installApp: (appName) => set((state) => ({ installedApps: [...state.installedApps, appName] })),
    uninstallApp: (appName) => set((state) => ({ installedApps: state.installedApps.filter(app => app !== appName) })),

    // System Settings
    wallpaper: 'city', // 'city', 'sunset', 'nebula'
    setWallpaper: (wallpaper) => set({ wallpaper }),

    // Notification System
    notifications: [],
    _notifIdCounter: 0,
    pushNotification: (message, type = 'info', title = '') => set((state) => {
        const id = state._notifIdCounter + 1
        return {
            _notifIdCounter: id,
            notifications: [...state.notifications, { id, message, type, title, ts: Date.now() }]
        }
    }),
    dismissNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),
}))

// Expose store to window for Developer Console "God Mode"
if (typeof window !== 'undefined') {
    window.aether = {
        store: useOSStore,
        // Helper to run store actions directly from console
        act: (fn) => fn(useOSStore.getState()),
        // Quick access helpers
        bg: (w) => useOSStore.getState().setWallpaper(w),
        lock: () => useOSStore.getState().lock(),
        unlock: () => useOSStore.getState().unlock(),
        launch: (app) => useOSStore.getState().launchApp(app),
        log: (msg) => console.log(`[AETHER_SYS]: ${msg}`)
    }
}
