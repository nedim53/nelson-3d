"use client"
import { useAppStore } from "../utils/store"
import { saveModelState } from "../lib/firestoreApi"
import { createDebouncedFunction } from "../utils/debounce"
import { wouldCollide } from "../utils/collisionDetection"
import { useCallback, useState } from "react"
import * as THREE from "three"

type Props = {
  modelId: string
}

export default function RotationControls({ modelId }: Props) {
  const modelState = useAppStore((state) => state.models[modelId])
  const updateModel = useAppStore((state) => state.updateModel)
  const allModels = useAppStore((state) => state.models)
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null)

  const debouncedSave = useCallback(
    createDebouncedFunction((id: string, data: { position: number[]; rotation: number[] }) => {
      saveModelState(id, data).catch(console.error)
    }, 200),
    [],
  )

  const handleRotationChange = useCallback(
    (axis: "x" | "y" | "z", value: number) => {
      if (!modelState || !modelState.mesh) return

      const newRotation: [number, number, number] = [...modelState.rotation]
      const axisIndex = axis === "x" ? 0 : axis === "y" ? 1 : 2
      newRotation[axisIndex] = (value * Math.PI) / 180

      // Prepare mesh data for collision check
      const allMeshes: Record<string, { 
        mesh: THREE.Object3D, 
        position: [number, number, number], 
        rotation: [number, number, number] 
      }> = {}
      
      for (const [otherId, otherModel] of Object.entries(allModels)) {
        if (otherModel.mesh) {
          allMeshes[otherId] = {
            mesh: otherModel.mesh,
            position: otherModel.position,
            rotation: otherModel.rotation
          }
        }
      }

      // Check if this rotation would cause collision
      const hasCollision = wouldCollide(
        modelState.mesh,
        modelState.position,
        newRotation,
        modelId,
        allMeshes
      )

      if (hasCollision) {
        // Show warning but don't apply rotation
        setCollisionWarning(`Cannot rotate ${axis.toUpperCase()} axis - would collide with another object`)
        // Clear warning after 2 seconds
        setTimeout(() => setCollisionWarning(null), 2000)
        return
      }

      // No collision, apply rotation
      setCollisionWarning(null)
      updateModel(modelId, { rotation: newRotation })

      debouncedSave(modelId, {
        position: modelState.position,
        rotation: newRotation,
      })
    },
    [modelId, modelState, allModels, updateModel, debouncedSave],
  )

  if (!modelState) return null

  const rotationDegrees = modelState.rotation.map((r) => (r * 180) / Math.PI)

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-[#001B3D] px-6 py-4 border-b-4 border-[#C41E3A]">
        <h3 className="font-bold text-lg text-white font-sans">Model Rotation</h3>
        <p className="text-gray-300 text-sm font-light">ID: {modelId}</p>
      </div>
      
      {/* Collision Warning */}
      {collisionWarning && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3" role="alert">
          <p className="text-sm font-medium">{collisionWarning}</p>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* X Axis Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#2D3748] uppercase tracking-wide">X Axis</label>
            <span className="text-lg font-bold text-[#C41E3A]">{rotationDegrees[0].toFixed(1)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={rotationDegrees[0]}
            onChange={(e) => handleRotationChange("x", Number.parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#001B3D]"
          />
          <div className="text-xs text-gray-500 font-light">0° - 360°</div>
        </div>

        {/* Y Axis Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#2D3748] uppercase tracking-wide">Y Axis</label>
            <span className="text-lg font-bold text-[#C41E3A]">{rotationDegrees[1].toFixed(1)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={rotationDegrees[1]}
            onChange={(e) => handleRotationChange("y", Number.parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#001B3D]"
          />
          <div className="text-xs text-gray-500 font-light">0° - 360°</div>
        </div>

        {/* Z Axis Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#2D3748] uppercase tracking-wide">Z Axis</label>
            <span className="text-lg font-bold text-[#C41E3A]">{rotationDegrees[2].toFixed(1)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={rotationDegrees[2]}
            onChange={(e) => handleRotationChange("z", Number.parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#001B3D]"
          />
          <div className="text-xs text-gray-500 font-light">0° - 360°</div>
        </div>
      </div>
    </div>
  )
}
