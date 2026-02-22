import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useOSStore } from '../store'

export const NeuralCore = () => {
    const meshRef = useRef()
    const { dna, isListening, aiState } = useOSStore()

    // DNA Gene Expression
    const count = dna.particleCount
    const dummy = useMemo(() => new THREE.Object3D(), [])

    // Particle State
    const particles = useMemo(() => {
        const temp = []
        for (let i = 0; i < 10000; i++) { // Max capacity
            const r = 10 // Radius
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)

            const x = r * Math.sin(phi) * Math.cos(theta)
            const y = r * Math.sin(phi) * Math.sin(theta)
            const z = r * Math.cos(phi)

            temp.push({
                t: Math.random() * 100,
                factor: 0.2 + Math.random(),
                speed: 0.01 + Math.random() / 200,
                x, y, z,
                mx: 0, my: 0
            })
        }
        return temp
    }, [])

    useFrame((state) => {
        if (!meshRef.current) return

        const time = state.clock.getElapsedTime()
        const { primaryHue, secondaryHue, chaos, pulseSpeed } = dna

        // AI State Influence
        const excitement = aiState === 'listening' ? 2 : aiState === 'speaking' ? 3 : 1

        particles.forEach((particle, i) => {
            if (i >= count) return // Limit by DNA count

            let { t, factor, speed, x, y, z } = particle

            // "Breathing" Motion modulated by Pulse Speed gene
            t = particle.t += speed / 2 * excitement * pulseSpeed

            // Chaos Gene: Determines how erratic movement is
            const wobble = Math.sin(t) * chaos * excitement

            // Layout Patterns based on System State
            // Default: Neural Sphere
            const r = 15 + Math.cos(t) * 2

            // Apply Position
            dummy.position.set(
                (particle.x + Math.cos(t) + Math.sin(t * 1) * factor) + Math.sin(t / 10) * wobble,
                (particle.y + Math.sin(t) + Math.cos(t * 2) * factor) + Math.cos(t / 10) * wobble,
                (particle.z + Math.cos(t) + Math.sin(t * 3) * factor) + Math.sin(t / 10) * wobble
            )

            // Neural Connection Scaling
            const scale = (Math.cos(t) + 2 + excitement) * 0.1
            dummy.scale.set(scale, scale, scale)

            // Rotation for localized spin
            dummy.rotation.set(s => s + speed, s => s + speed, s => s + speed)

            dummy.updateMatrix()
            meshRef.current.setMatrixAt(i, dummy.matrix)

            // Color Evolution
            // Interpolate between Gene Colors based on position
            const color = new THREE.Color()
            const mix = (Math.sin(t) + 1) / 2
            color.setHSL(
                (THREE.MathUtils.lerp(primaryHue, secondaryHue, mix) / 360),
                0.8,
                0.5 + (excitement * 0.1)
            )
            meshRef.current.setColorAt(i, color)
        })

        meshRef.current.instanceMatrix.needsUpdate = true
        meshRef.current.instanceColor.needsUpdate = true

        // Slow Rotation of entire core
        meshRef.current.rotation.y = time * 0.05
    })

    return (
        <instancedMesh ref={meshRef} args={[null, null, 10000]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial
                toneMapped={false}
                emissiveIntensity={2}
                transparent
                opacity={0.8}
            />
        </instancedMesh>
    )
}
