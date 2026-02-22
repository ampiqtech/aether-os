import { useState, useRef, useEffect } from 'react'
import { useOSStore } from '../../store'

const s = {
    wrap: {
        width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.97)',
        color: '#00ff88',
        fontFamily: '"JetBrains Mono", "Fira Mono", "Courier New", monospace',
        fontSize: 13,
        display: 'flex', flexDirection: 'column',
        borderRadius: 16,
        border: '1px solid rgba(0,255,136,0.25)',
        boxShadow: '0 0 32px rgba(0,255,136,0.12)',
        overflow: 'hidden',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 16px',
        borderBottom: '1px solid rgba(0,255,136,0.15)',
        background: 'rgba(0,255,136,0.04)',
        userSelect: 'none', flexShrink: 0,
    },
    title: {
        display: 'flex', alignItems: 'center', gap: 8,
        color: '#00ff88', fontWeight: 700, letterSpacing: '0.06em', fontSize: 12,
    },
    closeBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'rgba(0,255,136,0.5)', fontSize: 16, padding: '2px 6px',
        borderRadius: 4, lineHeight: 1,
        transition: 'background 0.15s',
    },
    output: {
        flex: 1, overflowY: 'auto', padding: '12px 16px',
        display: 'flex', flexDirection: 'column', gap: 2,
    },
    line: {
        lineHeight: 1.6, wordBreak: 'break-all', whiteSpace: 'pre-wrap',
        padding: '1px 0',
    },
    inputRow: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px',
        borderTop: '1px solid rgba(0,255,136,0.15)',
        background: 'rgba(0,255,136,0.03)',
        flexShrink: 0,
    },
    prompt: { color: '#00ff88', fontWeight: 700, userSelect: 'none' },
    input: {
        flex: 1, background: 'transparent', border: 'none', outline: 'none',
        color: '#fff', fontFamily: 'inherit', fontSize: 13,
        caretColor: '#00ff88',
    },
}

const lineColor = (type) => ({
    input: 'rgba(255,255,255,0.7)',
    error: '#ff5555',
    warn: '#ffb86c',
    success: '#50fa7b',
    code: '#8be9fd',
    matrix: '#00ff88',
    info: 'rgba(0,255,136,0.7)',
    text: 'rgba(255,255,255,0.85)',
}[type] || '#00ff88')

const BANNER = [
    '╔══════════════════════════════════════╗',
    '║   AETHER ENGINE v1.0 "Nova"          ║',
    '║   Kernel Process Console             ║',
    '╚══════════════════════════════════════╝',
    'Type "help" for commands.',
    '',
]

