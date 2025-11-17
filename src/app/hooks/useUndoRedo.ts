import { useState, useCallback } from 'react'

type ModelState = {
  [modelId: string]: {
    position: [number, number, number]
    rotation: [number, number, number]
  }
}

type HistoryState = {
  models: ModelState
}

const MAX_HISTORY = 10

/**
 * Simple undo/redo hook for model positions and rotations
 * Max history: 10 steps
 */
export function useUndoRedo(initialState: ModelState) {
  const [history, setHistory] = useState<HistoryState[]>([{ models: initialState }])
  const [currentIndex, setCurrentIndex] = useState(0)

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  const pushState = useCallback((newState: ModelState) => {
    setHistory((prev) => {
      // If we're not at the end of history, remove future states (clear redo stack)
      const newHistory = prev.slice(0, currentIndex + 1)
      
      // Add new state
      let updatedHistory = [...newHistory, { models: newState }]
      
      // Limit to MAX_HISTORY steps (keep most recent)
      if (updatedHistory.length > MAX_HISTORY) {
        updatedHistory = updatedHistory.slice(-MAX_HISTORY)
      }
      
      return updatedHistory
    })
    
    // Update index to point to the new state
    setCurrentIndex((prev) => {
      const newIndex = prev + 1
      // Ensure we don't exceed the max history length
      return Math.min(newIndex, MAX_HISTORY - 1)
    })
  }, [currentIndex])

  const undo = useCallback((): HistoryState | null => {
    if (!canUndo) return null
    
    setCurrentIndex((prev) => prev - 1)
    return history[currentIndex - 1]
  }, [canUndo, currentIndex, history])

  const redo = useCallback((): HistoryState | null => {
    if (!canRedo) return null
    
    setCurrentIndex((prev) => prev + 1)
    return history[currentIndex + 1]
  }, [canRedo, currentIndex, history])

  const reset = useCallback((newState: ModelState) => {
    setHistory([{ models: newState }])
    setCurrentIndex(0)
  }, [])

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    currentState: history[currentIndex]?.models || initialState,
    reset,
  }
}

