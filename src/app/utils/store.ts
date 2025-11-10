import { create } from 'zustand';
import * as THREE from 'three';

export type ViewMode = '3d' | '2d';

export interface ModelData {
  position: [number, number, number];
  rotation: [number, number, number];
  boundingBox?: THREE.Box3;
}

interface AppState {
  viewMode: ViewMode;
  models: Record<string, ModelData>;
  verticalMoveMode: boolean;
  setViewMode: (mode: ViewMode) => void;
  setVerticalMoveMode: (on: boolean) => void;
  updateModel: (id: string, data: Partial<ModelData>) => void;
  setModelBoundingBox: (id: string, box: THREE.Box3) => void;
  initializeModel: (id: string, position: [number, number, number], rotation: [number, number, number]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: '3d',
  models: {},
  verticalMoveMode: false,
  
  setViewMode: (mode) => set({ viewMode: mode }),
  setVerticalMoveMode: (on) => set({ verticalMoveMode: on }),
  
  updateModel: (id, data) => set((state) => ({
    models: {
      ...state.models,
      [id]: {
        ...state.models[id],
        ...data,
      },
    },
  })),
  
  setModelBoundingBox: (id, box) => set((state) => ({
    models: {
      ...state.models,
      [id]: {
        ...state.models[id],
        boundingBox: box,
      },
    },
  })),
  
  initializeModel: (id, position, rotation) => set((state) => ({
    models: {
      ...state.models,
      [id]: {
        position,
        rotation,
      },
    },
  })),
}));

