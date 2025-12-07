import { create } from 'zustand';
import * as THREE from 'three';

export type ViewMode = '3d' | '2d';
export type TransformMode = 'translate' | 'rotate';
export type ToolMode = 'select' | 'textbox';

export interface ModelData {
  position: [number, number, number];
  rotation: [number, number, number];
  mesh?: THREE.Object3D;  // Store the actual mesh for dynamic collision detection
}

export interface TextBoxData {
  id: string;
  position: [number, number, number];
  text: string;
  textColor: string;
  backgroundColor: string;
  backgroundTransparent: boolean;
  fontSize: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AppState {
  viewMode: ViewMode;
  transformMode: TransformMode;
  toolMode: ToolMode;
  selectedTextBoxId: string | null;
  models: Record<string, ModelData>;
  textBoxes: Record<string, TextBoxData>;
  verticalMoveMode: boolean;
  setViewMode: (mode: ViewMode) => void;
  setTransformMode: (mode: TransformMode) => void;
  setToolMode: (mode: ToolMode) => void;
  setSelectedTextBoxId: (id: string | null) => void;
  setVerticalMoveMode: (on: boolean) => void;
  updateModel: (id: string, data: Partial<ModelData>) => void;
  setModelMesh: (id: string, mesh: THREE.Object3D) => void;
  initializeModel: (id: string, position: [number, number, number], rotation: [number, number, number]) => void;
  addTextBox: (textBox: TextBoxData) => void;
  updateTextBox: (id: string, data: Partial<TextBoxData>) => void;
  removeTextBox: (id: string) => void;
  initializeTextBox: (id: string, textBox: TextBoxData) => void;
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: '3d',
  transformMode: 'translate',
  toolMode: 'select',
  selectedTextBoxId: null,
  models: {},
  textBoxes: {},
  verticalMoveMode: false,
  
  setViewMode: (mode) => set({ viewMode: mode }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  setToolMode: (mode) => set({ toolMode: mode, selectedTextBoxId: null }),
  setSelectedTextBoxId: (id) => set({ selectedTextBoxId: id }),
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
  
  setModelMesh: (id, mesh) => set((state) => ({
    models: {
      ...state.models,
      [id]: {
        ...state.models[id],
        mesh: mesh,
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
  
  addTextBox: (textBox) => set((state) => ({
    textBoxes: {
      ...state.textBoxes,
      [textBox.id]: textBox,
    },
  })),
  
  updateTextBox: (id, data) => set((state) => ({
    textBoxes: {
      ...state.textBoxes,
      [id]: {
        ...state.textBoxes[id],
        ...data,
        updatedAt: new Date(),
      },
    },
  })),
  
  removeTextBox: (id) => set((state) => {
    const newTextBoxes = { ...state.textBoxes }
    delete newTextBoxes[id]
    return { textBoxes: newTextBoxes }
  }),
  
  initializeTextBox: (id, textBox) => set((state) => ({
    textBoxes: {
      ...state.textBoxes,
      [id]: textBox,
    },
  })),
}));

