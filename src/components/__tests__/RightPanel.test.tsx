import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import RightPanel from '../RightPanel'
import mapSliceReducer from '../../store/mapSlice'
import editorSliceReducer from '../../store/editorSlice'
import { Dungeon, Template } from '../../types/map'

describe('RightPanel 統合テスト', () => {
  let store: ReturnType<typeof configureStore>
  let user: ReturnType<typeof userEvent.setup>
  let testDungeon: Dungeon
  let testTemplates: Template[]

  beforeEach(() => {
    testDungeon = {
      id: 'test-dungeon',
      name: 'テストダンジョン',
      author: 'テスター',
      version: '1.0.0',
      floors: [
        {
          id: 'floor-1',
          name: 'フロア1',
          width: 5,
          height: 5,
          cells: Array(5).fill(null).map((_, y) =>
            Array(5).fill(null).map((_, x) => ({
              x,
              y,
              floor: { type: 'normal', passable: true },
              walls: { north: null, east: null, south: null, west: null },
              events: [],
              decorations: [],
              properties: {}
            }))
          ),
          environment: {
            lighting: { ambient: 0.5, sources: [] },
            ceiling: { height: 3 },
            audio: {}
          }
        }
      ],
      resources: {
        textures: {},
        sprites: {},
        audio: {}
      },
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    }

    testTemplates = [
      {
        id: 'template-room',
        name: '部屋テンプレート',
        description: '基本的な部屋',
        category: 'room',
        size: { width: 3, height: 3 },
        cells: Array(3).fill(null).map((_, y) =>
          Array(3).fill(null).map((_, x) => ({
            floor: { type: 'normal', passable: true },
            walls: { north: null, east: null, south: null, west: null },
            events: [],
            decorations: []
          }))
        ),
        tags: ['basic'],
        createdAt: new Date().toISOString(),
        isBuiltIn: true
      },
      {
        id: 'template-corridor',
        name: '廊下テンプレート',
        description: '縦の廊下',
        category: 'corridor',
        size: { width: 1, height: 5 },
        cells: Array(5).fill(null).map((_, y) =>
          Array(1).fill(null).map((_, x) => ({
            floor: { type: 'normal', passable: true },
            walls: { north: null, east: null, south: null, west: null },
            events: [],
            decorations: []
          }))
        ),
        tags: ['vertical'],
        createdAt: new Date().toISOString(),
        isBuiltIn: true
      }
    ]

    store = configureStore({
      reducer: {
        map: mapSliceReducer,
        editor: editorSliceReducer
      },
      preloadedState: {
        map: {
          dungeon: testDungeon,
          history: [],
          currentHistoryIndex: -1,
          isUndoRedoOperation: false
        },
        editor: {
          activeTool: 'pen',
          activeLayer: 'floor',
          showGrid: true,
          zoom: 100,
          hoveredCell: null,
          hoveredCellInfo: null,
          selectedCells: [],
          isSelecting: false,
          selectionStart: null,
          selectionEnd: null,
          selectedTemplate: null,
          templateRotation: 0,
          showNewProjectDialog: false,
          showEventEditDialog: false,
          showTemplateCreateDialog: false,
          editingEvent: null,
          rangeSelection: null,
          viewMode: '2D',
          sidebarCollapsed: false,
          layerVisibility: {
            floor: true,
            walls: true,
            events: true,
            decorations: true
          }
        }
      }
    })

    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('パネル表示機能', () => {
    it('RightPanelが正常にレンダリングされる', () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      expect(screen.getByText('テンプレート')).toBeInTheDocument()
      expect(screen.getByText('プロパティ')).toBeInTheDocument()
    })

    it('プロジェクトが読み込まれていない場合は使用不可メッセージが表示される', () => {
      const emptyStore = configureStore({
        reducer: {
          map: mapSliceReducer,
          editor: editorSliceReducer
        }
      })

      render(
        <Provider store={emptyStore}>
          <RightPanel />
        </Provider>
      )

      expect(screen.getByText('プロジェクトを読み込んでください')).toBeInTheDocument()
    })

    it('サイドバーが折りたたまれている場合は表示されない', () => {
      store.dispatch(editorSlice.actions.setSidebarCollapsed(true))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      expect(screen.queryByText('テンプレート')).not.toBeInTheDocument()
    })
  })

  describe('テンプレート選択機能', () => {
    beforeEach(() => {
      // テンプレートデータをモック
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(testTemplates)
      })
    })

    it('テンプレートリストが表示される', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateSection = screen.getByText('テンプレート')
      await user.click(templateSection)

      await waitFor(() => {
        expect(screen.getByText('部屋テンプレート')).toBeInTheDocument()
        expect(screen.getByText('廊下テンプレート')).toBeInTheDocument()
      })
    })

    it('テンプレートカテゴリでフィルタリングができる', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateSection = screen.getByText('テンプレート')
      await user.click(templateSection)

      // カテゴリフィルターを選択
      const categoryFilter = screen.getByLabelText('カテゴリ')
      await user.selectOptions(categoryFilter, 'room')

      await waitFor(() => {
        expect(screen.getByText('部屋テンプレート')).toBeInTheDocument()
        expect(screen.queryByText('廊下テンプレート')).not.toBeInTheDocument()
      })
    })

    it('テンプレート検索が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateSection = screen.getByText('テンプレート')
      await user.click(templateSection)

      // 検索ボックスに入力
      const searchInput = screen.getByLabelText('テンプレート検索')
      await user.type(searchInput, '廊下')

      await waitFor(() => {
        expect(screen.queryByText('部屋テンプレート')).not.toBeInTheDocument()
        expect(screen.getByText('廊下テンプレート')).toBeInTheDocument()
      })
    })

    it('テンプレートの選択が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateSection = screen.getByText('テンプレート')
      await user.click(templateSection)

      await waitFor(() => {
        const roomTemplate = screen.getByText('部屋テンプレート')
        user.click(roomTemplate)
      })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.selectedTemplate?.id).toBe('template-room')
      })
    })

    it('選択されたテンプレートがハイライトされる', async () => {
      store.dispatch(editorSlice.actions.setSelectedTemplate(testTemplates[0]))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateSection = screen.getByText('テンプレート')
      await user.click(templateSection)

      await waitFor(() => {
        const roomTemplate = screen.getByText('部屋テンプレート')
        expect(roomTemplate.closest('.selected')).toBeInTheDocument()
      })
    })
  })

  describe('テンプレート回転機能', () => {
    beforeEach(() => {
      store.dispatch(editorSlice.actions.setSelectedTemplate(testTemplates[0]))
    })

    it('テンプレート回転ボタンが表示される', () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      expect(screen.getByLabelText('左回転')).toBeInTheDocument()
      expect(screen.getByLabelText('右回転')).toBeInTheDocument()
      expect(screen.getByText('0°')).toBeInTheDocument()
    })

    it('左回転ボタンで回転角度が変更される', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const leftRotateButton = screen.getByLabelText('左回転')
      await user.click(leftRotateButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.templateRotation).toBe(270)
      })
    })

    it('右回転ボタンで回転角度が変更される', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const rightRotateButton = screen.getByLabelText('右回転')
      await user.click(rightRotateButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.templateRotation).toBe(90)
      })
    })

    it('Qキーで左回転する', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      fireEvent.keyDown(document, { key: 'q' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.templateRotation).toBe(270)
      })
    })

    it('Rキーで右回転する', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      fireEvent.keyDown(document, { key: 'r' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.templateRotation).toBe(90)
      })
    })

    it('360度回転すると元の角度に戻る', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const rightRotateButton = screen.getByLabelText('右回転')

      // 4回右回転（90° × 4 = 360°）
      await user.click(rightRotateButton)
      await user.click(rightRotateButton)
      await user.click(rightRotateButton)
      await user.click(rightRotateButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.templateRotation).toBe(0)
      })
    })
  })

  describe('テンプレートプレビュー機能', () => {
    beforeEach(() => {
      store.dispatch(editorSlice.actions.setSelectedTemplate(testTemplates[0]))
    })

    it('選択されたテンプレートのプレビューが表示される', () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      expect(screen.getByText('プレビュー')).toBeInTheDocument()
      expect(screen.getByText('3×3')).toBeInTheDocument()
    })

    it('回転時にプレビューサイズが更新される', async () => {
      // 非正方形テンプレートを選択
      store.dispatch(editorSlice.actions.setSelectedTemplate(testTemplates[1]))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      expect(screen.getByText('1×5')).toBeInTheDocument()

      const rightRotateButton = screen.getByLabelText('右回転')
      await user.click(rightRotateButton)

      await waitFor(() => {
        expect(screen.getByText('5×1')).toBeInTheDocument()
      })
    })

    it('テンプレートの詳細情報が表示される', () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      expect(screen.getByText('基本的な部屋')).toBeInTheDocument()
      expect(screen.getByText('カテゴリ: room')).toBeInTheDocument()
      expect(screen.getByText('タグ: basic')).toBeInTheDocument()
    })
  })

  describe('テンプレート配置機能', () => {
    beforeEach(() => {
      store.dispatch(editorSlice.actions.setSelectedTemplate(testTemplates[0]))
    })

    it('配置ボタンが表示される', () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      expect(screen.getByText('配置')).toBeInTheDocument()
    })

    it('配置ボタンクリックでテンプレート配置モードになる', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const placeButton = screen.getByText('配置')
      await user.click(placeButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('template')
      })
    })

    it('Enterキーでテンプレート配置モードになる', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      fireEvent.keyDown(document, { key: 'Enter' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('template')
      })
    })

    it('配置可能サイズの警告が表示される', () => {
      // 大きなテンプレートを作成
      const largeTemplate = {
        ...testTemplates[0],
        size: { width: 10, height: 10 }
      }
      store.dispatch(editorSlice.actions.setSelectedTemplate(largeTemplate))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      expect(screen.getByText('⚠️ テンプレートがマップサイズを超えています')).toBeInTheDocument()
    })
  })

  describe('テンプレート作成機能', () => {
    it('新しいテンプレート作成ボタンが表示される', () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateSection = screen.getByText('テンプレート')
      user.click(templateSection)

      expect(screen.getByText('新しいテンプレート作成')).toBeInTheDocument()
    })

    it('範囲選択モードボタンでレンジ選択が開始される', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateSection = screen.getByText('テンプレート')
      await user.click(templateSection)

      const rangeSelectButton = screen.getByText('範囲選択')
      await user.click(rangeSelectButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('select')
      })
    })

    it('選択範囲がある場合にテンプレート作成ダイアログが開く', async () => {
      // 選択範囲を設定
      store.dispatch(editorSlice.actions.setRangeSelection({
        start: { x: 0, y: 0 },
        end: { x: 2, y: 2 }
      }))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateSection = screen.getByText('テンプレート')
      await user.click(templateSection)

      const createButton = screen.getByText('作成')
      await user.click(createButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.showTemplateCreateDialog).toBe(true)
      })
    })
  })

  describe('プロパティ表示機能', () => {
    it('プロパティセクションが表示される', () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      expect(propertySection).toBeInTheDocument()
    })

    it('選択されたセルのプロパティが表示される', async () => {
      store.dispatch(editorSlice.actions.setSelectedCells([{ x: 0, y: 0 }]))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('位置: (0, 0)')).toBeInTheDocument()
      expect(screen.getByText('床タイプ: normal')).toBeInTheDocument()
    })

    it('複数セル選択時に共通プロパティが表示される', async () => {
      store.dispatch(editorSlice.actions.setSelectedCells([
        { x: 0, y: 0 },
        { x: 1, y: 1 }
      ]))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('複数セル選択中 (2個)')).toBeInTheDocument()
    })

    it('セルが選択されていない場合はメッセージが表示される', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('セルを選択してください')).toBeInTheDocument()
    })
  })

  describe('プロパティ編集機能', () => {
    beforeEach(() => {
      store.dispatch(editorSlice.actions.setSelectedCells([{ x: 0, y: 0 }]))
    })

    it('床タイプの変更ができる', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      const floorTypeSelect = screen.getByLabelText('床タイプ')
      await user.selectOptions(floorTypeSelect, 'damage')

      await waitFor(() => {
        const state = store.getState()
        const cell = state.map.dungeon?.floors[0].cells[0][0]
        expect(cell?.floor.type).toBe('damage')
      })
    })

    it('通行可能フラグの変更ができる', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      const passableCheckbox = screen.getByLabelText('通行可能')
      await user.click(passableCheckbox)

      await waitFor(() => {
        const state = store.getState()
        const cell = state.map.dungeon?.floors[0].cells[0][0]
        expect(cell?.floor.passable).toBe(false)
      })
    })

    it('壁の設定ができる', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      const northWallSelect = screen.getByLabelText('北の壁')
      await user.selectOptions(northWallSelect, 'normal')

      await waitFor(() => {
        const state = store.getState()
        const cell = state.map.dungeon?.floors[0].cells[0][0]
        expect(cell?.walls.north?.type).toBe('normal')
      })
    })

    it('カスタムプロパティの追加ができる', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      const addPropertyButton = screen.getByText('プロパティ追加')
      await user.click(addPropertyButton)

      const keyInput = screen.getByLabelText('キー')
      const valueInput = screen.getByLabelText('値')

      await user.type(keyInput, 'customProperty')
      await user.type(valueInput, 'customValue')

      const saveButton = screen.getByText('保存')
      await user.click(saveButton)

      await waitFor(() => {
        const state = store.getState()
        const cell = state.map.dungeon?.floors[0].cells[0][0]
        expect(cell?.properties.customProperty).toBe('customValue')
      })
    })
  })

  describe('レイヤー依存表示機能', () => {
    it('床レイヤー選択時に床関連プロパティが表示される', async () => {
      store.dispatch(editorSlice.actions.setActiveLayer('floor'))
      store.dispatch(editorSlice.actions.setSelectedCells([{ x: 0, y: 0 }]))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByLabelText('床タイプ')).toBeInTheDocument()
      expect(screen.getByLabelText('通行可能')).toBeInTheDocument()
    })

    it('壁レイヤー選択時に壁関連プロパティが表示される', async () => {
      store.dispatch(editorSlice.actions.setActiveLayer('walls'))
      store.dispatch(editorSlice.actions.setSelectedCells([{ x: 0, y: 0 }]))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByLabelText('北の壁')).toBeInTheDocument()
      expect(screen.getByLabelText('東の壁')).toBeInTheDocument()
      expect(screen.getByLabelText('南の壁')).toBeInTheDocument()
      expect(screen.getByLabelText('西の壁')).toBeInTheDocument()
    })

    it('イベントレイヤー選択時にイベント関連プロパティが表示される', async () => {
      store.dispatch(editorSlice.actions.setActiveLayer('events'))
      store.dispatch(editorSlice.actions.setSelectedCells([{ x: 0, y: 0 }]))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('イベントなし')).toBeInTheDocument()
      expect(screen.getByText('新しいイベント追加')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ機能', () => {
    it('適切なaria-labelが設定されている', () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      expect(screen.getByLabelText('左回転')).toBeInTheDocument()
      expect(screen.getByLabelText('右回転')).toBeInTheDocument()
    })

    it('キーボードナビゲーションが正しく動作する', async () => {
      store.dispatch(editorSlice.actions.setSelectedTemplate(testTemplates[0]))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const leftRotateButton = screen.getByLabelText('左回転')
      await user.tab()
      expect(leftRotateButton).toHaveFocus()

      await user.tab()
      const rightRotateButton = screen.getByLabelText('右回転')
      expect(rightRotateButton).toHaveFocus()
    })

    it('フォームラベルが正しく関連付けられている', async () => {
      store.dispatch(editorSlice.actions.setSelectedCells([{ x: 0, y: 0 }]))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      const floorTypeSelect = screen.getByLabelText('床タイプ')
      expect(floorTypeSelect).toBeInTheDocument()

      const passableCheckbox = screen.getByLabelText('通行可能')
      expect(passableCheckbox).toBeInTheDocument()
    })
  })

  describe('パフォーマンス機能', () => {
    it('大量のテンプレートでも正常に表示される', async () => {
      // 大量のテンプレートを生成
      const manyTemplates = Array(100).fill(null).map((_, i) => ({
        ...testTemplates[0],
        id: `template-${i}`,
        name: `テンプレート${i}`
      }))

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(manyTemplates)
      })

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateSection = screen.getByText('テンプレート')
      await user.click(templateSection)

      await waitFor(() => {
        expect(screen.getByText('テンプレート0')).toBeInTheDocument()
      })
    })

    it('頻繁な状態変更でも適切にレンダリングされる', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      // 高速にテンプレートを切り替え
      for (let i = 0; i < 10; i++) {
        store.dispatch(editorSlice.actions.setSelectedTemplate(testTemplates[0]))
        store.dispatch(editorSlice.actions.setSelectedTemplate(testTemplates[1]))
        store.dispatch(editorSlice.actions.setSelectedTemplate(null))
      }

      await waitFor(() => {
        expect(screen.getByText('テンプレート')).toBeInTheDocument()
      })
    })
  })
})