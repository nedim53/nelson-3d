'use client'

import { useEffect, useState } from 'react'
import CanvasWrapper from './components/CanvasWrapper'
import ControlsUI from './components/ControlsUI'
import { useAppStore } from './utils/store'
import { loadModelState, ModelState } from './lib/firestoreApi'

// Flag za korištenje jednostavnih modela umjesto GLB (za testiranje)
const USE_SIMPLE_MODELS = false // Postavi na false kada imaš GLB/GLTF modele

// Model URLs - zamijenite s putanjama do vaših GLB/GLTF modela
const MODEL_URLS: Record<string, string> = {
  modelA: '/models/modelA.glb', // GLB format
  modelB: '/models/modelB.glb',  // GLB format
}

const MODEL_IDS = ['modelA', 'modelB']

// Konfiguracija za jednostavne modele (ako GLB ne postoje)
const SIMPLE_MODELS_CONFIG: Record<string, { shape: 'box' | 'sphere' | 'cone' | 'cylinder', color: string }> = {
  modelA: { shape: 'box', color: '#3b82f6' }, // Plava kocka
  modelB: { shape: 'sphere', color: '#ef4444' }, // Crvena kugla
}

// Default positions (ako modeli ne postoje u Firestore)
const DEFAULT_POSITIONS: Record<string, [number, number, number]> = {
  modelA: [-2, 0, 0],
  modelB: [2, 0, 0],
}

const DEFAULT_ROTATIONS: Record<string, [number, number, number]> = {
  modelA: [0, 0, 0],
  modelB: [0, 0, 0],
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initializeModel = useAppStore((state) => state.initializeModel)

  useEffect(() => {
    async function loadModels() {
      try {
        setIsLoading(true)
        setError(null)

        // Load state for each model from Firestore
        const loadPromises = MODEL_IDS.map(async (id) => {
          const savedState = await loadModelState(id)
          
          if (savedState) {
            // Use saved state from Firestore
            initializeModel(id, savedState.position, savedState.rotation)
          } else {
            // Use default position/rotation
            initializeModel(
              id,
              DEFAULT_POSITIONS[id] || [0, 0, 0],
              DEFAULT_ROTATIONS[id] || [0, 0, 0]
            )
            
            // Save default state to Firestore
            try {
              const { saveModelState } = await import('./lib/firestoreApi')
              await saveModelState(id, {
                position: DEFAULT_POSITIONS[id] || [0, 0, 0],
                rotation: DEFAULT_ROTATIONS[id] || [0, 0, 0],
              })
            } catch (err) {
              console.error(`Failed to save default state for ${id}:`, err)
            }
          }
        })

        await Promise.all(loadPromises)
      } catch (err) {
        console.error('Error loading models:', err)
        setError('Greška pri učitavanju modela iz baze podataka')
        
        // Initialize with defaults even on error
        MODEL_IDS.forEach((id) => {
          initializeModel(
            id,
            DEFAULT_POSITIONS[id] || [0, 0, 0],
            DEFAULT_ROTATIONS[id] || [0, 0, 0]
          )
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadModels()
  }, [initializeModel])

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje modela...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-6 rounded-lg shadow-lg max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600">
            Provjerite Firebase konfiguraciju u .env.local fajlu.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen">
      <CanvasWrapper 
        modelUrls={USE_SIMPLE_MODELS ? {} : MODEL_URLS} 
        useSimpleModels={USE_SIMPLE_MODELS}
        simpleModelsConfig={SIMPLE_MODELS_CONFIG}
      />
      <ControlsUI modelIds={MODEL_IDS} />
      
      {/* Info banner ako koristiš jednostavne modele */}
      {USE_SIMPLE_MODELS && (
        <div className="absolute top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-20 max-w-xs">
          <p className="text-sm font-semibold mb-1">⚠️ Test Mode</p>
          <p className="text-xs">
            Koristiš jednostavne Three.js oblike za testiranje. 
            Postavi <code className="bg-yellow-200 px-1 rounded">USE_SIMPLE_MODELS = false</code> u page.tsx 
            kada dodaš GLB modele.
          </p>
        </div>
      )}
    </div>
  )
}
