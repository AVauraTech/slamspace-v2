'use client'
import { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import { Text, RoundedBox, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { sound } from '@/lib/sound'

function BookPages({ count = 8 }: { count?: number }) {
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => (
        <RoundedBox
          key={i}
          args={[3, 4, 0.015]}
          radius={0.02}
          position={[0, 0, -0.18 + i * 0.008]}
        >
          <meshStandardMaterial
            color={`hsl(38, ${30 + i * 5}%, ${92 - i * 0.5}%)`}
            roughness={0.95}
          />
        </RoundedBox>
      ))}
    </group>
  )
}

function BookMesh({ onOpen }: { onOpen: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [opening, setOpening] = useState(false)
  const [pageFlipped, setPageFlipped] = useState(false)

  const { coverRotation, groupY } = useSpring({
    coverRotation: opening ? -Math.PI * 0.85 : 0,
    groupY: opening ? 0.3 : 0,
    config: { mass: 1.2, tension: 100, friction: 28 },
    onRest: () => {
      if (opening && !pageFlipped) {
        setPageFlipped(true)
        setTimeout(() => onOpen(), 300)
      }
    }
  })

  const { pageRot } = useSpring({
    pageRot: pageFlipped ? -Math.PI * 0.6 : 0,
    config: { mass: 0.8, tension: 80, friction: 20 },
    delay: 200
  })

  useFrame((state) => {
    if (groupRef.current && !opening) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.12
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.05
    }
  })

  return (
    <animated.group ref={groupRef} position-y={groupY}>
      {/* Book body — pages stack */}
      <BookPages count={10} />

      {/* Spine */}
      <RoundedBox args={[0.28, 4.05, 0.45]} radius={0.04} position={[-1.64, 0, -0.06]}>
        <meshStandardMaterial color="#6b3308" roughness={0.75} metalness={0.05} />
      </RoundedBox>

      {/* Page peeking out — animated */}
      <animated.group rotation-y={pageRot} position={[-1.5, 0, 0]}>
        <RoundedBox args={[2.8, 3.9, 0.012]} radius={0.02} position={[1.5, 0, 0.01]}>
          <meshStandardMaterial color="#fffaf0" roughness={0.9} />
        </RoundedBox>
      </animated.group>

      {/* Cover — the clickable animated part */}
      <animated.group
        rotation-y={coverRotation}
        position={[-1.5, 0, 0]}
        onClick={() => {
          sound.playPageFlip()
          setOpening(true)
        }}
        onPointerOver={() => {
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <RoundedBox args={[3.05, 4.1, 0.12]} radius={0.06} position={[1.5, 0, 0]}>
          <meshStandardMaterial
            color={hovered ? '#9a3d0e' : '#7b2d05'}
            roughness={0.65}
            metalness={0.08}
          />
        </RoundedBox>
        {/* Cover texture lines */}
        {[0.8, 0.2, -0.4].map((y, i) => (
          <mesh key={i} position={[1.5, y, 0.065]}>
            <planeGeometry args={[2.4, 0.015]} />
            <meshStandardMaterial color="#ffd700" opacity={0.4} transparent />
          </mesh>
        ))}

        {/* Title */}
        <Text
          position={[1.5, 0.7, 0.07]}
          fontSize={0.38}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
        >
          SlamSpace
        </Text>

        <Text
          position={[1.5, 0.15, 0.07]}
          fontSize={0.16}
          color="#ffe9aa"
          anchorX="center"
          anchorY="middle"
        >
          {hovered ? '✨ Click to Open!' : 'Where Friendships Live Forever'}
        </Text>

        <Text
          position={[1.5, -0.3, 0.07]}
          fontSize={0.22}
          color="#ffd700"
          anchorX="center"
          anchorY="middle"
        >
          📚
        </Text>

        {/* Spiral binding dots */}
        {[-1.7, -1.1, -0.5, 0.1, 0.7, 1.3, 1.7].map((y, i) => (
          <mesh key={i} position={[-0.12, y, 0.07]}>
            <torusGeometry args={[0.065, 0.02, 8, 16]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}

        {/* Gold corner ornament */}
        <Text position={[0.25, 1.7, 0.07]} fontSize={0.25} color="#ffd700">✦</Text>
        <Text position={[2.75, 1.7, 0.07]} fontSize={0.25} color="#ffd700">✦</Text>
        <Text position={[0.25, -1.7, 0.07]} fontSize={0.25} color="#ffd700">✦</Text>
        <Text position={[2.75, -1.7, 0.07]} fontSize={0.25} color="#ffd700">✦</Text>
      </animated.group>
    </animated.group>
  )
}

function Scene({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <Stars radius={80} depth={50} count={300} factor={3} saturation={0.2} fade speed={0.5} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 5]} intensity={1.4} castShadow />
      <pointLight position={[-5, 3, 4]} intensity={0.8} color="#ffd9a0" />
      <pointLight position={[5, -3, 4]} intensity={0.4} color="#a0d0ff" />
      <BookMesh onOpen={onOpen} />
    </>
  )
}

export default function Book3D({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="w-full h-96 md:h-[28rem] cursor-pointer select-none" style={{ touchAction: 'none' }}>
      <Canvas
        camera={{ position: [0, 0.3, 7.5], fov: 48 }}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        <Scene onOpen={onOpen} />
      </Canvas>
    </div>
  )
}
