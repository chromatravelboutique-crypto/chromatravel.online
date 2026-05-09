import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface OrbProps {
  position: [number, number, number];
  color: string;
  size?: number;
  speed?: number;
  distort?: number;
}

function AnimatedOrb({ position, color, size = 1, speed = 1, distort = 0.4 }: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialY = position[1];

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    meshRef.current.position.y = initialY + Math.sin(time * speed * 0.5) * 0.3;
    meshRef.current.position.x = position[0] + Math.cos(time * speed * 0.3) * 0.1;
    meshRef.current.rotation.x = time * 0.1 * speed;
    meshRef.current.rotation.z = time * 0.15 * speed;
  });

  return (
    <Sphere ref={meshRef} args={[size, 32, 32]} position={position}>
      <MeshDistortMaterial
        color={color}
        attach="material"
        distort={distort}
        speed={2}
        roughness={0.2}
        metalness={0.1}
        transparent
        opacity={0.7}
      />
    </Sphere>
  );
}

export function WebGLOrbs() {
  return (
    <group>
      <AnimatedOrb 
        position={[-2.5, 0.5, -1]} 
        color="#8b5cf6" 
        size={0.8} 
        speed={1.2}
        distort={0.5}
      />
      <AnimatedOrb 
        position={[2.2, -0.3, -0.5]} 
        color="#ec4899" 
        size={0.6} 
        speed={0.8}
        distort={0.4}
      />
      <AnimatedOrb 
        position={[0, 1.2, -2]} 
        color="#22d3ee" 
        size={0.5} 
        speed={1.5}
        distort={0.3}
      />
      <AnimatedOrb 
        position={[-1.5, -1, -1.5]} 
        color="#fb923c" 
        size={0.4} 
        speed={1}
        distort={0.6}
      />
    </group>
  );
}
