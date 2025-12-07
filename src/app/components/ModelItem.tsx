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
  
  // Store original colors for collision feedback
  const originalColorsRef = useRef<Map<THREE.Material, THREE.Color>>(new Map())
  
  // Load GLTF/GLB model - useGLTF handles loading with Suspense
  // Note: useGLTF supports both .gltf and .glb formats
  const gltf = useGLTF(url, true)
  
  // Log when model loads
  useEffect(() => {
    if (gltf?.scene) {
      console.log(`✅ Model ${id} loaded successfully from ${url}`)
      console.log(`   Scene children:`, gltf.scene.children.length)
      console.log(`   Scene position:`, gltf.scene.position)
    }
  }, [gltf?.scene, id, url])
  
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

  // Save mesh reference to store when ready (only once)
  useEffect(() => {
    if (ref.current && clonedScene.current) {
      setModelMesh(id, ref.current)
    }
  }, [id, setModelMesh, isReady])

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

    // Keep above ground: if any part dips below y=0, lift object up
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
      ref.current.position.copy(previousPosition)
      ref.current.rotation.copy(previousRotation)
      return
    }
    
    // Update previous position/rotation
    previousPosition.copy(position)
    previousRotation.copy(rotation)
    
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
  }, [id, updateModel, debouncedSave, checkCollisionAndUpdateFeedback, previousPosition, previousRotation, verticalMoveMode])

  // Handle drag start
  const handleDragStart = useCallback(() => {
    if (ref.current) {
      if (controls) controls.enabled = false
      setIsDragging(true)
      previousPosition.copy(ref.current.position)
      previousRotation.copy(ref.current.rotation)
      initialGroundYRef.current = ref.current.position.y
    }
  }, [previousPosition, previousRotation, controls])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    handleChange()
    setIsDragging(false)
    setIsColliding(false)
    // Save state to history for undo/redo
    saveCurrentState()
    if (controls) controls.enabled = true
  }, [handleChange, controls, saveCurrentState])

  // Clone the scene to avoid sharing between instances
  const clonedScene = useRef<THREE.Group | null>(null)
  
  useEffect(() => {
    if (gltf?.scene) {
      try {
        clonedScene.current = gltf.scene.clone()
        
        // Center and normalize model (optional - comment out if you want original positioning)
        const box = new THREE.Box3().setFromObject(clonedScene.current)
        if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3())
          clonedScene.current.position.sub(center)
        }
        
        console.log(`✅ Model ${id} processed and ready`)
        setIsReady(true)
      } catch (error: any) {
        console.error(`❌ Error processing model ${id}:`, error)
        setIsReady(false)
      }
    }
  }, [gltf?.scene, id])

  // Apply red tint to materials when colliding (store original colors)
  useEffect(() => {
    if (!clonedScene.current) return
    
    clonedScene.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          materials.forEach((mat) => {
            if ('color' in mat && mat instanceof THREE.MeshStandardMaterial) {
              // Store original color on first access
              if (!originalColorsRef.current.has(mat)) {
                originalColorsRef.current.set(mat, mat.color.clone())
              }
              
              // Apply red tint when colliding, restore original when not
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
    // Model is still loading - show nothing (Suspense will handle loading state)
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
