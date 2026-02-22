import { useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

const AetherMaterial = shaderMaterial(
    {
        uTime: 0,
        uColorStart: new THREE.Color('#2a1a3a'),
        uColorEnd: new THREE.Color('#ffaaee')
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying float vElevation;
    uniform float uTime;

    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      
      // Subtle wave effect
      float elevation = sin(modelPosition.x * 0.5 + uTime * 0.2) * 
                       sin(modelPosition.z * 0.5 + uTime * 0.2) * 0.5;
      
      modelPosition.y += elevation;
      vElevation = elevation;

      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectionPosition = projectionMatrix * viewPosition;

      gl_Position = projectionPosition;
    }
  `,
    // Fragment Shader
    `
    uniform float uTime;
    uniform vec3 uColorStart;
    uniform vec3 uColorEnd;
    varying vec2 vUv;
    varying float vElevation;

    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      // Flowing noise pattern
      float noiseStrength = snoise(vUv * 3.0 + uTime * 0.1);
      
      // Mix colors based on noise and elevation
      vec3 color = mix(uColorStart, uColorEnd, noiseStrength * 0.5 + 0.5);
      
      // Add a glowing energy line
      // Safe divisor to avoid infinity
      float sineVal = sin(vUv.y * 10.0 + uTime + noiseStrength);
      float glow = 0.02 / (abs(sineVal) + 0.05); 
      
      color += vec3(glow);

      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ AetherMaterial })

export const AetherField = ({ colorStart, colorEnd, ...props }) => {
    const materialRef = useRef()

    useFrame((state, delta) => {
        if (materialRef.current) {
            materialRef.current.uTime += delta

            // Smoothly interpolate colors if they change (optional, but good for polish)
            // For now just instant set
            if (colorStart) materialRef.current.uColorStart.set(colorStart)
            if (colorEnd) materialRef.current.uColorEnd.set(colorEnd)
        }
    })

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} {...props}>
            <planeGeometry args={[200, 200, 128, 128]} />
            <aetherMaterial
                ref={materialRef}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>
    )
}
