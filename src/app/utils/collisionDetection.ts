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
 */
function shrinkMeshGeometry(object: THREE.Object3D, amount: number): void {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      // Scale down slightly to create tolerance
      mesh.scale.multiplyScalar(1 - amount)
      mesh.updateMatrix()
      mesh.updateMatrixWorld(true)
    }
  })
}

/**
 * Check if two meshes intersect using precise BVH (Bounding Volume Hierarchy)
 * This method checks actual mesh geometry, accounting for rotation perfectly
 * @param tolerance - How much to shrink meshes (0.01 = 1% smaller, allows closer placement)
 */
function checkMeshIntersection(
  mesh1: THREE.Object3D,
  position1: [number, number, number],
  rotation1: [number, number, number],
  mesh2: THREE.Object3D,
  position2: [number, number, number],
  rotation2: [number, number, number],
  tolerance: number = 0.015
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
  
  // Shrink meshes slightly to allow closer placement
  // This creates a small tolerance margin (1.5% smaller by default)
  shrinkMeshGeometry(temp1, tolerance)
  shrinkMeshGeometry(temp2, tolerance)
  
  // Prepare BVH for both meshes
  prepareMeshBVH(temp1)
  prepareMeshBVH(temp2)
  
  // Check for intersection using BVH
  let hasIntersection = false
  
  temp1.traverse((child1) => {
    if (hasIntersection) return
    
    if ((child1 as THREE.Mesh).isMesh) {
      const mesh1 = child1 as THREE.Mesh
      const bvh1 = mesh1.geometry.boundsTree
      
      if (!bvh1) return
      
      temp2.traverse((child2) => {
        if (hasIntersection) return
        
        if ((child2 as THREE.Mesh).isMesh) {
          const mesh2 = child2 as THREE.Mesh
          const bvh2 = mesh2.geometry.boundsTree
          
          if (!bvh2) return
          
          // Get inverse matrix to transform mesh2 into mesh1's local space
          const inverseMatrix = new THREE.Matrix4().copy(mesh1.matrixWorld).invert()
          const mesh2ToMesh1 = new THREE.Matrix4().multiplyMatrices(inverseMatrix, mesh2.matrixWorld)
          
          // Check intersection using BVH
          const intersects = bvh1.intersectsGeometry(mesh2.geometry, mesh2ToMesh1)
          
          if (intersects) {
            hasIntersection = true
          }
        }
      })
    }
  })
  
  return hasIntersection
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
  tolerance: number = 0.015
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

