/**
 * AetherContext — AI Context Engine
 * Learns user habits, predicts next actions, feeds context to Gemini.
 * This is Aether's biggest competitive advantage over iOS/Android/Windows —
 * the OS itself is intelligent, not just an assistant running on top of it.
 */

const STORAGE_KEY = 'aether_context_v1'

class ContextEngine {
    constructor() {
        this._launchHistory = []      // { app, ts, hour, dayOfWeek }
        this._sessionStart = Date.now()
        this._predictions = []
    }

    // ─── Boot ─────────────────────────────────────────────────────────────────

    init() {
        this._load()
        console.info('[AetherContext] Initialized with', this._launchHistory.length, 'historical launches')
    }

    // ─── Recording ────────────────────────────────────────────────────────────

    recordLaunch(appName) {
        const now = new Date()
        const entry = {
            app: appName,
            ts: now.getTime(),
            hour: now.getHours(),
            dayOfWeek: now.getDay(),   // 0=Sun, 6=Sat
            session: this._sessionStart,
        }
        this._launchHistory.push(entry)
        // Keep last 500 launches
        if (this._launchHistory.length > 500) this._launchHistory.shift()
        this._save()
        this._updatePredictions()
    }

    // ─── Prediction ───────────────────────────────────────────────────────────

    predict(topN = 3) {
        return this._predictions.slice(0, topN)
    }

    /** Returns a rich context string for the Gemini system prompt */
    getSystemContext() {
        const now = new Date()
        const hour = now.getHours()
        const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'
        const recentApps = this._launchHistory.slice(-5).map(e => e.app).join(', ')
        const predicted = this.predict(3).map(p => p.app).join(', ')
        const totalApps = this._launchHistory.length

        return [
            `Current time: ${now.toLocaleTimeString()} (${timeOfDay})`,
            `Date: ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`,
            `Recently used apps: ${recentApps || 'none'}`,
            `Predicted next apps: ${predicted || 'unknown'}`,
            `Session uptime: ${Math.round((Date.now() - this._sessionStart) / 60000)} minutes`,
            `Total recorded app launches: ${totalApps}`,
        ].join('\n')
    }

    // ─── Usage Stats ──────────────────────────────────────────────────────────

    getUsageStats() {
        const counts = {}
        for (const entry of this._launchHistory) {
            counts[entry.app] = (counts[entry.app] || 0) + 1
        }
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([app, count]) => ({ app, count }))
    }

    getHeatmap() {
        // Returns a 24-element array of activity counts per hour
        const heatmap = Array(24).fill(0)
        for (const e of this._launchHistory) heatmap[e.hour]++
        return heatmap
    }

    getHistory(n = 20) {
        return this._launchHistory.slice(-n).reverse()
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    _updatePredictions() {
        const now = new Date()
        const hour = now.getHours()
        const day = now.getDay()

        // Score each app by: recency + time-of-day match + day-of-week match
        const scores = {}
        const total = this._launchHistory.length

        this._launchHistory.forEach((e, idx) => {
            const recencyScore = (idx / total) * 10          // recent launches score higher
            const hourDiff = Math.abs(e.hour - hour)
            const timeScore = Math.max(0, 5 - hourDiff)      // same hour = +5
            const dayScore = e.dayOfWeek === day ? 2 : 0     // same day of week = +2

            scores[e.app] = (scores[e.app] || 0) + recencyScore + timeScore + dayScore
        })

        this._predictions = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .map(([app, score]) => ({ app, score: Math.round(score) }))
    }

    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._launchHistory))
        } catch (_) { /* storage quota */ }
    }

    _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) this._launchHistory = JSON.parse(raw)
            this._updatePredictions()
        } catch (_) { this._launchHistory = [] }
    }
}

export const AetherContext = new ContextEngine()
