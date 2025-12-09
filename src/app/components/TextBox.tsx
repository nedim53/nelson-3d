'use client'
import { useRef, useEffect, useCallback, useMemo, useState } from 'react'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useAppStore } from '../utils/store'
import { saveTextBox } from '../lib/firestoreApi'
import { createDebouncedFunction } from '../utils/debounce'
import { wouldTextBoxCollide } from '../utils/collisionDetection'

type Props = {
  id: string
}

export default function TextBox({ id }: Props) {
  const ref = useRef<THREE.Group>(null)
  const isDraggingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPosRef = useRef<THREE.Vector3 | null>(null)
  
  const textBoxData = useAppStore((state) => state.textBoxes[id])
  const updateTextBox = useAppStore((state) => state.updateTextBox)
  const selectedTextBoxId = useAppStore((state) => state.selectedTextBoxId)
  const setSelectedTextBoxId = useAppStore((state) => state.setSelectedTextBoxId)
  const allModels = useAppStore((state) => state.models)
  const { camera, gl, raycaster, controls } = useThree()
  const orbitControls = controls as unknown as OrbitControlsImpl | null
  
  const isSelected = selectedTextBoxId === id
  
  const debouncedSaveRef = useRef(
    createDebouncedFunction(
      async (textBoxId: string, data: any) => {
        const currentData = useAppStore.getState().textBoxes[textBoxId]
        if (!currentData) return
        await saveTextBox({
          ...currentData,
          ...data,
        })
      },
      500
    )
  )
  
  useEffect(() => {
    if (!ref.current || !textBoxData?.position || isDraggingRef.current || isDragging) return
    
    const [x, y, z] = textBoxData.position
    const currentPos = ref.current.position
    
    if (
      Math.abs(currentPos.x - x) > 0.001 ||
      Math.abs(currentPos.y - y) > 0.001 ||
      Math.abs(currentPos.z - z) > 0.001
    ) {
      currentPos.set(x, y, z)
    }
  }, [textBoxData?.position, isDragging])
  
  const savePosition = useCallback(() => {
    if (!ref.current || !textBoxData) return
    
    const position = ref.current.position.clone()
    
    if (position.y < 0) {
      position.y = 0
      ref.current.position.y = 0
    }
    
    updateTextBox(id, {
      position: [position.x, position.y, position.z],
    })
    
    debouncedSaveRef.current(id, {
      position: [position.x, position.y, position.z],
    })
  }, [id, textBoxData, updateTextBox])
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!isDragging) {
      setSelectedTextBoxId(id)
    }
  }, [id, setSelectedTextBoxId, isDragging])
  
  const handleDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!ref.current) return
    
    if (orbitControls) {
      orbitControls.enabled = false
    }
    
    setIsDragging(true)
    isDraggingRef.current = true
    dragStartPosRef.current = ref.current.position.clone()
    
    const rect = gl.domElement.getBoundingClientRect()
    const startMouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!ref.current || !textBoxData) return
      
      const rect = gl.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )
      
      raycaster.setFromCamera(mouse, camera)
      
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -ref.current.position.y)
      const intersection = new THREE.Vector3()
      raycaster.ray.intersectPlane(plane, intersection)
      
      if (intersection) {
        const newPosition: [number, number, number] = [intersection.x, ref.current.position.y, intersection.z]
        
        // Prepare mesh data for all models
        const allMeshes: Record<string, { 
          mesh: THREE.Object3D, 
          position: [number, number, number], 
          rotation: [number, number, number] 
        }> = {}
        
        for (const [modelId, modelData] of Object.entries(allModels)) {
          if (modelData.mesh) {
            allMeshes[modelId] = {
              mesh: modelData.mesh,
              position: modelData.position,
              rotation: modelData.rotation
            }
          }
        }
        
        // Check collision with 3D models
        const textLength = textBoxData.text?.length || 20
        const hasCollision = wouldTextBoxCollide(
          newPosition,
          textBoxData.fontSize || 16,
          textLength,
          allMeshes
        )
        
        // Only update position if no collision
        if (!hasCollision) {
          ref.current.position.set(intersection.x, ref.current.position.y, intersection.z)
        }
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      isDraggingRef.current = false
      savePosition()
      dragStartPosRef.current = null
      
      if (orbitControls) {
        orbitControls.enabled = true
      }
      
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [camera, raycaster, gl, savePosition, orbitControls, textBoxData, allModels])
  
  const textBoxContent = useMemo(() => {
    if (!textBoxData) return null
    
    const { text, textColor, backgroundColor, backgroundTransparent, fontSize } = textBoxData
    
    return (
      <div
        style={{
          position: 'relative',
          padding: '12px 16px',
          paddingRight: '40px', // Space for drag handle
          backgroundColor: backgroundTransparent ? 'transparent' : backgroundColor,
          color: textColor,
          fontSize: `${fontSize}px`,
          fontFamily: 'Arial, sans-serif',
          borderRadius: '8px',
          border: isSelected ? '2px solid #001B3D' : '2px solid transparent',
          minWidth: '150px',
          maxWidth: '400px',
          wordWrap: 'break-word',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          whiteSpace: 'pre-wrap',
          pointerEvents: 'auto',
        }}
        onClick={handleClick}
      >
        {text || 'Click to edit'}
        <div
          onMouseDown={handleDragHandleMouseDown}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '24px',
            height: '24px',
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            opacity: 0.7,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isDragging) {
              e.currentTarget.style.opacity = '1'
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.opacity = '0.7'
            }
          }}
          title="Drag to move"
        >
          <span style={{ fontSize: '14px', userSelect: 'none' }}>⋮⋮</span>
        </div>
      </div>
    )
  }, [textBoxData, isSelected, handleClick, handleDragHandleMouseDown, isDragging])
  
  if (!textBoxData) {
    return null
  }
  
  return (
    <group ref={ref}>
      <Html
        position={[0, 0, 0]}
        center
        style={{
          pointerEvents: 'none',
        }}
        zIndexRange={[10, 0]}
        transform={false}
      >
        {textBoxContent}
      </Html>
    </group>
  )
}
