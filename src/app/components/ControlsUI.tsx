"use client"
import { useState } from "react"
import { useAppStore } from "../utils/store"
import RotationControls from "./RotationControls"
import { useUndoRedoContext } from "../contexts/UndoRedoContext"

type ControlsUIProps = {
  modelIds: string[]
}

export default function ControlsUI({ modelIds }: ControlsUIProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const viewMode = useAppStore((state) => state.viewMode)
  const setViewMode = useAppStore((state) => state.setViewMode)
  const transformMode = useAppStore((state) => state.transformMode)
  const setTransformMode = useAppStore((state) => state.setTransformMode)
  const verticalMoveMode = useAppStore((state) => state.verticalMoveMode)
  const setVerticalMoveMode = useAppStore((state) => state.setVerticalMoveMode)
  const { undo, redo, canUndo, canRedo } = useUndoRedoContext()

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-white to-gray-50 shadow-2xl transition-all duration-300 z-50 flex flex-col border-r border-gray-200 ${
        isExpanded ? 'w-80' : 'w-14'
      }`}
      style={{ top: '73px' }}
    >
      {/* Header with minimize/expand button */}
      <div className="bg-gradient-to-r from-[#001B3D] to-[#002b5d] px-5 py-4 flex items-center justify-between flex-shrink-0 shadow-md">
        {isExpanded && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-white text-xl">⚙️</span>
            </div>
            <h2 className="text-white font-bold text-lg tracking-wide" style={{ fontFamily: "Montserrat" }}>
              Controls
            </h2>
          </div>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200 flex items-center justify-center min-w-[36px] ml-auto"
          title={isExpanded ? 'Minimize' : 'Expand'}
        >
          <span className="text-lg font-semibold">{isExpanded ? '►' : '◄'}</span>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
          {/* View Mode Toggle */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <label className="block text-sm font-semibold text-[#2D3748] mb-3 flex items-center gap-2" style={{ fontFamily: "Montserrat" }}>
              <span className="text-lg">👁️</span>
              View Mode
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setViewMode("3d")}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                  viewMode === "3d" 
                    ? "bg-gradient-to-r from-[#001B3D] to-[#002b5d] text-white" 
                    : "bg-white text-[#2D3748] hover:bg-gray-50 border-2 border-gray-200"
                }`}
                style={{ fontFamily: "Montserrat" }}
              >
                3D
              </button>
              <button
                onClick={() => setViewMode("2d")}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                  viewMode === "2d" 
                    ? "bg-gradient-to-r from-[#001B3D] to-[#002b5d] text-white" 
                    : "bg-white text-[#2D3748] hover:bg-gray-50 border-2 border-gray-200"
                }`}
                style={{ fontFamily: "Montserrat" }}
              >
                2D (Top-down)
              </button>
            </div>
          </div>

          {/* Transform Mode Toggle */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <label className="block text-sm font-semibold text-[#2D3748] mb-3 flex items-center gap-2" style={{ fontFamily: "Montserrat" }}>
              <span className="text-lg">🔄</span>
              Transform Mode
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setTransformMode("translate")}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                  transformMode === "translate" 
                    ? "bg-gradient-to-r from-[#001B3D] to-[#002b5d] text-white" 
                    : "bg-white text-[#2D3748] hover:bg-gray-50 border-2 border-gray-200"
                }`}
                style={{ fontFamily: "Montserrat" }}
              >
                ↔ Move
              </button>
              <button
                onClick={() => setTransformMode("rotate")}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                  transformMode === "rotate" 
                    ? "bg-gradient-to-r from-[#001B3D] to-[#002b5d] text-white" 
                    : "bg-white text-[#2D3748] hover:bg-gray-50 border-2 border-gray-200"
                }`}
                style={{ fontFamily: "Montserrat" }}
              >
                ↻ Rotate
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1" style={{ fontFamily: "Montserrat" }}>
              <span>💡</span>
              {transformMode === "translate" ? "Click and drag arrows to move" : "Click and drag circles to rotate"}
            </p>
          </div>

          {/* Vertical move toggle (only show in translate mode) */}
          {transformMode === "translate" && (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <label className="block text-sm font-semibold text-[#2D3748] mb-3 flex items-center gap-2" style={{ fontFamily: "Montserrat" }}>
                <span className="text-lg">⬆️</span>
                Vertical Movement (Y)
              </label>
              <button
                onClick={() => setVerticalMoveMode(!verticalMoveMode)}
                className={`w-full px-4 py-3.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                  verticalMoveMode 
                    ? "bg-gradient-to-r from-[#C41E3A] to-[#d63031] text-white" 
                    : "bg-white text-[#2D3748] hover:bg-gray-50 border-2 border-gray-200"
                }`}
                style={{ fontFamily: "Montserrat" }}
              >
                {verticalMoveMode ? "✓ On" : "Off"}
              </button>
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1" style={{ fontFamily: "Montserrat" }}>
                <span>💡</span>
                {verticalMoveMode ? "Easier up/down movement" : "Ground plane only (X/Z)"}
              </p>
            </div>
          )}

          {/* Undo/Redo Controls */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <label className="block text-sm font-semibold text-[#2D3748] mb-3 flex items-center gap-2" style={{ fontFamily: "Montserrat" }}>
              <span className="text-lg">⏪</span>
              History
            </label>
            <div className="flex gap-3">
              <button
                onClick={undo}
                disabled={!canUndo}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                  canUndo
                    ? "bg-gradient-to-r from-[#001B3D] to-[#002b5d] text-white hover:from-[#002b5d] hover:to-[#003d7a]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
                }`}
                style={{ fontFamily: "Montserrat" }}
              >
                ↶ Undo
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                  canRedo
                    ? "bg-gradient-to-r from-[#001B3D] to-[#002b5d] text-white hover:from-[#002b5d] hover:to-[#003d7a]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
                }`}
                style={{ fontFamily: "Montserrat" }}
              >
                ↷ Redo
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📖</span>
              <h3 className="text-sm font-semibold text-[#2D3748]" style={{ fontFamily: "Montserrat" }}>
                Instructions
              </h3>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-semibold text-[#001B3D] mb-1 flex items-center gap-2" style={{ fontFamily: "Montserrat" }}>
                  <span>↔️</span>
                  Drag
                </p>
                <p className="text-xs text-gray-600" style={{ fontFamily: "Montserrat" }}>
                  Use the transform control (yellow gizmo) to move models.
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-semibold text-[#C41E3A] mb-1 flex items-center gap-2" style={{ fontFamily: "Montserrat" }}>
                  <span>↻</span>
                  Rotation
                </p>
                <p className="text-xs text-gray-600" style={{ fontFamily: "Montserrat" }}>
                  Use the control below to rotate the model.
                </p>
              </div>
            </div>
          </div>

          {/* Rotation Controls */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🎯</span>
              <h3 className="text-sm font-semibold text-[#2D3748]" style={{ fontFamily: "Montserrat" }}>
                Model Rotation
              </h3>
            </div>
            <div className="space-y-4">
              {modelIds.map((id) => (
                <RotationControls key={id} modelId={id} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Minimized state indicator */}
      {!isExpanded && (
        <div className="flex-1 flex items-center justify-center">
          <div className="transform -rotate-90 whitespace-nowrap">
            <span className="text-gray-400 text-sm font-semibold" style={{ fontFamily: "Montserrat" }}>
              Controls
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
