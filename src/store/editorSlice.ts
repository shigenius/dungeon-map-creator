import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DrawingTool, Layer, ViewMode, FloorType, WallType, Template, TemplateCategory, CustomFloorType, CustomWallType, DungeonEvent, DecorationType } from '../types/map'

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
  selectedDecorationType: DecorationType
  capturedCellData: CapturedCellData | null
  hoveredCellInfo: HoveredCellInfo | null
  hoveredCellPosition: { x: number; y: number } | null
  hoveredWallInfo: { position: { x: number; y: number }; direction: 'north' | 'east' | 'south' | 'west' } | null
  isShiftPressed: boolean
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
  // テンプレート関連の状態
  templates: Template[]
  selectedTemplate: Template | null
  templateCategory: TemplateCategory
  showTemplateDialog: boolean
  // カスタムタイプ関連の状態
  customFloorTypes: CustomFloorType[]
  customWallTypes: CustomWallType[]
  showCustomTypeDialog: boolean
  customTypeDialogMode: 'floor' | 'wall' | null
  // イベント関連の状態
  showEventEditDialog: boolean
  editingEvent: DungeonEvent | null
  // テンプレート配置関連の状態
  templatePlacementMode: boolean
  templatePreviewPosition: { x: number; y: number } | null
  templateRotation: 0 | 90 | 180 | 270
  // ユーザーテンプレート作成関連の状態
  selectionMode: boolean
  selectionStart: { x: number; y: number } | null
  selectionEnd: { x: number; y: number } | null
  showCreateTemplateDialog: boolean
  // ヘルプダイアログの状態
  showHelpDialog: boolean
}

const initialState: EditorState = {
  currentFloor: 0,
  selectedTool: 'pen',
  selectedLayer: 'floor',
  selectedFloorType: 'normal',
  selectedWallType: 'normal',
  selectedDecorationType: 'furniture',
  capturedCellData: null,
  hoveredCellInfo: null,
  hoveredCellPosition: null,
  hoveredWallInfo: null,
  isShiftPressed: false,
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
  // テンプレート関連の初期状態
  templates: [],
  selectedTemplate: null,
  templateCategory: 'room',
  showTemplateDialog: false,
  // カスタムタイプ関連の初期状態
  customFloorTypes: [],
  customWallTypes: [],
  showCustomTypeDialog: false,
  customTypeDialogMode: null,
  // イベント関連の初期状態
  showEventEditDialog: false,
  editingEvent: null,
  // テンプレート配置関連の初期状態
  templatePlacementMode: false,
  templatePreviewPosition: null,
  templateRotation: 0,
  // ユーザーテンプレート作成関連の初期状態
  selectionMode: false,
  selectionStart: null,
  selectionEnd: null,
  showCreateTemplateDialog: false,
  // ヘルプダイアログの初期状態
  showHelpDialog: false,
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
    
    setSelectedDecorationType: (state, action: PayloadAction<DecorationType>) => {
      state.selectedDecorationType = action.payload
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
    
    setHoveredWallInfo: (state, action: PayloadAction<{ position: { x: number; y: number }; direction: 'north' | 'east' | 'south' | 'west' }>) => {
      state.hoveredWallInfo = action.payload
    },
    
    clearHoveredWallInfo: (state) => {
      state.hoveredWallInfo = null
    },
    
    setShiftPressed: (state, action: PayloadAction<boolean>) => {
      state.isShiftPressed = action.payload
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

    // テンプレート関連のアクション
    addTemplate: (state, action: PayloadAction<Template>) => {
      state.templates.push(action.payload)
    },

    removeTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter(template => template.id !== action.payload)
    },

    setSelectedTemplate: (state, action: PayloadAction<Template | null>) => {
      console.log('テンプレート選択:', action.payload?.name || 'null')
      const previousTemplate = state.selectedTemplate
      state.selectedTemplate = action.payload
      // テンプレートが選択された時にテンプレートツールに切り替え
      if (action.payload) {
        state.selectedTool = 'template'
        state.templatePlacementMode = true
        // 異なるテンプレートが選択された場合のみ回転をリセット
        if (!previousTemplate || previousTemplate.id !== action.payload.id) {
          state.templateRotation = 0
        }
        console.log('テンプレート配置モード有効化, ツール:', state.selectedTool)
      } else {
        state.templatePlacementMode = false
        state.templatePreviewPosition = null
        console.log('テンプレート配置モード無効化')
      }
    },

    setTemplateCategory: (state, action: PayloadAction<TemplateCategory>) => {
      state.templateCategory = action.payload
    },

    openTemplateDialog: (state) => {
      state.showTemplateDialog = true
    },

    closeTemplateDialog: (state) => {
      state.showTemplateDialog = false
    },

    loadTemplates: (state, action: PayloadAction<Template[]>) => {
      state.templates = action.payload
    },

    // カスタムタイプ関連のアクション
    addCustomFloorType: (state, action: PayloadAction<CustomFloorType>) => {
      state.customFloorTypes.push(action.payload)
    },

    removeCustomFloorType: (state, action: PayloadAction<string>) => {
      state.customFloorTypes = state.customFloorTypes.filter(type => type.id !== action.payload)
    },

    updateCustomFloorType: (state, action: PayloadAction<CustomFloorType>) => {
      const index = state.customFloorTypes.findIndex(type => type.id === action.payload.id)
      if (index !== -1) {
        state.customFloorTypes[index] = action.payload
      }
    },

    addCustomWallType: (state, action: PayloadAction<CustomWallType>) => {
      state.customWallTypes.push(action.payload)
    },

    removeCustomWallType: (state, action: PayloadAction<string>) => {
      state.customWallTypes = state.customWallTypes.filter(type => type.id !== action.payload)
    },

    updateCustomWallType: (state, action: PayloadAction<CustomWallType>) => {
      const index = state.customWallTypes.findIndex(type => type.id === action.payload.id)
      if (index !== -1) {
        state.customWallTypes[index] = action.payload
      }
    },

    openCustomTypeDialog: (state, action: PayloadAction<'floor' | 'wall'>) => {
      state.showCustomTypeDialog = true
      state.customTypeDialogMode = action.payload
    },

    closeCustomTypeDialog: (state) => {
      state.showCustomTypeDialog = false
      state.customTypeDialogMode = null
    },

    // イベント関連のアクション
    openEventEditDialog: (state, action: PayloadAction<DungeonEvent | null>) => {
      state.showEventEditDialog = true
      state.editingEvent = action.payload
    },

    closeEventEditDialog: (state) => {
      state.showEventEditDialog = false
      state.editingEvent = null
    },

    // テンプレート配置関連のアクション
    setTemplatePreviewPosition: (state, action: PayloadAction<{ x: number; y: number } | null>) => {
      state.templatePreviewPosition = action.payload
    },

    enableTemplatePlacementMode: (state) => {
      state.templatePlacementMode = true
      state.selectedTool = 'template'
    },

    disableTemplatePlacementMode: (state) => {
      state.templatePlacementMode = false
      state.templatePreviewPosition = null
      // テンプレート選択状態と回転は保持（連続配置のため）
      // state.selectedTemplate = null
      // state.selectedTool = 'pen'
      // state.templateRotation = 0
    },

    rotateTemplate: (state) => {
      const oldRotation = state.templateRotation
      state.templateRotation = ((state.templateRotation + 90) % 360) as 0 | 90 | 180 | 270
      console.log(`テンプレート右回転: ${oldRotation}° → ${state.templateRotation}°`)
    },

    rotateTemplateLeft: (state) => {
      const oldRotation = state.templateRotation
      state.templateRotation = ((state.templateRotation - 90 + 360) % 360) as 0 | 90 | 180 | 270
      console.log(`テンプレート左回転: ${oldRotation}° → ${state.templateRotation}°`)
    },

    setTemplateRotation: (state, action: PayloadAction<0 | 90 | 180 | 270>) => {
      state.templateRotation = action.payload
    },

    // ユーザーテンプレート作成関連のアクション
    startSelection: (state) => {
      state.selectionMode = true
      state.selectionStart = null
      state.selectionEnd = null
      state.selectedTool = 'select'
    },

    setSelectionStart: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.selectionStart = action.payload
    },

    setSelectionEnd: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.selectionEnd = action.payload
    },

    clearSelection: (state) => {
      state.selectionStart = null
      state.selectionEnd = null
      state.selectionMode = false
    },

    openCreateTemplateDialog: (state) => {
      state.showCreateTemplateDialog = true
    },

    closeCreateTemplateDialog: (state) => {
      state.showCreateTemplateDialog = false
      state.selectionStart = null
      state.selectionEnd = null
      state.selectionMode = false
    },

    // ヘルプダイアログ関連のアクション
    openHelpDialog: (state) => {
      state.showHelpDialog = true
    },

    closeHelpDialog: (state) => {
      state.showHelpDialog = false
    },
  },
})

