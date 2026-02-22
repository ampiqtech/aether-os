import { useEffect, useRef, useState } from 'react'
import { useOSStore } from '../store'

export const useVoiceCommands = () => {
    const {
        isListening, setIsListening,
        setMode, openApp, lock,
        processes, activePid,
        setAiState, setAiMessage
    } = useOSStore()

    const recognitionRef = useRef(null)
    const synthesisRef = useRef(window.speechSynthesis)

    // Voices for TTS
    const [voice, setVoice] = useState(null)

    useEffect(() => {
        // Load voices
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices()
            // Try to find a good English voice (e.g., Google US English, Microsoft Zira/David)
            const preferred = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'))
                || voices.find(v => v.lang === 'en-US')
                || voices[0]
            setVoice(preferred)
        }

        loadVoices()
        window.speechSynthesis.onvoiceschanged = loadVoices

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            console.warn('Web Speech API not supported.')
            return
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onstart = () => {
            setIsListening(true)
        }

        recognition.onend = () => {
            // Restart strictly if supposed to be listening
            if (isListening) recognition.start()
        }

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase()
            console.log('Heard:', transcript)

            // 1. Check for Wake Word
            const wakeWords = ['aether', 'ether', 'heather', 'computer', 'system', 'jarvis', 'wake up', 'wake']
            const detectedWakeWord = wakeWords.find(w => transcript.includes(w))

            if (detectedWakeWord) {
                // If the wake word was "wake up", ensure we unlock/go home
                if (detectedWakeWord === 'wake up' || detectedWakeWord === 'wake') {
                    setMode('home')
                    speak("System online.")
                    setAiState('listening') // Ensure we stay listening
                    return // Stop processing other commands for this utterance to be safe, or continue if you want "wake up and open browser"
                }

                // Parse command after wake word
                const command = transcript.split(detectedWakeWord)[1]?.trim()

                if (command) {
                    processCommand(command)
                } else {
                    // Woke up but no command yet
                    speak("I'm listening.")
                    setAiState('listening')
                }
            }
            // Optional: If already in "listening" mode (e.g. after a prompt), take input directly?
            // For now, require wake word every time for safety.
        }

        recognitionRef.current = recognition
        if (isListening) recognition.start()

        return () => recognition.stop()
    }, [isListening])

    const speak = (text) => {
        // Mute - just visual feedback
        setAiState('thinking') // or speaking, but silent
        setAiMessage(text)

        setTimeout(() => {
            setAiState('idle')
            setTimeout(() => setAiMessage(''), 3000)
        }, 2000) // Simulate duration
    }

    const processCommand = (cmd) => {
        setAiState('thinking')

        // --- 1. System Control ---
        if (cmd.includes('home') || cmd.includes('desktop')) {
            speak("Going to desktop.")
            setMode('home')
        }
        else if (cmd.includes('lock') || cmd.includes('sleep')) {
            speak("System locking. Goodbye.")
            lock()
        }

        // --- 2. App Management ---
        else if (cmd.includes('open') || cmd.includes('launch')) {
            const appName = cmd.replace('open', '').replace('launch', '').trim()
            if (!appName) return speak("Open what?")

            const validApps = {
                'browser': 'Browser', 'internet': 'Browser', 'web': 'Browser',
                'settings': 'Settings', 'config': 'Settings',
                'files': 'Files', 'documents': 'Files',
                'music': 'Music', 'player': 'Music', 'songs': 'Music',
                'camera': 'Camera', 'photo': 'Camera',
                'phone': 'Phone', 'call': 'Phone',
                'social': 'Social', 'chat': 'Social',
                'app store': 'AppStore', 'store': 'AppStore',
                'lms': 'LMS', 'academy': 'LMS', 'school': 'LMS', 'course': 'LMS',
                'assistant': 'Assistant', 'ai': 'Assistant', 'help': 'Assistant'
            }

            // Find best match
            const match = Object.keys(validApps).find(key => appName.includes(key))

            if (match) {
                const targetId = validApps[match]
                speak(`Opening ${targetId}.`)
                openApp(targetId)
            } else {
                speak(`I couldn't find an app called ${appName}.`)
            }
        }

        // --- 3. Utilities / Fun ---
        else if (cmd.includes('time')) {
            const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
            speak(`It is currently ${time}.`)
        }
        else if (cmd.includes('date') || cmd.includes('day')) {
            const date = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
            speak(`Today is ${date}.`)
        }
        else if (cmd.includes('joke')) {
            const jokes = [
                "Why do programmers prefer dark mode? Because light attracts bugs.",
                "I would tell you a UDP joke, but you might not get it.",
                "How many programmers does it take to change a light bulb? None, that's a hardware problem."
            ]
            const randomJoke = jokes[Math.floor(Math.random() * jokes.length)]
            speak(randomJoke)
        }
        else if (cmd.includes('search') || cmd.includes('google')) {
            // "Search for [query]"
            const query = cmd.split(/search for|search|google/)[1]?.trim()
            if (query) {
                speak(`Here is what I found for ${query}.`)
                // Open browser with query (requires logic update in Browser app to accept initial URL/Query)
                // For now just open browser
                openApp('Browser')
            } else {
                speak("What would you like me to search for?")
            }
        }
        else if (cmd.includes('photo') || cmd.includes('picture')) {
            speak("Say cheese!")
            openApp('Camera')
            // Ideally trigger shutter here if camera is open
        }
        else {
            speak("I'm not sure how to do that yet.")
        }
    }
}
