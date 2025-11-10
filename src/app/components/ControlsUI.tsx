"use client"
import { useAppStore } from "../utils/store"
import RotationControls from "./RotationControls"

type ControlsUIProps = {
  modelIds: string[]
}

export default function ControlsUI({ modelIds }: ControlsUIProps) {
  const viewMode = useAppStore((state) => state.viewMode)
  const setViewMode = useAppStore((state) => state.setViewMode)
  const verticalMoveMode = useAppStore((state) => state.verticalMoveMode)
  const setVerticalMoveMode = useAppStore((state) => state.setVerticalMoveMode)

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[#001B3D] px-6 py-4 sticky top-0 z-10 flex-shrink-0">
        <h2 className="text-white font-bold text-lg tracking-wide" style={{ fontFamily: "Montserrat" }}>
          Kontrole
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* View Mode Toggle */}
        <div>
          <label className="block text-sm font-semibold text-[#2D3748] mb-3" style={{ fontFamily: "Montserrat" }}>
            Prikaz:
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
            Vertikalno pomjeranje (Y):
          </label>
          <button
            onClick={() => setVerticalMoveMode(!verticalMoveMode)}
            className={`w-full px-4 py-3 rounded font-medium transition-all duration-200 ${
              verticalMoveMode ? "bg-[#C41E3A] text-white shadow-md" : "bg-gray-100 text-[#2D3748] hover:bg-gray-200"
            }`}
            style={{ fontFamily: "Montserrat" }}
          >
            {verticalMoveMode ? "✓ Uključeno" : "Isključeno"}
          </button>
          <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: "Montserrat" }}>
            {verticalMoveMode ? "Lakše gore/dole" : "Samo po podu (X/Z)"}
          </p>
        </div>

        {/* Instructions */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-[#2D3748] mb-1" style={{ fontFamily: "Montserrat" }}>
              <span className="text-[#001B3D]">Drag:</span>
            </p>
            <p className="text-xs text-gray-600" style={{ fontFamily: "Montserrat" }}>
              Koristi transform kontrolu (žuti gizmo) za pomicanje modela.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2D3748] mb-1" style={{ fontFamily: "Montserrat" }}>
              <span className="text-[#C41E3A]">Rotacija:</span>
            </p>
            <p className="text-xs text-gray-600" style={{ fontFamily: "Montserrat" }}>
              Koristi kontrolu ispod za rotaciju modela.
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
