import { useEffect, useRef, useState } from 'react'
import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'
import { useOSStore } from '../store'

// ──────────────────────────────────────────────
// Gesture Event Bus — apps subscribe here
// ──────────────────────────────────────────────
export const gestureEventBus = new EventTarget()

// Helper to fire a gesture event with screen coords + extra data
export const emitGestureEvent = (type, detail) => {
    gestureEventBus.dispatchEvent(new CustomEvent(type, { detail }))
}

export const useHandTracking = () => {
    const videoRef = useRef(null)
    const [hands, setHands] = useState(null)
    const [camera, setCamera] = useState(null)
    const [isTracking, setIsTracking] = useState(false)
    const { setMode, unlock, mode, openApp, activeApp } = useOSStore()

    // Gesture State
    const gestureState = useRef({
        lastHandPosition: null, // {x, y, time}
        zoomStartDistance: null,
        isZooming: false,
        lastSwipeTime: 0
    })

    // Cursor position and state
    const cursorRef = useRef({
        x: 0.5,
        y: 0.5,
        active: false,
        clicked: false,
        isDragging: false,
        landmarks: [],
        secondaryLandmarks: [],
        gesture: null,      // 'swipe_left' | 'swipe_right' | 'swipe_up' | 'swipe_down'
        zoomFactor: 1
    })

    useEffect(() => {
        const handsInstance = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            }
        })

        handsInstance.setOptions({
            maxNumHands: 2,
            modelComplexity: 0,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        })

        handsInstance.onResults(onResults)
        setHands(handsInstance)

        return () => {
            handsInstance.close()
        }
    }, [])

    const onResults = (results) => {
        const now = Date.now()
        let gesture = null
        let zoomFactor = 1

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const validHands = results.multiHandLandmarks.filter(lm => lm[0].y < 0.9)

            if (validHands.length === 0) {
                cursorRef.current.active = false
                gestureState.current.lastHandPosition = null
                return
            }

            const landmarks1 = validHands[0]
            const landmarks2 = validHands.length > 1 ? validHands[1] : null

            // --- 1. Cursor Logic (Primary Hand) ---
            const indexTip = landmarks1[8]
            const cursorX = 1 - indexTip.x
            const cursorY = indexTip.y

            // Pinch
            const thumbTip = landmarks1[4]
            const pinchDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y)
            const PINCH_THRESHOLD = 0.08
            const isPinching = pinchDist < PINCH_THRESHOLD

            // Click/Drag State Machine
            const prev = cursorRef.current
            let clicked = false
            let isDragging = prev.isDragging

            if (isPinching) {
                if (!prev.isDragging && !prev.clicked) {
                    clicked = true
                    isDragging = true
                } else {
                    isDragging = true
                    clicked = false
                }
            } else {
                isDragging = false
                clicked = false
            }

            // --- 2. SWIPE Gesture (Primary Hand Movement — both axes) ---
            if (!isDragging && !landmarks2) {
                const handCenter = landmarks1[9] // Middle finger MCP

                if (gestureState.current.lastHandPosition) {
                    const last = gestureState.current.lastHandPosition
                    const dx = handCenter.x - last.x
                    const dy = handCenter.y - last.y
                    const dt = now - last.time

                    const velocityX = dx / dt
                    const velocityY = dy / dt

                    const SWIPE_VEL = 0.002
                    const DEBOUNCE = 500

                    if (dt > 20 && now - gestureState.current.lastSwipeTime > DEBOUNCE) {
                        const absX = Math.abs(velocityX)
                        const absY = Math.abs(velocityY)

                        if (absX > SWIPE_VEL || absY > SWIPE_VEL) {
                            // Dominant axis wins
                            if (absX >= absY) {
                                gesture = velocityX > 0 ? 'swipe_right' : 'swipe_left'
                            } else {
                                // Y axis: positive = downward in image = user hand moving down
                                gesture = velocityY > 0 ? 'swipe_down' : 'swipe_up'
                            }
                            gestureState.current.lastSwipeTime = now
                            console.log('[Gesture]', gesture)
                        }
                    }
                }
                gestureState.current.lastHandPosition = { x: handCenter.x, y: handCenter.y, time: now }
            } else {
                gestureState.current.lastHandPosition = null
            }

            // --- 3. ZOOM Gesture (Two Hands) ---
            if (landmarks2) {
                const p1 = landmarks1[9]
                const p2 = landmarks2[9]
                const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)

                if (!gestureState.current.isZooming) {
                    gestureState.current.isZooming = true
                    gestureState.current.zoomStartDistance = dist
                } else {
                    const start = gestureState.current.zoomStartDistance
                    if (start > 0.01) {
                        zoomFactor = dist / start
                        zoomFactor = Math.min(Math.max(zoomFactor, 0.5), 2)
                    }
                }
            } else {
                gestureState.current.isZooming = false
                gestureState.current.zoomStartDistance = null
            }

            // Unlock Logic
            const isHandOpen = !isPinching
            if (activeApp === null && mode === 'locked' && isHandOpen && !landmarks2) {
                unlock()
            }

            cursorRef.current = {
                x: cursorX,
                y: cursorY,
                active: true,
                clicked: clicked,
                isDragging: isDragging,
                landmarks: landmarks1,
                secondaryLandmarks: landmarks2,
                gesture: gesture,
                zoomFactor: zoomFactor
            }
        } else {
            cursorRef.current.active = false
            gestureState.current.lastHandPosition = null
        }
    }

    const startVideo = () => {
        if (videoRef.current && hands) {
            const cam = new Camera(videoRef.current, {
                onFrame: async () => {
                    await hands.send({ image: videoRef.current })
                },
                width: 640,
                height: 480
            })
            cam.start()
            setCamera(cam)
            setIsTracking(true)
        }
    }

    const stopVideo = () => {
        if (camera) {
            camera.stop()
            setCamera(null)
            setIsTracking(false)
        }
    }

    const toggleTracking = () => {
        if (isTracking) {
            stopVideo()
        } else {
            startVideo()
        }
    }

    return {
        videoRef,
        isTracking,
        toggleTracking,
        startVideo,
        cursorRef,
        hands
    }
}
