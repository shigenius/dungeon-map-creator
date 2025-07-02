import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DrawingTool, Layer, ViewMode, FloorType, WallType } from '../types/map'

interface CapturedCellData {
  floor: {
    type: FloorType
    passable: boolean
  }
  walls: {
    north: { type: WallType; transparent: boolean } | null
    east: { type: WallType; transparent: boolean } | null
    south: { type: WallType; transparent: boolean } | null
    west: { type: WallType; transparent: boolean } | null
  }
  hasEvents: boolean
}

interface HoveredCellInfo {
  position: { x: number; y: number }
  floor: {
    type: FloorType
    passable: boolean
  }
  walls: {
    north: { type: WallType; transparent: boolean } | null
    east: { type: WallType; transparent: boolean } | null
    south: { type: WallType; transparent: boolean } | null
    west: { type: WallType; transparent: boolean } | null
  }
  events: Array<{ name: string; type: string }>
  decorations: Array<{ name: string; type: string }>
}

interface EditorState {
  currentFloor: number
  selectedTool: DrawingTool
  selectedLayer: Layer
  selectedFloorType: FloorType
  selectedWallType: WallType
  capturedCellData: CapturedCellData | null
  hoveredCellInfo: HoveredCellInfo | null
  hoveredCellPosition: { x: number; y: number } | null
  zoom: number
  gridVisible: boolean
  coordinatesVisible: boolean
  viewMode: ViewMode
  layerVisibility: Record<Layer, boolean>
  showNewProjectDialog: boolean
  accordionStates: {
    floorTypeAccordion: boolean
    wallTypeAccordion: boolean
  }
}

const initialState: EditorState = {
  currentFloor: 0,
  selectedTool: 'pen',
  selectedLayer: 'floor',
  selectedFloorType: 'normal',
  selectedWallType: 'normal',
  capturedCellData: null,
  hoveredCellInfo: null,
  hoveredCellPosition: null,
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
  showNewProjectDialog: false,
  accordionStates: {
    floorTypeAccordion: true,
    wallTypeAccordion: false,
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
      // レイヤー切り替え時にアコーディオンを自動で開く
      if (action.payload === 'floor') {
        state.accordionStates.floorTypeAccordion = true
      } else if (action.payload === 'walls') {
        state.accordionStates.wallTypeAccordion = true
      }
    },
    
    setSelectedFloorType: (state, action: PayloadAction<FloorType>) => {
      state.selectedFloorType = action.payload
    },
    
    setSelectedWallType: (state, action: PayloadAction<WallType>) => {
      state.selectedWallType = action.payload
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
    
    setCapturedCellData: (state, action: PayloadAction<CapturedCellData>) => {
      state.capturedCellData = action.payload
    },
    
    clearCapturedCellData: (state) => {
      state.capturedCellData = null
    },
    
    setHoveredCellInfo: (state, action: PayloadAction<HoveredCellInfo>) => {
      state.hoveredCellInfo = action.payload
    },
    
    clearHoveredCellInfo: (state) => {
      state.hoveredCellInfo = null
    },
    
    setHoveredCellPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.hoveredCellPosition = action.payload
    },
    
    clearHoveredCellPosition: (state) => {
      state.hoveredCellPosition = null
    },
    
    openNewProjectDialog: (state) => {
      state.showNewProjectDialog = true
    },
    
    closeNewProjectDialog: (state) => {
      state.showNewProjectDialog = false
    },

    toggleFloorTypeAccordion: (state) => {
      state.accordionStates.floorTypeAccordion = !state.accordionStates.floorTypeAccordion
    },

    toggleWallTypeAccordion: (state) => {
      state.accordionStates.wallTypeAccordion = !state.accordionStates.wallTypeAccordion
    },
  },
})

export const {
  setCurrentFloor,
  setSelectedTool,
  setSelectedLayer,
  setSelectedFloorType,
  setSelectedWallType,
  setCapturedCellData,
  clearCapturedCellData,
  setHoveredCellInfo,
  clearHoveredCellInfo,
  setHoveredCellPosition,
  clearHoveredCellPosition,
  setZoom,
  toggleGrid,
  toggleCoordinates,
  setViewMode,
  toggleLayerVisibility,
  openNewProjectDialog,
  closeNewProjectDialog,
  toggleFloorTypeAccordion,
  toggleWallTypeAccordion,
} = editorSlice.actions

export default editorSlice.reducer