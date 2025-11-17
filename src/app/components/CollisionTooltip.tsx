'use client'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

type CollisionTooltipProps = {
  position: THREE.Vector3 | [number, number, number]
  visible: boolean
}

/**
 * Simple floating tooltip that appears above a model during collision
 */
export default function CollisionTooltip({ position, visible }: CollisionTooltipProps) {
  if (!visible) return null

  const tooltipPosition = Array.isArray(position)
    ? [position[0], position[1] + 1, position[2]] as [number, number, number]
    : [position.x, position.y + 1, position.z] as [number, number, number]

  return (
    <Html position={tooltipPosition} center>
      <div
        style={{
          padding: '6px 12px',
          backgroundColor: '#DC2626',
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'Montserrat, sans-serif',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        Models cannot overlap
      </div>
    </Html>
  )
}

