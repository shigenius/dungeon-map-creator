import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import ToolBar from '../ToolBar'
import mapSliceReducer from '../../store/mapSlice'
import editorSliceReducer from '../../store/editorSlice'
import { Dungeon } from '../../types/map'

describe('ToolBar 統合テスト', () => {
  let store: ReturnType<typeof configureStore>
  let user: ReturnType<typeof userEvent.setup>
  let testDungeon: Dungeon

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

    store = configureStore({
      reducer: {
        map: mapSliceReducer,
        editor: editorSliceReducer
      },
      preloadedState: {
        map: {
          dungeon: testDungeon,
          history: [
            { dungeon: testDungeon, timestamp: Date.now() }
          ],
          currentHistoryIndex: 0,
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

  describe('ツールバー表示機能', () => {
    it('ToolBarが正常にレンダリングされる', () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      // ツールボタンが表示されることを確認
      expect(screen.getByLabelText('ペンツール')).toBeInTheDocument()
      expect(screen.getByLabelText('矩形ツール')).toBeInTheDocument()
      expect(screen.getByLabelText('塗りつぶしツール')).toBeInTheDocument()
      expect(screen.getByLabelText('スポイトツール')).toBeInTheDocument()
      expect(screen.getByLabelText('選択ツール')).toBeInTheDocument()
    })

    it('現在選択されているツールがハイライトされる', () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const penTool = screen.getByLabelText('ペンツール')
      expect(penTool).toHaveAttribute('aria-pressed', 'true')

      const rectangleTool = screen.getByLabelText('矩形ツール')
      expect(rectangleTool).toHaveAttribute('aria-pressed', 'false')
    })

    it('プロジェクトが読み込まれていない場合はツールが無効化される', () => {
      // プロジェクトなしのストアを作成
      const emptyStore = configureStore({
        reducer: {
          map: mapSliceReducer,
          editor: editorSliceReducer
        }
      })

      render(
        <Provider store={emptyStore}>
          <ToolBar />
        </Provider>
      )

      const penTool = screen.getByLabelText('ペンツール')
      expect(penTool).toBeDisabled()
    })
  })

  describe('ツール選択機能', () => {
    it('ペンツールの選択が正しく機能する', async () => {
      store.dispatch(editorSlice.actions.setActiveTool('rectangle'))
      
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const penTool = screen.getByLabelText('ペンツール')
      await user.click(penTool)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('pen')
      })
    })

    it('矩形ツールの選択が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const rectangleTool = screen.getByLabelText('矩形ツール')
      await user.click(rectangleTool)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('rectangle')
      })
    })

    it('塗りつぶしツールの選択が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const fillTool = screen.getByLabelText('塗りつぶしツール')
      await user.click(fillTool)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('fill')
      })
    })

    it('スポイトツールの選択が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const eyedropperTool = screen.getByLabelText('スポイトツール')
      await user.click(eyedropperTool)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('eyedropper')
      })
    })

    it('選択ツールの選択が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const selectTool = screen.getByLabelText('選択ツール')
      await user.click(selectTool)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('select')
      })
    })
  })

  describe('キーボードショートカット機能', () => {
    it('1キーでペンツールが選択される', async () => {
      store.dispatch(editorSlice.actions.setActiveTool('rectangle'))
      
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: '1' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('pen')
      })
    })

    it('2キーで矩形ツールが選択される', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: '2' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('rectangle')
      })
    })

    it('3キーで塗りつぶしツールが選択される', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: '3' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('fill')
      })
    })

    it('4キーでスポイトツールが選択される', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: '4' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('eyedropper')
      })
    })

    it('5キーで選択ツールが選択される', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: '5' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('select')
      })
    })

    it('テキスト入力中はショートカットが無効化される', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
          <input data-testid="text-input" />
        </Provider>
      )

      const textInput = screen.getByTestId('text-input')
      await user.click(textInput)

      fireEvent.keyDown(textInput, { key: '2' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('pen') // 変更されない
      })
    })
  })

  describe('レイヤー選択機能', () => {
    it('レイヤー切り替えボタンが表示される', () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      expect(screen.getByLabelText('床レイヤー')).toBeInTheDocument()
      expect(screen.getByLabelText('壁レイヤー')).toBeInTheDocument()
      expect(screen.getByLabelText('イベントレイヤー')).toBeInTheDocument()
      expect(screen.getByLabelText('装飾レイヤー')).toBeInTheDocument()
    })

    it('現在選択されているレイヤーがハイライトされる', () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const floorLayer = screen.getByLabelText('床レイヤー')
      expect(floorLayer).toHaveAttribute('aria-pressed', 'true')
    })

    it('壁レイヤーの選択が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const wallsLayer = screen.getByLabelText('壁レイヤー')
      await user.click(wallsLayer)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeLayer).toBe('walls')
      })
    })

    it('イベントレイヤーの選択が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const eventsLayer = screen.getByLabelText('イベントレイヤー')
      await user.click(eventsLayer)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeLayer).toBe('events')
      })
    })

    it('装飾レイヤーの選択が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const decorationsLayer = screen.getByLabelText('装飾レイヤー')
      await user.click(decorationsLayer)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeLayer).toBe('decorations')
      })
    })
  })

  describe('レイヤーキーボードショートカット', () => {
    it('Fキーで床レイヤーが選択される', async () => {
      store.dispatch(editorSlice.actions.setActiveLayer('walls'))
      
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: 'f' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeLayer).toBe('floor')
      })
    })

    it('Wキーで壁レイヤーが選択される', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: 'w' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeLayer).toBe('walls')
      })
    })

    it('Eキーでイベントレイヤーが選択される', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: 'e' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeLayer).toBe('events')
      })
    })

    it('Dキーで装飾レイヤーが選択される', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: 'd' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeLayer).toBe('decorations')
      })
    })

    it('Tabキーでレイヤーが順次切り替わる', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      // 初期状態: floor
      expect(store.getState().editor.activeLayer).toBe('floor')

      fireEvent.keyDown(document, { key: 'Tab' })
      await waitFor(() => {
        expect(store.getState().editor.activeLayer).toBe('walls')
      })

      fireEvent.keyDown(document, { key: 'Tab' })
      await waitFor(() => {
        expect(store.getState().editor.activeLayer).toBe('events')
      })

      fireEvent.keyDown(document, { key: 'Tab' })
      await waitFor(() => {
        expect(store.getState().editor.activeLayer).toBe('decorations')
      })

      fireEvent.keyDown(document, { key: 'Tab' })
      await waitFor(() => {
        expect(store.getState().editor.activeLayer).toBe('floor') // 循環
      })
    })
  })

  describe('undo/redo機能', () => {
    it('undoボタンが表示される', () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      expect(screen.getByLabelText('元に戻す')).toBeInTheDocument()
    })

    it('redoボタンが表示される', () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      expect(screen.getByLabelText('やり直し')).toBeInTheDocument()
    })

    it('履歴がない場合はundoボタンが無効化される', () => {
      // 履歴なしのストアを作成
      const noHistoryStore = configureStore({
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
          editor: store.getState().editor
        }
      })

      render(
        <Provider store={noHistoryStore}>
          <ToolBar />
        </Provider>
      )

      const undoButton = screen.getByLabelText('元に戻す')
      expect(undoButton).toBeDisabled()
    })

    it('未来の履歴がない場合はredoボタンが無効化される', () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const redoButton = screen.getByLabelText('やり直し')
      expect(redoButton).toBeDisabled()
    })

    it('Ctrl+Zでundoが実行される', async () => {
      // 複数の履歴を作成
      store.dispatch(mapSlice.actions.addToHistory({ dungeon: testDungeon, timestamp: Date.now() }))
      
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: 'z', ctrlKey: true })

      await waitFor(() => {
        const state = store.getState()
        expect(state.map.currentHistoryIndex).toBe(0)
      })
    })

    it('Ctrl+Yでredoが実行される', async () => {
      // undoして未来の履歴を作成
      store.dispatch(mapSlice.actions.addToHistory({ dungeon: testDungeon, timestamp: Date.now() }))
      store.dispatch(mapSlice.actions.undo())
      
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: 'y', ctrlKey: true })

      await waitFor(() => {
        const state = store.getState()
        expect(state.map.currentHistoryIndex).toBe(1)
      })
    })
  })

  describe('ズーム機能', () => {
    it('ズーム表示が正しく表示される', () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('ズームインボタンでズームが増加する', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const zoomInButton = screen.getByLabelText('ズームイン')
      await user.click(zoomInButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.zoom).toBeGreaterThan(100)
      })
    })

    it('ズームアウトボタンでズームが減少する', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const zoomOutButton = screen.getByLabelText('ズームアウト')
      await user.click(zoomOutButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.zoom).toBeLessThan(100)
      })
    })

    it('ズームリセットボタンで100%に戻る', async () => {
      store.dispatch(editorSlice.actions.setZoom(150))
      
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const resetZoomButton = screen.getByLabelText('ズームリセット')
      await user.click(resetZoomButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.zoom).toBe(100)
      })
    })
  })

  describe('グリッド表示機能', () => {
    it('グリッド表示ボタンが表示される', () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      expect(screen.getByLabelText('グリッド表示')).toBeInTheDocument()
    })

    it('グリッド表示の切り替えが正しく機能する', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const gridButton = screen.getByLabelText('グリッド表示')
      await user.click(gridButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.showGrid).toBe(false)
      })
    })

    it('Ctrl+Gでグリッド表示が切り替わる', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: 'g', ctrlKey: true })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.showGrid).toBe(false)
      })
    })

    it('Spaceキーでグリッド表示が切り替わる', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: ' ' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.showGrid).toBe(false)
      })
    })
  })

  describe('ビューモード切り替え', () => {
    it('2D/3Dビューモード切り替えボタンが表示される', () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      expect(screen.getByLabelText('2Dビュー')).toBeInTheDocument()
      expect(screen.getByLabelText('3Dビュー')).toBeInTheDocument()
    })

    it('3Dビューモードの切り替えが正しく機能する', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const view3DButton = screen.getByLabelText('3Dビュー')
      await user.click(view3DButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.viewMode).toBe('3D')
      })
    })

    it('Ctrl+1で2Dビューが選択される', async () => {
      store.dispatch(editorSlice.actions.setViewMode('3D'))
      
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: '1', ctrlKey: true })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.viewMode).toBe('2D')
      })
    })

    it('Ctrl+2で3Dビューが選択される', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      fireEvent.keyDown(document, { key: '2', ctrlKey: true })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.viewMode).toBe('3D')
      })
    })
  })

  describe('アクセシビリティ機能', () => {
    it('すべてのボタンに適切なaria-labelが設定されている', () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      // ツールボタン
      expect(screen.getByLabelText('ペンツール')).toBeInTheDocument()
      expect(screen.getByLabelText('矩形ツール')).toBeInTheDocument()
      expect(screen.getByLabelText('塗りつぶしツール')).toBeInTheDocument()
      expect(screen.getByLabelText('スポイトツール')).toBeInTheDocument()
      expect(screen.getByLabelText('選択ツール')).toBeInTheDocument()

      // レイヤーボタン
      expect(screen.getByLabelText('床レイヤー')).toBeInTheDocument()
      expect(screen.getByLabelText('壁レイヤー')).toBeInTheDocument()
      expect(screen.getByLabelText('イベントレイヤー')).toBeInTheDocument()
      expect(screen.getByLabelText('装飾レイヤー')).toBeInTheDocument()

      // 操作ボタン
      expect(screen.getByLabelText('元に戻す')).toBeInTheDocument()
      expect(screen.getByLabelText('やり直し')).toBeInTheDocument()
      expect(screen.getByLabelText('グリッド表示')).toBeInTheDocument()
    })

    it('ボタンの状態がaria-pressedで適切に表現されている', () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const penTool = screen.getByLabelText('ペンツール')
      expect(penTool).toHaveAttribute('aria-pressed', 'true')

      const floorLayer = screen.getByLabelText('床レイヤー')
      expect(floorLayer).toHaveAttribute('aria-pressed', 'true')
    })

    it('キーボードナビゲーションが正しく動作する', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const penTool = screen.getByLabelText('ペンツール')
      await user.tab()
      expect(penTool).toHaveFocus()

      await user.tab()
      const rectangleTool = screen.getByLabelText('矩形ツール')
      expect(rectangleTool).toHaveFocus()
    })
  })

  describe('ツールチップ機能', () => {
    it('ツールボタンにホバーでツールチップが表示される', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const penTool = screen.getByLabelText('ペンツール')
      await user.hover(penTool)

      await waitFor(() => {
        expect(screen.getByText('ペン (1)')).toBeInTheDocument()
      })
    })

    it('レイヤーボタンにホバーでツールチップが表示される', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      const floorLayer = screen.getByLabelText('床レイヤー')
      await user.hover(floorLayer)

      await waitFor(() => {
        expect(screen.getByText('床 (F)')).toBeInTheDocument()
      })
    })
  })

  describe('パフォーマンス機能', () => {
    it('頻繁な状態変更でも適切にレンダリングされる', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      // 高速にツールを切り替え
      for (let i = 0; i < 10; i++) {
        store.dispatch(editorSlice.actions.setActiveTool('pen'))
        store.dispatch(editorSlice.actions.setActiveTool('rectangle'))
        store.dispatch(editorSlice.actions.setActiveTool('fill'))
      }

      await waitFor(() => {
        expect(screen.getByLabelText('塗りつぶしツール')).toHaveAttribute('aria-pressed', 'true')
      })
    })

    it('大量のキーボードイベントでも正常に動作する', async () => {
      render(
        <Provider store={store}>
          <ToolBar />
        </Provider>
      )

      // 高速にキーイベントを発生させる
      for (let i = 0; i < 50; i++) {
        fireEvent.keyDown(document, { key: '1' })
        fireEvent.keyDown(document, { key: '2' })
        fireEvent.keyDown(document, { key: '3' })
      }

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('fill')
      })
    })
  })
})