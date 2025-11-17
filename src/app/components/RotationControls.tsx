"use client"
import { useAppStore } from "../utils/store"
import { saveModelState } from "../lib/firestoreApi"
import { createDebouncedFunction } from "../utils/debounce"
import { useCallback } from "react"

type Props = {
  modelId: string
}

export default function RotationControls({ modelId }: Props) {
  const modelState = useAppStore((state) => state.models[modelId])
  const updateModel = useAppStore((state) => state.updateModel)

  const debouncedSave = useCallback(
    createDebouncedFunction((id: string, data: { position: number[]; rotation: number[] }) => {
      saveModelState(id, data).catch(console.error)
    }, 200),
    [],
  )

  const handleRotationChange = useCallback(
    (axis: "x" | "y" | "z", value: number) => {
      if (!modelState) return

      const newRotation: [number, number, number] = [...modelState.rotation]
      const axisIndex = axis === "x" ? 0 : axis === "y" ? 1 : 2
      newRotation[axisIndex] = (value * Math.PI) / 180

      updateModel(modelId, { rotation: newRotation })

      debouncedSave(modelId, {
        position: modelState.position,
        rotation: newRotation,
      })
    },
    [modelId, modelState, updateModel, debouncedSave],
  )

  if (!modelState) return null

  const rotationDegrees = modelState.rotation.map((r) => (r * 180) / Math.PI)

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-[#001B3D] px-6 py-4 border-b-4 border-[#C41E3A]">
        <h3 className="font-bold text-lg text-white font-sans">Model Rotation</h3>
        <p className="text-gray-300 text-sm font-light">ID: {modelId}</p>
      </div>

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
