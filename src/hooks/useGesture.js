import { useEffect, useRef } from 'react'
import { gestureEventBus } from './useHandTracking'

/**
 * useGesture — subscribe to gesture events from the OS gesture system.
 *
 * Pass a handlers object with any of:
 *   onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onPinch
 *
 * Each handler receives: { screenX, screenY, gesture }
 *
 * Optionally pass `containerRef` (a React ref to a DOM element) to
 * restrict gesture events to only fire when the cursor is inside that element.
 *
 * Example:
 *   const containerRef = useRef()
 *   useGesture({
 *     onSwipeLeft: () => goBack(),
 *     onSwipeRight: () => goForward(),
 *     onSwipeUp: () => scrollUp(),
 *     onSwipeDown: () => scrollDown(),
 *   }, containerRef)
 */
export const useGesture = (handlers, containerRef = null) => {
    const handlersRef = useRef(handlers)
    handlersRef.current = handlers // always up-to-date without re-subscribing

    useEffect(() => {
        const isInside = (screenX, screenY) => {
            if (!containerRef?.current) return true // no container = global
            const rect = containerRef.current.getBoundingClientRect()
            return (
                screenX >= rect.left && screenX <= rect.right &&
                screenY >= rect.top && screenY <= rect.bottom
            )
        }

        const makeListener = (eventName, handlerKey) => {
            const fn = (e) => {
                const h = handlersRef.current[handlerKey]
                if (!h) return
                const { screenX, screenY } = e.detail
                if (isInside(screenX, screenY)) h(e.detail)
            }
            gestureEventBus.addEventListener(eventName, fn)
            return () => gestureEventBus.removeEventListener(eventName, fn)
        }

        const cleanups = [
            makeListener('swipe_left', 'onSwipeLeft'),
            makeListener('swipe_right', 'onSwipeRight'),
            makeListener('swipe_up', 'onSwipeUp'),
            makeListener('swipe_down', 'onSwipeDown'),
            makeListener('pinch', 'onPinch'),
        ]

        return () => cleanups.forEach(fn => fn())
    }, [containerRef]) // only re-subscribe if containerRef changes
}
