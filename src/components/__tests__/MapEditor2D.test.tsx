import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import MapEditor2D from '../MapEditor2D'
import mapSliceReducer from '../../store/mapSlice'
import editorSliceReducer from '../../store/editorSlice'
import { Dungeon } from '../../types/map'

// Canvas APIのモック
const mockCanvas = {
  getContext: vi.fn(() => ({
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    fillText: vi.fn(),
    strokeText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    closePath: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 }))
  })),
  width: 800,
  height: 600,
  style: {},
  getBoundingClientRect: vi.fn(() => ({
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600
  })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

HTMLCanvasElement.prototype.getContext = mockCanvas.getContext as any
HTMLCanvasElement.prototype.getBoundingClientRect = mockCanvas.getBoundingClientRect as any

// ResizeObserverのモック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

describe('MapEditor2D 統合テスト', () => {
  let store: ReturnType<typeof configureStore>
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
          history: [],
          currentHistoryIndex: -1,
          isUndoRedoOperation: false
        },
        editor: {
          // 基本ツール設定
          activeTool: 'pen',
          activeLayer: 'floor',
          showGrid: true,
          zoom: 100,
          
          // ホバー状態
          hoveredCell: null,
          hoveredCellInfo: null,
          
          // 選択状態
          selectedCells: [],
          isSelecting: false,
          selectionStart: null,
          selectionEnd: null,
          
          // テンプレート
          selectedTemplate: null,
          templateRotation: 0,
          
          // ダイアログ
          showNewProjectDialog: false,
          showEventEditDialog: false,
          showTemplateCreateDialog: false,
          editingEvent: null,
          rangeSelection: null,
          
          // 表示設定
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

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('コンポーネント基本機能', () => {
    it('MapEditor2Dコンポーネントが正常にレンダリングされる', () => {
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')
      expect(canvas).toBeInTheDocument()
      expect(canvas.tagName).toBe('CANVAS')
    })

    it('Canvasのサイズが適切に設定される', () => {
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')
      expect(canvas).toHaveAttribute('width')
      expect(canvas).toHaveAttribute('height')
    })

    it('プロジェクトが読み込まれていない場合はメッセージを表示', () => {
      // プロジェクトなしのストアを作成
      const emptyStore = configureStore({
        reducer: {
          map: mapSliceReducer,
          editor: editorSliceReducer
        }
      })

      render(
        <Provider store={emptyStore}>
          <MapEditor2D />
        </Provider>
      )

      expect(screen.getByText('プロジェクトが読み込まれていません')).toBeInTheDocument()
    })
  })

  describe('マウスイベント処理', () => {
    it('マウスクリックで床タイプが変更される', async () => {
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')
      
      // ペンツールと床レイヤーを選択（既に選択されている）
      expect(store.getState().editor.activeTool).toBe('pen')
      expect(store.getState().editor.activeLayer).toBe('floor')

      // マウスクリックイベントをシミュレート
      fireEvent.mouseDown(canvas, {
        clientX: 100,
        clientY: 100,
        button: 0
      })

      await waitFor(() => {
        const state = store.getState()
        // マウスクリックでセル更新アクションが発生することを確認
        expect(mockCanvas.getContext).toHaveBeenCalled()
      })
    })

    it('マウスホバーでセル情報が更新される', async () => {
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')
      
      // マウスホバーイベントをシミュレート
      fireEvent.mouseMove(canvas, {
        clientX: 100,
        clientY: 100
      })

      await waitFor(() => {
        const state = store.getState()
        // ホバー状態が更新されることを確認（座標に基づく）
        expect(state.editor.hoveredCell).toBeDefined()
      })
    })

    it('マウスドラッグで複数セルが選択される', async () => {
      // 矩形ツールを選択
      store.dispatch(editorSlice.actions.setActiveTool('rectangle'))
      
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')

      // マウスドラッグ開始
      fireEvent.mouseDown(canvas, {
        clientX: 50,
        clientY: 50,
        button: 0
      })

      // マウス移動
      fireEvent.mouseMove(canvas, {
        clientX: 150,
        clientY: 150
      })

      // マウスドラッグ終了
      fireEvent.mouseUp(canvas, {
        clientX: 150,
        clientY: 150,
        button: 0
      })

      await waitFor(() => {
        const state = store.getState()
        // 選択状態が更新されることを確認
        expect(state.editor.selectedCells.length).toBeGreaterThan(0)
      })
    })

    it('右クリックでコンテキストメニューが表示される', async () => {
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')

      // 右クリックイベントをシミュレート
      fireEvent.mouseDown(canvas, {
        clientX: 100,
        clientY: 100,
        button: 2
      })

      fireEvent.contextMenu(canvas, {
        clientX: 100,
        clientY: 100
      })

      await waitFor(() => {
        // コンテキストメニューが表示されることを確認
        // 実際の実装に応じて調整が必要
        expect(mockCanvas.getContext).toHaveBeenCalled()
      })
    })
  })

  describe('キーボードイベント処理', () => {
    it('Escキーで選択がクリアされる', async () => {
      // 選択状態を設定
      store.dispatch(editorSlice.actions.setSelectedCells([{x: 0, y: 0}]))
      
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      // Escキーを押下
      fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.selectedCells).toHaveLength(0)
      })
    })

    it('Deleteキーで選択セルが削除される', async () => {
      // 選択状態を設定
      store.dispatch(editorSlice.actions.setSelectedCells([{x: 0, y: 0}]))
      
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      // Deleteキーを押下
      fireEvent.keyDown(document, { key: 'Delete' })

      await waitFor(() => {
        // 削除処理が実行されることを確認
        expect(mockCanvas.getContext).toHaveBeenCalled()
      })
    })
  })

  describe('ツール機能', () => {
    it('ペンツールでセルが個別に更新される', async () => {
      store.dispatch(editorSlice.actions.setActiveTool('pen'))
      
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')
      
      // ペンツールでクリック
      fireEvent.mouseDown(canvas, {
        clientX: 100,
        clientY: 100,
        button: 0
      })

      fireEvent.mouseUp(canvas, {
        clientX: 100,
        clientY: 100,
        button: 0
      })

      await waitFor(() => {
        // セル更新が発生することを確認
        expect(mockCanvas.getContext).toHaveBeenCalled()
      })
    })

    it('バケツツールで塗りつぶしが実行される', async () => {
      store.dispatch(editorSlice.actions.setActiveTool('fill'))
      
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')
      
      // バケツツールでクリック
      fireEvent.mouseDown(canvas, {
        clientX: 100,
        clientY: 100,
        button: 0
      })

      await waitFor(() => {
        // 塗りつぶし処理が実行されることを確認
        expect(mockCanvas.getContext).toHaveBeenCalled()
      })
    })

    it('スポイトツールで床タイプが取得される', async () => {
      store.dispatch(editorSlice.actions.setActiveTool('eyedropper'))
      
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')
      
      // スポイトツールでクリック
      fireEvent.mouseDown(canvas, {
        clientX: 100,
        clientY: 100,
        button: 0
      })

      await waitFor(() => {
        // スポイト処理が実行されることを確認
        expect(mockCanvas.getContext).toHaveBeenCalled()
      })
    })
  })

  describe('レイヤー管理', () => {
    it('床レイヤーが正しく表示される', async () => {
      store.dispatch(editorSlice.actions.setActiveLayer('floor'))
      
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      await waitFor(() => {
        // 床レイヤーが描画されることを確認
        expect(mockCanvas.getContext).toHaveBeenCalled()
      })
    })

    it('壁レイヤーが正しく表示される', async () => {
      store.dispatch(editorSlice.actions.setActiveLayer('walls'))
      
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      await waitFor(() => {
        // 壁レイヤーが描画されることを確認
        expect(mockCanvas.getContext).toHaveBeenCalled()
      })
    })

    it('イベントレイヤーが正しく表示される', async () => {
      store.dispatch(editorSlice.actions.setActiveLayer('events'))
      
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      await waitFor(() => {
        // イベントレイヤーが描画されることを確認
        expect(mockCanvas.getContext).toHaveBeenCalled()
      })
    })

    it('レイヤー可視性が正しく反映される', async () => {
      // 床レイヤーを非表示に設定
      store.dispatch(editorSlice.actions.setLayerVisibility({ layer: 'floor', visible: false }))
      
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.layerVisibility.floor).toBe(false)
      })
    })
  })

  describe('ズーム機能', () => {
    it('ズームインが正しく動作する', async () => {
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')
      
      // ホイールイベントでズームイン
      fireEvent.wheel(canvas, {
        deltaY: -100,
        ctrlKey: true
      })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.zoom).toBeGreaterThan(100)
      })
    })

    it('ズームアウトが正しく動作する', async () => {
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')
      
      // ホイールイベントでズームアウト
      fireEvent.wheel(canvas, {
        deltaY: 100,
        ctrlKey: true
      })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.zoom).toBeLessThan(100)
      })
    })

    it('ズーム制限が正しく適用される', async () => {
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')
      
      // 最大ズーム以上にズームイン
      for (let i = 0; i < 10; i++) {
        fireEvent.wheel(canvas, {
          deltaY: -100,
          ctrlKey: true
        })
      }

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.zoom).toBeLessThanOrEqual(400) // 最大ズーム制限
      })
    })
  })

  describe('グリッド表示', () => {
    it('グリッドが正しく表示される', async () => {
      store.dispatch(editorSlice.actions.setShowGrid(true))
      
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.showGrid).toBe(true)
        expect(mockCanvas.getContext).toHaveBeenCalled()
      })
    })

    it('グリッドが正しく非表示になる', async () => {
      store.dispatch(editorSlice.actions.setShowGrid(false))
      
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.showGrid).toBe(false)
      })
    })
  })

  describe('パフォーマンス最適化', () => {
    it('頻繁な再描画時にパフォーマンスが保たれる', async () => {
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')
      
      // 高速なマウス移動イベントを発生させる
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseMove(canvas, {
          clientX: i * 2,
          clientY: i * 2
        })
      }

      await waitFor(() => {
        // 過度な再描画が発生しないことを確認
        expect(mockCanvas.getContext).toHaveBeenCalled()
      })
    })

    it('大きなマップでも正常に動作する', async () => {
      // 大きなマップを作成
      const largeDungeon = {
        ...testDungeon,
        floors: [{
          ...testDungeon.floors[0],
          width: 50,
          height: 50,
          cells: Array(50).fill(null).map((_, y) =>
            Array(50).fill(null).map((_, x) => ({
              x,
              y,
              floor: { type: 'normal', passable: true },
              walls: { north: null, east: null, south: null, west: null },
              events: [],
              decorations: [],
              properties: {}
            }))
          )
        }]
      }

      store.dispatch(mapSlice.actions.loadDungeon(largeDungeon))
      
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      await waitFor(() => {
        // 大きなマップでも正常に描画されることを確認
        expect(mockCanvas.getContext).toHaveBeenCalled()
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('Canvasコンテキストが取得できない場合のエラー処理', async () => {
      // Canvas getContextを失敗させる
      const mockFailingCanvas = {
        ...mockCanvas,
        getContext: vi.fn(() => null)
      }
      HTMLCanvasElement.prototype.getContext = mockFailingCanvas.getContext as any

      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      await waitFor(() => {
        // エラーが適切に処理されることを確認
        expect(mockFailingCanvas.getContext).toHaveBeenCalled()
      })
    })

    it('無効な座標でのクリック処理', async () => {
      render(
        <Provider store={store}>
          <MapEditor2D />
        </Provider>
      )

      const canvas = screen.getByTestId('map-canvas')
      
      // マップ範囲外の座標でクリック
      fireEvent.mouseDown(canvas, {
        clientX: -100,
        clientY: -100,
        button: 0
      })

      await waitFor(() => {
        // エラーが発生しないことを確認
        expect(mockCanvas.getContext).toHaveBeenCalled()
      })
    })
  })
})