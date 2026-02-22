import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, Cloud } from '@react-three/drei'
import { AetherField } from './AetherField'
import * as THREE from 'three'

import { useOSStore } from '../store'

export const Background = () => {
    const groupRef = useRef()
    const { wallpaper } = useOSStore()

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y -= delta * 0.05
        }
    })

    const getBgColors = () => {
        switch (wallpaper) {
            case 'sunset': return { start: '#2a1a3a', end: '#ff77aa', cloud: '#ffaaee' }
            case 'nebula': return { start: '#0a0a2a', end: '#4400cc', cloud: '#a020f0' }
            case 'city':
            default: return { start: '#020210', end: '#1a1a40', cloud: '#a0b0ff' }
        }
    }

    const { start, end, cloud } = getBgColors()

    return (
        <group ref={groupRef}>
            {/* Deep space background color */}
            <color attach="background" args={[start]} />

            {/* Custom Shader Field */}
            <AetherField
                colorStart={start}
                colorEnd={end}
                position={[0, -8, -10]}
                scale={1.5}
            />

            <Stars
                radius={100}
                depth={50}
                count={wallpaper === 'nebula' ? 8000 : 5000}
                factor={4}
                saturation={wallpaper === 'sunset' ? 1 : 0.5}
                fade
                speed={0.5}
            />

            {/* Layered clouds for depth */}
            <Cloud
                opacity={0.3}
                speed={0.2}
                width={20}
                depth={2}
                segments={20}
                position={[0, -5, -15]}
                color={cloud}
            />
            <Cloud
                opacity={0.2}
                speed={0.3}
                width={10}
                depth={1}
                segments={10}
                position={[10, 5, -20]}
                color={cloud}
            />
            {/* Fog for seamless blending */}
            <fog attach="fog" args={[start, 10, 50]} />
        </group>
    )
}

export default Background
