'use client'
import { useAppStore } from '../utils/store'
import RotationControls from './RotationControls'

type ControlsUIProps = {
  modelIds: string[]
}

export default function ControlsUI({ modelIds }: ControlsUIProps) {
  const viewMode = useAppStore((state) => state.viewMode)
  const setViewMode = useAppStore((state) => state.setViewMode)

  return (
    <div className="absolute top-4 left-4 z-10 max-w-xs">
      <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
        <h2 className="text-xl font-bold mb-4">Kontrole</h2>
        
        {/* View Mode Toggle */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Prikaz:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-4 py-2 rounded ${
                viewMode === '3d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              3D
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-4 py-2 rounded ${
                viewMode === '2d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              2D (Top-down)
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 mb-4">
          <p className="mb-2">
            <strong>Drag:</strong> Koristi transform kontrolu (žuti gizmo) za pomicanje modela.
          </p>
          <p>
            <strong>Rotacija:</strong> Koristi kontrolu ispod za rotaciju modela.
          </p>
        </div>
      </div>

      {/* Rotation Controls for each model */}
      {modelIds.map((id) => (
        <RotationControls key={id} modelId={id} />
      ))}
    </div>
  )
}

