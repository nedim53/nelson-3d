'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import { useGLTF, TransformControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../utils/store'
import { saveModelState } from '../lib/firestoreApi'
import { createDebouncedFunction } from '../utils/debounce'

type Props = {
  url: string
  id: string
}

export default function ModelItem({ url, id }: Props) {
  const ref = useRef<THREE.Group>(null)
  const transformControlsRef = useRef<any>(null)
  
  const modelState = useAppStore((state) => state.models[id])
  const updateModel = useAppStore((state) => state.updateModel)
  const setModelBoundingBox = useAppStore((state) => state.setModelBoundingBox)
  const allModels = useAppStore((state) => state.models)
  
  const [previousPosition] = useState<THREE.Vector3>(new THREE.Vector3())
  const [previousRotation] = useState<THREE.Euler>(new THREE.Euler())
  
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
    
    // Create temporary box at new position
    const tempGroup = new THREE.Group()
    tempGroup.copy(ref.current)
    tempGroup.position.copy(position)
    
    const candidateBox = new THREE.Box3().setFromObject(tempGroup)
    
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
  }, [id, updateModel, debouncedSave, checkCollision, previousPosition, previousRotation])

  // Handle drag start
  const handleDragStart = useCallback(() => {
    if (ref.current) {
      previousPosition.copy(ref.current.position)
      previousRotation.copy(ref.current.rotation)
    }
  }, [previousPosition, previousRotation])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    handleChange()
  }, [handleChange])

  // Clone the scene to avoid sharing between instances
  const clonedScene = useRef<THREE.Group | null>(null)
  
  useEffect(() => {
    if (gltf?.scene && !clonedScene.current) {
      try {
        clonedScene.current = gltf.scene.clone()
        
        // Center and normalize model (optional - comment out if you want original positioning)
        const box = new THREE.Box3().setFromObject(clonedScene.current)
        if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3())
          clonedScene.current.position.sub(center)
        }
        
        console.log(`✅ Model ${id} processed and ready`)
      } catch (error: any) {
        console.error(`❌ Error processing model ${id}:`, error)
      }
    }
  }, [gltf?.scene, id])

  if (!modelState) {
    return null
  }

  if (!gltf?.scene || !clonedScene.current) {
    // Model is still loading - show nothing (Suspense will handle loading state)
    return null
  }

  return (
    <>
      <group ref={ref}>
        <primitive object={clonedScene.current} />
      </group>
      <TransformControls
        ref={transformControlsRef}
        object={ref as React.MutableRefObject<THREE.Group>}
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
