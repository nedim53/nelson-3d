"use client"

import { useEffect, useState } from "react"
import CanvasWrapper from "./components/CanvasWrapper"
import ControlsUI from "./components/ControlsUI"
import { useAppStore } from "./utils/store"
import { loadModelState } from "./lib/firestoreApi"

const USE_SIMPLE_MODELS = false

const MODEL_URLS: Record<string, string> = {
  modelA: "/models/modelA.glb",
  modelB: "/models/modelB.glb",
}

const MODEL_IDS = ["modelA", "modelB"]

const SIMPLE_MODELS_CONFIG: Record<string, { shape: "box" | "sphere" | "cone" | "cylinder"; color: string }> = {
  modelA: { shape: "box", color: "#3b82f6" },
  modelB: { shape: "sphere", color: "#ef4444" },
}

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

        const loadPromises = MODEL_IDS.map(async (id) => {
          const savedState = await loadModelState(id)

          if (savedState) {
            initializeModel(id, savedState.position, savedState.rotation)
          } else {
            initializeModel(id, DEFAULT_POSITIONS[id] || [0, 0, 0], DEFAULT_ROTATIONS[id] || [0, 0, 0])

            try {
              const { saveModelState } = await import("./lib/firestoreApi")
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
        console.error("Error loading models:", err)
        setError("Greška pri učitavanju modela iz baze podataka")

        MODEL_IDS.forEach((id) => {
          initializeModel(id, DEFAULT_POSITIONS[id] || [0, 0, 0], DEFAULT_ROTATIONS[id] || [0, 0, 0])
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadModels()
  }, [initializeModel])

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 mb-8 mx-auto relative">
            <div
              className="w-full h-full rounded-full border-4 animate-spin"
              style={{
                borderColor: "#E2E8F0",
                borderTopColor: "#C41E3A",
              }}
            ></div>
            <div
              className="absolute inset-0 rounded-full opacity-30 animate-pulse"
              style={{
                borderColor: "#C41E3A",
              }}
            ></div>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#001B3D", fontFamily: "Montserrat" }}>
            Učitavanje modela
          </h2>
          <p className="text-sm font-light" style={{ color: "#718096", fontFamily: "Montserrat" }}>
            Molim vas, pričekajte...
          </p>
          <div className="flex justify-center gap-1 mt-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  backgroundColor: "#C41E3A",
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#F7FAFC" }}>
        <div
          className="w-full max-w-md rounded-2xl shadow-xl p-8 backdrop-blur-sm border"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" }}
        >
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full mb-4 mx-auto"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <svg className="w-8 h-8" style={{ color: "#DC2626" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2 text-center" style={{ color: "#2D3748", fontFamily: "Montserrat" }}>
            Greška pri učitavanju
          </h3>
          <p className="text-sm text-center mb-4 font-light" style={{ color: "#718096", fontFamily: "Montserrat" }}>
            {error}
          </p>
          <div className="pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
            <p className="text-xs font-light" style={{ color: "#718096", fontFamily: "Montserrat" }}>
              Provjerite Firebase konfiguraciju u{" "}
              <code
                className="px-2 py-1 rounded text-xs font-mono inline-block mt-2"
                style={{ backgroundColor: "#F7FAFC", color: "#2D3748" }}
              >
                .env.local
              </code>{" "}
              fajlu.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col">
      <header className="bg-[#001B3D] text-white px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wide" style={{ fontFamily: "Montserrat" }}>
            NELSON CABINETRY
          </h1>
          <p className="text-sm text-gray-300" style={{ fontFamily: "Montserrat" }}>
            3D Kitchen Design
          </p>
        </div>
      </header>

      <div className="flex-1 flex gap-4 overflow-hidden bg-[#F7FAFC] p-4">
        <div className="w-80 bg-white rounded-lg shadow-lg overflow-y-auto">
          <ControlsUI modelIds={MODEL_IDS} />
        </div>

        <div className="flex-1 rounded-lg shadow-lg overflow-hidden">
          <CanvasWrapper
            modelUrls={USE_SIMPLE_MODELS ? {} : MODEL_URLS}
            useSimpleModels={USE_SIMPLE_MODELS}
            simpleModelsConfig={SIMPLE_MODELS_CONFIG}
          />
        </div>
      </div>

      <footer className="bg-[#001B3D] text-white px-6 py-3 text-center">
        <p className="text-sm" style={{ fontFamily: "Montserrat", color: "#E2E8F0" }}>
          © 2025 Nelson Cabinetry | Premium RTA Cabinets | Free 3D Kitchen Design
        </p>
      </footer>

      {USE_SIMPLE_MODELS && (
        <div
          className="absolute top-4 right-4 rounded-xl shadow-lg p-5 z-20 max-w-xs backdrop-blur-sm border"
          style={{ backgroundColor: "#FFFBEB", borderColor: "#FCD34D" }}
        >
          <div className="flex items-start gap-3">
            <div className="text-lg mt-0.5 flex-shrink-0">⚠️</div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#001B3D", fontFamily: "Montserrat" }}>
                Test Mode
              </p>
              <p
                className="text-xs mt-1 font-light leading-relaxed"
                style={{ color: "#78350F", fontFamily: "Montserrat" }}
              >
                Koristiš Three.js oblike za testiranje. Postavi{" "}
                <code
                  className="inline-block px-2 py-1 rounded text-xs font-mono mt-1"
                  style={{ backgroundColor: "#FCD34D", color: "#001B3D" }}
                >
                  USE_SIMPLE_MODELS = false
                </code>{" "}
                kada dodaš GLB modele.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
