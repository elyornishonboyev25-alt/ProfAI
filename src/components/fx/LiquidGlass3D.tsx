import { Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, MeshTransmissionMaterial, Float, Sphere, ContactShadows, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

function MovingBlobs() {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.getElapsedTime()
    // Slowly rotate the entire blob group
    group.current.rotation.y = Math.sin(t / 4) * 0.2
    group.current.rotation.z = Math.cos(t / 5) * 0.1
  })

  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={1.5} floatIntensity={2} position={[-2, 1, -4]}>
        <Sphere args={[1.5, 64, 64]}>
          <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.8} roughness={0.1} metalness={0.8} />
        </Sphere>
      </Float>

      <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5} position={[2.5, -1.5, -3]}>
        <Sphere args={[2, 64, 64]}>
          <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={0.6} roughness={0.2} metalness={0.5} />
        </Sphere>
      </Float>

      <Float speed={2.5} rotationIntensity={1} floatIntensity={3} position={[-1.5, -2.5, -2]}>
        <Sphere args={[1.2, 32, 32]}>
          <meshStandardMaterial color="#fb923c" emissive="#c2410c" emissiveIntensity={0.4} roughness={0.1} metalness={0.6} />
        </Sphere>
      </Float>
    </group>
  )
}

function LiquidGlassPanels() {
  const { viewport } = useThree()
  const isMobile = viewport.width < 5

  const materialProps = {
    thickness: 1.5,
    roughness: 0.15,
    transmission: 1,
    ior: 1.3,
    chromaticAberration: 0.08,
    backside: true,
    color: '#ffffff',
  }

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
      {/* Main ambient glass shards/panels floating in the background */}
      {!isMobile && (
        <>
          <mesh position={[-3.5, 2.5, -1]} rotation={[0.2, -0.4, 0.1]}>
            <RoundedBox args={[3, 3, 0.2]} radius={0.5} smoothness={16}>
              <MeshTransmissionMaterial {...materialProps} thickness={2} roughness={0.05} />
            </RoundedBox>
          </mesh>
          <mesh position={[4.5, -1.5, -2]} rotation={[-0.2, 0.4, -0.1]}>
            <Sphere args={[1.8, 64, 64]}>
              <MeshTransmissionMaterial {...materialProps} thickness={3} roughness={0.1} chromaticAberration={0.15} />
            </Sphere>
          </mesh>
          <mesh position={[-4, -3, -1.5]} rotation={[0.5, 0.2, 0.4]}>
             <RoundedBox args={[2, 4, 0.2]} radius={0.4} smoothness={16}>
              <MeshTransmissionMaterial {...materialProps} thickness={1} roughness={0.2} chromaticAberration={0.1} />
            </RoundedBox>
          </mesh>
        </>
      )}
    </Float>
  )
}

function InteractiveRig() {
  const { camera, pointer } = useThree()

  useFrame(() => {
    // Parallax effect: camera slightly follows mouse
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.5, 0.05)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.5, 0.05)
    camera.lookAt(0, 0, 0)
  })

  return null
}

export default function LiquidGlass3D() {
  const { minimalMotion } = useMotionPreferences()

  if (minimalMotion) return null

  return (
    <div className="absolute inset-0 z-0 h-full w-full pointer-events-none" style={{ position: 'fixed', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]} gl={{ antialias: false }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#eef2fb']} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
          <directionalLight position={[-10, -10, -5]} intensity={1} color="#fecdd3" />
          <Environment preset="city" />

          <MovingBlobs />
          <LiquidGlassPanels />
          <InteractiveRig />
        </Suspense>
      </Canvas>
    </div>
  )
}
