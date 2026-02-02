import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Background } from './Background'
import { SpatialInterface } from './SpatialInterface'

export const Experience = () => {
    return (
        <>
            <color attach="background" args={['#111']} />

            {/* Lights & Environment */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
            <Environment preset="city" />

            {/* Main Content */}
            <group position={[0, 0, 0]}>
                <Background />
                <SpatialInterface />
            </group>

            {/* Floor Shadows for grounding */}
            <ContactShadows
                position={[0, -2.5, 0]}
                opacity={0.4}
                scale={20}
                blur={2}
                far={4}
            />

            {/* Camera Controls */}
            <OrbitControls
                makeDefault
                enablePan={false}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.5}
                minDistance={3}
                maxDistance={8}
            />
        </>
    )
}

export default Experience
