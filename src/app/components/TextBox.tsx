'use client'
import { useRef, useEffect, useCallback, useMemo, useState } from 'react'
import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useAppStore } from '../utils/store'
import { saveTextBox } from '../lib/firestoreApi'
import { createDebouncedFunction } from '../utils/debounce'

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
  const { camera, gl, raycaster, controls } = useThree()
  const orbitControls = controls as unknown as OrbitControlsImpl | null
  
  const isSelected = selectedTextBoxId === id
  
  // Debounced save - created once, never recreated
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
  
  // Set position from store - ONLY when not dragging and position changed
  useEffect(() => {
    if (!ref.current || !textBoxData?.position || isDraggingRef.current || isDragging) return
    
    const [x, y, z] = textBoxData.position
    const currentPos = ref.current.position
    
    // Only update if position is significantly different
    if (
      Math.abs(currentPos.x - x) > 0.001 ||
      Math.abs(currentPos.y - y) > 0.001 ||
      Math.abs(currentPos.z - z) > 0.001
    ) {
      currentPos.set(x, y, z)
    }
  }, [textBoxData?.position, isDragging])
  
  // Save position to store and Firestore
  const savePosition = useCallback(() => {
    if (!ref.current || !textBoxData) return
    
    const position = ref.current.position.clone()
    
    // Keep above ground
    if (position.y < 0) {
      position.y = 0
      ref.current.position.y = 0
    }
    
    // Update store
    updateTextBox(id, {
      position: [position.x, position.y, position.z],
    })
    
    // Save to Firestore
    debouncedSaveRef.current(id, {
      position: [position.x, position.y, position.z],
    })
  }, [id, textBoxData, updateTextBox])
  
  // Handle click to select - prevent event bubbling
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!isDragging) {
      setSelectedTextBoxId(id)
    }
  }, [id, setSelectedTextBoxId, isDragging])
  
  // Drag and drop handler for drag handle - same logic as models
  const handleDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!ref.current) return
    
    // Disable camera controls during drag (same as models)
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
      if (!ref.current) return
      
      const rect = gl.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )
      
      raycaster.setFromCamera(mouse, camera)
      
      // Create a plane at the current Y position
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -ref.current.position.y)
      const intersection = new THREE.Vector3()
      raycaster.ray.intersectPlane(plane, intersection)
      
      if (intersection) {
        ref.current.position.set(intersection.x, ref.current.position.y, intersection.z)
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      isDraggingRef.current = false
      savePosition()
      dragStartPosRef.current = null
      
      // Re-enable camera controls after drag (same as models)
      if (orbitControls) {
        orbitControls.enabled = true
      }
      
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [camera, raycaster, gl, savePosition, orbitControls])
  
  // Memoize text box content to prevent re-renders - stable reference
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
        {/* Drag handle icon */}
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
