import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DrawingTool, Layer, ViewMode } from '../types/map'

interface EditorState {
  currentFloor: number
  selectedTool: DrawingTool
  selectedLayer: Layer
  zoom: number
  gridVisible: boolean
  coordinatesVisible: boolean
  viewMode: ViewMode
  layerVisibility: Record<Layer, boolean>
}

const initialState: EditorState = {
  currentFloor: 0,
  selectedTool: 'pen',
  selectedLayer: 'floor',
  zoom: 1.0,
  gridVisible: true,
  coordinatesVisible: false,
  viewMode: '2d',
  layerVisibility: {
    floor: true,
    walls: true,
    events: true,
    decorations: true,
  },
}

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setCurrentFloor: (state, action: PayloadAction<number>) => {
      state.currentFloor = action.payload
    },
    
    setSelectedTool: (state, action: PayloadAction<DrawingTool>) => {
      state.selectedTool = action.payload
    },
    
    setSelectedLayer: (state, action: PayloadAction<Layer>) => {
      state.selectedLayer = action.payload
    },
    
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = Math.max(0.1, Math.min(4.0, action.payload))
    },
    
    toggleGrid: (state) => {
      state.gridVisible = !state.gridVisible
    },
    
    toggleCoordinates: (state) => {
      state.coordinatesVisible = !state.coordinatesVisible
    },
    
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload
    },
    
    toggleLayerVisibility: (state, action: PayloadAction<Layer>) => {
      state.layerVisibility[action.payload] = !state.layerVisibility[action.payload]
    },
  },
})

export const {
  setCurrentFloor,
  setSelectedTool,
  setSelectedLayer,
  setZoom,
  toggleGrid,
  toggleCoordinates,
  setViewMode,
  toggleLayerVisibility,
} = editorSlice.actions

export default editorSlice.reducer