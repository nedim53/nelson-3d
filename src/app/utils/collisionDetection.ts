import * as THREE from 'three'
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast, MeshBVH } from 'three-mesh-bvh'

// Add BVH extensions to THREE.BufferGeometry
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree
THREE.Mesh.prototype.raycast = acceleratedRaycast

/**
 * Prepare mesh with BVH (Bounding Volume Hierarchy) for fast collision detection
 */
function prepareMeshBVH(object: THREE.Object3D): void {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      if (mesh.geometry && !mesh.geometry.boundsTree) {
        mesh.geometry.computeBoundsTree()
      }
    }
  })
}

/**
 * Shrink mesh geometry slightly to allow objects to get closer
 * This creates a small tolerance margin for more natural placement
 * Uses original scale to avoid cumulative shrinking
 */
function shrinkMeshGeometry(object: THREE.Object3D, amount: number, originalScales?: Map<THREE.Mesh, THREE.Vector3>): void {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      // Use provided original scale or current scale
      const originalScale = originalScales?.get(mesh) || mesh.scale.clone()
      // Scale down slightly to create tolerance
      mesh.scale.set(
        originalScale.x * (1 - amount),
        originalScale.y * (1 - amount),
        originalScale.z * (1 - amount)
      )
      mesh.updateMatrix()
      mesh.updateMatrixWorld(true)
    }
  })
}

/**
 * Check if two meshes intersect using precise BVH (Bounding Volume Hierarchy)
 * This method checks actual mesh geometry, accounting for rotation perfectly
 * Uses dual-check approach: first with tolerance for close placement, then strict check for penetration
 * @param tolerance - How much to shrink meshes for initial check (allows closer placement)
 */
function checkMeshIntersection(
  mesh1: THREE.Object3D,
  position1: [number, number, number],
  rotation1: [number, number, number],
  mesh2: THREE.Object3D,
  position2: [number, number, number],
  rotation2: [number, number, number],
  tolerance: number = 0.02
): boolean {
  // Clone and transform first mesh
  const temp1 = mesh1.clone(true)
  temp1.position.set(position1[0], position1[1], position1[2])
  temp1.rotation.set(rotation1[0], rotation1[1], rotation1[2])
  temp1.updateMatrixWorld(true)
  
  // Clone and transform second mesh
  const temp2 = mesh2.clone(true)
  temp2.position.set(position2[0], position2[1], position2[2])
  temp2.rotation.set(rotation2[0], rotation2[1], rotation2[2])
  temp2.updateMatrixWorld(true)
  
  // Store original scales
  const originalScales1: Map<THREE.Mesh, THREE.Vector3> = new Map()
  const originalScales2: Map<THREE.Mesh, THREE.Vector3> = new Map()
  
  temp1.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      originalScales1.set(mesh, mesh.scale.clone())
    }
  })
  
  temp2.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      originalScales2.set(mesh, mesh.scale.clone())
    }
  })
  
  // ALWAYS check for actual penetration FIRST (no tolerance)
  // This is the most important check - prevents any overlap
  prepareMeshBVH(temp1)
  prepareMeshBVH(temp2)
  
  let hasPenetration = false
  
  temp1.traverse((child1) => {
    if (hasPenetration) return
    
    if ((child1 as THREE.Mesh).isMesh) {
      const mesh1 = child1 as THREE.Mesh
      const bvh1 = mesh1.geometry.boundsTree
      
      if (!bvh1) return
      
      temp2.traverse((child2) => {
        if (hasPenetration) return
        
        if ((child2 as THREE.Mesh).isMesh) {
          const mesh2 = child2 as THREE.Mesh
          const bvh2 = mesh2.geometry.boundsTree
          
          if (!bvh2) return
          
          // Get inverse matrix to transform mesh2 into mesh1's local space
          const inverseMatrix = new THREE.Matrix4().copy(mesh1.matrixWorld).invert()
          const mesh2ToMesh1 = new THREE.Matrix4().multiplyMatrices(inverseMatrix, mesh2.matrixWorld)
          
          // STRICT CHECK: actual penetration - NO TOLERANCE
          // This is the primary check - if objects penetrate, collision detected
          const intersects = bvh1.intersectsGeometry(mesh2.geometry, mesh2ToMesh1)
          
          if (intersects) {
            hasPenetration = true
          }
        }
      })
    }
  })
  
  // If there's penetration, immediately report collision
  // This prevents any overlap - critical for preventing penetration
  if (hasPenetration) {
    return true
  }
  
  // SECOND CHECK: With tolerance to allow close placement (but prevent getting too close)
  // Only check this if there's no penetration
  // Shrink meshes slightly to create a small buffer zone
  shrinkMeshGeometry(temp1, tolerance, originalScales1)
  shrinkMeshGeometry(temp2, tolerance, originalScales2)
  
  // Rebuild BVH with shrunk geometry for tolerance check
  prepareMeshBVH(temp1)
  prepareMeshBVH(temp2)
  
  let hasIntersectionWithTolerance = false
  
  temp1.traverse((child1) => {
    if (hasIntersectionWithTolerance) return
    
    if ((child1 as THREE.Mesh).isMesh) {
      const mesh1 = child1 as THREE.Mesh
      const bvh1 = mesh1.geometry.boundsTree
      
      if (!bvh1) return
      
      temp2.traverse((child2) => {
        if (hasIntersectionWithTolerance) return
        
        if ((child2 as THREE.Mesh).isMesh) {
          const mesh2 = child2 as THREE.Mesh
          const bvh2 = mesh2.geometry.boundsTree
          
          if (!bvh2) return
          
          // Get inverse matrix to transform mesh2 into mesh1's local space
          const inverseMatrix = new THREE.Matrix4().copy(mesh1.matrixWorld).invert()
          const mesh2ToMesh1 = new THREE.Matrix4().multiplyMatrices(inverseMatrix, mesh2.matrixWorld)
          
          // Check intersection with tolerance (shrunk meshes)
          const intersects = bvh1.intersectsGeometry(mesh2.geometry, mesh2ToMesh1)
          
          if (intersects) {
            hasIntersectionWithTolerance = true
          }
        }
      })
    }
  })
  
  // Report collision if objects are too close (with tolerance)
  // This allows close placement but prevents getting too close
  return hasIntersectionWithTolerance
}

