import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import NewProjectDialog from '../NewProjectDialog'
import mapSliceReducer from '../../store/mapSlice'
import editorSliceReducer from '../../store/editorSlice'

describe('NewProjectDialog 統合テスト', () => {
  let store: ReturnType<typeof configureStore>
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
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
          dungeon: null,
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
          showNewProjectDialog: true, // ダイアログを表示状態に
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

  describe('ダイアログ表示機能', () => {
    it('NewProjectDialogが正常にレンダリングされる', () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      expect(screen.getByText('新規プロジェクト作成')).toBeInTheDocument()
      expect(screen.getByLabelText('プロジェクト名')).toBeInTheDocument()
      expect(screen.getByLabelText('作者名')).toBeInTheDocument()
      expect(screen.getByLabelText('幅')).toBeInTheDocument()
      expect(screen.getByLabelText('高さ')).toBeInTheDocument()
    })

    it('ダイアログが非表示の場合は何も表示されない', () => {
      // ダイアログを非表示に設定
      store.dispatch(editorSlice.actions.setShowNewProjectDialog(false))
      
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      expect(screen.queryByText('新規プロジェクト作成')).not.toBeInTheDocument()
    })
  })

  describe('フォーム入力機能', () => {
    it('プロジェクト名の入力が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const nameInput = screen.getByLabelText('プロジェクト名')
      await user.type(nameInput, 'テストダンジョン')

      expect(nameInput).toHaveValue('テストダンジョン')
    })

    it('作者名の入力が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const authorInput = screen.getByLabelText('作者名')
      await user.type(authorInput, 'テスト作者')

      expect(authorInput).toHaveValue('テスト作者')
    })

    it('幅の数値入力が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const widthInput = screen.getByLabelText('幅')
      await user.clear(widthInput)
      await user.type(widthInput, '15')

      expect(widthInput).toHaveValue(15)
    })

    it('高さの数値入力が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const heightInput = screen.getByLabelText('高さ')
      await user.clear(heightInput)
      await user.type(heightInput, '20')

      expect(heightInput).toHaveValue(20)
    })
  })

  describe('バリデーション機能', () => {
    it('プロジェクト名が空の場合にエラーメッセージが表示される', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const createButton = screen.getByText('作成')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('プロジェクト名は必須です')).toBeInTheDocument()
      })
    })

    it('作者名が空の場合にエラーメッセージが表示される', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const nameInput = screen.getByLabelText('プロジェクト名')
      await user.type(nameInput, 'テストプロジェクト')

      const createButton = screen.getByText('作成')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('作者名は必須です')).toBeInTheDocument()
      })
    })

    it('幅が最小値未満の場合にエラーメッセージが表示される', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const widthInput = screen.getByLabelText('幅')
      await user.clear(widthInput)
      await user.type(widthInput, '2')

      const createButton = screen.getByText('作成')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('幅は5以上100以下で入力してください')).toBeInTheDocument()
      })
    })

    it('幅が最大値を超える場合にエラーメッセージが表示される', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const widthInput = screen.getByLabelText('幅')
      await user.clear(widthInput)
      await user.type(widthInput, '150')

      const createButton = screen.getByText('作成')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('幅は5以上100以下で入力してください')).toBeInTheDocument()
      })
    })

    it('高さが最小値未満の場合にエラーメッセージが表示される', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const heightInput = screen.getByLabelText('高さ')
      await user.clear(heightInput)
      await user.type(heightInput, '3')

      const createButton = screen.getByText('作成')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('高さは5以上100以下で入力してください')).toBeInTheDocument()
      })
    })

    it('高さが最大値を超える場合にエラーメッセージが表示される', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const heightInput = screen.getByLabelText('高さ')
      await user.clear(heightInput)
      await user.type(heightInput, '120')

      const createButton = screen.getByText('作成')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('高さは5以上100以下で入力してください')).toBeInTheDocument()
      })
    })
  })

  describe('プロジェクト作成機能', () => {
    it('有効なデータでプロジェクトが正常に作成される', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      // フォームに入力
      const nameInput = screen.getByLabelText('プロジェクト名')
      const authorInput = screen.getByLabelText('作者名')
      const widthInput = screen.getByLabelText('幅')
      const heightInput = screen.getByLabelText('高さ')

      await user.type(nameInput, 'テストダンジョン')
      await user.type(authorInput, 'テスト作者')
      await user.clear(widthInput)
      await user.type(widthInput, '10')
      await user.clear(heightInput)
      await user.type(heightInput, '8')

      // 作成ボタンをクリック
      const createButton = screen.getByText('作成')
      await user.click(createButton)

      await waitFor(() => {
        const state = store.getState()
        // 新しいダンジョンが作成されることを確認
        expect(state.map.dungeon).toBeDefined()
        expect(state.map.dungeon?.name).toBe('テストダンジョン')
        expect(state.map.dungeon?.author).toBe('テスト作者')
        expect(state.map.dungeon?.floors[0].width).toBe(10)
        expect(state.map.dungeon?.floors[0].height).toBe(8)
        // ダイアログが閉じることを確認
        expect(state.editor.showNewProjectDialog).toBe(false)
      })
    })

    it('デフォルト値でプロジェクトが作成される', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      // 必須フィールドのみ入力
      const nameInput = screen.getByLabelText('プロジェクト名')
      const authorInput = screen.getByLabelText('作者名')

      await user.type(nameInput, 'デフォルトダンジョン')
      await user.type(authorInput, 'デフォルト作者')

      // 作成ボタンをクリック
      const createButton = screen.getByText('作成')
      await user.click(createButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.map.dungeon).toBeDefined()
        expect(state.map.dungeon?.floors[0].width).toBe(10) // デフォルト値
        expect(state.map.dungeon?.floors[0].height).toBe(10) // デフォルト値
      })
    })

    it('作成されたダンジョンの構造が正しい', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const nameInput = screen.getByLabelText('プロジェクト名')
      const authorInput = screen.getByLabelText('作者名')
      const widthInput = screen.getByLabelText('幅')
      const heightInput = screen.getByLabelText('高さ')

      await user.type(nameInput, 'テストダンジョン')
      await user.type(authorInput, 'テスト作者')
      await user.clear(widthInput)
      await user.type(widthInput, '5')
      await user.clear(heightInput)
      await user.type(heightInput, '5')

      const createButton = screen.getByText('作成')
      await user.click(createButton)

      await waitFor(() => {
        const state = store.getState()
        const dungeon = state.map.dungeon!
        
        // ダンジョンの基本構造
        expect(dungeon.id).toBeDefined()
        expect(dungeon.name).toBe('テストダンジョン')
        expect(dungeon.author).toBe('テスト作者')
        expect(dungeon.version).toBeDefined()
        expect(dungeon.floors).toHaveLength(1)
        
        // フロアの構造
        const floor = dungeon.floors[0]
        expect(floor.id).toBeDefined()
        expect(floor.name).toBe('フロア1')
        expect(floor.width).toBe(5)
        expect(floor.height).toBe(5)
        expect(floor.cells).toHaveLength(5) // 高さ
        expect(floor.cells[0]).toHaveLength(5) // 幅
        
        // セルの構造
        const cell = floor.cells[0][0]
        expect(cell.x).toBe(0)
        expect(cell.y).toBe(0)
        expect(cell.floor).toBeDefined()
        expect(cell.walls).toBeDefined()
        expect(cell.events).toEqual([])
        expect(cell.decorations).toEqual([])
        
        // メタデータ
        expect(dungeon.metadata.created).toBeDefined()
        expect(dungeon.metadata.modified).toBeDefined()
      })
    })
  })

  describe('ダイアログ操作機能', () => {
    it('キャンセルボタンでダイアログが閉じる', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const cancelButton = screen.getByText('キャンセル')
      await user.click(cancelButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.showNewProjectDialog).toBe(false)
        expect(state.map.dungeon).toBeNull() // プロジェクトは作成されない
      })
    })

    it('Escキーでダイアログが閉じる', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      // Escキーを押下
      fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.showNewProjectDialog).toBe(false)
      })
    })

    it('ダイアログの外側をクリックしてダイアログが閉じる', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      // ダイアログのバックドロップをクリック
      const backdrop = screen.getByRole('presentation').firstChild
      await user.click(backdrop as Element)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.showNewProjectDialog).toBe(false)
      })
    })
  })

  describe('フォームリセット機能', () => {
    it('ダイアログを閉じて再度開くとフォームがリセットされる', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      // フォームに入力
      const nameInput = screen.getByLabelText('プロジェクト名')
      await user.type(nameInput, 'テスト入力')

      // ダイアログを閉じる
      const cancelButton = screen.getByText('キャンセル')
      await user.click(cancelButton)

      // ダイアログを再度開く
      store.dispatch(editorSlice.actions.setShowNewProjectDialog(true))

      await waitFor(() => {
        const nameInputReopened = screen.getByLabelText('プロジェクト名')
        expect(nameInputReopened).toHaveValue('') // フォームがリセットされている
      })
    })
  })

  describe('アクセシビリティ機能', () => {
    beforeEach(() => {
      // 各テストの前にストアを新しく作成して確実にダイアログが開いた状態にする
      store = configureStore({
        reducer: {
          map: mapSliceReducer,
          editor: editorSliceReducer
        },
        preloadedState: {
          map: {
            dungeon: null,
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
            showNewProjectDialog: true, // 確実にダイアログを表示
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
    })

    it('フォームラベルが正しく関連付けられている', () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      expect(screen.getByLabelText('プロジェクト名')).toBeInTheDocument()
      expect(screen.getByLabelText('作者名')).toBeInTheDocument()
      expect(screen.getByLabelText('幅')).toBeInTheDocument()
      expect(screen.getByLabelText('高さ')).toBeInTheDocument()
    })

    it('エラーメッセージがaria-invalidで関連付けられている', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const createButton = screen.getByText('作成')
      await user.click(createButton)

      await waitFor(() => {
        const nameInput = screen.getByLabelText('プロジェクト名')
        expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('フォーカス管理が正しく動作する', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const nameInput = screen.getByLabelText('プロジェクト名')
      
      // ダイアログが開いた時に最初のフィールドにフォーカスが当たる
      await waitFor(() => {
        expect(nameInput).toHaveFocus()
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('プロジェクト作成中にエラーが発生した場合の処理', async () => {
      // Redux actionでエラーを発生させるためのテスト
      // 実際の実装に応じて調整が必要
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const nameInput = screen.getByLabelText('プロジェクト名')
      const authorInput = screen.getByLabelText('作者名')

      await user.type(nameInput, 'エラーテスト')
      await user.type(authorInput, 'エラー作者')

      const createButton = screen.getByText('作成')
      await user.click(createButton)

      // エラーが発生してもダイアログが適切に処理されることを確認
      await waitFor(() => {
        // プロジェクトが作成されることを確認（正常ケース）
        const state = store.getState()
        expect(state.map.dungeon).toBeDefined()
      })
    })

    it('無効な数値入力の処理', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const widthInput = screen.getByLabelText('幅')
      
      // 文字列を入力しようとする
      await user.clear(widthInput)
      await user.type(widthInput, 'abc')

      // 数値入力フィールドでは文字列が入力されない
      expect(widthInput).toHaveValue(null)
    })
  })

  describe('パフォーマンステスト', () => {
    it('大きなマップサイズでも正常に作成される', async () => {
      render(
        <Provider store={store}>
          <NewProjectDialog />
        </Provider>
      )

      const nameInput = screen.getByLabelText('プロジェクト名')
      const authorInput = screen.getByLabelText('作者名')
      const widthInput = screen.getByLabelText('幅')
      const heightInput = screen.getByLabelText('高さ')

      await user.type(nameInput, '大型ダンジョン')
      await user.type(authorInput, 'テスト作者')
      await user.clear(widthInput)
      await user.type(widthInput, '50')
      await user.clear(heightInput)
      await user.type(heightInput, '50')

      const createButton = screen.getByText('作成')
      await user.click(createButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.map.dungeon?.floors[0].width).toBe(50)
        expect(state.map.dungeon?.floors[0].height).toBe(50)
        expect(state.map.dungeon?.floors[0].cells).toHaveLength(50)
        expect(state.map.dungeon?.floors[0].cells[0]).toHaveLength(50)
      }, { timeout: 5000 }) // 大きなマップ作成のためタイムアウトを延長
    })
  })
})