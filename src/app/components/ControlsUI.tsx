"use client"
import { useAppStore } from "../utils/store"
import RotationControls from "./RotationControls"
import { useUndoRedoContext } from "../contexts/UndoRedoContext"

type ControlsUIProps = {
  modelIds: string[]
}

export default function ControlsUI({ modelIds }: ControlsUIProps) {
  const viewMode = useAppStore((state) => state.viewMode)
  const setViewMode = useAppStore((state) => state.setViewMode)
  const verticalMoveMode = useAppStore((state) => state.verticalMoveMode)
  const setVerticalMoveMode = useAppStore((state) => state.setVerticalMoveMode)
  const { undo, redo, canUndo, canRedo } = useUndoRedoContext()

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[#001B3D] px-6 py-4 sticky top-0 z-10 flex-shrink-0">
        <h2 className="text-white font-bold text-lg tracking-wide" style={{ fontFamily: "Montserrat" }}>
          Controls
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* View Mode Toggle */}
        <div>
          <label className="block text-sm font-semibold text-[#2D3748] mb-3" style={{ fontFamily: "Montserrat" }}>
            View:
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode("3d")}
              className={`flex-1 px-4 py-2.5 rounded font-medium transition-all duration-200 ${
                viewMode === "3d" ? "bg-[#001B3D] text-white shadow-md" : "bg-gray-100 text-[#2D3748] hover:bg-gray-200"
              }`}
              style={{ fontFamily: "Montserrat" }}
            >
              3D
            </button>
            <button
              onClick={() => setViewMode("2d")}
              className={`flex-1 px-4 py-2.5 rounded font-medium transition-all duration-200 ${
                viewMode === "2d" ? "bg-[#001B3D] text-white shadow-md" : "bg-gray-100 text-[#2D3748] hover:bg-gray-200"
              }`}
              style={{ fontFamily: "Montserrat" }}
            >
              2D (Top-down)
            </button>
          </div>
        </div>

        {/* Vertical move toggle */}
        <div>
          <label className="block text-sm font-semibold text-[#2D3748] mb-3" style={{ fontFamily: "Montserrat" }}>
            Vertical movement (Y):
          </label>
          <button
            onClick={() => setVerticalMoveMode(!verticalMoveMode)}
            className={`w-full px-4 py-3 rounded font-medium transition-all duration-200 ${
              verticalMoveMode ? "bg-[#C41E3A] text-white shadow-md" : "bg-gray-100 text-[#2D3748] hover:bg-gray-200"
            }`}
            style={{ fontFamily: "Montserrat" }}
          >
            {verticalMoveMode ? "✓ On" : "Off"}
          </button>
          <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: "Montserrat" }}>
            {verticalMoveMode ? "Easier up/down" : "Ground plane only (X/Z)"}
          </p>
        </div>

        {/* Undo/Redo Controls */}
        <div>
          <label className="block text-sm font-semibold text-[#2D3748] mb-3" style={{ fontFamily: "Montserrat" }}>
            History:
          </label>
          <div className="flex gap-3">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`flex-1 px-4 py-2.5 rounded font-medium transition-all duration-200 ${
                canUndo
                  ? "bg-[#001B3D] text-white shadow-md hover:bg-[#002b5d]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              style={{ fontFamily: "Montserrat" }}
            >
              ↶ Undo
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`flex-1 px-4 py-2.5 rounded font-medium transition-all duration-200 ${
                canRedo
                  ? "bg-[#001B3D] text-white shadow-md hover:bg-[#002b5d]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              style={{ fontFamily: "Montserrat" }}
            >
              ↷ Redo
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-[#2D3748] mb-1" style={{ fontFamily: "Montserrat" }}>
              <span className="text-[#001B3D]">Drag:</span>
            </p>
            <p className="text-xs text-gray-600" style={{ fontFamily: "Montserrat" }}>
              Use the transform control (yellow gizmo) to move models.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2D3748] mb-1" style={{ fontFamily: "Montserrat" }}>
              <span className="text-[#C41E3A]">Rotation:</span>
            </p>
            <p className="text-xs text-gray-600" style={{ fontFamily: "Montserrat" }}>
              Use the control below to rotate the model.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-3">
          {modelIds.map((id) => (
            <RotationControls key={id} modelId={id} />
          ))}
        </div>
      </div>
    </div>
  )
}
