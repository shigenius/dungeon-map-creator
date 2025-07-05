import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'
import LeftPanel from '../LeftPanel'
import mapReducer from '../../store/mapSlice'
import editorReducer from '../../store/editorSlice'

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
})

describe('LeftPanel統合テスト', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        map: mapReducer,
        editor: editorReducer
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: ['map/placeTemplate'],
            ignoredPaths: ['payload.template.createdAt'],
          },
        }),
    })
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          {component}
        </ThemeProvider>
      </Provider>
    )
  }

  it('初期状態で正しく表示される', () => {
    renderWithProviders(<LeftPanel />)
    
    expect(screen.getByText('編集中:')).toBeInTheDocument()
    expect(screen.getByText('床レイヤー')).toBeInTheDocument()
    expect(screen.getByText('プロジェクトを作成してください')).toBeInTheDocument()
  })

  it('ダンジョンを作成すると床タイプ選択が有効になる', async () => {
    renderWithProviders(<LeftPanel />)

    // ダンジョンを作成
    store.dispatch({
      type: 'map/createNewDungeon',
      payload: {
        name: 'テストダンジョン',
        author: 'テスター',
        width: 5,
        height: 5
      }
    })

    await waitFor(() => {
      expect(screen.getByText('床タイプ選択')).toBeInTheDocument()
    })

    // 床タイプボタンがクリック可能になる
    const normalFloorButton = screen.getByText('通常')
    expect(normalFloorButton.closest('button')).not.toBeDisabled()
  })

  it('床タイプを選択すると状態が更新される', async () => {
    renderWithProviders(<LeftPanel />)

    // ダンジョンを作成
    store.dispatch({
      type: 'map/createNewDungeon',
      payload: {
        name: 'テストダンジョン',
        author: 'テスター',
        width: 5,
        height: 5
      }
    })

    await waitFor(() => {
      const damageFloorButton = screen.getByText('ダメージ')
      fireEvent.click(damageFloorButton)
    })

    // editorSliceの状態が更新されることを確認
    const state = store.getState()
    expect(state.editor.selectedFloorType).toBe('damage')
    expect(state.editor.selectedTool).toBe('pen')
  })

  it('レイヤーを切り替えると表示内容が変わる', async () => {
    renderWithProviders(<LeftPanel />)

    // ダンジョンを作成
    store.dispatch({
      type: 'map/createNewDungeon',
      payload: {
        name: 'テストダンジョン',
        author: 'テスター',
        width: 5,
        height: 5
      }
    })

    // 壁レイヤーに切り替え
    store.dispatch({
      type: 'editor/setSelectedLayer',
      payload: 'walls'
    })

    await waitFor(() => {
      expect(screen.getByText('壁レイヤー')).toBeInTheDocument()
      expect(screen.getByText('壁タイプ選択')).toBeInTheDocument()
      expect(screen.getByText('通常壁')).toBeInTheDocument()
    })
  })

  it('イベントレイヤーでイベント管理が表示される', async () => {
    renderWithProviders(<LeftPanel />)

    // ダンジョンを作成
    store.dispatch({
      type: 'map/createNewDungeon',
      payload: {
        name: 'テストダンジョン',
        author: 'テスター',
        width: 5,
        height: 5
      }
    })

    // イベントレイヤーに切り替え
    store.dispatch({
      type: 'editor/setSelectedLayer',
      payload: 'events'
    })

    await waitFor(() => {
      expect(screen.getByText('イベントレイヤー')).toBeInTheDocument()
      expect(screen.getByText('イベント管理')).toBeInTheDocument()
      expect(screen.getByText('新しいイベント')).toBeInTheDocument()
      expect(screen.getByText('イベントテンプレート選択')).toBeInTheDocument()
    })
  })

  it('イベントを追加すると一覧に表示される', async () => {
    renderWithProviders(<LeftPanel />)

    // ダンジョンを作成
    store.dispatch({
      type: 'map/createNewDungeon',
      payload: {
        name: 'テストダンジョン',
        author: 'テスター',
        width: 5,
        height: 5
      }
    })

    // イベントレイヤーに切り替え
    store.dispatch({
      type: 'editor/setSelectedLayer',
      payload: 'events'
    })

    // イベントを追加
    const testEvent = {
      id: 'test-event',
      name: 'テストイベント',
      type: 'treasure' as const,
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

    store.dispatch({
      type: 'map/addEventToCell',
      payload: {
        x: 1,
        y: 1,
        event: testEvent
      }
    })

    await waitFor(() => {
      expect(screen.getByText('テストイベント')).toBeInTheDocument()
      expect(screen.getByText('(1, 1) treasure')).toBeInTheDocument()
      expect(screen.getByText('イベント数: 1')).toBeInTheDocument()
    })
  })

  it('装飾レイヤーで装飾タイプ選択が表示される', async () => {
    renderWithProviders(<LeftPanel />)

    // ダンジョンを作成
    store.dispatch({
      type: 'map/createNewDungeon',
      payload: {
        name: 'テストダンジョン',
        author: 'テスター',
        width: 5,
        height: 5
      }
    })

    // 装飾レイヤーに切り替え
    store.dispatch({
      type: 'editor/setSelectedLayer',
      payload: 'decorations'
    })

    await waitFor(() => {
      expect(screen.getByText('装飾レイヤー')).toBeInTheDocument()
      expect(screen.getByText('装飾タイプ選択')).toBeInTheDocument()
      expect(screen.getByText('家具')).toBeInTheDocument()
      expect(screen.getByText('彫像')).toBeInTheDocument()
    })
  })

  it('キャプチャされたセル情報が表示される', async () => {
    renderWithProviders(<LeftPanel />)

    // ダンジョンを作成
    store.dispatch({
      type: 'map/createNewDungeon',
      payload: {
        name: 'テストダンジョン',
        author: 'テスター',
        width: 5,
        height: 5
      }
    })

    // セル情報をキャプチャ
    store.dispatch({
      type: 'editor/setCapturedCellData',
      payload: {
        floor: { type: 'damage', passable: true },
        walls: {
          north: { type: 'door', transparent: false },
          east: null,
          south: null,
          west: null
        },
        hasEvents: false
      }
    })

    await waitFor(() => {
      expect(screen.getByText('キャプチャされたセル')).toBeInTheDocument()
      expect(screen.getByText('ダメージ')).toBeInTheDocument()
      expect(screen.getByText('扉')).toBeInTheDocument()
      expect(screen.getByText('イベントなし')).toBeInTheDocument()
    })
  })
})