export const DevConsole = ({ onClose }) => {
    const [history, setHistory] = useState(BANNER.map(l => ({ type: 'info', content: l })))
    const [input, setInput] = useState('')
    const [cmdHistory, setCmdHistory] = useState([])
    const [cmdIdx, setCmdIdx] = useState(-1)
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [history])

    const push = (...lines) => setHistory(prev => [...prev, ...lines])

    const execute = (cmd) => {
        const trimmed = cmd.trim()
        if (!trimmed) return
        setCmdHistory(prev => [trimmed, ...prev.slice(0, 49)])
        setCmdIdx(-1)

        push({ type: 'input', content: `> ${trimmed}` })

        const parts = trimmed.split(' ')
        const command = parts[0].toLowerCase()
        const args = parts.slice(1)

        try {
            switch (command) {
                case 'help': {
                    push({
                        type: 'info', content: `
SYSTEM COMMANDS:
  help            — This message
  clear           — Clear terminal
  echo [msg]      — Print message

ENGINE COMMANDS:
  ps              — Show process table
  kill [pid]      — Terminate process by PID
  launch [app]    — Launch an app
  top             — Live process stats
  predict         — AI next-app predictions
  usage           — App usage statistics
  grants          — Permission grants
  ls [path]       — List files (aether://documents etc.)
  engine          — Full engine stats

SYSTEM:
  bg [name]       — Wallpaper (city/sunset/nebula)
  lock / unlock   — Lock/unlock OS
  js [code]       — Execute raw JavaScript
  version         — Engine version` })
                    break
                }
                case 'clear': {
                    setHistory([])
                    return
                }
                case 'echo': {
                    push({ type: 'text', content: args.join(' ') })
                    break
                }
                case 'ps': {
                    const kernel = window.AetherEngine?.kernel
                    if (kernel) {
                        const procs = kernel.getProcesses()
                        if (procs.length === 0) {
                            push({ type: 'info', content: 'No running processes.' })
                        } else {
                            push({ type: 'info', content: 'PID  NAME              STATE       CPU%   MEM' })
                            push({ type: 'info', content: '─────────────────────────────────────────────' })
                            procs.forEach(p => {
                                push({ type: 'success', content: `${String(p.pid).padEnd(5)}${p.name.padEnd(18)}${(p.state || '').padEnd(12)}${(p.cpuPercent?.toFixed(1) || '0').padEnd(7)}${(p.memEstimate || 0) + 'MB'}` })
                            })
                        }
                    } else {
                        push({ type: 'warn', content: 'AetherEngine not initialized yet.' })
                    }
                    break
                }
                case 'top': {
                    window.AetherEngine?.kernel?.top()
                    push({ type: 'info', content: 'Process table logged to browser DevTools (F12).' })
                    break
                }
                case 'kill': {
                    const pid = parseInt(args[0])
                    if (isNaN(pid)) {
                        push({ type: 'error', content: 'Usage: kill [pid]' })
                    } else {
                        const success = window.AetherEngine?.kernel?.kill(pid)
                        if (success) {
                            useOSStore.getState().closeApp(pid)
                            push({ type: 'warn', content: `Process ${pid} terminated.` })
                        } else {
                            push({ type: 'error', content: `No process with PID ${pid}.` })
                        }
                    }
                    break
                }
                case 'launch': {
                    if (!args[0]) {
                        push({ type: 'error', content: 'Usage: launch [AppName]' })
                    } else {
                        const appName = args[0].charAt(0).toUpperCase() + args[0].slice(1)
                        useOSStore.getState().launchApp(appName)
                        push({ type: 'success', content: `Launching ${appName}...` })
                    }
                    break
                }
                case 'predict': {
                    const preds = window.AetherEngine?.context?.predict(5)
                    if (preds?.length) {
                        push({ type: 'info', content: 'Next-app predictions:' })
                        preds.forEach((p, i) => push({ type: 'success', content: `  ${i + 1}. ${p.app} (score: ${p.score})` }))
                    } else {
                        push({ type: 'warn', content: 'Not enough usage data yet. Launch some apps first.' })
                    }
                    break
                }
                case 'usage': {
                    const stats = window.AetherEngine?.context?.getUsageStats() || []
                    if (stats.length) {
                        push({ type: 'info', content: 'APP USAGE STATISTICS:' })
                        stats.slice(0, 10).forEach(s => push({ type: 'success', content: `  ${s.app.padEnd(20)} ${s.count} launches` }))
                    } else {
                        push({ type: 'warn', content: 'No usage data yet.' })
                    }
                    break
                }
                case 'grants': {
                    const grants = window.AetherEngine?.guard?.getAllGrants() || []
                    if (grants.length) {
                        push({ type: 'info', content: 'CAPABILITY GRANTS:' })
                        grants.forEach(g => push({ type: g.granted ? 'success' : 'error', content: `  [${g.granted ? 'GRANTED' : 'DENIED '}] ${g.app} → ${g.capability}` }))
                    } else {
                        push({ type: 'info', content: 'No capability grants recorded yet.' })
                    }
                    break
                }
                case 'ls': {
                    const path = args[0] || 'aether://documents'
                    push({ type: 'info', content: `Listing ${path}...` })
                    window.AetherEngine?.fs?.ls(path).then(files => {
                        if (!files || files.length === 0) {
                            push({ type: 'warn', content: '  (empty)' })
                        } else {
                            files.forEach(f => push({ type: 'text', content: `  ${f.name.padEnd(30)} ${(f.size / 1024).toFixed(1)}KB` }))
                        }
                    }).catch(e => push({ type: 'error', content: e.message }))
                    break
                }
                case 'engine': {
                    const stats = window.AetherEngine?.getStats()
                    if (stats) {
                        push({ type: 'info', content: `Aether Engine v${stats.version} "${stats.codename}"` })
                        push({ type: 'success', content: `  Uptime: ${stats.uptime}` })
                        push({ type: 'success', content: `  Processes: ${stats.processes}` })
                        push({ type: 'success', content: `  Permissions: ${stats.permissions}` })
                        if (stats.topApps?.length) push({ type: 'success', content: `  Top Apps: ${stats.topApps.map(a => a.app).join(', ')}` })
                    } else {
                        push({ type: 'warn', content: 'Engine not initialized.' })
                    }
                    break
                }
                case 'version': {
                    push({ type: 'success', content: `Aether Engine v${window.AetherEngine?.version || '1.0.0'} "${window.AetherEngine?.codename || 'Nova'}"` })
                    break
                }
                case 'bg': {
                    if (args[0]) {
                        useOSStore.getState().setWallpaper(args[0])
                        push({ type: 'success', content: `Wallpaper set to ${args[0]}` })
                    } else {
                        push({ type: 'error', content: 'Usage: bg [city|sunset|nebula]' })
                    }
                    break
                }
                case 'lock': {
                    useOSStore.getState().lock()
                    push({ type: 'warn', content: 'System locked.' })
                    break
                }
                case 'unlock': {
                    useOSStore.getState().unlock()
                    push({ type: 'success', content: 'System unlocked.' })
                    break
                }
                case 'js': {
                    try {
                        // eslint-disable-next-line no-eval
                        const result = eval(args.join(' '))
                        push({ type: 'code', content: `← ${JSON.stringify(result, null, 2)}` })
                    } catch (e) {
                        push({ type: 'error', content: `JS Error: ${e.message}` })
                    }
                    break
                }
                default: {
                    // Try as a raw JS expression via window.aether shortcuts
                    push({ type: 'error', content: `Unknown command: "${command}". Type "help" for commands.` })
                }
            }
        } catch (err) {
            push({ type: 'error', content: `System Error: ${err.message}` })
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            execute(input)
            setInput('')
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            const next = Math.min(cmdIdx + 1, cmdHistory.length - 1)
            setCmdIdx(next)
            setInput(cmdHistory[next] || '')
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            const next = Math.max(cmdIdx - 1, -1)
            setCmdIdx(next)
            setInput(next === -1 ? '' : cmdHistory[next] || '')
        }
    }

    return (
        <div style={s.wrap}>
            {/* Header */}
            <div style={s.header}>
                <div style={s.title}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, animation: 'pulse 1.5s ease infinite' }}>terminal</span>
                    root@aether:~
                </div>
                <button style={s.closeBtn} onClick={onClose}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,136,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    ×
                </button>
            </div>

            {/* Output */}
            <div style={s.output}>
                {history.map((line, i) => (
                    <div key={i} style={{ ...s.line, color: lineColor(line.type) }}>
                        {line.content}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={s.inputRow}>
                <span style={s.prompt}>❯</span>
                <input
                    autoFocus
                    style={s.input}
                    value={input}
                    placeholder="type a command..."
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    autoComplete="off"
                />
            </div>
        </div>
    )
}
