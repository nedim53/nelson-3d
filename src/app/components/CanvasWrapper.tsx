"use client"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Grid, PerspectiveCamera, OrthographicCamera, Environment } from "@react-three/drei"
import { Suspense } from "react"
import { useAppStore } from "../utils/store"
import ModelItemWithErrorBoundary from "./ModelItemWithErrorBoundary"
import SimpleModelItem from "./SimpleModelItem"

type CanvasWrapperProps = {
  modelUrls: Record<string, string>
  useSimpleModels?: boolean
  simpleModelsConfig?: Record<string, { shape: "box" | "sphere" | "cone" | "cylinder"; color: string }>
}

function SceneContent({
  modelUrls,
  useSimpleModels = false,
  simpleModelsConfig = {},
}: {
  modelUrls: Record<string, string>
  useSimpleModels?: boolean
  simpleModelsConfig?: Record<string, { shape: "box" | "sphere" | "cone" | "cylinder"; color: string }>
}) {
  const viewMode = useAppStore((state) => state.viewMode)
  const models = useAppStore((state) => state.models)

  return (
    <>
      {/* Camera */}
      {viewMode === "3d" ? (
        <PerspectiveCamera makeDefault position={[6, 6, 6]} fov={45} />
      ) : (
        <OrthographicCamera makeDefault position={[0, 15, 0]} rotation={[-Math.PI / 2, 0, 0]} zoom={80} />
      )}

      {/* Lights */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      {/* Environment for better lighting */}
      <Environment preset="sunset" />

      <Grid
        renderOrder={-1}
        position={[0, -0.01, 0]}
        infiniteGrid
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#C41E3A"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#001B3D"
        fadeDistance={25}
        fadeStrength={1}
      />

      {/* Models */}
      {useSimpleModels
        ? Object.entries(models).map(([id, modelState]) => {
            const config = simpleModelsConfig[id]
            if (config && modelState) {
              return <SimpleModelItem key={id} id={id} shape={config.shape} color={config.color} />
            }
            return null
          })
        : Object.entries(modelUrls).map(([id, url]) => {
            if (models[id]) {
              const fallbackConfig =
                id === "modelA"
                  ? { shape: "box" as const, color: "#001B3D" }
                  : { shape: "sphere" as const, color: "#C41E3A" }

              return (
                <Suspense
                  key={id}
                  fallback={
                    // Loading placeholder
                    <mesh position={models[id]?.position || [0, 0, 0]}>
                      <boxGeometry args={[0.3, 0.3, 0.3]} />
                      <meshStandardMaterial color="#2D3748" transparent opacity={0.5} />
                    </mesh>
                  }
                >
                  <ModelItemWithErrorBoundary
                    url={url}
                    id={id}
                    fallbackShape={fallbackConfig.shape}
                    fallbackColor={fallbackConfig.color}
                  />
                </Suspense>
              )
            }
            return null
          })}

      {/* Controls - only in 3D mode */}
      {viewMode === "3d" && <OrbitControls makeDefault enableDamping dampingFactor={0.05} />}
    </>
  )
}

export default function CanvasWrapper({
  modelUrls,
  useSimpleModels = false,
  simpleModelsConfig = {},
}: CanvasWrapperProps) {
  return (
    <div className="w-full h-screen bg-background">
      <Canvas>
        <SceneContent modelUrls={modelUrls} useSimpleModels={useSimpleModels} simpleModelsConfig={simpleModelsConfig} />
      </Canvas>
    </div>
  )
}
