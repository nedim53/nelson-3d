'use client'
import { useRef, useCallback, useEffect } from 'react'
import { TransformControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../utils/store'
import { saveModelState } from '../lib/firestoreApi'
import { createDebouncedFunction } from '../utils/debounce'

type Props = {
  id: string
  shape: 'box' | 'sphere' | 'cone' | 'cylinder'
  color?: string
}

export default function SimpleModelItem({ id, shape, color = '#3b82f6' }: Props) {
  const ref = useRef<THREE.Mesh>(null)
  const transformControlsRef = useRef<any>(null)
  
  const modelState = useAppStore((state) => state.models[id])
  const updateModel = useAppStore((state) => state.updateModel)
  const setModelBoundingBox = useAppStore((state) => state.setModelBoundingBox)
  const allModels = useAppStore((state) => state.models)
  
  const previousPositionRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const previousRotationRef = useRef<THREE.Euler>(new THREE.Euler())
  
  // Debounced save function
  const debouncedSave = useCallback(
    createDebouncedFunction((modelId: string, data: { position: number[]; rotation: number[] }) => {
      saveModelState(modelId, data).catch(console.error)
    }, 200),
    []
  )

  // Update model position/rotation from store
  useEffect(() => {
    if (ref.current && modelState) {
      ref.current.position.set(...modelState.position)
      ref.current.rotation.set(...modelState.rotation)
    }
  }, [modelState])

  // Update bounding box periodically
  useFrame(() => {
    if (ref.current) {
      const box = new THREE.Box3().setFromObject(ref.current)
      setModelBoundingBox(id, box)
    }
  })

  // Collision detection
  const checkCollision = useCallback((position: THREE.Vector3): boolean => {
    if (!ref.current) return false
    
    const tempMesh = ref.current.clone()
    tempMesh.position.copy(position)
    
    const candidateBox = new THREE.Box3().setFromObject(tempMesh)
    
    // Check against all other models
    for (const [otherId, otherModel] of Object.entries(allModels)) {
      if (otherId === id) continue
      if (otherModel.boundingBox && candidateBox.intersectsBox(otherModel.boundingBox)) {
        return true
      }
    }
    
    return false
  }, [allModels, id])

  // Handle transform change
  const handleChange = useCallback(() => {
    if (!ref.current || !transformControlsRef.current) return
    
    const position = ref.current.position.clone()
    const rotation = ref.current.rotation.clone()
    
    // Check for collision
    if (checkCollision(position)) {
      // Rollback to previous position
      ref.current.position.copy(previousPositionRef.current)
      ref.current.rotation.copy(previousRotationRef.current)
      return
    }
    
    // Update previous position/rotation
    previousPositionRef.current.copy(position)
    previousRotationRef.current.copy(rotation)
    
    // Update store
    updateModel(id, {
      position: [position.x, position.y, position.z],
      rotation: [rotation.x, rotation.y, rotation.z],
    })
    
    // Save to Firestore (debounced)
    debouncedSave(id, {
      position: [position.x, position.y, position.z],
      rotation: [rotation.x, rotation.y, rotation.z],
    })
  }, [id, updateModel, debouncedSave, checkCollision])

  // Handle drag start
  const handleDragStart = useCallback(() => {
    if (ref.current) {
      previousPositionRef.current.copy(ref.current.position)
      previousRotationRef.current.copy(ref.current.rotation)
    }
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    handleChange()
  }, [handleChange])

  if (!modelState) {
    return null
  }

  // Render different shapes
  const renderGeometry = () => {
    switch (shape) {
      case 'box':
        return <boxGeometry args={[1, 1, 1]} />
      case 'sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />
      case 'cone':
        return <coneGeometry args={[0.5, 1, 32]} />
      case 'cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
      default:
        return <boxGeometry args={[1, 1, 1]} />
    }
  }

  return (
    <>
      <mesh ref={ref}>
        {renderGeometry()}
        <meshStandardMaterial color={color} />
      </mesh>
      <TransformControls
        ref={transformControlsRef}
        object={ref as React.MutableRefObject<THREE.Mesh>}
        mode="translate"
        onMouseDown={handleDragStart}
        onObjectChange={handleChange}
        onMouseUp={handleDragEnd}
        showX={true}
        showY={true}
        showZ={true}
      />
    </>
  )
}

