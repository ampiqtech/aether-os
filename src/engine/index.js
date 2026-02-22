/**
 * Aether Engine — Bootstrap
 * Initializes all engine modules and exposes them as window.AetherEngine.
 * Call AetherEngine.boot(storeRef) once before mounting React.
 * 
 * After boot, the following are available globally:
 *   window.AetherEngine.kernel   — AetherKernel
 *   window.AetherEngine.context  — AetherContext
 *   window.AetherEngine.fs       — AetherFS
 *   window.AetherEngine.input    — AetherInput
 *   window.AetherEngine.guard    — AetherGuard
 */

import { AetherKernel } from './AetherKernel'
import { AetherContext } from './AetherContext'
import { AetherFS } from './AetherFS'
import { AetherInput } from './AetherInput'
import { AetherGuard } from './AetherGuard'

export { AetherKernel, AetherContext, AetherFS, AetherInput, AetherGuard }

const ENGINE_VERSION = '1.0.0'
const ENGINE_CODENAME = 'Nova'

export const AetherEngine = {
    version: ENGINE_VERSION,
    codename: ENGINE_CODENAME,
    kernel: AetherKernel,
    context: AetherContext,
    fs: AetherFS,
    input: AetherInput,
    guard: AetherGuard,
    _bootTime: null,

    /**
     * Boot the Aether Engine.
     * Must be called before React renders.
     * @param {Object} storeRef - Zustand store reference (useOSStore)
     */
    async boot(storeRef) {
        const start = performance.now()
        console.group(`%c⚡ Aether Engine v${ENGINE_VERSION} "${ENGINE_CODENAME}" — Booting`, 'color:#a855f7;font-weight:bold;font-size:14px')

        // 1. Kernel (process manager + IPC)
        AetherKernel.init(storeRef)
        console.info('%c✓ AetherKernel', 'color:#22c55e', '— Process scheduler active')

        // 2. Context (AI habit engine)
        AetherContext.init()
        console.info('%c✓ AetherContext', 'color:#22c55e', '— Usage learning active')

        // 3. File System
        await AetherFS.init()
        console.info('%c✓ AetherFS', 'color:#22c55e', '— Virtual file system ready')

        // 4. Input Router
        AetherInput.init()
        console.info('%c✓ AetherInput', 'color:#22c55e', '— Unified input router active')

        // 5. Guard (Permissions)
        AetherGuard.init()
        console.info('%c✓ AetherGuard', 'color:#22c55e', '— Permission system active')

        const elapsed = (performance.now() - start).toFixed(1)
        this._bootTime = Date.now()
        console.info(`%c🚀 Engine boot complete in ${elapsed}ms`, 'color:#a855f7;font-weight:bold')
        console.groupEnd()

        // Expose globally for DevConsole
        window.AetherEngine = this
        // Extend existing window.aether helpers  
        if (window.aether) {
            window.aether.engine = this
            window.aether.kernel = AetherKernel
            window.aether.context = AetherContext
            window.aether.fs = AetherFS
            window.aether.input = AetherInput
            window.aether.guard = AetherGuard
            // DevConsole commands
            window.aether.ps = () => AetherKernel.top()
            window.aether.kill = (pid) => AetherKernel.kill(pid)
            window.aether.predict = () => AetherContext.predict()
            window.aether.usage = () => console.table(AetherContext.getUsageStats())
            window.aether.grants = () => console.table(AetherGuard.getAllGrants())
            window.aether.ls = (path) => AetherFS.ls(path).then(f => console.table(f.map(x => ({ name: x.name, size: x.size, type: x.type }))))
        }

        return this
    },

    getUptime() {
        if (!this._bootTime) return 'Engine not booted'
        const ms = Date.now() - this._bootTime
        const s = Math.floor(ms / 1000)
        const m = Math.floor(s / 60)
        const h = Math.floor(m / 60)
        return h > 0 ? `${h}h ${m % 60}m` : m > 0 ? `${m}m ${s % 60}s` : `${s}s`
    },

    getStats() {
        return {
            version: ENGINE_VERSION,
            codename: ENGINE_CODENAME,
            uptime: this.getUptime(),
            processes: AetherKernel.getProcesses().length,
            topApps: AetherContext.getUsageStats().slice(0, 3),
            permissions: AetherGuard.getAllGrants().length,
        }
    }
}
