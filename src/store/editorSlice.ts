import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DrawingTool, Layer, ViewMode, FloorType, WallType, Template, TemplateCategory, CustomFloorType, CustomWallType, CustomDecorationType, DungeonEvent, DecorationType, EventType } from '../types/map'

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
  selectedFloorPassable: boolean
  selectedWallType: WallType
  selectedDecorationType: DecorationType
  selectedEventType: EventType | null
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
    eventTypeAccordion: boolean
    decorationTypeAccordion: boolean
  }
  // テンプレート関連の状態
  templates: Template[]
  selectedTemplate: Template | null
  templateCategory: TemplateCategory
  showTemplateDialog: boolean
  // カスタムタイプ関連の状態
  customFloorTypes: CustomFloorType[]
  customWallTypes: CustomWallType[]
  customDecorationTypes: CustomDecorationType[]
  showCustomTypeDialog: boolean
  customTypeDialogMode: 'floor' | 'wall' | 'decoration' | null
  customTypeDialogType: 'add' | 'edit' | 'view' | null
  editingCustomType: CustomFloorType | CustomWallType | CustomDecorationType | null
  // イベント関連の状態
  showEventEditDialog: boolean
  editingEvent: DungeonEvent | null
  selectedEventId: string | null
  // テンプレート配置関連の状態
  templatePlacementMode: boolean
  templatePreviewPosition: { x: number; y: number } | null
  templateRotation: 0 | 90 | 180 | 270
  // ユーザーテンプレート作成関連の状態
  selectionMode: boolean
  selectionStart: { x: number; y: number } | null
  selectionEnd: { x: number; y: number } | null
  selectionConfirmed: boolean
  showCreateTemplateDialog: boolean
  // ヘルプダイアログの状態
  showHelpDialog: boolean
  // マップ検証ダイアログの状態
  showMapValidationDialog: boolean
  // ビューポート関連の状態
  viewCenter: { x: number; y: number } | null
  // イベントハイライト関連の状態
  highlightedEventId: string | null
  // 初回自動プロジェクト作成ダイアログかどうか
  isInitialProjectDialog: boolean
}

