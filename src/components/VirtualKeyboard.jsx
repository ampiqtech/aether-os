import { useRef, useState, useMemo } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useOSStore } from '../store'

const KEYS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Enter'],
    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '?'],
    ['Space']
]

const Key = ({ char, position, width = 0.1, onData }) => {
    const meshRef = useRef()
    const [hovered, setHover] = useState(false)
    const [pressed, setPressed] = useState(false)

    useFrame(() => {
        if (meshRef.current) {
            // Visual press effect
            meshRef.current.position.z = THREE.MathUtils.lerp(
                meshRef.current.position.z,
                pressed ? -0.02 : 0,
                0.2
            )
        }
    })

    const handlePress = () => {
        setPressed(true)
        onData(char)
        setTimeout(() => setPressed(false), 150)
    }

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onClick={handlePress}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <boxGeometry args={[width, 0.1, 0.02]} />
                <meshStandardMaterial
                    color={pressed ? '#00ffff' : hovered ? '#444' : '#222'}
                    roughness={0.3}
                    metalness={0.8}
                />
            </mesh>
            <Text
                position={[0, 0, 0.015]}
                fontSize={0.04}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {char === 'Space' ? ' ' : char}
            </Text>
        </group>
    )
}

export const VirtualKeyboard = () => {
    const { keyboard, setKeyboardText, appendKeyboardText, backspaceKeyboardText, toggleKeyboardFloating } = useOSStore()
    const groupRef = useRef()

    if (!keyboard.visible) return null

    const handleInput = (char) => {
        if (char === 'Backspace') {
            backspaceKeyboardText()
        } else if (char === 'Enter') {
            // Handle Enter? Maybe close or newline
            appendKeyboardText('\n')
        } else if (char === 'Space') {
            appendKeyboardText(' ')
        } else if (char === 'Shift') {
            // Toggle shift logic todo
        } else {
            appendKeyboardText(char)
        }
    }

    return (
        <group
            ref={groupRef}
            position={keyboard.isFloating ? [0, 0.2, 0.5] : [0, -0.8, 0.2]}
            rotation={keyboard.isFloating ? [0, 0, 0] : [-Math.PI / 6, 0, 0]}
        >
            {/* Backplate */}
            <mesh position={[0, -0.3, -0.02]}>
                <boxGeometry args={[1.5, 0.8, 0.02]} />
                <meshStandardMaterial color="#111" transparent opacity={0.8} />
            </mesh>

            {/* Title / Grab Bar */}
            <group position={[0, 0.05, 0]}>
                <Text position={[-0.6, 0, 0]} fontSize={0.05} color="#aaa">Keyboard</Text>
                <mesh onClick={toggleKeyboardFloating} position={[0.6, 0, 0]}>
                    <boxGeometry args={[0.2, 0.05, 0.01]} />
                    <meshBasicMaterial color={keyboard.isFloating ? "#0f0" : "#555"} />
                </mesh>
                <Text position={[0.6, 0, 0.02]} fontSize={0.03} color="black">{keyboard.isFloating ? 'Dock' : 'Float'}</Text>
            </group>

            {KEYS.map((row, rowIndex) => (
                <group key={rowIndex} position={[0, -rowIndex * 0.12, 0]}>
                    {row.map((char, colIndex) => {
                        // Center logic
                        const totalWidth = row.length * 0.11
                        const startX = -totalWidth / 2
                        const x = startX + colIndex * 0.11 + 0.05

                        let width = 0.1
                        if (char === 'Space') width = 0.6
                        if (char === 'Backspace' || char === 'Enter' || char === 'Shift') width = 0.18

                        // Adjust x for special keys
                        // Simplified grid for now
                        return (
                            <Key
                                key={char}
                                char={char}
                                position={[x, 0, 0]}
                                width={width}
                                onData={handleInput}
                            />
                        )
                    })}
                </group>
            ))}
        </group>
    )
}
