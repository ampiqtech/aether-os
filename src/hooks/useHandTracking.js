import { useEffect, useRef, useState } from 'react'
import * as handTrack from 'handtrackjs'
import { useOSStore } from '../store'

// Default model params
const modelParams = {
    flipHorizontal: true,   // flip e.g for video 
    imageScaleFactor: 0.7,  // reduce input image size for gains in speed.
    maxNumBoxes: 1,         // maximum number of boxes to detect
    iouThreshold: 0.5,      // ioU threshold for non-max suppression
    scoreThreshold: 0.79,   // confidence threshold for predictions.
}

export const useHandTracking = () => {
    const videoRef = useRef(null)
    const [model, setModel] = useState(null)
    const [isTracking, setIsTracking] = useState(false)
    const requestRef = useRef(null)
    const { setMode, unlock, mode } = useOSStore()

    // Cursor position (normalized 0-1)
    const cursorRef = useRef({ x: 0.5, y: 0.5, active: false })

    useEffect(() => {
        // Load the model
        handTrack.load(modelParams).then(lModel => {
            console.log("Handtrack Model loaded")
            setModel(lModel)
        })
    }, [])

    const startVideo = () => {
        if (!model || !videoRef.current) return

        handTrack.startVideo(videoRef.current).then(status => {
            if (status) {
                setIsTracking(true)
                runDetection()
            }
        })
    }

    const runDetection = () => {
        if (!model || !videoRef.current) return

        model.detect(videoRef.current).then(predictions => {
            if (predictions.length > 0) {
                // Get the first hand
                const hand = predictions[0]
                const [x, y, width, height] = hand.bbox

                // Calculate center
                const centerX = x + width / 2
                const centerY = y + height / 2

                // Normalize based on video dimensions (usually 640x480)
                const normX = centerX / videoRef.current.videoWidth
                const normY = centerY / videoRef.current.videoHeight

                cursorRef.current = { x: normX, y: normY, active: true }

                // Simple Gesture: Open Hand vs Closed? 
                // Handtrackjs gives labels like 'open', 'closed', 'pinch', 'point'
                // Check label
                if (hand.label === 'open' || hand.label === 'point') {
                    if (mode === 'locked') {
                        unlock()
                    }
                }

                // Pinch/Click Logic:
                // We map cursor to screen coordinates (assuming full screen for simplicity for now, 
                // but since we are in a canvas, it's relative. However, for a 2D overlay mouse, relative is fine)
                // Actually, for "Air Mouse", we need to know where the cursor is ON SCREEN.
                // Our cursorRef.x/y is 0-1 normalized.
                if (hand.label === 'pinch' || hand.label === 'closed') {
                    // Provide a visual cue or trigger logic in the consuming component
                    cursorRef.current.clicked = true
                } else {
                    cursorRef.current.clicked = false
                }
            } else {
                cursorRef.current.active = false
            }

            if (requestRef.current !== null) { // Check if we should stop
                requestRef.current = requestAnimationFrame(runDetection)
            }
        })
    }

    // Toggle tracking
    const toggleTracking = () => {
        if (isTracking) {
            handTrack.stopVideo(videoRef.current)
            setIsTracking(false)
            requestRef.current = null // Stop loop
        } else {
            startVideo()
        }
    }

    useEffect(() => {
        return () => {
            // Cleanup
            // handTrack.stopVideo(videoRef.current) // logic handled in toggle or unmount
            setIsTracking(false)
            requestRef.current = null
        }
    }, [])

    return {
        videoRef,
        isTracking,
        toggleTracking,
        cursorRef
    }
}
