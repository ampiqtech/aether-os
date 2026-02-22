/**
 * AetherInput — Unified Spatial Input Engine
 * Routes all input modalities (gesture, voice, touch, keyboard, gaze)
 * through a single priority-ordered event pipeline.
 * Apps register intent handlers; the engine routes the right event.
 */

// Input modality priorities (lower = higher priority)
export const InputPriority = {
    GESTURE: 0,
    VOICE: 1,
    TOUCH: 2,
    KEYBOARD: 3,
    GAZE: 4,
}

// Standard input intents
export const Intents = {
    // Navigation
    SWIPE_LEFT: 'swipe_left',
    SWIPE_RIGHT: 'swipe_right',
    SWIPE_UP: 'swipe_up',
    SWIPE_DOWN: 'swipe_down',
    PINCH: 'pinch',
    SPREAD: 'spread',
    TAP: 'tap',
    LONG_PRESS: 'long_press',
    // System
    HOME: 'home',
    BACK: 'back',
    SCREENSHOT: 'screenshot',
    VOICE_WAKE: 'voice_wake',
}

class InputEngine {
    constructor() {
        this._handlers = new Map()           // intent → [{pid, handler, priority}]
        this._macros = []                    // recorded input sequences
        this._recording = false
        this._recordBuffer = []
        this._deadZone = 30                  // pixels — prevents accidental triggers
        this._lastInput = { type: null, ts: 0 }
        this._inputHistory = []
    }

    // ─── Boot ─────────────────────────────────────────────────────────────────

    init() {
        this._bindSystemInputs()
        console.info('[AetherInput] Initialized — unified input router active')
    }

    // ─── Intent Registration ──────────────────────────────────────────────────

    /**
     * Register a handler for an intent.
     * @param {string} intent - One of Intents.*
     * @param {Function} handler - Called with (event, modality)
     * @param {number} pid - Process ID of the registering app
     * @param {number} priority - Override priority (optional)
     * @returns {Function} Unregister function
     */
    on(intent, handler, pid = 0, priority = InputPriority.GESTURE) {
        if (!this._handlers.has(intent)) this._handlers.set(intent, [])
        const entry = { pid, handler, priority }
        this._handlers.get(intent).push(entry)
        // Sort by priority (ascending = higher priority first)
        this._handlers.get(intent).sort((a, b) => a.priority - b.priority)
        return () => this._removeHandler(intent, handler)
    }

    /**
     * Emit an intent from any input modality.
     * Handlers are called in priority order; first to return `true` consumes the event.
     */
    emit(intent, payload = {}, modality = 'gesture') {
        const now = Date.now()

        // Dead zone: ignore duplicate intents within 150ms
        if (this._lastInput.type === intent && now - this._lastInput.ts < 150) return false
        this._lastInput = { type: intent, ts: now }

        // Record if macro mode is on
        if (this._recording) this._recordBuffer.push({ intent, payload, modality, ts: now })

        // Log to history
        this._inputHistory.push({ intent, modality, ts: now })
        if (this._inputHistory.length > 100) this._inputHistory.shift()

        // Dispatch to handlers
        const handlers = this._handlers.get(intent) || []
        for (const { handler } of handlers) {
            const consumed = handler({ intent, payload, modality, ts: now })
            if (consumed === true) break   // Event consumed
        }

        return true
    }

    // ─── Macro Recording ──────────────────────────────────────────────────────

    startRecording() {
        this._recording = true
        this._recordBuffer = []
        console.info('[AetherInput] Macro recording started')
    }

    stopRecording(name) {
        this._recording = false
        const macro = { name, steps: [...this._recordBuffer] }
        this._macros.push(macro)
        console.info(`[AetherInput] Macro "${name}" saved (${macro.steps.length} steps)`)
        return macro
    }

    playMacro(name, delayMs = 100) {
        const macro = this._macros.find(m => m.name === name)
        if (!macro) { console.warn('[AetherInput] Macro not found:', name); return }
        macro.steps.forEach((step, i) => {
            setTimeout(() => this.emit(step.intent, step.payload, 'macro'), i * delayMs)
        })
    }

    // ─── Inspection ───────────────────────────────────────────────────────────

    getHistory(n = 20) { return this._inputHistory.slice(-n) }
    getMacros() { return this._macros.map(m => ({ name: m.name, steps: m.steps.length })) }

    // ─── Private ──────────────────────────────────────────────────────────────

    _bindSystemInputs() {
        // Keyboard shortcuts → intents
        window.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'h') this.emit(Intents.HOME, {}, 'keyboard')
            if (e.altKey && e.key === 'ArrowLeft') this.emit(Intents.SWIPE_LEFT, {}, 'keyboard')
            if (e.altKey && e.key === 'ArrowRight') this.emit(Intents.SWIPE_RIGHT, {}, 'keyboard')
            if (e.altKey && e.key === 'ArrowUp') this.emit(Intents.SWIPE_UP, {}, 'keyboard')
            if (e.altKey && e.key === 'ArrowDown') this.emit(Intents.SWIPE_DOWN, {}, 'keyboard')
        })

        // Touch swipe detection
        let touchStart = null
        window.addEventListener('touchstart', e => { touchStart = e.touches[0] }, { passive: true })
        window.addEventListener('touchend', e => {
            if (!touchStart) return
            const dx = e.changedTouches[0].clientX - touchStart.clientX
            const dy = e.changedTouches[0].clientY - touchStart.clientY
            if (Math.abs(dx) > this._deadZone || Math.abs(dy) > this._deadZone) {
                const intent = Math.abs(dx) > Math.abs(dy)
                    ? (dx > 0 ? Intents.SWIPE_RIGHT : Intents.SWIPE_LEFT)
                    : (dy > 0 ? Intents.SWIPE_DOWN : Intents.SWIPE_UP)
                this.emit(intent, { dx, dy }, 'touch')
            }
            touchStart = null
        }, { passive: true })
    }

    _removeHandler(intent, handler) {
        const list = this._handlers.get(intent)
        if (list) {
            const idx = list.findIndex(h => h.handler === handler)
            if (idx >= 0) list.splice(idx, 1)
        }
    }
}

export const AetherInput = new InputEngine()