export const {
  setCurrentFloor,
  setSelectedTool,
  setSelectedLayer,
  setSelectedFloorType,
  setSelectedWallType,
  setSelectedDecorationType,
  setCapturedCellData,
  clearCapturedCellData,
  setHoveredCellInfo,
  clearHoveredCellInfo,
  setHoveredCellPosition,
  clearHoveredCellPosition,
  setHoveredWallInfo,
  clearHoveredWallInfo,
  setShiftPressed,
  setZoom,
  toggleGrid,
  toggleCoordinates,
  setViewMode,
  toggleLayerVisibility,
  openNewProjectDialog,
  closeNewProjectDialog,
  toggleFloorTypeAccordion,
  toggleWallTypeAccordion,
  // テンプレート関連のアクション
  addTemplate,
  removeTemplate,
  setSelectedTemplate,
  setTemplateCategory,
  openTemplateDialog,
  closeTemplateDialog,
  loadTemplates,
  // カスタムタイプ関連のアクション
  addCustomFloorType,
  removeCustomFloorType,
  updateCustomFloorType,
  addCustomWallType,
  removeCustomWallType,
  updateCustomWallType,
  openCustomTypeDialog,
  closeCustomTypeDialog,
  // イベント関連のアクション
  openEventEditDialog,
  closeEventEditDialog,
  // テンプレート配置関連のアクション
  setTemplatePreviewPosition,
  enableTemplatePlacementMode,
  disableTemplatePlacementMode,
  rotateTemplate,
  rotateTemplateLeft,
  setTemplateRotation,
  // ユーザーテンプレート作成関連のアクション
  startSelection,
  setSelectionStart,
  setSelectionEnd,
  clearSelection,
  openCreateTemplateDialog,
  closeCreateTemplateDialog,
  // ヘルプダイアログ関連のアクション
  openHelpDialog,
  closeHelpDialog,
} = editorSlice.actions

export default editorSlice.reducer