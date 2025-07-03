import { describe, it, expect, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import mapReducer, { 
  createNewDungeon, 
  updateCell, 
  updateCells, 
  placeTemplate,
  undo, 
  redo,
  addEventToCell,
  removeEventFromCell
} from '../mapSlice'
import { Dungeon, Cell, Template } from '../../types/map'

describe('mapSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        map: mapReducer
      }
    })
  })

  describe('createNewDungeon', () => {
    it('新しいダンジョンを作成できる', () => {
      const dungeonData = {
        name: 'テストダンジョン',
        author: 'テスター',
        width: 5,
        height: 5
      }

      store.dispatch(createNewDungeon(dungeonData))
      const state = store.getState().map

      expect(state.dungeon).toBeDefined()
      expect(state.dungeon?.name).toBe('テストダンジョン')
      expect(state.dungeon?.author).toBe('テスター')
      expect(state.dungeon?.floors[0].width).toBe(5)
      expect(state.dungeon?.floors[0].height).toBe(5)
      expect(state.history).toHaveLength(1)
      expect(state.historyIndex).toBe(0)
    })

    it('セルが正しく初期化される', () => {
      store.dispatch(createNewDungeon({
        name: 'テスト',
        author: 'テスター',
        width: 3,
        height: 3
      }))

      const state = store.getState().map
      const cells = state.dungeon?.floors[0].cells

      expect(cells).toHaveLength(3)
      expect(cells?.[0]).toHaveLength(3)
      
      const firstCell = cells?.[0][0]
      expect(firstCell?.x).toBe(0)
      expect(firstCell?.y).toBe(0)
      expect(firstCell?.floor.type).toBe('normal')
      expect(firstCell?.floor.passable).toBe(true)
      expect(firstCell?.walls.north).toBeNull()
      expect(firstCell?.events).toEqual([])
    })
  })

  describe('updateCell', () => {
    beforeEach(() => {
      store.dispatch(createNewDungeon({
        name: 'テスト',
        author: 'テスター',
        width: 3,
        height: 3
      }))
    })

    it('セルを更新できる', () => {
      const cellUpdate = {
        floorIndex: 0,
        position: { x: 1, y: 1 },
        cell: {
          floor: { type: 'damage' as const, passable: true },
          walls: {
            north: { type: 'door' as const, transparent: false },
            east: null,
            south: null,
            west: null
          }
        }
      }

      store.dispatch(updateCell(cellUpdate))
      const state = store.getState().map
      const updatedCell = state.dungeon?.floors[0].cells[1][1]

      expect(updatedCell?.floor.type).toBe('damage')
      expect(updatedCell?.walls.north?.type).toBe('door')
      expect(state.history).toHaveLength(2) // 初期 + 更新
    })
  })

  describe('updateCells (batch update)', () => {
    beforeEach(() => {
      store.dispatch(createNewDungeon({
        name: 'テスト',
        author: 'テスター',
        width: 3,
        height: 3
      }))
    })

    it('複数セルを一括更新できる', () => {
      const cellUpdates = {
        floorIndex: 0,
        updates: [
          {
            position: { x: 0, y: 0 },
            cell: { floor: { type: 'damage' as const, passable: true } }
          },
          {
            position: { x: 1, y: 1 },
            cell: { floor: { type: 'slippery' as const, passable: true } }
          }
        ]
      }

      store.dispatch(updateCells(cellUpdates))
      const state = store.getState().map
      const cells = state.dungeon?.floors[0].cells

      expect(cells?.[0][0].floor.type).toBe('damage')
      expect(cells?.[1][1].floor.type).toBe('slippery')
      expect(state.history).toHaveLength(2) // バッチ更新は1回の履歴
    })
  })

  describe('undo/redo機能', () => {
    beforeEach(() => {
      store.dispatch(createNewDungeon({
        name: 'テスト',
        author: 'テスター',
        width: 3,
        height: 3
      }))
    })

    it('undo/redoが正しく動作する', () => {
      // 初期状態
      const initialState = store.getState().map.dungeon

      // セルを更新
      store.dispatch(updateCell({
        floorIndex: 0,
        position: { x: 0, y: 0 },
        cell: { floor: { type: 'damage', passable: true } }
      }))

      let state = store.getState().map
      expect(state.dungeon?.floors[0].cells[0][0].floor.type).toBe('damage')
      expect(state.historyIndex).toBe(1)

      // Undo
      store.dispatch(undo())
      state = store.getState().map
      expect(state.dungeon?.floors[0].cells[0][0].floor.type).toBe('normal')
      expect(state.historyIndex).toBe(0)

      // Redo
      store.dispatch(redo())
      state = store.getState().map
      expect(state.dungeon?.floors[0].cells[0][0].floor.type).toBe('damage')
      expect(state.historyIndex).toBe(1)
    })

    it('履歴の上限が正しく管理される', () => {
      // 60回更新（上限50を超える）
      for (let i = 0; i < 60; i++) {
        store.dispatch(updateCell({
          floorIndex: 0,
          position: { x: 0, y: 0 },
          cell: { floor: { type: 'normal', passable: true } }
        }))
      }

      const state = store.getState().map
      expect(state.history.length).toBeLessThanOrEqual(50)
    })
  })

  describe('テンプレート配置', () => {
    let template: Template

    beforeEach(() => {
      store.dispatch(createNewDungeon({
        name: 'テスト',
        author: 'テスター',
        width: 5,
        height: 5
      }))

      template = {
        id: 'test-template',
        name: 'テストテンプレート',
        description: 'テスト用',
        category: 'room',
        size: { width: 2, height: 2 },
        cells: [
          [
            {
              floor: { type: 'normal', passable: true },
              walls: { north: { type: 'normal', transparent: false }, east: null, south: null, west: null },
              events: [],
              decorations: []
            },
            {
              floor: { type: 'damage', passable: true },
              walls: { north: null, east: null, south: null, west: null },
              events: [],
              decorations: []
            }
          ],
          [
            {
              floor: { type: 'normal', passable: true },
              walls: { north: null, east: null, south: null, west: null },
              events: [],
              decorations: []
            },
            {
              floor: { type: 'normal', passable: true },
              walls: { north: null, east: null, south: null, west: null },
              events: [],
              decorations: []
            }
          ]
        ],
        tags: ['test'],
        createdAt: new Date().toISOString(),
        isBuiltIn: true
      }
    })

    it('テンプレートを配置できる', () => {
      store.dispatch(placeTemplate({
        template,
        position: { x: 1, y: 1 },
        floorIndex: 0
      }))

      const state = store.getState().map
      const cells = state.dungeon?.floors[0].cells

      // テンプレートが正しく配置されているか確認
      expect(cells?.[1][1].walls.north?.type).toBe('normal')
      expect(cells?.[1][2].floor.type).toBe('damage')
    })

    it('範囲外への配置は無視される', () => {
      const initialState = store.getState().map.dungeon

      store.dispatch(placeTemplate({
        template,
        position: { x: 4, y: 4 }, // 5x5マップに2x2テンプレートは配置不可
        floorIndex: 0
      }))

      const state = store.getState().map
      expect(state.dungeon).toEqual(initialState) // 変更されない
    })
  })

  describe('イベント管理', () => {
    beforeEach(() => {
      store.dispatch(createNewDungeon({
        name: 'テスト',
        author: 'テスター',
        width: 3,
        height: 3
      }))
    })

    it('イベントを追加できる', () => {
      const event = {
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

      store.dispatch(addEventToCell({
        x: 1,
        y: 1,
        event
      }))

      const state = store.getState().map
      const cell = state.dungeon?.floors[0].cells[1][1]
      expect(cell?.events).toHaveLength(1)
      expect(cell?.events[0].name).toBe('テストイベント')
    })

    it('イベントを削除できる', () => {
      // まずイベントを追加
      const event = {
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

      store.dispatch(addEventToCell({
        x: 1,
        y: 1,
        event
      }))

      // イベントを削除
      store.dispatch(removeEventFromCell({
        x: 1,
        y: 1,
        eventId: 'test-event'
      }))

      const state = store.getState().map
      const cell = state.dungeon?.floors[0].cells[1][1]
      expect(cell?.events).toHaveLength(0)
    })
  })
})