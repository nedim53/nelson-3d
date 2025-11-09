'use client'
import { useAppStore } from '../utils/store'
import { saveModelState } from '../lib/firestoreApi'
import { createDebouncedFunction } from '../utils/debounce'
import { useCallback, useEffect } from 'react'

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
    []
  )

  const handleRotationChange = useCallback((axis: 'x' | 'y' | 'z', value: number) => {
    if (!modelState) return
    
    const newRotation: [number, number, number] = [...modelState.rotation]
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    newRotation[axisIndex] = (value * Math.PI) / 180 // Convert to radians
    
    updateModel(modelId, { rotation: newRotation })
    
    debouncedSave(modelId, {
      position: modelState.position,
      rotation: newRotation,
    })
  }, [modelId, modelState, updateModel, debouncedSave])

  if (!modelState) return null

  const rotationDegrees = modelState.rotation.map(r => (r * 180) / Math.PI)

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h3 className="font-semibold mb-2">Rotacija - {modelId}</h3>
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium mb-1">X: {rotationDegrees[0].toFixed(1)}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotationDegrees[0]}
            onChange={(e) => handleRotationChange('x', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Y: {rotationDegrees[1].toFixed(1)}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotationDegrees[1]}
            onChange={(e) => handleRotationChange('y', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Z: {rotationDegrees[2].toFixed(1)}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotationDegrees[2]}
            onChange={(e) => handleRotationChange('z', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}

