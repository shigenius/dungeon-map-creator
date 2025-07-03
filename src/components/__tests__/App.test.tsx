import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import App from '../App'
import mapSliceReducer from '../../store/mapSlice'
import editorSliceReducer from '../../store/editorSlice'

// グローバルモック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Canvas APIのモック
const mockCanvas = {
  getContext: vi.fn(() => ({
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    drawImage: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 }))
  })),
  width: 800,
  height: 600,
  getBoundingClientRect: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600
  }))
}

HTMLCanvasElement.prototype.getContext = mockCanvas.getContext as any
HTMLCanvasElement.prototype.getBoundingClientRect = mockCanvas.getBoundingClientRect as any

describe('App 統合テスト', () => {
  let store: ReturnType<typeof configureStore>
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        map: mapSliceReducer,
        editor: editorSliceReducer
      }
    })

    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('アプリケーション基本機能', () => {
    it('Appが正常にレンダリングされる', () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      expect(screen.getByText('Dungeon Map Creator')).toBeInTheDocument()
      expect(screen.getByText('新しいプロジェクト')).toBeInTheDocument()
    })

    it('初期状態でメニューバー、ツールバー、パネルが表示される', () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      // メニューバー
      expect(screen.getByText('ファイル')).toBeInTheDocument()
      expect(screen.getByText('編集')).toBeInTheDocument()
      expect(screen.getByText('表示')).toBeInTheDocument()
      expect(screen.getByText('ツール')).toBeInTheDocument()

      // ツールバー
      expect(screen.getByLabelText('ペンツール')).toBeInTheDocument()

      // パネル
      expect(screen.getByText('レイヤー')).toBeInTheDocument()
      expect(screen.getByText('テンプレート')).toBeInTheDocument()
    })

    it('プロジェクトが読み込まれていない場合は適切なメッセージが表示される', () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      expect(screen.getByText('プロジェクトが読み込まれていません')).toBeInTheDocument()
    })
  })

  describe('レイアウト機能', () => {
    it('サイドバーの折りたたみが正しく機能する', async () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      const toggleButton = screen.getByLabelText('サイドバー切り替え')
      await user.click(toggleButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.sidebarCollapsed).toBe(true)
      })
    })

    it('レスポンシブレイアウトが正しく動作する', () => {
      // ウィンドウサイズを変更
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      })
      
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      // モバイルレイアウト時の表示確認
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('キーボードナビゲーションが正しく動作する', async () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      // Tabキーでナビゲーション
      await user.tab()
      const firstFocusable = document.activeElement
      expect(firstFocusable).toBeInTheDocument()

      await user.tab()
      const secondFocusable = document.activeElement
      expect(secondFocusable).not.toBe(firstFocusable)
    })
  })

  describe('キーボードショートカット機能', () => {
    beforeEach(() => {
      // プロジェクトを作成してショートカットを有効化
      const testDungeon = {
        id: 'test-dungeon',
        name: 'テストダンジョン',
        author: 'テスター',
        version: '1.0.0',
        floors: [{
          id: 'floor-1',
          name: 'フロア1',
          width: 5,
          height: 5,
          cells: Array(5).fill(null).map((_, y) =>
            Array(5).fill(null).map((_, x) => ({
              x, y,
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
        }],
        resources: { textures: {}, sprites: {}, audio: {} },
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      }
      store.dispatch(mapSlice.actions.loadDungeon(testDungeon))
    })

    describe('ツール選択ショートカット', () => {
      it('1キーでペンツールが選択される', async () => {
        render(
          <Provider store={store}>
            <App />
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
            <App />
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
            <App />
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
            <App />
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
            <App />
          </Provider>
        )

        fireEvent.keyDown(document, { key: '5' })

        await waitFor(() => {
          const state = store.getState()
          expect(state.editor.activeTool).toBe('select')
        })
      })
    })

    describe('レイヤー選択ショートカット', () => {
      it('Fキーで床レイヤーが選択される', async () => {
        render(
          <Provider store={store}>
            <App />
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
            <App />
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
            <App />
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
            <App />
          </Provider>
        )

        fireEvent.keyDown(document, { key: 'd' })

        await waitFor(() => {
          const state = store.getState()
          expect(state.editor.activeLayer).toBe('decorations')
        })
      })

      it('Tabキーでレイヤーが循環切り替えされる', async () => {
        render(
          <Provider store={store}>
            <App />
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
          expect(store.getState().editor.activeLayer).toBe('floor')
        })
      })
    })

    describe('表示制御ショートカット', () => {
      it('Ctrl+Gでグリッド表示が切り替わる', async () => {
        render(
          <Provider store={store}>
            <App />
          </Provider>
        )

        const initialGrid = store.getState().editor.showGrid
        fireEvent.keyDown(document, { key: 'g', ctrlKey: true })

        await waitFor(() => {
          const state = store.getState()
          expect(state.editor.showGrid).toBe(!initialGrid)
        })
      })

      it('Spaceキーでグリッド表示が切り替わる', async () => {
        render(
          <Provider store={store}>
            <App />
          </Provider>
        )

        const initialGrid = store.getState().editor.showGrid
        fireEvent.keyDown(document, { key: ' ' })

        await waitFor(() => {
          const state = store.getState()
          expect(state.editor.showGrid).toBe(!initialGrid)
        })
      })

      it('Ctrl+1で2Dビューが選択される', async () => {
        render(
          <Provider store={store}>
            <App />
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
            <App />
          </Provider>
        )

        fireEvent.keyDown(document, { key: '2', ctrlKey: true })

        await waitFor(() => {
          const state = store.getState()
          expect(state.editor.viewMode).toBe('3D')
        })
      })
    })

    describe('ズーム制御ショートカット', () => {
      it('Ctrl++でズームインする', async () => {
        render(
          <Provider store={store}>
            <App />
          </Provider>
        )

        const initialZoom = store.getState().editor.zoom
        fireEvent.keyDown(document, { key: '+', ctrlKey: true })

        await waitFor(() => {
          const state = store.getState()
          expect(state.editor.zoom).toBeGreaterThan(initialZoom)
        })
      })

      it('Ctrl+-でズームアウトする', async () => {
        render(
          <Provider store={store}>
            <App />
          </Provider>
        )

        const initialZoom = store.getState().editor.zoom
        fireEvent.keyDown(document, { key: '-', ctrlKey: true })

        await waitFor(() => {
          const state = store.getState()
          expect(state.editor.zoom).toBeLessThan(initialZoom)
        })
      })

      it('Ctrl+0でズームリセットする', async () => {
        store.dispatch(editorSlice.actions.setZoom(150))

        render(
          <Provider store={store}>
            <App />
          </Provider>
        )

        fireEvent.keyDown(document, { key: '0', ctrlKey: true })

        await waitFor(() => {
          const state = store.getState()
          expect(state.editor.zoom).toBe(100)
        })
      })
    })

    describe('編集操作ショートカット', () => {
      it('Ctrl+Zで元に戻す', async () => {
        // 履歴を作成
        store.dispatch(mapSlice.actions.addToHistory({ 
          dungeon: store.getState().map.dungeon!, 
          timestamp: Date.now() 
        }))

        render(
          <Provider store={store}>
            <App />
          </Provider>
        )

        fireEvent.keyDown(document, { key: 'z', ctrlKey: true })

        await waitFor(() => {
          const state = store.getState()
          expect(state.map.currentHistoryIndex).toBeLessThan(1)
        })
      })

      it('Ctrl+Yでやり直し', async () => {
        // 履歴を作成してundoする
        store.dispatch(mapSlice.actions.addToHistory({ 
          dungeon: store.getState().map.dungeon!, 
          timestamp: Date.now() 
        }))
        store.dispatch(mapSlice.actions.undo())

        render(
          <Provider store={store}>
            <App />
          </Provider>
        )

        fireEvent.keyDown(document, { key: 'y', ctrlKey: true })

        await waitFor(() => {
          const state = store.getState()
          expect(state.map.currentHistoryIndex).toBeGreaterThan(-1)
        })
      })
    })

    describe('テンプレート操作ショートカット', () => {
      it('Qキーでテンプレート左回転', async () => {
        render(
          <Provider store={store}>
            <App />
          </Provider>
        )

        fireEvent.keyDown(document, { key: 'q' })

        await waitFor(() => {
          const state = store.getState()
          expect(state.editor.templateRotation).toBe(270)
        })
      })

      it('Rキーでテンプレート右回転', async () => {
        render(
          <Provider store={store}>
            <App />
          </Provider>
        )

        fireEvent.keyDown(document, { key: 'r' })

        await waitFor(() => {
          const state = store.getState()
          expect(state.editor.templateRotation).toBe(90)
        })
      })
    })

    it('テキスト入力中はショートカットが無効化される', async () => {
      render(
        <Provider store={store}>
          <App />
          <input data-testid="text-input" />
        </Provider>
      )

      const textInput = screen.getByTestId('text-input')
      await user.click(textInput)

      // ツール選択ショートカットをテスト
      fireEvent.keyDown(textInput, { key: '2' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('pen') // 変更されない
      })
    })
  })

  describe('ダイアログ管理機能', () => {
    it('Ctrl+Nで新しいプロジェクトダイアログが開く', async () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      fireEvent.keyDown(document, { key: 'n', ctrlKey: true })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.showNewProjectDialog).toBe(true)
      })
    })

    it('Escキーでダイアログが閉じる', async () => {
      store.dispatch(editorSlice.actions.setShowNewProjectDialog(true))

      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.showNewProjectDialog).toBe(false)
      })
    })

    it('複数のダイアログが同時に開かない', async () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      // 新しいプロジェクトダイアログを開く
      store.dispatch(editorSlice.actions.setShowNewProjectDialog(true))

      // 別のダイアログを開こうとする
      store.dispatch(editorSlice.actions.setShowEventEditDialog(true))

      await waitFor(() => {
        const state = store.getState()
        // 一度に一つのダイアログのみ開かれる
        const openDialogs = [
          state.editor.showNewProjectDialog,
          state.editor.showEventEditDialog,
          state.editor.showTemplateCreateDialog
        ].filter(Boolean)
        expect(openDialogs.length).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('エラーハンドリング機能', () => {
    it('予期しないエラーが発生してもアプリケーションがクラッシュしない', () => {
      // エラーを発生させるコンポーネントをモック
      const ErrorComponent = () => {
        throw new Error('テストエラー')
      }

      // エラーバウンダリのテスト
      expect(() => {
        render(
          <Provider store={store}>
            <App />
            <ErrorComponent />
          </Provider>
        )
      }).not.toThrow()
    })

    it('無効なRedux actionが送信されてもアプリケーションが安定している', () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      // 無効なactionをdispatch
      expect(() => {
        store.dispatch({ type: 'INVALID_ACTION' })
      }).not.toThrow()
    })
  })

  describe('パフォーマンス機能', () => {
    it('大量のキーボードイベントでも正常に動作する', async () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      // 大量のキーイベントを高速で発生させる
      for (let i = 0; i < 100; i++) {
        fireEvent.keyDown(document, { key: '1' })
        fireEvent.keyDown(document, { key: '2' })
        fireEvent.keyDown(document, { key: 'f' })
        fireEvent.keyDown(document, { key: 'w' })
      }

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.activeTool).toBe('rectangle')
        expect(state.editor.activeLayer).toBe('walls')
      })
    })

    it('ウィンドウリサイズイベントが正しく処理される', async () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      // ウィンドウリサイズをシミュレート
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      })

      fireEvent.resize(window)

      // レイアウトが適切に更新されることを確認
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('アクセシビリティ機能', () => {
    it('適切なランドマークロールが設定されている', () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('main')).toBeInTheDocument() // main
      expect(screen.getByRole('navigation')).toBeInTheDocument() // nav
    })

    it('フォーカストラップが正しく動作する', async () => {
      store.dispatch(editorSlice.actions.setShowNewProjectDialog(true))

      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      // ダイアログ内でTabキーを押してフォーカスが循環することを確認
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()

      // フォーカス可能な要素を確認
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      expect(focusableElements.length).toBeGreaterThan(0)
    })

    it('キーボードのみでの操作が可能', async () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      // キーボードのみでメニューを開く
      const fileMenu = screen.getByText('ファイル')
      fireEvent.keyDown(fileMenu, { key: 'Enter' })

      // メニューアイテムにフォーカスが移動することを確認
      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem')
        expect(menuItems.length).toBeGreaterThan(0)
      })
    })

    it('スクリーンリーダー対応のaria属性が適切に設定されている', () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      // ツールボタンにaria-labelが設定されている
      expect(screen.getByLabelText('ペンツール')).toBeInTheDocument()
      
      // ライブリージョンが設定されている
      const liveRegions = document.querySelectorAll('[aria-live]')
      expect(liveRegions.length).toBeGreaterThan(0)
    })
  })

  describe('国際化対応', () => {
    it('日本語UIが正しく表示される', () => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      )

      expect(screen.getByText('ファイル')).toBeInTheDocument()
      expect(screen.getByText('編集')).toBeInTheDocument()
      expect(screen.getByText('表示')).toBeInTheDocument()
      expect(screen.getByText('新しいプロジェクト')).toBeInTheDocument()
    })
  })
})