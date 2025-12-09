'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import { useGLTF, TransformControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../utils/store'
import { saveModelState } from '../lib/firestoreApi'
import { createDebouncedFunction } from '../utils/debounce'
import { wouldCollide } from '../utils/collisionDetection'
import CollisionTooltip from './CollisionTooltip'
import { useUndoRedoContext } from '../contexts/UndoRedoContext'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

type Props = {
  url: string
  id: string
}

export default function ModelItem({ url, id }: Props) {
  const ref = useRef<THREE.Group>(null)
  const transformControlsRef = useRef<any>(null)
  
  const modelState = useAppStore((state) => state.models[id])
  const updateModel = useAppStore((state) => state.updateModel)
  const setModelMesh = useAppStore((state) => state.setModelMesh)
  const allModels = useAppStore((state) => state.models)
  const verticalMoveMode = useAppStore((state) => state.verticalMoveMode)
  const transformMode = useAppStore((state) => state.transformMode)
  const [isReady, setIsReady] = useState(false)
  const controls = useThree((state) => state.controls) as unknown as OrbitControlsImpl | null
  const initialGroundYRef = useRef(0)
  const [isColliding, setIsColliding] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const { saveCurrentState } = useUndoRedoContext()
  
  const [previousPosition] = useState<THREE.Vector3>(new THREE.Vector3())
  const [previousRotation] = useState<THREE.Euler>(new THREE.Euler())
  
  const originalColorsRef = useRef<Map<THREE.Material, THREE.Color>>(new Map())
  
  const gltf = useGLTF(url, true)
  
  useEffect(() => {
    if (gltf?.scene) {
    }
  }, [gltf?.scene, id, url])
  
  const debouncedSave = useCallback(
    createDebouncedFunction((modelId: string, data: { position: number[]; rotation: number[] }) => {
      saveModelState(modelId, data).catch(console.error)
    }, 200),
    []
  )

  useEffect(() => {
    if (ref.current && modelState) {
      ref.current.position.set(...modelState.position)
      ref.current.rotation.set(...modelState.rotation)
    }
  }, [modelState])

  useEffect(() => {
    if (ref.current && clonedScene.current) {
      setModelMesh(id, ref.current)
    }
  }, [id, setModelMesh, isReady])

  const checkCollisionAndUpdateFeedback = useCallback(
    (position: THREE.Vector3 | [number, number, number], rotation: THREE.Euler | [number, number, number]): boolean => {
      if (!ref.current) return false
      
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
      
      // Normalize position and rotation to arrays
      const posArray: [number, number, number] = Array.isArray(position) 
        ? position 
        : [position.x, position.y, position.z]
      const rotArray: [number, number, number] = Array.isArray(rotation)
        ? rotation
        : [rotation.x, rotation.y, rotation.z]
      
      const hasCollision = wouldCollide(
        ref.current,
        posArray,
        rotArray,
        id,
        allMeshes
      )
      
      setIsColliding(hasCollision && isDragging)
      
      return hasCollision
    }, [allModels, id, isDragging]
  )

  const handleChange = useCallback(() => {
    if (!ref.current || !transformControlsRef.current) return
    
    const position = ref.current.position.clone()
    const rotation = ref.current.rotation.clone()

    if (!verticalMoveMode) {
      position.y = initialGroundYRef.current
      ref.current.position.y = position.y
    }

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
    
    // Check collision with per-axis blocking
    // Try each axis separately to allow movement in other directions
    let finalPosition = position.clone()
    let finalRotation = rotation.clone()
    
    // Check rotation first - if rotation causes collision, block it
    const rotArray: [number, number, number] = [rotation.x, rotation.y, rotation.z]
    const prevRotArray: [number, number, number] = [previousRotation.x, previousRotation.y, previousRotation.z]
    
    if (checkCollisionAndUpdateFeedback(previousPosition, rotArray)) {
      // Rotation causes collision, try each rotation axis separately
      // X rotation
      const testRotX: [number, number, number] = [rotation.x, prevRotArray[1], prevRotArray[2]]
      if (checkCollisionAndUpdateFeedback(previousPosition, testRotX)) {
        finalRotation.x = previousRotation.x
      } else {
        finalRotation.x = rotation.x
      }
      
      // Y rotation
      const testRotY: [number, number, number] = [finalRotation.x, rotation.y, prevRotArray[2]]
      if (checkCollisionAndUpdateFeedback(previousPosition, testRotY)) {
        finalRotation.y = previousRotation.y
      } else {
        finalRotation.y = rotation.y
      }
      
      // Z rotation
      const testRotZ: [number, number, number] = [finalRotation.x, finalRotation.y, rotation.z]
      if (checkCollisionAndUpdateFeedback(previousPosition, testRotZ)) {
        finalRotation.z = previousRotation.z
      } else {
        finalRotation.z = rotation.z
      }
    } else {
      // No collision with new rotation, allow it
      finalRotation.copy(rotation)
    }
    
    // Check each position axis separately with final rotation
    const finalRotArray: [number, number, number] = [finalRotation.x, finalRotation.y, finalRotation.z]
    
    // X axis
    const testPosX: [number, number, number] = [position.x, previousPosition.y, previousPosition.z]
    if (checkCollisionAndUpdateFeedback(testPosX, finalRotArray)) {
      finalPosition.x = previousPosition.x
    } else {
      finalPosition.x = position.x
    }
    
    // Y axis
    const testPosY: [number, number, number] = [finalPosition.x, position.y, previousPosition.z]
    if (checkCollisionAndUpdateFeedback(testPosY, finalRotArray)) {
      finalPosition.y = previousPosition.y
    } else {
      finalPosition.y = position.y
    }
    
    // Z axis
    const testPosZ: [number, number, number] = [finalPosition.x, finalPosition.y, position.z]
    if (checkCollisionAndUpdateFeedback(testPosZ, finalRotArray)) {
      finalPosition.z = previousPosition.z
    } else {
      finalPosition.z = position.z
    }
    
    // Apply the final position and rotation
    ref.current.position.copy(finalPosition)
    ref.current.rotation.copy(finalRotation)
    
    // Update previous position/rotation
    previousPosition.copy(finalPosition)
    previousRotation.copy(finalRotation)
    
    updateModel(id, {
      position: [finalPosition.x, finalPosition.y, finalPosition.z],
      rotation: [finalRotation.x, finalRotation.y, finalRotation.z],
    })
    
    debouncedSave(id, {
      position: [finalPosition.x, finalPosition.y, finalPosition.z],
      rotation: [finalRotation.x, finalRotation.y, finalRotation.z],
    })
  }, [id, updateModel, debouncedSave, checkCollisionAndUpdateFeedback, previousPosition, previousRotation, verticalMoveMode])

  const handleDragStart = useCallback(() => {
    if (ref.current) {
      if (controls) controls.enabled = false
      setIsDragging(true)
      previousPosition.copy(ref.current.position)
      previousRotation.copy(ref.current.rotation)
      initialGroundYRef.current = ref.current.position.y
    }
  }, [previousPosition, previousRotation, controls])

  const handleDragEnd = useCallback(() => {
    handleChange()
    setIsDragging(false)
    setIsColliding(false)
    saveCurrentState()
    if (controls) controls.enabled = true
  }, [handleChange, controls, saveCurrentState])

  const clonedScene = useRef<THREE.Group | null>(null)
  
  useEffect(() => {
    if (gltf?.scene) {
      try {
        clonedScene.current = gltf.scene.clone()
        
        const box = new THREE.Box3().setFromObject(clonedScene.current)
        if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3())
          clonedScene.current.position.sub(center)
        }
        
        setIsReady(true)
      } catch (error: any) {
        console.error(`❌ Error processing model ${id}:`, error)
        setIsReady(false)
      }
    }
  }, [gltf?.scene, id])

  useEffect(() => {
    if (!clonedScene.current) return
    
    clonedScene.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          materials.forEach((mat) => {
            if ('color' in mat && mat instanceof THREE.MeshStandardMaterial) {
              if (!originalColorsRef.current.has(mat)) {
                originalColorsRef.current.set(mat, mat.color.clone())
              }
              
              if (isColliding) {
                mat.color.set('#DC2626')
              } else {
                const originalColor = originalColorsRef.current.get(mat)
                if (originalColor) {
                  mat.color.copy(originalColor)
                }
              }
            }
          })
        }
      }
    })
  }, [isColliding])

  if (!modelState) {
    return null
  }

  if (!gltf?.scene || !clonedScene.current || !isReady) {
    return null
  }

  return (
    <>
      <group ref={ref}>
        <primitive object={clonedScene.current} />
      </group>
      {isColliding && ref.current && (
        <CollisionTooltip position={ref.current.position} visible={true} />
      )}
      <TransformControls
        ref={transformControlsRef}
        object={ref as React.MutableRefObject<THREE.Group>}
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