const initialState: EditorState = {
  currentFloor: 0,
  selectedTool: 'pen',
  selectedLayer: 'floor',
  selectedFloorType: 'normal',
  selectedFloorPassable: true,
  selectedWallType: 'normal',
  selectedDecorationType: 'furniture',
  selectedEventType: null,
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
    eventTypeAccordion: true,
    decorationTypeAccordion: true,
  },
  // テンプレート関連の初期状態
  templates: [],
  selectedTemplate: null,
  templateCategory: 'room',
  showTemplateDialog: false,
  // カスタムタイプ関連の初期状態
  customFloorTypes: [],
  customWallTypes: [],
  customDecorationTypes: [],
  showCustomTypeDialog: false,
  customTypeDialogMode: null,
  customTypeDialogType: null,
  editingCustomType: null,
  // イベント関連の初期状態
  showEventEditDialog: false,
  editingEvent: null,
  selectedEventId: null,
  // テンプレート配置関連の初期状態
  templatePlacementMode: false,
  templatePreviewPosition: null,
  templateRotation: 0,
  // ユーザーテンプレート作成関連の初期状態
  selectionMode: false,
  selectionStart: null,
  selectionEnd: null,
  selectionConfirmed: false,
  showCreateTemplateDialog: false,
  // ヘルプダイアログの初期状態
  showHelpDialog: false,
  // マップ検証ダイアログの初期状態
  showMapValidationDialog: false,
  // ビューポート関連の初期状態
  viewCenter: null,
  // イベントハイライト関連の初期状態
  highlightedEventId: null,
  // 初回自動プロジェクト作成ダイアログの初期状態
  isInitialProjectDialog: false,
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
      } else if (action.payload === 'events') {
        state.accordionStates.eventTypeAccordion = true
        // イベントレイヤー選択時はイベントテンプレートを未選択状態にする
        state.selectedEventType = null
      } else if (action.payload === 'decorations') {
        state.accordionStates.decorationTypeAccordion = true
      }
    },
    
    setSelectedFloorType: (state, action: PayloadAction<FloorType>) => {
      state.selectedFloorType = action.payload
    },
    
    setSelectedFloorPassable: (state, action: PayloadAction<boolean>) => {
      state.selectedFloorPassable = action.payload
    },
    
    setSelectedWallType: (state, action: PayloadAction<WallType>) => {
      state.selectedWallType = action.payload
    },
    
    setSelectedDecorationType: (state, action: PayloadAction<DecorationType>) => {
      state.selectedDecorationType = action.payload
    },
    
    setSelectedEventType: (state, action: PayloadAction<EventType | null>) => {
      state.selectedEventType = action.payload
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
    
    openNewProjectDialog: (state, action: PayloadAction<{ isInitial?: boolean }> = { payload: {}, type: '' }) => {
      state.showNewProjectDialog = true
      state.isInitialProjectDialog = action.payload.isInitial || false
    },
    
    closeNewProjectDialog: (state) => {
      state.showNewProjectDialog = false
      state.isInitialProjectDialog = false
    },

    toggleFloorTypeAccordion: (state) => {
      state.accordionStates.floorTypeAccordion = !state.accordionStates.floorTypeAccordion
    },

    toggleWallTypeAccordion: (state) => {
      state.accordionStates.wallTypeAccordion = !state.accordionStates.wallTypeAccordion
    },

    toggleEventTypeAccordion: (state) => {
      state.accordionStates.eventTypeAccordion = !state.accordionStates.eventTypeAccordion
    },

    toggleDecorationTypeAccordion: (state) => {
      state.accordionStates.decorationTypeAccordion = !state.accordionStates.decorationTypeAccordion
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
      // カスタム床タイプ作成後にアコーディオンを明示的に開いたままにする
      state.accordionStates.floorTypeAccordion = true
      // 床レイヤーに切り替え（確実にアコーディオンが表示される状態にする）
      state.selectedLayer = 'floor'
      // 新しく作成されたカスタム床タイプを自動的に選択
      state.selectedFloorType = action.payload.id as any
      state.selectedFloorPassable = action.payload.passable
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
      // カスタム壁タイプ作成後にアコーディオンを明示的に開いたままにする
      state.accordionStates.wallTypeAccordion = true
      // 壁レイヤーに切り替え（確実にアコーディオンが表示される状態にする）
      state.selectedLayer = 'walls'
      // 新しく作成されたカスタム壁タイプを自動的に選択
      state.selectedWallType = action.payload.id as any
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

    addCustomDecorationType: (state, action: PayloadAction<CustomDecorationType>) => {
      state.customDecorationTypes.push(action.payload)
      // カスタム装飾タイプ作成後にアコーディオンを明示的に開いたままにする
      state.accordionStates.decorationTypeAccordion = true
      // 装飾レイヤーに切り替え（確実にアコーディオンが表示される状態にする）
      state.selectedLayer = 'decorations'
      // 新しく作成されたカスタム装飾タイプを自動的に選択
      state.selectedDecorationType = action.payload.id as any
    },

    removeCustomDecorationType: (state, action: PayloadAction<string>) => {
      state.customDecorationTypes = state.customDecorationTypes.filter(type => type.id !== action.payload)
    },

    updateCustomDecorationType: (state, action: PayloadAction<CustomDecorationType>) => {
      const index = state.customDecorationTypes.findIndex(type => type.id === action.payload.id)
      if (index !== -1) {
        state.customDecorationTypes[index] = action.payload
      }
    },

    openCustomTypeDialog: (state, action: PayloadAction<{ 
      type: 'floor' | 'wall' | 'decoration'
      mode: 'add' | 'edit' | 'view'
      data?: CustomFloorType | CustomWallType | CustomDecorationType 
    }>) => {
      state.showCustomTypeDialog = true
      state.customTypeDialogMode = action.payload.type
      state.customTypeDialogType = action.payload.mode
      state.editingCustomType = action.payload.data || null
      // アコーディオン状態の変更をここから削除（別途管理）
    },

    closeCustomTypeDialog: (state) => {
      state.showCustomTypeDialog = false
      state.editingCustomType = null
      // アコーディオン状態を維持するためcustomTypeDialogModeはリセットしない
      // state.customTypeDialogMode = null
      // state.customTypeDialogType = null
      
      // カスタムタイプダイアログを閉じる際に該当アコーディオンを明示的に開いたままにする
      if (state.customTypeDialogMode === 'floor') {
        state.accordionStates.floorTypeAccordion = true
      } else if (state.customTypeDialogMode === 'wall') {
        state.accordionStates.wallTypeAccordion = true
      }
    },

    // イベント関連のアクション
    openEventEditDialog: (state, action: PayloadAction<DungeonEvent | null>) => {
      state.showEventEditDialog = true
      state.editingEvent = action.payload
    },

    closeEventEditDialog: (state) => {
      state.showEventEditDialog = false
      state.editingEvent = null
      state.selectedEventId = null
    },

    setSelectedEventId: (state, action: PayloadAction<string | null>) => {
      state.selectedEventId = action.payload
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
      state.selectedTool = 'pen'
    },

    setSelectionStart: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.selectionStart = action.payload
    },

    setSelectionEnd: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.selectionEnd = action.payload
    },

    confirmSelection: (state) => {
      state.selectionConfirmed = true
    },

    clearSelection: (state) => {
      state.selectionStart = null
      state.selectionEnd = null
      state.selectionConfirmed = false
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

    openMapValidationDialog: (state) => {
      state.showMapValidationDialog = true
    },

    closeMapValidationDialog: (state) => {
      state.showMapValidationDialog = false
    },

    setViewCenter: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.viewCenter = action.payload
    },

    // イベントハイライト関連のアクション
    setHighlightedEventId: (state, action: PayloadAction<string | null>) => {
      state.highlightedEventId = action.payload
    },

    // カスタムタイプ設定アクション（インポート時）
    setCustomFloorTypes: (state, action: PayloadAction<CustomFloorType[]>) => {
      state.customFloorTypes = action.payload
    },

    setCustomWallTypes: (state, action: PayloadAction<CustomWallType[]>) => {
      state.customWallTypes = action.payload
    },

    setCustomDecorationTypes: (state, action: PayloadAction<CustomDecorationType[]>) => {
      state.customDecorationTypes = action.payload
    },
  },
})

export const {
  setCurrentFloor,
  setSelectedTool,
  setSelectedLayer,
  setSelectedFloorType,
  setSelectedFloorPassable,
  setSelectedWallType,
  setSelectedDecorationType,
  setSelectedEventType,
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
  toggleEventTypeAccordion,
  toggleDecorationTypeAccordion,
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
  addCustomDecorationType,
  removeCustomDecorationType,
  updateCustomDecorationType,
  openCustomTypeDialog,
  closeCustomTypeDialog,
  // イベント関連のアクション
  openEventEditDialog,
  closeEventEditDialog,
  setSelectedEventId,
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
  confirmSelection,
  clearSelection,
  openCreateTemplateDialog,
  closeCreateTemplateDialog,
  // ヘルプダイアログ関連のアクション
  openHelpDialog,
  closeHelpDialog,
  // マップ検証ダイアログ関連のアクション
  openMapValidationDialog,
  closeMapValidationDialog,
  // ビューポート関連のアクション
  setViewCenter,
  // イベントハイライト関連のアクション
  setHighlightedEventId,
  // カスタムタイプ設定アクション
  setCustomFloorTypes,
  setCustomWallTypes,
  setCustomDecorationTypes,
} = editorSlice.actions

export default editorSlice.reducer