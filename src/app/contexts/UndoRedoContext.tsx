'use client'
import { createContext, useContext, ReactNode } from 'react'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useAppStore } from '../utils/store'

type ModelState = {
  [modelId: string]: {
    position: [number, number, number]
    rotation: [number, number, number]
  }
}

type UndoRedoContextType = {
  saveCurrentState: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

const UndoRedoContext = createContext<UndoRedoContextType | null>(null)

export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const models = useAppStore((state) => state.models)
  const initializeModel = useAppStore((state) => state.initializeModel)

  // Convert current models to the format needed by undo/redo
  const getCurrentModelState = (): ModelState => {
    const state: ModelState = {}
    Object.entries(models).forEach(([id, model]) => {
      state[id] = {
        position: model.position,
        rotation: model.rotation,
      }
    })
    return state
  }

  // Initialize with current state
  const initialModelState = getCurrentModelState()
  const undoRedo = useUndoRedo(initialModelState)

  // Save current state to history
  const saveCurrentState = () => {
    const currentState = getCurrentModelState()
    undoRedo.pushState(currentState)
  }

  // Undo - restore previous state
  const handleUndo = () => {
    const previousState = undoRedo.undo()
    if (previousState) {
      Object.entries(previousState.models).forEach(([id, model]) => {
        initializeModel(id, model.position, model.rotation)
      })
    }
  }

  // Redo - restore next state
  const handleRedo = () => {
    const nextState = undoRedo.redo()
    if (nextState) {
      Object.entries(nextState.models).forEach(([id, model]) => {
        initializeModel(id, model.position, model.rotation)
      })
    }
  }

  const value: UndoRedoContextType = {
    saveCurrentState,
    undo: handleUndo,
    redo: handleRedo,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
  }

  return <UndoRedoContext.Provider value={value}>{children}</UndoRedoContext.Provider>
}

export function useUndoRedoContext() {
  const context = useContext(UndoRedoContext)
  if (!context) {
    throw new Error('useUndoRedoContext must be used within UndoRedoProvider')
  }
  return context
}

