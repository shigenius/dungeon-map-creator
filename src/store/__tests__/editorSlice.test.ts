import { describe, it, expect, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import editorReducer, {
  setCurrentFloor,
  setSelectedTool,
  setSelectedLayer,
  setSelectedFloorType,
  setSelectedWallType,
  setSelectedDecorationType,
  setSelectedEventType,
  setZoom,
  toggleGrid,
  toggleCoordinates,
  setViewMode,
  toggleLayerVisibility,
  setHoveredCellInfo,
  clearHoveredCellInfo,
  setHoveredCellPosition,
  clearHoveredCellPosition,
  setHoveredWallInfo,
  clearHoveredWallInfo,
  setShiftPressed,
  toggleFloorTypeAccordion,
  toggleWallTypeAccordion,
  toggleEventTypeAccordion,
  toggleDecorationTypeAccordion,
  addTemplate,
  removeTemplate,
  setSelectedTemplate,
  setTemplateCategory,
  openTemplateDialog,
  closeTemplateDialog,
  loadTemplates,
  addCustomFloorType,
  removeCustomFloorType,
  updateCustomFloorType,
  addCustomWallType,
  removeCustomWallType,
  updateCustomWallType,
  openEventEditDialog,
  closeEventEditDialog,
  setTemplatePreviewPosition,
  enableTemplatePlacementMode,
  disableTemplatePlacementMode,
  rotateTemplate,
  rotateTemplateLeft,
  setTemplateRotation,
  setSelectionStart,
  setSelectionEnd,
  openCreateTemplateDialog,
  closeCreateTemplateDialog,
  openHelpDialog,
  closeHelpDialog
} from '../editorSlice'
import { Template, CustomFloorType, CustomWallType, DungeonEvent } from '../../types/map'

describe('editorSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        editor: editorReducer
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [
              'editor/setSelectedTemplate',
              'editor/addTemplate',
              'editor/loadTemplates',
              'editor/openEventEditDialog'
            ],
            ignoredPaths: [
              'payload.createdAt',
              'payload.metadata.created',
              'payload.metadata.modified'
            ],
          },
        }),
    })
  })

  describe('基本状態管理', () => {
    it('現在のフロアを設定できる', () => {
      store.dispatch(setCurrentFloor(2))
      const state = store.getState().editor
      expect(state.currentFloor).toBe(2)
    })

    it('選択ツールを変更できる', () => {
      store.dispatch(setSelectedTool('rectangle'))
      const state = store.getState().editor
      expect(state.selectedTool).toBe('rectangle')
    })

    it('選択レイヤーを変更でき、対応するアコーディオンが開く', () => {
      // 壁レイヤーに切り替え
      store.dispatch(setSelectedLayer('walls'))
      let state = store.getState().editor
      expect(state.selectedLayer).toBe('walls')
      expect(state.accordionStates.wallTypeAccordion).toBe(true)

      // イベントレイヤーに切り替え
      store.dispatch(setSelectedLayer('events'))
      state = store.getState().editor
      expect(state.selectedLayer).toBe('events')
      expect(state.accordionStates.eventTypeAccordion).toBe(true)

      // 装飾レイヤーに切り替え
      store.dispatch(setSelectedLayer('decorations'))
      state = store.getState().editor
      expect(state.selectedLayer).toBe('decorations')
      expect(state.accordionStates.decorationTypeAccordion).toBe(true)
    })

    it('選択された床タイプを変更できる', () => {
      store.dispatch(setSelectedFloorType('damage'))
      const state = store.getState().editor
      expect(state.selectedFloorType).toBe('damage')
    })

    it('選択された壁タイプを変更できる', () => {
      store.dispatch(setSelectedWallType('door'))
      const state = store.getState().editor
      expect(state.selectedWallType).toBe('door')
    })

    it('選択された装飾タイプを変更できる', () => {
      store.dispatch(setSelectedDecorationType('statue'))
      const state = store.getState().editor
      expect(state.selectedDecorationType).toBe('statue')
    })

    it('選択されたイベントタイプを変更できる', () => {
      store.dispatch(setSelectedEventType('npc'))
      const state = store.getState().editor
      expect(state.selectedEventType).toBe('npc')
    })
  })

  describe('ズームと表示設定', () => {
    it('ズームレベルを設定できる', () => {
      store.dispatch(setZoom(2.0))
      const state = store.getState().editor
      expect(state.zoom).toBe(2.0)
    })

    it('ズームレベルの上限と下限が守られる', () => {
      // 上限テスト
      store.dispatch(setZoom(10.0))
      let state = store.getState().editor
      expect(state.zoom).toBe(4.0)

      // 下限テスト
      store.dispatch(setZoom(0.01))
      state = store.getState().editor
      expect(state.zoom).toBe(0.1)
    })

    it('グリッド表示をトグルできる', () => {
      const initialState = store.getState().editor.gridVisible
      store.dispatch(toggleGrid())
      const state = store.getState().editor
      expect(state.gridVisible).toBe(!initialState)
    })

    it('座標表示をトグルできる', () => {
      const initialState = store.getState().editor.coordinatesVisible
      store.dispatch(toggleCoordinates())
      const state = store.getState().editor
      expect(state.coordinatesVisible).toBe(!initialState)
    })

    it('表示モードを変更できる', () => {
      store.dispatch(setViewMode('3d'))
      const state = store.getState().editor
      expect(state.viewMode).toBe('3d')
    })

    it('レイヤー表示をトグルできる', () => {
      const initialState = store.getState().editor.layerVisibility.floor
      store.dispatch(toggleLayerVisibility('floor'))
      const state = store.getState().editor
      expect(state.layerVisibility.floor).toBe(!initialState)
    })
  })

  describe('セル情報管理', () => {

    it('ホバーされたセル情報を設定・クリアできる', () => {
      const hoverInfo = {
        position: { x: 1, y: 2 },
        floor: { type: 'normal' as const, passable: true },
        walls: { north: null, east: null, south: null, west: null },
        events: [{ name: 'テスト宝箱', type: 'treasure' }],
        decorations: []
      }

      store.dispatch(setHoveredCellInfo(hoverInfo))
      let state = store.getState().editor
      expect(state.hoveredCellInfo).toEqual(hoverInfo)

      store.dispatch(clearHoveredCellInfo())
      state = store.getState().editor
      expect(state.hoveredCellInfo).toBeNull()
    })

    it('ホバーされたセル位置を設定・クリアできる', () => {
      const position = { x: 5, y: 3 }

      store.dispatch(setHoveredCellPosition(position))
      let state = store.getState().editor
      expect(state.hoveredCellPosition).toEqual(position)

      store.dispatch(clearHoveredCellPosition())
      state = store.getState().editor
      expect(state.hoveredCellPosition).toBeNull()
    })

    it('ホバーされた壁情報を設定・クリアできる', () => {
      const wallInfo = {
        position: { x: 2, y: 4 },
        direction: 'north' as const
      }

      store.dispatch(setHoveredWallInfo(wallInfo))
      let state = store.getState().editor
      expect(state.hoveredWallInfo).toEqual(wallInfo)

      store.dispatch(clearHoveredWallInfo())
      state = store.getState().editor
      expect(state.hoveredWallInfo).toBeNull()
    })

    it('Shiftキー押下状態を管理できる', () => {
      store.dispatch(setShiftPressed(true))
      let state = store.getState().editor
      expect(state.isShiftPressed).toBe(true)

      store.dispatch(setShiftPressed(false))
      state = store.getState().editor
      expect(state.isShiftPressed).toBe(false)
    })
  })

  describe('ダイアログ管理', () => {

    it('テンプレートダイアログの開閉ができる', () => {
      store.dispatch(openTemplateDialog())
      let state = store.getState().editor
      expect(state.showTemplateDialog).toBe(true)

      store.dispatch(closeTemplateDialog())
      state = store.getState().editor
      expect(state.showTemplateDialog).toBe(false)
    })


    it('イベント編集ダイアログの開閉ができる', () => {
      const testEvent: DungeonEvent = {
        id: 'test-event',
        name: 'テストイベント',
        type: 'treasure',
        position: { x: 1, y: 1 },
        appearance: { color: '#ffd700', icon: '💰' },
        triggers: [],
        actions: [],
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          author: 'テスター',
          version: 1
        }
      }

      store.dispatch(openEventEditDialog(testEvent))
      let state = store.getState().editor
      expect(state.showEventEditDialog).toBe(true)
      expect(state.editingEvent).toEqual(testEvent)

      store.dispatch(closeEventEditDialog())
      state = store.getState().editor
      expect(state.showEventEditDialog).toBe(false)
      expect(state.editingEvent).toBeNull()
    })

    it('ヘルプダイアログの開閉ができる', () => {
      store.dispatch(openHelpDialog())
      let state = store.getState().editor
      expect(state.showHelpDialog).toBe(true)

      store.dispatch(closeHelpDialog())
      state = store.getState().editor
      expect(state.showHelpDialog).toBe(false)
    })

    it('テンプレート作成ダイアログの開閉ができる', () => {
      store.dispatch(openCreateTemplateDialog())
      let state = store.getState().editor
      expect(state.showCreateTemplateDialog).toBe(true)

      store.dispatch(closeCreateTemplateDialog())
      state = store.getState().editor
      expect(state.showCreateTemplateDialog).toBe(false)
      expect(state.selectionStart).toBeNull()
      expect(state.selectionEnd).toBeNull()
      expect(state.selectionMode).toBe(false)
    })
  })

  describe('アコーディオン管理', () => {
    it('床タイプアコーディオンをトグルできる', () => {
      const initialState = store.getState().editor.accordionStates.floorTypeAccordion
      store.dispatch(toggleFloorTypeAccordion())
      const state = store.getState().editor
      expect(state.accordionStates.floorTypeAccordion).toBe(!initialState)
    })

    it('壁タイプアコーディオンをトグルできる', () => {
      const initialState = store.getState().editor.accordionStates.wallTypeAccordion
      store.dispatch(toggleWallTypeAccordion())
      const state = store.getState().editor
      expect(state.accordionStates.wallTypeAccordion).toBe(!initialState)
    })

    it('イベントタイプアコーディオンをトグルできる', () => {
      const initialState = store.getState().editor.accordionStates.eventTypeAccordion
      store.dispatch(toggleEventTypeAccordion())
      const state = store.getState().editor
      expect(state.accordionStates.eventTypeAccordion).toBe(!initialState)
    })

    it('装飾タイプアコーディオンをトグルできる', () => {
      const initialState = store.getState().editor.accordionStates.decorationTypeAccordion
      store.dispatch(toggleDecorationTypeAccordion())
      const state = store.getState().editor
      expect(state.accordionStates.decorationTypeAccordion).toBe(!initialState)
    })
  })

  describe('テンプレート管理', () => {
    it('テンプレートを追加できる', () => {
      const template: Template = {
        id: 'test-template',
        name: 'テストテンプレート',
        description: 'テスト用',
        category: 'room',
        size: { width: 2, height: 2 },
        cells: [],
        tags: ['test'],
        createdAt: new Date().toISOString(),
        isBuiltIn: false
      }

      store.dispatch(addTemplate(template))
      const state = store.getState().editor
      expect(state.templates).toHaveLength(1)
      expect(state.templates[0]).toEqual(template)
    })

    it('テンプレートを削除できる', () => {
      const template: Template = {
        id: 'test-template',
        name: 'テストテンプレート',
        description: 'テスト用',
        category: 'room',
        size: { width: 2, height: 2 },
        cells: [],
        tags: ['test'],
        createdAt: new Date().toISOString(),
        isBuiltIn: false
      }

      store.dispatch(addTemplate(template))
      store.dispatch(removeTemplate('test-template'))
      const state = store.getState().editor
      expect(state.templates).toHaveLength(0)
    })

    it('選択されたテンプレートを設定でき、ツールとモードが変更される', () => {
      const template: Template = {
        id: 'test-template',
        name: 'テストテンプレート',
        description: 'テスト用',
        category: 'room',
        size: { width: 2, height: 2 },
        cells: [],
        tags: ['test'],
        createdAt: new Date().toISOString(),
        isBuiltIn: false
      }

      store.dispatch(setSelectedTemplate(template))
      const state = store.getState().editor
      expect(state.selectedTemplate).toEqual(template)
      expect(state.selectedTool).toBe('template')
      expect(state.templatePlacementMode).toBe(true)
      expect(state.templateRotation).toBe(0)
    })

    it('テンプレート選択をクリアできる', () => {
      const template: Template = {
        id: 'test-template',
        name: 'テストテンプレート',
        description: 'テスト用',
        category: 'room',
        size: { width: 2, height: 2 },
        cells: [],
        tags: ['test'],
        createdAt: new Date().toISOString(),
        isBuiltIn: false
      }

      store.dispatch(setSelectedTemplate(template))
      store.dispatch(setSelectedTemplate(null))
      
      const state = store.getState().editor
      expect(state.selectedTemplate).toBeNull()
      expect(state.templatePlacementMode).toBe(false)
      expect(state.templatePreviewPosition).toBeNull()
    })

    it('テンプレートカテゴリを設定できる', () => {
      store.dispatch(setTemplateCategory('corridor'))
      const state = store.getState().editor
      expect(state.templateCategory).toBe('corridor')
    })

    it('テンプレートを一括ロードできる', () => {
      const templates: Template[] = [
        {
          id: 'template1',
          name: 'テンプレート1',
          description: 'テスト用1',
          category: 'room',
          size: { width: 2, height: 2 },
          cells: [],
          tags: ['test'],
          createdAt: new Date().toISOString(),
          isBuiltIn: true
        },
        {
          id: 'template2',
          name: 'テンプレート2',
          description: 'テスト用2',
          category: 'corridor',
          size: { width: 3, height: 1 },
          cells: [],
          tags: ['test'],
          createdAt: new Date().toISOString(),
          isBuiltIn: true
        }
      ]

      store.dispatch(loadTemplates(templates))
      const state = store.getState().editor
      expect(state.templates).toHaveLength(2)
      expect(state.templates).toEqual(templates)
    })
  })

  describe('テンプレート配置機能', () => {
    it('テンプレートプレビュー位置を設定できる', () => {
      const position = { x: 3, y: 4 }
      store.dispatch(setTemplatePreviewPosition(position))
      const state = store.getState().editor
      expect(state.templatePreviewPosition).toEqual(position)
    })

    it('テンプレート配置モードを有効/無効にできる', () => {
      store.dispatch(enableTemplatePlacementMode())
      let state = store.getState().editor
      expect(state.templatePlacementMode).toBe(true)
      expect(state.selectedTool).toBe('template')

      store.dispatch(disableTemplatePlacementMode())
      state = store.getState().editor
      expect(state.templatePlacementMode).toBe(false)
      expect(state.templatePreviewPosition).toBeNull()
    })

    it('テンプレートを回転できる', () => {
      // 右回転テスト
      store.dispatch(rotateTemplate())
      let state = store.getState().editor
      expect(state.templateRotation).toBe(90)

      store.dispatch(rotateTemplate())
      state = store.getState().editor
      expect(state.templateRotation).toBe(180)

      store.dispatch(rotateTemplate())
      state = store.getState().editor
      expect(state.templateRotation).toBe(270)

      store.dispatch(rotateTemplate())
      state = store.getState().editor
      expect(state.templateRotation).toBe(0)
    })

    it('テンプレートを左回転できる', () => {
      store.dispatch(rotateTemplateLeft())
      let state = store.getState().editor
      expect(state.templateRotation).toBe(270)

      store.dispatch(rotateTemplateLeft())
      state = store.getState().editor
      expect(state.templateRotation).toBe(180)

      store.dispatch(rotateTemplateLeft())
      state = store.getState().editor
      expect(state.templateRotation).toBe(90)

      store.dispatch(rotateTemplateLeft())
      state = store.getState().editor
      expect(state.templateRotation).toBe(0)
    })

    it('テンプレート回転角度を直接設定できる', () => {
      store.dispatch(setTemplateRotation(180))
      const state = store.getState().editor
      expect(state.templateRotation).toBe(180)
    })
  })

  describe('カスタムタイプ管理', () => {
    it('カスタム床タイプを追加・削除・更新できる', () => {
      const customFloor: CustomFloorType = {
        id: 'custom-floor-1',
        name: 'カスタム床',
        description: 'テスト用カスタム床',
        color: '#ff0000',
        passable: true,
        texture: 'custom-texture'
      }

      // 追加
      store.dispatch(addCustomFloorType(customFloor))
      let state = store.getState().editor
      expect(state.customFloorTypes).toHaveLength(1)
      expect(state.customFloorTypes[0]).toEqual(customFloor)

      // 更新
      const updatedFloor = { ...customFloor, name: '更新された床' }
      store.dispatch(updateCustomFloorType(updatedFloor))
      state = store.getState().editor
      expect(state.customFloorTypes[0].name).toBe('更新された床')

      // 削除
      store.dispatch(removeCustomFloorType('custom-floor-1'))
      state = store.getState().editor
      expect(state.customFloorTypes).toHaveLength(0)
    })

    it('カスタム壁タイプを追加・削除・更新できる', () => {
      const customWall: CustomWallType = {
        id: 'custom-wall-1',
        name: 'カスタム壁',
        description: 'テスト用カスタム壁',
        color: '#0000ff',
        transparent: false,
        texture: 'custom-wall-texture'
      }

      // 追加
      store.dispatch(addCustomWallType(customWall))
      let state = store.getState().editor
      expect(state.customWallTypes).toHaveLength(1)
      expect(state.customWallTypes[0]).toEqual(customWall)

      // 更新
      const updatedWall = { ...customWall, name: '更新された壁' }
      store.dispatch(updateCustomWallType(updatedWall))
      state = store.getState().editor
      expect(state.customWallTypes[0].name).toBe('更新された壁')

      // 削除
      store.dispatch(removeCustomWallType('custom-wall-1'))
      state = store.getState().editor
      expect(state.customWallTypes).toHaveLength(0)
    })
  })

  describe('選択機能', () => {

    it('選択範囲の開始・終了位置を設定できる', () => {
      const startPos = { x: 1, y: 1 }
      const endPos = { x: 3, y: 3 }

      store.dispatch(setSelectionStart(startPos))
      let state = store.getState().editor
      expect(state.selectionStart).toEqual(startPos)

      store.dispatch(setSelectionEnd(endPos))
      state = store.getState().editor
      expect(state.selectionEnd).toEqual(endPos)
    })
  })
})