"use client"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Grid, PerspectiveCamera, OrthographicCamera, Environment } from "@react-three/drei"
import { Suspense, useEffect, useRef } from "react"
import { useAppStore } from "../utils/store"
import ModelItemWithErrorBoundary from "./ModelItemWithErrorBoundary"
import SimpleModelItem from "./SimpleModelItem"
import TextBox from "./TextBox"
import * as THREE from "three"
import { saveTextBox } from "../lib/firestoreApi"
import { wouldTextBoxCollide } from "../utils/collisionDetection"

type CanvasWrapperProps = {
  modelUrls: Record<string, string>
  useSimpleModels?: boolean
  simpleModelsConfig?: Record<string, { shape: "box" | "sphere" | "cone" | "cylinder"; color: string }>
}

function CanvasClickHandler() {
  const { camera, gl, scene } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const groundPlaneRef = useRef<THREE.Mesh | null>(null)
  
  const toolMode = useAppStore((state) => state.toolMode)
  const addTextBox = useAppStore((state) => state.addTextBox)
  const allModels = useAppStore((state) => state.models)
  
  useEffect(() => {
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000)
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = 0
    plane.name = 'groundPlane'
    scene.add(plane)
    groundPlaneRef.current = plane
    
    return () => {
      scene.remove(plane)
      planeGeometry.dispose()
      planeMaterial.dispose()
    }
  }, [scene])
  
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (toolMode !== 'textbox') return
      
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'BUTTON' ||
        target.closest('div[style*="padding"]')
      ) {
        return
      }
      
      if (target !== gl.domElement) {
        return
      }
      
      const rect = gl.domElement.getBoundingClientRect()
      
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      raycaster.current.setFromCamera(mouse.current, camera)
      
      if (groundPlaneRef.current) {
        const intersects = raycaster.current.intersectObject(groundPlaneRef.current)
        
        if (intersects.length > 0) {
          const point = intersects[0].point
          const newPosition: [number, number, number] = [point.x, 0.1, point.z]
          
          // Prepare mesh data for all models
          const allMeshes: Record<string, { 
            mesh: THREE.Object3D, 
            position: [number, number, number], 
            rotation: [number, number, number] 
          }> = {}
          
          for (const [modelId, modelData] of Object.entries(allModels)) {
            if (modelData.mesh) {
              allMeshes[modelId] = {
                mesh: modelData.mesh,
                position: modelData.position,
                rotation: modelData.rotation
              }
            }
          }
          
          // Check collision with 3D models before placing
          const defaultTextLength = 12 // "New Text Box" length
          const defaultFontSize = 16
          const hasCollision = wouldTextBoxCollide(
            newPosition,
            defaultFontSize,
            defaultTextLength,
            allMeshes
          )
          
          // Only place text box if no collision
          if (!hasCollision) {
            const textBoxId = `textbox-${Date.now()}`
            const newTextBox = {
              id: textBoxId,
              position: newPosition,
              text: 'New Text Box',
              textColor: '#000000',
              backgroundColor: '#ffffff',
              backgroundTransparent: false,
              fontSize: defaultFontSize,
              createdAt: new Date(),
            }
            
            addTextBox(newTextBox)
            saveTextBox(newTextBox).catch(console.error)
            
            const setToolMode = useAppStore.getState().setToolMode
            setToolMode('select')
          }
        }
      }
    }
    
    gl.domElement.addEventListener('click', handleClick, true)
    return () => {
      gl.domElement.removeEventListener('click', handleClick, true)
    }
  }, [toolMode, camera, gl, addTextBox, scene, allModels])
  
  return null
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
  const textBoxes = useAppStore((state) => state.textBoxes)

  return (
    <>
      {viewMode === "3d" ? (
        <PerspectiveCamera makeDefault position={[6, 6, 6]} fov={45} />
      ) : (
        <OrthographicCamera makeDefault position={[0, 15, 0]} rotation={[-Math.PI / 2, 0, 0]} zoom={80} />
      )}

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

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

      {Object.keys(textBoxes).map((id) => (
        <TextBox key={id} id={id} />
      ))}

      <CanvasClickHandler />

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
