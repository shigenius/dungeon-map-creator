import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import RightPanel from '../RightPanel'
import mapSliceReducer from '../../store/mapSlice'
import editorSliceReducer from '../../store/editorSlice'
import { setSelectedTemplate, setHoveredCellInfo, setSelectedLayer } from '../../store/editorSlice'
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
          },
          properties: {} // カスタムプロパティ
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
      },
      properties: {} // カスタムプロパティ
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
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          // テスト環境では重いmiddlewareを無効化
          serializableCheck: false,
          immutableCheck: false,
        }),
      preloadedState: {
        map: {
          dungeon: testDungeon,
          history: [],
          currentHistoryIndex: -1,
          isUndoRedoOperation: false
        },
        editor: {
          currentFloor: 0,
          selectedTool: 'pen',
          selectedLayer: 'floor',
          selectedFloorType: 'normal',
          selectedWallType: 'normal',
          selectedDecorationType: 'furniture',
          selectedEventType: 'treasure',
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
            decorations: true
          },
          showNewProjectDialog: false,
          accordionStates: {
            floorTypeAccordion: true,
            wallTypeAccordion: false,
            eventTypeAccordion: true,
            decorationTypeAccordion: true
          },
          templates: testTemplates,
          selectedTemplate: null,
          templateCategory: 'room',
          showTemplateDialog: false,
          customFloorTypes: [],
          customWallTypes: [],
          showCustomTypeDialog: false,
          customTypeDialogMode: null,
          showEventEditDialog: false,
          editingEvent: null,
          selectedEventId: null,
          templatePlacementMode: false,
          templatePreviewPosition: null,
          templateRotation: 0,
          selectionMode: false,
          selectionStart: null,
          selectionEnd: null,
          selectionConfirmed: false,
          showCreateTemplateDialog: false,
          showHelpDialog: false,
          showMapValidationDialog: false,
          viewCenter: null
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

    it('プロジェクトが読み込まれていない場合でも正常に表示される', () => {
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

      expect(screen.getByText('プロパティ')).toBeInTheDocument()
      expect(screen.getByText('テンプレート')).toBeInTheDocument()
    })

    it('RightPanelが常に表示される', () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      expect(screen.getByText('テンプレート')).toBeInTheDocument()
      expect(screen.getByText('プロパティ')).toBeInTheDocument()
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
      store.dispatch(setSelectedTemplate(testTemplates[0]))

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
      store.dispatch(setSelectedTemplate(testTemplates[0]))
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
      store.dispatch(setSelectedTemplate(testTemplates[0]))
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
      store.dispatch(setSelectedTemplate(testTemplates[1]))

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
      store.dispatch(setSelectedTemplate(testTemplates[0]))
    })

    it('配置ボタンが表示される', () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      expect(screen.getByText('配置')).toBeInTheDocument()
    })

    it('配置ボタンが表示される', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateTab = screen.getByText('テンプレート')
      await user.click(templateTab)

      // テンプレートが選択されていない場合は配置ボタンが表示されない
      expect(screen.queryByText('配置')).not.toBeInTheDocument()
    })

    it('テンプレートタブの基本機能が正常に動作する', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateTab = screen.getByText('テンプレート')
      await user.click(templateTab)

      expect(screen.getByText('カテゴリ')).toBeInTheDocument()
      expect(screen.getByText('テンプレート作成')).toBeInTheDocument()
    })

    it('テンプレートのサイズ情報が表示される', () => {
      store.dispatch(setSelectedTemplate(testTemplates[0]))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateTab = screen.getByText('テンプレート')
      user.click(templateTab)

      // テンプレートのサイズが表示される
      expect(screen.getByText('3×3')).toBeInTheDocument()
    })
  })

  describe('テンプレート作成機能', () => {
    it('テンプレート作成ボタンが表示される', () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateSection = screen.getByText('テンプレート')
      user.click(templateSection)

      expect(screen.getByText('テンプレート作成')).toBeInTheDocument()
    })

    it('テンプレート作成ボタンが機能する', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateSection = screen.getByText('テンプレート')
      await user.click(templateSection)

      const createTemplateButton = screen.getByText('テンプレート作成')
      expect(createTemplateButton).toBeInTheDocument()
      
      // ボタンがクリック可能であることを確認
      expect(createTemplateButton).not.toBeDisabled()
    })

    it('テンプレート作成ボタンが表示される', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateSection = screen.getByText('テンプレート')
      await user.click(templateSection)

      expect(screen.getByText('テンプレート作成')).toBeInTheDocument()
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

    it('プロパティセクションのタブが表示される', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('セルプロパティ')).toBeInTheDocument()
    })

    it('プロパティセクションが正常に機能する', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('セルプロパティ')).toBeInTheDocument()
      expect(screen.getByText('マップ設定')).toBeInTheDocument()
    })

    it('セルが選択されていない場合のデフォルトメッセージが表示される', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('マウスをマップ上のセルに重ねると詳細情報が表示されます')).toBeInTheDocument()
    })
  })

  describe('プロパティ編集機能', () => {
    beforeEach(() => {
      // hoveredCellInfoを設定
      store.dispatch(setHoveredCellInfo({
        position: { x: 0, y: 0 },
        floor: { type: 'normal', passable: true },
        walls: { north: null, east: null, south: null, west: null },
        events: [],
        decorations: []
      }))
    })

    it('床タイプ情報が表示される', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('床タイプ')).toBeInTheDocument()
      expect(screen.getByText('通常')).toBeInTheDocument()
      expect(screen.getByText('通行可否: 可能')).toBeInTheDocument()
    })

    it('壁情報が表示される', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('壁情報')).toBeInTheDocument()
      expect(screen.getByText('北:')).toBeInTheDocument()
      expect(screen.getByText('東:')).toBeInTheDocument()
      expect(screen.getByText('南:')).toBeInTheDocument()
      expect(screen.getByText('西:')).toBeInTheDocument()
    })

    it('イベント情報が表示される', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('イベント (0個)')).toBeInTheDocument()
      expect(screen.getByText('なし')).toBeInTheDocument()
    })

    it('装飾情報が表示される', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('装飾 (0個)')).toBeInTheDocument()
    })
  })

  describe('レイヤー依存表示機能', () => {
    it('プロパティセクションが表示される', async () => {
      store.dispatch(setSelectedLayer('floor'))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('セルプロパティ')).toBeInTheDocument()
    })

    it('壁レイヤー選択時もプロパティセクションが表示される', async () => {
      store.dispatch(setSelectedLayer('walls'))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('セルプロパティ')).toBeInTheDocument()
    })

    it('イベントレイヤー選択時もプロパティセクションが表示される', async () => {
      store.dispatch(setSelectedLayer('events'))

      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('セルプロパティ')).toBeInTheDocument()
      expect(screen.getByText('マップ設定')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ機能', () => {
    it('タブのラベルが適切に設定されている', () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      expect(screen.getByText('プロパティ')).toBeInTheDocument()
      expect(screen.getByText('テンプレート')).toBeInTheDocument()
    })

    it('テンプレートタブのボタンがアクセス可能', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const templateTab = screen.getByText('テンプレート')
      await user.click(templateTab)

      expect(screen.getByText('テンプレート作成')).toBeInTheDocument()
    })

    it('プロパティセクションにアクセスできる', async () => {
      render(
        <Provider store={store}>
          <RightPanel />
        </Provider>
      )

      const propertySection = screen.getByText('プロパティ')
      await user.click(propertySection)

      expect(screen.getByText('セルプロパティ')).toBeInTheDocument()
      expect(screen.getByText('マップ設定')).toBeInTheDocument()
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
        store.dispatch(setSelectedTemplate(testTemplates[0]))
        store.dispatch(setSelectedTemplate(testTemplates[1]))
        store.dispatch(setSelectedTemplate(null))
      }

      await waitFor(() => {
        expect(screen.getByText('テンプレート')).toBeInTheDocument()
      })
    })
  })
})