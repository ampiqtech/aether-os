/**
 * AetherGuard — Permission & Capability System
 * Every app must declare capabilities it needs.
 * Users approve or deny each capability — just like native iOS/Android,
 * but with more granularity and full auditability via DevConsole.
 */

const GRANTS_KEY = 'aether_capability_grants_v1'

// Available capabilities
export const Capabilities = {
    CAMERA: 'camera',
    MICROPHONE: 'microphone',
    FILES: 'files',
    LOCATION: 'location',
    NETWORK: 'network',
    NOTIFICATIONS: 'notifications',
    CONTACTS: 'contacts',
    BIOMETRICS: 'biometrics',
    PAYMENTS: 'payments',
    SYSTEM: 'system',          // Admin — DevConsole, Settings only
}

// App capability manifests (built-in apps)
export const AppManifests = {
    Camera: [Capabilities.CAMERA, Capabilities.FILES, Capabilities.NOTIFICATIONS],
    Phone: [Capabilities.MICROPHONE, Capabilities.CONTACTS, Capabilities.NETWORK],
    Assistant: [Capabilities.MICROPHONE, Capabilities.NETWORK],
    Files: [Capabilities.FILES],
    Music: [Capabilities.FILES, Capabilities.NETWORK],
    Social: [Capabilities.NETWORK, Capabilities.NOTIFICATIONS],
    Browser: [Capabilities.NETWORK],
    PaymentSystem: [Capabilities.NETWORK, Capabilities.PAYMENTS, Capabilities.BIOMETRICS],
    DevConsole: [Capabilities.SYSTEM],
    Settings: [Capabilities.SYSTEM, Capabilities.NOTIFICATIONS],
    LMS: [Capabilities.NETWORK],
    AppStore: [Capabilities.NETWORK, Capabilities.NOTIFICATIONS],
    LibraryShowcase: [Capabilities.NETWORK],
}

class CapabilityGuard {
    constructor() {
        // Map of "appName:capability" → { granted: bool, grantedAt: ts, usageCount: 0 }
        this._grants = new Map()
        this._auditLog = []
        this._pendingRequests = new Map()    // requestId → { resolve, reject }
        this._promptCallback = null          // Set by UI to show permission dialog
    }

    // ─── Boot ─────────────────────────────────────────────────────────────────

    init() {
        this._load()
        console.info('[AetherGuard] Permission system initialized,', this._grants.size, 'grants loaded')
    }

    // ─── Register UI prompt handler ───────────────────────────────────────────

    /** The UI calls this to register the dialog renderer */
    setPromptHandler(callback) {
        this._promptCallback = callback
    }

    // ─── Capability Checking ──────────────────────────────────────────────────

    /** Check if an app has a capability (no prompt) */
    hasCapability(appName, capability) {
        const key = `${appName}:${capability}`
        return this._grants.get(key)?.granted === true
    }

    /**
     * Request a capability — prompts user if not already granted.
     * Returns a Promise that resolves to true (granted) or false (denied).
     */
    async request(appName, capability) {
        const key = `${appName}:${capability}`
        const existing = this._grants.get(key)

        if (existing) {
            existing.usageCount++
            this._audit(appName, capability, existing.granted ? 'USED' : 'BLOCKED')
            this._save()
            return existing.granted
        }

        // New request — show prompt
        const granted = await this._prompt(appName, capability)
        this._grants.set(key, { granted, grantedAt: Date.now(), usageCount: 1 })
        this._audit(appName, capability, granted ? 'GRANTED' : 'DENIED')
        this._save()
        return granted
    }

    /** Revoke a previously granted capability */
    revoke(appName, capability) {
        const key = `${appName}:${capability}`
        const grant = this._grants.get(key)
        if (grant) {
            grant.granted = false
            this._audit(appName, capability, 'REVOKED')
            this._save()
        }
    }

    /** Grant without prompting (used by Settings / system) */
    grant(appName, capability) {
        const key = `${appName}:${capability}`
        this._grants.set(key, { granted: true, grantedAt: Date.now(), usageCount: 0 })
        this._audit(appName, capability, 'GRANTED_SILENTLY')
        this._save()
    }

    // ─── Inspection ───────────────────────────────────────────────────────────

    getAppGrants(appName) {
        const result = []
        for (const [key, val] of this._grants) {
            if (key.startsWith(appName + ':')) {
                result.push({ capability: key.split(':')[1], ...val })
            }
        }
        return result
    }

    getAllGrants() {
        return Array.from(this._grants.entries()).map(([key, val]) => ({
            app: key.split(':')[0],
            capability: key.split(':')[1],
            ...val,
        }))
    }

    getAuditLog(n = 50) {
        return this._auditLog.slice(-n)
    }

    getManifest(appName) {
        return AppManifests[appName] || []
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    async _prompt(appName, capability) {
        if (this._promptCallback) {
            return new Promise(resolve => this._promptCallback({ appName, capability, resolve }))
        }
        // No UI registered — auto-grant (dev mode)
        console.warn(`[AetherGuard] No prompt UI registered — auto-granting ${capability} to ${appName}`)
        return true
    }

    _audit(appName, capability, action) {
        const entry = { appName, capability, action, ts: Date.now() }
        this._auditLog.push(entry)
        if (this._auditLog.length > 500) this._auditLog.shift()
    }

    _save() {
        try {
            const serializable = Array.from(this._grants.entries())
            localStorage.setItem(GRANTS_KEY, JSON.stringify(serializable))
        } catch (_) { }
    }

    _load() {
        try {
            const raw = localStorage.getItem(GRANTS_KEY)
            if (raw) {
                const entries = JSON.parse(raw)
                this._grants = new Map(entries)
            }
        } catch (_) { this._grants = new Map() }
    }
}

export const AetherGuard = new CapabilityGuard()
