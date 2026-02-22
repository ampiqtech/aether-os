/**
 * AetherKernel — Process Scheduler & IPC Bus
 * The core runtime that manages all app processes in Aether OS.
 * Superior to iOS/Android in transparency: every process is inspectable
 * and controllable via the DevConsole at runtime.
 */

// Process priority levels
export const Priority = {
    CRITICAL: 0,  // System processes (input handler, compositor)
    HIGH: 1,      // Foreground app
    NORMAL: 2,    // Background apps
    LOW: 3,       // Suspended apps
    IDLE: 4,      // Deferred tasks
}

// Process states (mirrors a real OS process lifecycle)
export const ProcessState = {
    CREATED: 'created',
    RUNNING: 'running',
    SUSPENDED: 'suspended',
    TERMINATED: 'terminated',
}

class KernelClass {
    constructor() {
        this._processes = new Map()      // pid → ProcessDescriptor
        this._nextPid = 1
        this._ipcListeners = new Map()   // channel → Set<handler>
        this._eventLog = []              // kernel event history
        this._startTime = performance.now()
        this._cpuSamples = []
        this._schedulerHandle = null
        this._storeRef = null            // injected after store init
    }

    // ─── Boot ────────────────────────────────────────────────────────────────

    init(storeRef) {
        this._storeRef = storeRef
        this._startScheduler()
        this._log('KERNEL_BOOT', 'AetherKernel initialized')
        console.info('[AetherKernel] Booted at', new Date().toISOString())
    }

    // ─── Process Management ───────────────────────────────────────────────────

    spawn(appName, props = {}, capabilities = []) {
        const pid = this._nextPid++
        const now = performance.now()

        const descriptor = {
            pid,
            name: appName,
            title: appName,
            state: ProcessState.CREATED,
            priority: Priority.HIGH,
            capabilities,
            props,
            cpuTime: 0,
            cpuPercent: 0,
            memEstimate: 0,
            spawnedAt: now,
            lastActive: now,
            messages: [],
            // Window metadata (managed by compositor)
            minimized: false,
            maximized: false,
            position: { x: (Math.random() - 0.5) * 0.5, y: (Math.random() - 0.5) * 0.5, z: 0 },
            size: { width: 800, height: 600 },
            icon: this._iconFor(appName),
        }

        this._processes.set(pid, descriptor)
        descriptor.state = ProcessState.RUNNING

        this._log('SPAWN', `PID ${pid} — ${appName}`)
        this._notifyStore()

        // AetherContext: record launch for predictions
        if (window.AetherEngine?.context) {
            window.AetherEngine.context.recordLaunch(appName)
        }

        return pid
    }

    kill(pid) {
        const proc = this._processes.get(pid)
        if (!proc) return false

        proc.state = ProcessState.TERMINATED
        this._processes.delete(pid)
        this._log('KILL', `PID ${pid} — ${proc.name}`)
        this._notifyStore()
        return true
    }

    suspend(pid) {
        const proc = this._processes.get(pid)
        if (!proc) return
        proc.state = ProcessState.SUSPENDED
        proc.priority = Priority.LOW
        this._notifyStore()
    }

    resume(pid) {
        const proc = this._processes.get(pid)
        if (!proc) return
        proc.state = ProcessState.RUNNING
        proc.priority = Priority.HIGH
        proc.lastActive = performance.now()
        this._notifyStore()
    }

    focus(pid) {
        // Deprioritize all others, prioritize focused
        for (const [p, proc] of this._processes) {
            if (!proc.minimized) {
                proc.priority = p === pid ? Priority.HIGH : Priority.NORMAL
            }
        }
        this._notifyStore()
    }

    setWindowProp(pid, key, value) {
        const proc = this._processes.get(pid)
        if (!proc) return
        proc[key] = value
        this._notifyStore()
    }

    // ─── IPC Bus ──────────────────────────────────────────────────────────────

    /** Send a message from one process to a named channel */
    send(channel, payload, fromPid = null) {
        const msg = { channel, payload, fromPid, ts: Date.now() }
        const handlers = this._ipcListeners.get(channel)
        if (handlers) handlers.forEach(fn => fn(msg))
        this._log('IPC', `Channel "${channel}" from PID ${fromPid}`)
    }

    /** Subscribe to messages on a channel */
    on(channel, handler) {
        if (!this._ipcListeners.has(channel)) this._ipcListeners.set(channel, new Set())
        this._ipcListeners.get(channel).add(handler)
        // Return unsubscribe fn
        return () => this._ipcListeners.get(channel)?.delete(handler)
    }

    // ─── Inspection API (DevConsole) ──────────────────────────────────────────

    getProcesses() {
        return Array.from(this._processes.values())
    }

    getProcess(pid) {
        return this._processes.get(pid)
    }

    getUptime() {
        return ((performance.now() - this._startTime) / 1000).toFixed(1) + 's'
    }

    getEventLog(n = 20) {
        return this._eventLog.slice(-n)
    }

    top() {
        console.table(
            this.getProcesses().map(p => ({
                PID: p.pid,
                Name: p.name,
                State: p.state,
                Priority: p.priority,
                'CPU%': p.cpuPercent.toFixed(1),
                Uptime: ((performance.now() - p.spawnedAt) / 1000).toFixed(0) + 's',
            }))
        )
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    _startScheduler() {
        // Lightweight scheduler — runs every ~500ms to update CPU estimates
        const tick = () => {
            const now = performance.now()
            for (const proc of this._processes.values()) {
                if (proc.state === ProcessState.RUNNING) {
                    const elapsed = now - proc.lastActive
                    proc.cpuTime += elapsed * 0.001 // rough CPU time ms
                    // Estimate CPU% based on priority
                    proc.cpuPercent = proc.priority === Priority.HIGH ? 15 + Math.random() * 5 :
                        proc.priority === Priority.NORMAL ? 2 + Math.random() * 3 : 0.5
                    proc.memEstimate = 20 + this._processes.size * 5 // rough MB
                }
                proc.lastActive = now
            }
        }
        this._schedulerHandle = setInterval(tick, 500)
    }

    _notifyStore() {
        // Push updated process list to Zustand store
        if (this._storeRef) {
            const processes = this.getProcesses()
            this._storeRef.setState({ processes })
        }
    }

    _log(type, message) {
        const entry = { type, message, ts: Date.now(), uptime: this.getUptime() }
        this._eventLog.push(entry)
        if (this._eventLog.length > 200) this._eventLog.shift()
    }

    _iconFor(name) {
        const map = {
            browser: 'rocket_launch', journey: 'rocket_launch',
            files: 'folder', settings: 'settings', camera: 'photo_camera',
            music: 'music_note', phone: 'call', social: 'groups',
            appstore: 'storefront', devconsole: 'terminal',
            libraryshowcase: 'library_books', wallet: 'account_balance_wallet',
            assistant: 'smart_toy', lms: 'school',
        }
        return map[name.toLowerCase()] || 'apps'
    }
}

export const AetherKernel = new KernelClass()