/**
 * Compute bounding box (used for quick broad-phase check)
 */
export function computeDynamicBoundingBox(
  mesh: THREE.Object3D,
  position: [number, number, number],
  rotation: [number, number, number]
): THREE.Box3 {
  const tempObject = mesh.clone(true)
  tempObject.position.set(position[0], position[1], position[2])
  tempObject.rotation.set(rotation[0], rotation[1], rotation[2])
  tempObject.updateMatrixWorld(true)
  
  const box = new THREE.Box3().setFromObject(tempObject)
  return box
}

/**
 * Check if two objects would collide using precise BVH collision detection
 * This is the most accurate method - checks actual mesh geometry with rotation
 * @param tolerance - Adjustment factor (0.01-0.02 recommended for natural placement)
 */
export function checkPreciseCollision(
  mesh1: THREE.Object3D,
  position1: [number, number, number],
  rotation1: [number, number, number],
  mesh2: THREE.Object3D,
  position2: [number, number, number],
  rotation2: [number, number, number],
  tolerance: number = 0.02
): boolean {
  return checkMeshIntersection(mesh1, position1, rotation1, mesh2, position2, rotation2, tolerance)
}

/**
 * Check if moving/rotating a model to a new position/rotation would cause collision
 * Uses precise BVH (Bounding Volume Hierarchy) collision detection
 * 
 * @param mesh - The actual mesh object
 * @param newPosition - The target position
 * @param newRotation - The target rotation
 * @param modelId - ID of the model being checked (to exclude from collision check)
 * @param allMeshes - Record of all mesh objects with their current transforms
 * @returns true if collision would occur, false if move is safe
 */
export function wouldCollide(
  mesh: THREE.Object3D,
  newPosition: [number, number, number],
  newRotation: [number, number, number],
  modelId: string,
  allMeshes: Record<string, { 
    mesh: THREE.Object3D, 
    position: [number, number, number], 
    rotation: [number, number, number] 
  }>
): boolean {
  // Check against all other models
  for (const [otherId, otherModel] of Object.entries(allMeshes)) {
    if (otherId === modelId) continue
    
    // Always use precise BVH collision detection
    // This is the most accurate and consistent method
    // It checks actual mesh geometry accounting for rotation perfectly
    const hasCollision = checkPreciseCollision(
      mesh,
      newPosition,
      newRotation,
      otherModel.mesh,
      otherModel.position,
      otherModel.rotation
    )
    
    if (hasCollision) {
      return true
    }
  }
  
  return false
}

/**
 * Create a bounding box mesh for a text box
 * Text boxes are HTML elements, so we create a simple box geometry for collision detection
 * @param fontSize - Font size of the text box (affects box size)
 * @param textLength - Approximate text length (affects box width)
 */
export function createTextBoxBoundingBox(fontSize: number = 16, textLength: number = 20): THREE.Mesh {
  // Estimate box dimensions based on font size and text
  // Text boxes have minWidth: 150px, maxWidth: 400px, padding: 12px 16px
  // Convert to 3D space (rough approximation: 1px ≈ 0.01 units)
  const width = Math.min(Math.max(textLength * fontSize * 0.01, 1.5), 4.0) // 1.5 to 4.0 units
  const height = fontSize * 0.02 + 0.3 // Height based on font size + padding
  const depth = 0.1 // Small depth for text box
  
  const geometry = new THREE.BoxGeometry(width, height, depth)
  const material = new THREE.MeshBasicMaterial({ visible: false })
  const box = new THREE.Mesh(geometry, material)
  
  return box
}

/**
 * Check if a text box would collide with any 3D models at the given position
 * @param textBoxPosition - Position of the text box
 * @param fontSize - Font size of the text box
 * @param textLength - Approximate text length
 * @param allMeshes - Record of all 3D model meshes
 * @returns true if collision would occur, false if placement is safe
 */
export function wouldTextBoxCollide(
  textBoxPosition: [number, number, number],
  fontSize: number,
  textLength: number,
  allMeshes: Record<string, { 
    mesh: THREE.Object3D, 
    position: [number, number, number], 
    rotation: [number, number, number] 
  }>
): boolean {
  // Create bounding box for text box
  const textBoxMesh = createTextBoxBoundingBox(fontSize, textLength)
  
  // Check collision against all models
  for (const [modelId, modelData] of Object.entries(allMeshes)) {
    if (!modelData.mesh) continue
    
    // Check if text box would intersect with this model
    const hasCollision = checkPreciseCollision(
      textBoxMesh,
      textBoxPosition,
      [0, 0, 0], // Text boxes don't rotate
      modelData.mesh,
      modelData.position,
      modelData.rotation,
      0.01 // Small tolerance
    )
    
    if (hasCollision) {
      // Clean up
      textBoxMesh.geometry.dispose()
      if (textBoxMesh.material instanceof THREE.Material) {
        textBoxMesh.material.dispose()
      }
      return true
    }
  }
  
  // Clean up
  textBoxMesh.geometry.dispose()
  if (textBoxMesh.material instanceof THREE.Material) {
    textBoxMesh.material.dispose()
  }
  
  return false
}

