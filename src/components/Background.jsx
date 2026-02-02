import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, Cloud } from '@react-three/drei'
import * as THREE from 'three'

export const Background = () => {
    const groupRef = useRef()

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y -= delta * 0.05
        }
    })

    return (
        <group ref={groupRef}>
            <color attach="background" args={['#050510']} />
            <Stars
                radius={100}
                depth={50}
                count={5000}
                factor={4}
                saturation={0}
                fade
                speed={1}
            />
            <Cloud
                opacity={0.3}
                speed={0.4}
                width={10}
                depth={1.5}
                segments={20}
                position={[0, -5, -10]}
                color="#a0b0ff"
            />
        </group>
    )
}

export default Background
