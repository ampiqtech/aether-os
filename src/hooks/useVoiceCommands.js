import { useEffect, useRef } from 'react'
import { useOSStore } from '../store'

export const useVoiceCommands = () => {
    const { isListening, setMode, setIsListening, openApp, lock } = useOSStore()
    const recognitionRef = useRef(null)

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) {
            console.warn('Web Speech API not supported in this browser.')
            return
        }

        const recognition = new window.webkitSpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onstart = () => {
            console.log('Voice recognition started')
            setIsListening(true)
        }

        recognition.onend = () => {
            console.log('Voice recognition ended')
            if (isListening) {
                // recognition.start() 
                setIsListening(false)
            }
        }

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase()
            console.log('Voice Command:', transcript)

            if (transcript.includes('wake up') || transcript.includes('open')) {
                setMode('home')
            }

            if (transcript.includes('sleep') || transcript.includes('lock')) {
                lock()
            }

            if (transcript.includes('browser')) {
                openApp('Browser')
            }
        }

        recognitionRef.current = recognition

        return () => {
            recognition.stop()
        }
    }, [setMode, setIsListening]) // Re-create if these change (they shouldn't)

    // Effect to toggle based on store state
    useEffect(() => {
        const recognition = recognitionRef.current
        if (!recognition) return

        if (isListening) {
            try {
                recognition.start()
            } catch (e) {
                // Ignore error if already started
            }
        } else {
            recognition.stop()
        }
    }, [isListening])
}
