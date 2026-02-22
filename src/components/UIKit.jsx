/**
 * Aether OS — UIKit
 * Shared premium glass UI components used across all built-in apps.
 * Import from: '../components/UIKit' or './UIKit'
 */
import { useRef } from 'react'
import { useGesture } from '../hooks/useGesture'

// ── GestureApp ─────────────────────────────────────────────────────────
/**
 * Wrap any app's root element with <GestureApp> to automatically get:
 *  - swipe up/down → scroll content inside the app
 *  - custom gesture handlers via the `gestures` prop
 *
 * Example:
 *   <GestureApp gestures={{ onSwipeLeft: goBack, onSwipeRight: goForward }}>
 *     ...your app content...
 *   </GestureApp>
 *
 * The component acts as a transparent full-size container that forwards
 * all gestures spatially (only fires when cursor is inside *this* app).
 */
export const GestureApp = ({ children, gestures = {}, className = '', style = {} }) => {
    const containerRef = useRef(null)

    // Built-in: scroll when swiping up/down over any scrollable child
    useGesture({
        onSwipeUp: () => {
            const el = containerRef.current?.querySelector('[data-scroll], .overflow-y-auto, .overflow-auto, [style*="overflow"]')
            el?.scrollBy({ top: -120, behavior: 'smooth' })
        },
        onSwipeDown: () => {
            const el = containerRef.current?.querySelector('[data-scroll], .overflow-y-auto, .overflow-auto, [style*="overflow"]')
            el?.scrollBy({ top: 120, behavior: 'smooth' })
        },
        // Spread in any extra handlers the app wants
        ...gestures,
    }, containerRef)

    return (
        <div
            ref={containerRef}
            className={`h-full w-full ${className}`}
            style={style}
        >
            {children}
        </div>
    )
}


// ── GlassCard ─────────────────────────────────────────────────────────
export const GlassCard = ({ children, className = '', style = {}, onClick, hover = true }) => (
    <div
        className={`ui-card ${hover ? '' : 'hover:bg-[rgba(255,255,255,0.04)]'} ${className}`}
        style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
        onClick={onClick}
    >
        {children}
    </div>
)

// ── GlassButton ───────────────────────────────────────────────────────
export const GlassButton = ({
    children, variant = 'primary', icon, onClick, disabled = false,
    size = 'md', style = {}, className = ''
}) => {
    const sizeMap = {
        sm: { padding: '5px 12px', fontSize: 12, height: 30 },
        md: { padding: '8px 18px', fontSize: 14, height: 38 },
        lg: { padding: '10px 24px', fontSize: 15, height: 44 },
    }
    return (
        <button
            className={`ui-btn ui-btn-${variant} ${className}`}
            style={{
                ...sizeMap[size],
                opacity: disabled ? 0.45 : 1,
                pointerEvents: disabled ? 'none' : 'auto',
                ...style,
            }}
            onClick={onClick}
            disabled={disabled}
        >
            {icon && (
                <span className="material-symbols-outlined" style={{ fontSize: sizeMap[size].fontSize + 2 }}>
                    {icon}
                </span>
            )}
            {children}
        </button>
    )
}

// ── StatusBadge ───────────────────────────────────────────────────────
export const StatusBadge = ({ label, color = 'cyan' }) => (
    <span className={`ui-badge ui-badge-${color}`}>{label}</span>
)

// ── TagChip ───────────────────────────────────────────────────────────
export const TagChip = ({ label, icon, onRemove }) => (
    <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 999, padding: '2px 10px',
        fontSize: 12, color: 'rgba(255,255,255,0.7)',
        fontFamily: 'Outfit, sans-serif',
    }}>
        {icon && (
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{icon}</span>
        )}
        {label}
        {onRemove && (
            <button onClick={onRemove} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)', padding: 0, display: 'flex',
                fontSize: 12, marginLeft: 2,
            }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
            </button>
        )}
    </div>
)

// ── AvatarIcon ────────────────────────────────────────────────────────
export const AvatarIcon = ({ icon, color = '#3d86f2', size = 36 }) => (
    <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `${color}22`,
        border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    }}>
        <span className="material-symbols-outlined" style={{ fontSize: size * 0.5, color }}>
            {icon}
        </span>
    </div>
)

// ── Divider ───────────────────────────────────────────────────────────
export const Divider = ({ vertical = false, style = {} }) => (
    <div
        className="ui-divider"
        style={{
            ...(vertical ? { width: 1, height: '100%', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent)', margin: '0 8px' } : {}),
            ...style,
        }}
    />
)

// ── ProgressBar ───────────────────────────────────────────────────────
export const ProgressBar = ({ value, max = 100, color = 'var(--accent-blue)', style = {} }) => (
    <div className="ui-progress-track" style={style}>
        <div
            className="ui-progress-fill"
            style={{
                width: `${Math.min(100, (value / max) * 100)}%`,
                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            }}
        />
    </div>
)

// ── GlassInput ────────────────────────────────────────────────────────
export const GlassInput = ({ placeholder, value, onChange, type = 'text', icon, style = {} }) => (
    <div style={{ position: 'relative', ...style }}>
        {icon && (
            <span className="material-symbols-outlined" style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 16, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
            }}>
                {icon}
            </span>
        )}
        <input
            className="ui-input"
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            style={{ paddingLeft: icon ? 36 : undefined }}
        />
    </div>
)

// ── SectionHeader ─────────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
            <h3 style={{
                fontSize: 15, fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'Outfit, sans-serif',
                margin: 0, lineHeight: 1.3,
            }}>
                {title}
            </h3>
            {subtitle && (
                <p style={{
                    fontSize: 12, color: 'rgba(255,255,255,0.4)',
                    fontFamily: 'Outfit, sans-serif', margin: '2px 0 0',
                }}>
                    {subtitle}
                </p>
            )}
        </div>
        {action}
    </div>
)

// ── InfoRow ───────────────────────────────────────────────────────────
export const InfoRow = ({ label, value, icon }) => (
    <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon && (
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>
                    {icon}
                </span>
            )}
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontFamily: 'Outfit, sans-serif' }}>
                {label}
            </span>
        </div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
            {value}
        </span>
    </div>
)

// ── EmptyState ────────────────────────────────────────────────────────
export const EmptyState = ({ icon = 'inbox', title = 'Nothing here', subtitle = '' }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.35)',
    }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.4 }}>{icon}</span>
        <div>
            <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Outfit, sans-serif', margin: 0 }}>{title}</p>
            {subtitle && <p style={{ fontSize: 12, margin: '4px 0 0', opacity: 0.7 }}>{subtitle}</p>}
        </div>
    </div>
)
