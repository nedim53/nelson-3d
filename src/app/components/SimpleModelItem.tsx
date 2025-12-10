'use client'
import { useRef, useCallback, useEffect, useState } from 'react'
import { TransformControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../utils/store'
import { saveModelState } from '../lib/firestoreApi'
import { createDebouncedFunction } from '../utils/debounce'
import { wouldCollide } from '../utils/collisionDetection'
import CollisionTooltip from './CollisionTooltip'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

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
  const setModelMesh = useAppStore((state) => state.setModelMesh)
  const allModels = useAppStore((state) => state.models)
  const verticalMoveMode = useAppStore((state) => state.verticalMoveMode)
  const transformMode = useAppStore((state) => state.transformMode)
  const [isColliding, setIsColliding] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  const previousPositionRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const previousRotationRef = useRef<THREE.Euler>(new THREE.Euler())
  const initialGroundYRef = useRef(0)
  const controls = useThree((state) => state.controls) as unknown as OrbitControlsImpl | null
  
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

  // Save mesh reference to store when component mounts
  useEffect(() => {
    if (ref.current) {
      setModelMesh(id, ref.current)
    }
  }, [id, setModelMesh])

  // Check collision and update visual feedback (with position and rotation)
  const checkCollisionAndUpdateFeedback = useCallback(
    (position: THREE.Vector3, rotation: THREE.Euler): boolean => {
      if (!ref.current) return false
      
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
      
      // Check if the proposed position/rotation would cause collision
      const hasCollision = wouldCollide(
        ref.current,
        [position.x, position.y, position.z],
        [rotation.x, rotation.y, rotation.z],
        id,
        allMeshes
      )
      
      setIsColliding(hasCollision && isDragging)
      
      return hasCollision
    }, [allModels, id, isDragging]
  )

  // Handle transform change
  const handleChange = useCallback(() => {
    if (!ref.current || !transformControlsRef.current) return
    
    const position = ref.current.position.clone()
    const rotation = ref.current.rotation.clone()

    if (!verticalMoveMode) {
      position.y = initialGroundYRef.current
      ref.current.position.y = position.y
    }

    // Keep above ground: lift if any part dips below y=0
    const ensureAboveGround = (obj: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(obj)
      const minY = box.min.y
      if (minY < 0) {
        const delta = -minY
        obj.position.y += delta
        position.y += delta
      }
    }
    ensureAboveGround(ref.current)
    
    // Check for collision and update feedback (now includes rotation)
    if (checkCollisionAndUpdateFeedback(position, rotation)) {
      // Rollback to previous position AND rotation
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
  }, [id, updateModel, debouncedSave, checkCollisionAndUpdateFeedback, verticalMoveMode])

  // Handle drag start
  const handleDragStart = useCallback(() => {
    if (ref.current) {
      if (controls) controls.enabled = false
      setIsDragging(true)
      previousPositionRef.current.copy(ref.current.position)
      previousRotationRef.current.copy(ref.current.rotation)
      initialGroundYRef.current = ref.current.position.y
    }
  }, [controls])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    handleChange()
    setIsDragging(false)
    setIsColliding(false)
    if (controls) controls.enabled = true
  }, [handleChange, controls])

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
        <meshStandardMaterial color={isColliding ? '#DC2626' : color} />
      </mesh>
      {isColliding && ref.current && (
        <CollisionTooltip position={ref.current.position} visible={true} />
      )}
      <TransformControls
        ref={transformControlsRef}
        object={ref as React.MutableRefObject<THREE.Mesh>}
        mode={transformMode}
        translationSnap={transformMode === 'translate' ? (verticalMoveMode ? 0.05 : 0.1) : undefined}
        rotationSnap={transformMode === 'rotate' ? Math.PI / 12 : undefined}
        onMouseDown={handleDragStart}
        onObjectChange={handleChange}
        onMouseUp={handleDragEnd}
        showX={transformMode === 'translate' ? !verticalMoveMode : true}
        showY={true}
        showZ={transformMode === 'translate' ? !verticalMoveMode : true}
      />
    </>
  )
}

