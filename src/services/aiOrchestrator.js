export const AIOrchestrator = {
    /**
     * Parses a natural language user command and returns an actionable intent.
     * @param {string} input - The user's input text.
     * @returns {Object} - { type, payload, response }
     */
    processCommand: (input) => {
        const lower = input.toLowerCase().trim()

        // --- App Launching ---
        const launchMatch = lower.match(/^(open|launch|start|run)\s+(.+)/)
        if (launchMatch) {
            const appName = mapAppName(launchMatch[2])
            return {
                type: 'LAUNCH_APP',
                payload: { appName },
                response: `Opening ${appName}...`
            }
        }

        // --- App Closing ---
        const closeMatch = lower.match(/^(close|exit|quit|stop)\s+(.+)/)
        if (closeMatch) {
            const appName = mapAppName(closeMatch[2])
            return {
                type: 'CLOSE_APP',
                payload: { appName },
                response: `Closing ${appName}...`
            }
        }

        // --- System Controls: Volume ---
        // "Set volume to 50", "Volume 50%", "Mute volume"
        if (lower.includes('volume')) {
            if (lower.includes('mute') || lower.includes('silence')) {
                return {
                    type: 'SET_VOLUME',
                    payload: { level: 0 },
                    response: "Muting volume."
                }
            }
            const volMatch = lower.match(/(\d+)/)
            if (volMatch) {
                let level = parseInt(volMatch[0])
                level = Math.max(0, Math.min(100, level)) // Clamp 0-100
                return {
                    type: 'SET_VOLUME',
                    payload: { level },
                    response: `Setting volume to ${level}%.`
                }
            }
        }

        // --- System Controls: Brightness ---
        if (lower.includes('brightness') || lower.includes('dim')) {
            const brightMatch = lower.match(/(\d+)/)
            if (brightMatch) {
                let level = parseInt(brightMatch[0])
                level = Math.max(0, Math.min(100, level))
                return {
                    type: 'SET_BRIGHTNESS',
                    payload: { level },
                    response: `Setting brightness to ${level}%.`
                }
            }
        }

        // --- System Controls: Wallpaper ---
        if (lower.includes('wallpaper') || lower.includes('background')) {
            if (lower.includes('city')) return { type: 'SET_WALLPAPER', payload: { id: 'city' }, response: "Changing wallpaper to City." }
            if (lower.includes('sunset')) return { type: 'SET_WALLPAPER', payload: { id: 'sunset' }, response: "Changing wallpaper to Sunset." }
            if (lower.includes('nebula')) return { type: 'SET_WALLPAPER', payload: { id: 'nebula' }, response: "Changing wallpaper to Nebula." }
        }

        // --- Information & Chit-Chat ---
        if (lower.includes('time')) {
            return {
                type: 'QA',
                payload: {},
                response: `It is currently ${new Date().toLocaleTimeString()}.`
            }
        }

        if (lower.includes('date') || lower.includes('day')) {
            return {
                type: 'QA',
                payload: {},
                response: `Today is ${new Date().toLocaleDateString()}.`
            }
        }

        if (lower.includes('joke')) {
            const jokes = [
                "Why do programmers prefer dark mode? Because light attracts bugs.",
                "I would tell you a UDP joke, but you might not get it.",
                "Why did the React component feel lost? It didn't know where to render."
            ]
            return {
                type: 'QA',
                payload: {},
                response: jokes[Math.floor(Math.random() * jokes.length)]
            }
        }

        // --- Fallback ---
        return {
            type: 'UNKNOWN',
            payload: {},
            response: "I'm not sure how to do that yet."
        }
    }
}

// Helper: Map common names to internal App IDs
const mapAppName = (name) => {
    const n = name.toLowerCase().replace(/[^\w\s]/g, '') // remove punctuation

    if (n.includes('setting') || n.includes('config')) return 'Settings'
    if (n.includes('file') || n.includes('folder') || n.includes('explorer')) return 'Files'
    if (n.includes('music') || n.includes('song') || n.includes('audio') || n.includes('player')) return 'Music'
    if (n.includes('browser') || n.includes('internet') || n.includes('web')) return 'Browser'
    if (n.includes('camera') || n.includes('photo') || n.includes('video')) return 'Camera'
    if (n.includes('store') || n.includes('app') || n.includes('download')) return 'AppStore'
    if (n.includes('console') || n.includes('terminal') || n.includes('dev') || n.includes('command')) return 'DevConsole'
    if (n.includes('lms') || n.includes('course') || n.includes('learn') || n.includes('school')) return 'LMS'

    // Default: Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1)
}
