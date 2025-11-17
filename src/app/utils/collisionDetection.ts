import * as THREE from 'three'

/**
 * Simple collision detection helper
 * Checks if two Box3 bounding boxes intersect
 */
export function checkBox3Intersection(box1: THREE.Box3, box2: THREE.Box3): boolean {
  return box1.intersectsBox(box2)
}

/**
 * Check if a model's bounding box collides with any other model
 * @param modelBox - The bounding box of the model being checked
 * @param modelId - ID of the model being checked (to exclude from collision check)
 * @param allModels - Record of all models with their bounding boxes
 * @returns true if collision detected, false otherwise
 */
export function checkModelCollision(
  modelBox: THREE.Box3,
  modelId: string,
  allModels: Record<string, { boundingBox?: THREE.Box3 }>
): boolean {
  for (const [otherId, otherModel] of Object.entries(allModels)) {
    if (otherId === modelId) continue
    if (otherModel.boundingBox && checkBox3Intersection(modelBox, otherModel.boundingBox)) {
      return true
    }
  }
  return false
}

