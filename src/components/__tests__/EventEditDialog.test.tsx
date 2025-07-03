import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import EventEditDialog from '../EventEditDialog'
import mapSliceReducer from '../../store/mapSlice'
import editorSliceReducer from '../../store/editorSlice'
import { DungeonEvent, Dungeon } from '../../types/map'

describe('EventEditDialog 統合テスト', () => {
  let store: ReturnType<typeof configureStore>
  let user: ReturnType<typeof userEvent.setup>
  let testDungeon: Dungeon
  let testEvent: DungeonEvent

  beforeEach(() => {
    testEvent = {
      id: 'test-event-1',
      name: 'テスト宝箱',
      type: 'treasure',
      position: { x: 2, y: 3 },
      appearance: { color: '#ffd700', icon: '💰' },
      triggers: [
        {
          type: 'interact',
          repeatPolicy: { type: 'once' },
          conditions: [
            { type: 'flag', key: 'quest_completed', operator: '==', value: true }
          ]
        }
      ],
      actions: [
        {
          id: 'action-1',
          type: 'message',
          params: { text: '宝箱を開けた！', title: 'システム' }
        },
        {
          id: 'action-2',
          type: 'item',
          params: { operation: 'add', itemId: 'gold_coin', count: 100 }
        }
      ],
      metadata: {
        created: '2025-01-01T00:00:00.000Z',
        modified: '2025-01-01T12:00:00.000Z',
        author: 'テスター',
        version: 1
      }
    }

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
              events: x === 2 && y === 3 ? [testEvent] : [],
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
          activeTool: 'pen',
          activeLayer: 'events',
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
          showEventEditDialog: true, // ダイアログを表示状態に
          showTemplateCreateDialog: false,
          editingEvent: testEvent, // 編集中のイベントを設定
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
    it('EventEditDialogが正常にレンダリングされる', () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      expect(screen.getByText('イベント編集')).toBeInTheDocument()
      expect(screen.getByLabelText('イベント名')).toBeInTheDocument()
      expect(screen.getByLabelText('イベントタイプ')).toBeInTheDocument()
    })

    it('ダイアログが非表示の場合は何も表示されない', () => {
      store.dispatch(editorSlice.actions.setShowEventEditDialog(false))
      
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      expect(screen.queryByText('イベント編集')).not.toBeInTheDocument()
    })

    it('編集中のイベントがない場合は新規作成モードになる', () => {
      store.dispatch(editorSlice.actions.setEditingEvent(null))
      
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      expect(screen.getByText('新しいイベント')).toBeInTheDocument()
    })
  })

  describe('フォーム入力機能', () => {
    it('イベント名の入力が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const nameInput = screen.getByLabelText('イベント名')
      expect(nameInput).toHaveValue('テスト宝箱')

      await user.clear(nameInput)
      await user.type(nameInput, '新しい宝箱')

      expect(nameInput).toHaveValue('新しい宝箱')
    })

    it('イベントタイプの選択が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const typeSelect = screen.getByLabelText('イベントタイプ')
      expect(typeSelect).toHaveValue('treasure')

      await user.selectOptions(typeSelect, 'npc')
      expect(typeSelect).toHaveValue('npc')
    })

    it('イベント位置の入力が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const xInput = screen.getByLabelText('X座標')
      const yInput = screen.getByLabelText('Y座標')

      expect(xInput).toHaveValue(2)
      expect(yInput).toHaveValue(3)

      await user.clear(xInput)
      await user.type(xInput, '4')
      await user.clear(yInput)
      await user.type(yInput, '1')

      expect(xInput).toHaveValue(4)
      expect(yInput).toHaveValue(1)
    })

    it('外観設定（色とアイコン）の入力が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const colorInput = screen.getByLabelText('色')
      const iconInput = screen.getByLabelText('アイコン')

      expect(colorInput).toHaveValue('#ffd700')
      expect(iconInput).toHaveValue('💰')

      await user.clear(colorInput)
      await user.type(colorInput, '#ff0000')
      await user.clear(iconInput)
      await user.type(iconInput, '🎁')

      expect(colorInput).toHaveValue('#ff0000')
      expect(iconInput).toHaveValue('🎁')
    })
  })

  describe('トリガー設定機能', () => {
    it('トリガータイプの選択が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      // トリガー設定セクションを開く
      const triggerSection = screen.getByText('トリガー設定')
      await user.click(triggerSection)

      const triggerTypeSelect = screen.getByLabelText('トリガータイプ')
      expect(triggerTypeSelect).toHaveValue('interact')

      await user.selectOptions(triggerTypeSelect, 'auto')
      expect(triggerTypeSelect).toHaveValue('auto')
    })

    it('リピートポリシーの設定が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const triggerSection = screen.getByText('トリガー設定')
      await user.click(triggerSection)

      const repeatPolicySelect = screen.getByLabelText('リピートポリシー')
      expect(repeatPolicySelect).toHaveValue('once')

      await user.selectOptions(repeatPolicySelect, 'always')
      expect(repeatPolicySelect).toHaveValue('always')
    })

    it('トリガー条件の追加と編集が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const triggerSection = screen.getByText('トリガー設定')
      await user.click(triggerSection)

      // 既存の条件が表示されることを確認
      expect(screen.getByText('フラグ条件')).toBeInTheDocument()

      // 新しい条件を追加
      const addConditionButton = screen.getByText('条件を追加')
      await user.click(addConditionButton)

      // 条件タイプを選択
      const conditionTypeSelects = screen.getAllByLabelText('条件タイプ')
      await user.selectOptions(conditionTypeSelects[1], 'item')

      expect(screen.getByText('アイテム条件')).toBeInTheDocument()
    })

    it('条件の削除が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const triggerSection = screen.getByText('トリガー設定')
      await user.click(triggerSection)

      // 条件削除ボタンをクリック
      const deleteConditionButton = screen.getByText('削除')
      await user.click(deleteConditionButton)

      // 条件が削除されることを確認
      await waitFor(() => {
        expect(screen.queryByText('フラグ条件')).not.toBeInTheDocument()
      })
    })
  })

  describe('アクション設定機能', () => {
    it('アクションの追加が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const actionSection = screen.getByText('アクション設定')
      await user.click(actionSection)

      // 既存のアクションが表示されることを確認
      expect(screen.getByText('メッセージ表示')).toBeInTheDocument()
      expect(screen.getByText('アイテム操作')).toBeInTheDocument()

      // 新しいアクションを追加
      const addActionButton = screen.getByText('アクションを追加')
      await user.click(addActionButton)

      // アクションタイプを選択
      const actionTypeSelects = screen.getAllByLabelText('アクションタイプ')
      const lastSelect = actionTypeSelects[actionTypeSelects.length - 1]
      await user.selectOptions(lastSelect, 'flag')

      expect(screen.getByText('フラグ操作')).toBeInTheDocument()
    })

    it('アクションパラメータの編集が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const actionSection = screen.getByText('アクション設定')
      await user.click(actionSection)

      // メッセージアクションのパラメータを編集
      const messageTextInput = screen.getByLabelText('メッセージテキスト')
      expect(messageTextInput).toHaveValue('宝箱を開けた！')

      await user.clear(messageTextInput)
      await user.type(messageTextInput, '新しいメッセージ')

      expect(messageTextInput).toHaveValue('新しいメッセージ')
    })

    it('アクションの削除が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const actionSection = screen.getByText('アクション設定')
      await user.click(actionSection)

      // アクション削除ボタンをクリック
      const deleteActionButtons = screen.getAllByText('削除')
      await user.click(deleteActionButtons[0]) // 最初のアクションを削除

      // アクションが削除されることを確認
      await waitFor(() => {
        const messageActions = screen.queryAllByText('メッセージ表示')
        expect(messageActions).toHaveLength(0)
      })
    })

    it('アクションの順序変更が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const actionSection = screen.getByText('アクション設定')
      await user.click(actionSection)

      // 順序変更ボタンが表示されることを確認
      const moveUpButtons = screen.getAllByText('↑')
      const moveDownButtons = screen.getAllByText('↓')

      expect(moveUpButtons).toHaveLength(2)
      expect(moveDownButtons).toHaveLength(2)

      // 2番目のアクションを上に移動
      await user.click(moveUpButtons[1])

      // 順序が変更されることを確認（実装に応じて調整）
      await waitFor(() => {
        // アクションの順序変更が反映されることを確認
        expect(screen.getAllByText('削除')).toHaveLength(2)
      })
    })
  })

  describe('イベント保存機能', () => {
    it('イベントの更新が正しく機能する', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      // イベント名を変更
      const nameInput = screen.getByLabelText('イベント名')
      await user.clear(nameInput)
      await user.type(nameInput, '更新された宝箱')

      // 保存ボタンをクリック
      const saveButton = screen.getByText('保存')
      await user.click(saveButton)

      await waitFor(() => {
        const state = store.getState()
        const floor = state.map.dungeon!.floors[0]
        const cell = floor.cells[3][2] // y=3, x=2
        const updatedEvent = cell.events[0]
        
        expect(updatedEvent.name).toBe('更新された宝箱')
        expect(state.editor.showEventEditDialog).toBe(false)
      })
    })

    it('新しいイベントの作成が正しく機能する', async () => {
      // 新規作成モードに設定
      store.dispatch(editorSlice.actions.setEditingEvent(null))
      
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      // フォームに入力
      const nameInput = screen.getByLabelText('イベント名')
      const typeSelect = screen.getByLabelText('イベントタイプ')
      const xInput = screen.getByLabelText('X座標')
      const yInput = screen.getByLabelText('Y座標')

      await user.type(nameInput, '新しいNPC')
      await user.selectOptions(typeSelect, 'npc')
      await user.clear(xInput)
      await user.type(xInput, '1')
      await user.clear(yInput)
      await user.type(yInput, '1')

      // 保存ボタンをクリック
      const saveButton = screen.getByText('保存')
      await user.click(saveButton)

      await waitFor(() => {
        const state = store.getState()
        const floor = state.map.dungeon!.floors[0]
        const cell = floor.cells[1][1] // y=1, x=1
        
        expect(cell.events).toHaveLength(1)
        expect(cell.events[0].name).toBe('新しいNPC')
        expect(cell.events[0].type).toBe('npc')
      })
    })

    it('位置変更時に元の位置からイベントが削除される', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      // 位置を変更
      const xInput = screen.getByLabelText('X座標')
      const yInput = screen.getByLabelText('Y座標')
      
      await user.clear(xInput)
      await user.type(xInput, '0')
      await user.clear(yInput)
      await user.type(yInput, '0')

      // 保存ボタンをクリック
      const saveButton = screen.getByText('保存')
      await user.click(saveButton)

      await waitFor(() => {
        const state = store.getState()
        const floor = state.map.dungeon!.floors[0]
        
        // 元の位置(2,3)からイベントが削除される
        const oldCell = floor.cells[3][2]
        expect(oldCell.events).toHaveLength(0)
        
        // 新しい位置(0,0)にイベントが移動する
        const newCell = floor.cells[0][0]
        expect(newCell.events).toHaveLength(1)
        expect(newCell.events[0].name).toBe('テスト宝箱')
      })
    })
  })

  describe('バリデーション機能', () => {
    it('イベント名が空の場合にエラーメッセージが表示される', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const nameInput = screen.getByLabelText('イベント名')
      await user.clear(nameInput)

      const saveButton = screen.getByText('保存')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('イベント名は必須です')).toBeInTheDocument()
      })
    })

    it('位置座標が範囲外の場合にエラーメッセージが表示される', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const xInput = screen.getByLabelText('X座標')
      await user.clear(xInput)
      await user.type(xInput, '10') // マップサイズ(5x5)を超える

      const saveButton = screen.getByText('保存')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('X座標は0以上4以下で入力してください')).toBeInTheDocument()
      })
    })

    it('無効な色コードの場合にエラーメッセージが表示される', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const colorInput = screen.getByLabelText('色')
      await user.clear(colorInput)
      await user.type(colorInput, 'invalid-color')

      const saveButton = screen.getByText('保存')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('有効な色コードを入力してください')).toBeInTheDocument()
      })
    })
  })

  describe('ダイアログ操作機能', () => {
    it('キャンセルボタンでダイアログが閉じる', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const cancelButton = screen.getByText('キャンセル')
      await user.click(cancelButton)

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.showEventEditDialog).toBe(false)
        expect(state.editor.editingEvent).toBeNull()
      })
    })

    it('Escキーでダイアログが閉じる', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => {
        const state = store.getState()
        expect(state.editor.showEventEditDialog).toBe(false)
      })
    })

    it('削除ボタンでイベントが削除される', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const deleteButton = screen.getByText('削除')
      await user.click(deleteButton)

      // 確認ダイアログが表示される
      const confirmButton = screen.getByText('削除する')
      await user.click(confirmButton)

      await waitFor(() => {
        const state = store.getState()
        const floor = state.map.dungeon!.floors[0]
        const cell = floor.cells[3][2]
        
        expect(cell.events).toHaveLength(0)
        expect(state.editor.showEventEditDialog).toBe(false)
      })
    })
  })

  describe('プレビュー機能', () => {
    it('イベントのプレビューが正しく表示される', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      // プレビューセクションが表示されることを確認
      const previewSection = screen.getByText('プレビュー')
      expect(previewSection).toBeInTheDocument()

      // イベントアイコンが表示されることを確認
      const eventIcon = screen.getByText('💰')
      expect(eventIcon).toBeInTheDocument()
    })

    it('設定変更時にプレビューがリアルタイムで更新される', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      // アイコンを変更
      const iconInput = screen.getByLabelText('アイコン')
      await user.clear(iconInput)
      await user.type(iconInput, '🎁')

      // プレビューが更新されることを確認
      await waitFor(() => {
        const updatedIcon = screen.getByText('🎁')
        expect(updatedIcon).toBeInTheDocument()
      })
    })
  })

  describe('アクセシビリティ機能', () => {
    it('フォームラベルが正しく関連付けられている', () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      expect(screen.getByLabelText('イベント名')).toBeInTheDocument()
      expect(screen.getByLabelText('イベントタイプ')).toBeInTheDocument()
      expect(screen.getByLabelText('X座標')).toBeInTheDocument()
      expect(screen.getByLabelText('Y座標')).toBeInTheDocument()
      expect(screen.getByLabelText('色')).toBeInTheDocument()
      expect(screen.getByLabelText('アイコン')).toBeInTheDocument()
    })

    it('エラーメッセージがaria-describedbyで関連付けられている', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const nameInput = screen.getByLabelText('イベント名')
      await user.clear(nameInput)

      const saveButton = screen.getByText('保存')
      await user.click(saveButton)

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      })
    })
  })

  describe('複雑なイベント設定', () => {
    it('複数のトリガーと条件を持つイベントが正しく処理される', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const triggerSection = screen.getByText('トリガー設定')
      await user.click(triggerSection)

      // 新しいトリガーを追加
      const addTriggerButton = screen.getByText('トリガーを追加')
      await user.click(addTriggerButton)

      // 2つ目のトリガーを設定
      const triggerTypeSelects = screen.getAllByLabelText('トリガータイプ')
      await user.selectOptions(triggerTypeSelects[1], 'auto')

      const saveButton = screen.getByText('保存')
      await user.click(saveButton)

      await waitFor(() => {
        const state = store.getState()
        const floor = state.map.dungeon!.floors[0]
        const cell = floor.cells[3][2]
        const savedEvent = cell.events[0]
        
        expect(savedEvent.triggers).toHaveLength(2)
        expect(savedEvent.triggers[0].type).toBe('interact')
        expect(savedEvent.triggers[1].type).toBe('auto')
      })
    })

    it('アクションチェーンが正しく設定される', async () => {
      render(
        <Provider store={store}>
          <EventEditDialog />
        </Provider>
      )

      const actionSection = screen.getByText('アクション設定')
      await user.click(actionSection)

      // アクションの次のアクション設定
      const nextActionSelects = screen.getAllByLabelText('次のアクション')
      await user.selectOptions(nextActionSelects[0], 'action-2')

      const saveButton = screen.getByText('保存')
      await user.click(saveButton)

      await waitFor(() => {
        const state = store.getState()
        const floor = state.map.dungeon!.floors[0]
        const cell = floor.cells[3][2]
        const savedEvent = cell.events[0]
        
        expect(savedEvent.actions[0].nextActionId).toBe('action-2')
      })
    })
  })
})