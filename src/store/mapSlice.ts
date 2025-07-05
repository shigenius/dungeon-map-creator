import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Dungeon, Cell, Position, DungeonEvent, TemplateCategory, Template, Decoration } from '../types/map'
import { rotateTemplate as rotateTemplateUtil } from '../utils/templateUtils'

interface MapState {
  dungeon: Dungeon | null
  history: Dungeon[]
  historyIndex: number
  maxHistory: number
}

const initialState: MapState = {
  dungeon: null,
  history: [],
  historyIndex: -1,
  maxHistory: 50,
}

// ヘルパー関数：最適化された履歴管理
const addToHistoryHelper = (state: MapState) => {
  if (!state.dungeon) return
  
  state.dungeon.metadata.modified = new Date().toISOString()
  
  // パフォーマンス最適化: シャローコピー + 改良されたディープコピー
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  
  try {
    // structuredCloneを試行し、失敗時はJSON方式にフォールバック
    let clonedDungeon: Dungeon
    
    if (typeof structuredClone === 'function') {
      try {
        clonedDungeon = structuredClone(state.dungeon)
      } catch (structuredCloneError) {
        // structuredCloneが失敗（DataCloneError等）の場合、JSON方式を使用
        console.warn('structuredClone failed, falling back to JSON method:', structuredCloneError)
        clonedDungeon = JSON.parse(JSON.stringify(state.dungeon))
      }
    } else {
      // structuredCloneが利用できない場合、JSON方式を使用
      clonedDungeon = JSON.parse(JSON.stringify(state.dungeon))
    }
    
    newHistory.push(clonedDungeon)
  } catch (error) {
    // 全てのコピー方法が失敗した場合は履歴追加をスキップ
    console.warn('All cloning methods failed, skipping history:', error)
    return
  }
  
  if (newHistory.length > state.maxHistory) {
    newHistory.shift()
  } else {
    state.historyIndex++
  }
  
  state.history = newHistory
}

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    createNewDungeon: (state, action: PayloadAction<{ name: string; author: string; width: number; height: number }>) => {
      const { name, author, width, height } = action.payload
      const newDungeon: Dungeon = {
        id: crypto.randomUUID(),
        name,
        author,
        version: '1.0.0',
        floors: [{
          id: crypto.randomUUID(),
          name: 'フロア1',
          width,
          height,
          cells: Array.from({ length: height }, (_, y) =>
            Array.from({ length: width }, (_, x) => ({
              x,
              y,
              floor: {
                type: 'normal',
                passable: true,
              },
              walls: {
                north: null,
                east: null,
                south: null,
                west: null,
              },
              events: [],
              decorations: [],
              properties: {},
            }))
          ),
          environment: {
            lighting: {
              ambient: 0.5,
              sources: [],
            },
            ceiling: {
              height: 3,
            },
            audio: {},
          },
        }],
        resources: {
          textures: {},
          sprites: {},
          audio: {},
        },
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
      }
      
      state.dungeon = newDungeon
      // 初期化時は最適化されたコピーを使用
      try {
        let clonedDungeon: Dungeon
        if (typeof structuredClone === 'function') {
          try {
            clonedDungeon = structuredClone(newDungeon)
          } catch (structuredCloneError) {
            console.warn('structuredClone failed during initialization, falling back to JSON method:', structuredCloneError)
            clonedDungeon = JSON.parse(JSON.stringify(newDungeon))
          }
        } else {
          clonedDungeon = JSON.parse(JSON.stringify(newDungeon))
        }
        state.history = [clonedDungeon]
      } catch (error) {
        console.warn('Failed to initialize history:', error)
        state.history = []
      }
      state.historyIndex = 0
    },
    
    loadDungeon: (state, action: PayloadAction<Dungeon>) => {
      state.dungeon = action.payload
      // ロード時は最適化されたコピーを使用
      try {
        let clonedDungeon: Dungeon
        if (typeof structuredClone === 'function') {
          try {
            clonedDungeon = structuredClone(action.payload)
          } catch (structuredCloneError) {
            console.warn('structuredClone failed during load, falling back to JSON method:', structuredCloneError)
            clonedDungeon = JSON.parse(JSON.stringify(action.payload))
          }
        } else {
          clonedDungeon = JSON.parse(JSON.stringify(action.payload))
        }
        state.history = [clonedDungeon]
      } catch (error) {
        console.warn('Failed to initialize history on load:', error)
        state.history = []
      }
      state.historyIndex = 0
    },
    
    updateCells: (state, action: PayloadAction<{ floorIndex: number; updates: Array<{ position: Position; cell: Partial<Cell> }> }>) => {
      if (!state.dungeon) return
      
      const { floorIndex, updates } = action.payload
      const floor = state.dungeon.floors[floorIndex]
      
      if (!floor) return
      
      // バッチでセルを更新
      updates.forEach(({ position, cell }) => {
        if (position.y >= floor.height || position.x >= floor.width) return
        Object.assign(floor.cells[position.y][position.x], cell)
      })
      
      // 最適化された履歴管理を使用
      addToHistoryHelper(state)
    },

    updateCell: (state, action: PayloadAction<{ floorIndex: number; position: Position; cell: Partial<Cell> }>) => {
      if (!state.dungeon) return
      
      const { floorIndex, position, cell } = action.payload
      const floor = state.dungeon.floors[floorIndex]
      
      if (!floor) return
      if (position.y >= floor.height || position.x >= floor.width) return
      
      Object.assign(floor.cells[position.y][position.x], cell)
      
      // 最適化された履歴管理を使用
      addToHistoryHelper(state)
    },
    
    undo: (state) => {
      if (state.historyIndex > 0) {
        state.historyIndex--
        state.dungeon = JSON.parse(JSON.stringify(state.history[state.historyIndex]))
      }
    },
    
    redo: (state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++
        state.dungeon = JSON.parse(JSON.stringify(state.history[state.historyIndex]))
      }
    },

    placeTemplate: (state, action: PayloadAction<{ template: Template; position?: Position; floorIndex: number; rotation?: 0 | 90 | 180 | 270 }>) => {
      if (!state.dungeon) return
      
      const { template: inputTemplate, position, floorIndex, rotation = 0 } = action.payload
      const floor = state.dungeon.floors[floorIndex]
      if (!floor) return
      
      console.log('placeTemplate実行:', {
        templateName: inputTemplate.name,
        templateId: inputTemplate.id,
        rotation,
        position
      })
      
      // 渡されたテンプレートを使用
      let template = inputTemplate
      
      // テンプレートを指定角度回転
      if (rotation !== 0) {
        console.log(`テンプレートを${rotation}度回転します`)
        template = rotateTemplateUtil(template, rotation)
        console.log('回転後のテンプレートサイズ:', {
          beforeSize: { width: inputTemplate.size.width, height: inputTemplate.size.height },
          afterSize: { width: template.size.width, height: template.size.height }
        })
      } else {
        console.log('テンプレート回転なし（rotation = 0）')
      }

      // マップ全体テンプレートの判定
      const isFullMapTemplate = template.isFullMap || template.category === 'fullmap'
      
      if (isFullMapTemplate) {
        // マップ全体を置き換え
        // マップサイズをテンプレートに合わせて変更
        floor.width = template.size.width
        floor.height = template.size.height
        
        // 新しいセル配列を作成
        const newCells = []
        for (let y = 0; y < template.size.height; y++) {
          const row = []
          for (let x = 0; x < template.size.width; x++) {
            const templateCell = template.cells[y][x]
            row.push({
              x,
              y,
              floor: { ...templateCell.floor },
              walls: {
                north: templateCell.walls.north ? { ...templateCell.walls.north } : null,
                east: templateCell.walls.east ? { ...templateCell.walls.east } : null,
                south: templateCell.walls.south ? { ...templateCell.walls.south } : null,
                west: templateCell.walls.west ? { ...templateCell.walls.west } : null,
              },
              events: [...templateCell.events],
              decorations: [...templateCell.decorations],
              properties: {}
            })
          }
          newCells.push(row)
        }
        
        floor.cells = newCells
      } else {
        // 通常の部分的テンプレート配置
        if (!position) return
        
        // テンプレートの範囲がマップ内に収まるかチェック
        const endX = position.x + template.size.width
        const endY = position.y + template.size.height
        if (endX > floor.width || endY > floor.height) return

        // テンプレートのセルを配置
        for (let ty = 0; ty < template.size.height; ty++) {
          for (let tx = 0; tx < template.size.width; tx++) {
            const mapX = position.x + tx
            const mapY = position.y + ty
            const templateCell = template.cells[ty][tx]
            
            if (mapX < floor.width && mapY < floor.height) {
              const targetCell = floor.cells[mapY][mapX]
              
              // テンプレートのセルデータをマップのセルにコピー
              targetCell.floor = { ...templateCell.floor }
              targetCell.walls = {
                north: templateCell.walls.north ? { ...templateCell.walls.north } : null,
                east: templateCell.walls.east ? { ...templateCell.walls.east } : null,
                south: templateCell.walls.south ? { ...templateCell.walls.south } : null,
                west: templateCell.walls.west ? { ...templateCell.walls.west } : null,
              }
              targetCell.events = [...templateCell.events]
              targetCell.decorations = [...templateCell.decorations]
            }
          }
        }
      }

      // 履歴に追加
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(state.dungeon)))
      
      if (newHistory.length > state.maxHistory) {
        newHistory.shift()
      } else {
        state.historyIndex++
      }
      
      state.history = newHistory
    },

    // イベント関連のアクション
    addEventToCell: (state, action: PayloadAction<{ x: number; y: number; event: DungeonEvent; floorIndex?: number }>) => {
      if (!state.dungeon) return
      
      const { x, y, event, floorIndex = 0 } = action.payload
      const cell = state.dungeon.floors[floorIndex]?.cells[y]?.[x]
      if (cell) {
        console.log('addEventToCell実行:', {
          position: { x, y },
          eventId: event.id,
          eventName: event.name,
          currentEventsInCell: cell.events.length,
          currentEventIds: cell.events.map(e => e.id)
        })
        
        // イベントの位置をセルの座標に合わせる
        const eventWithPosition = { ...event, position: { x, y } }
        cell.events.push(eventWithPosition)
        
        console.log('addEventToCell完了:', {
          newEventsInCell: cell.events.length,
          newEventIds: cell.events.map(e => e.id)
        })
        
        // 履歴に追加
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push(JSON.parse(JSON.stringify(state.dungeon)))
        
        if (newHistory.length > state.maxHistory) {
          newHistory.shift()
        } else {
          state.historyIndex++
        }
        
        state.history = newHistory
      }
    },

    updateEventInCell: (state, action: PayloadAction<{ oldX: number; oldY: number; newX: number; newY: number; event: DungeonEvent; floorIndex?: number }>) => {
      if (!state.dungeon) return
      
      const { oldX, oldY, newX, newY, event, floorIndex = 0 } = action.payload
      
      // 古い位置からイベントを削除
      const oldCell = state.dungeon.floors[floorIndex]?.cells[oldY]?.[oldX]
      if (oldCell) {
        const eventIndex = oldCell.events.findIndex(e => e.id === event.id)
        if (eventIndex !== -1) {
          oldCell.events.splice(eventIndex, 1)
        }
      }
      
      // 新しい位置にイベントを追加
      const newCell = state.dungeon.floors[floorIndex]?.cells[newY]?.[newX]
      if (newCell) {
        const eventWithPosition = { ...event, position: { x: newX, y: newY } }
        newCell.events.push(eventWithPosition)
        
        // 履歴に追加
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push(JSON.parse(JSON.stringify(state.dungeon)))
        
        if (newHistory.length > state.maxHistory) {
          newHistory.shift()
        } else {
          state.historyIndex++
        }
        
        state.history = newHistory
      }
    },

    removeEventFromCell: (state, action: PayloadAction<{ x: number; y: number; eventId: string; floorIndex?: number }>) => {
      if (!state.dungeon) return
      
      const { x, y, eventId, floorIndex = 0 } = action.payload
      const cell = state.dungeon.floors[floorIndex]?.cells[y]?.[x]
      if (cell) {
        const beforeCount = cell.events.length
        const beforeIds = cell.events.map(e => e.id)
        
        cell.events = cell.events.filter(event => event.id !== eventId)
        
        const afterCount = cell.events.length
        const afterIds = cell.events.map(e => e.id)
        
        console.log(`削除処理: 座標(${x},${y}) 削除対象ID: ${eventId}`)
        console.log(`削除前: ${beforeCount}個 [${beforeIds.join(', ')}]`)
        console.log(`削除後: ${afterCount}個 [${afterIds.join(', ')}]`)
        console.log(`実際に削除された数: ${beforeCount - afterCount}`)
        
        // 履歴に追加
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push(JSON.parse(JSON.stringify(state.dungeon)))
        
        if (newHistory.length > state.maxHistory) {
          newHistory.shift()
        } else {
          state.historyIndex++
        }
        
        state.history = newHistory
      }
    },

    // 装飾関連のアクション
    addDecorationToCell: (state, action: PayloadAction<{ x: number; y: number; decoration: Decoration; floorIndex?: number }>) => {
      if (!state.dungeon) return
      
      const { x, y, decoration, floorIndex = 0 } = action.payload
      const cell = state.dungeon.floors[floorIndex]?.cells[y]?.[x]
      if (cell) {
        // 装飾の位置をセルの座標に合わせる
        const decorationWithPosition = { ...decoration, position: { x, y } }
        cell.decorations.push(decorationWithPosition)
        // 履歴に追加
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push(JSON.parse(JSON.stringify(state.dungeon)))
        
        if (newHistory.length > state.maxHistory) {
          newHistory.shift()
        } else {
          state.historyIndex++
        }
        
        state.history = newHistory
      }
    },

    updateDecorationInCell: (state, action: PayloadAction<{ x: number; y: number; decoration: Decoration; floorIndex?: number }>) => {
      if (!state.dungeon) return
      
      const { x, y, decoration, floorIndex = 0 } = action.payload
      const cell = state.dungeon.floors[floorIndex]?.cells[y]?.[x]
      if (cell) {
        const decorationIndex = cell.decorations.findIndex(d => d.id === decoration.id)
        if (decorationIndex !== -1) {
          // 装飾の位置をセルの座標に合わせる
          const decorationWithPosition = { ...decoration, position: { x, y } }
          cell.decorations[decorationIndex] = decorationWithPosition
          // 履歴に追加
          const newHistory = state.history.slice(0, state.historyIndex + 1)
          newHistory.push(JSON.parse(JSON.stringify(state.dungeon)))
          
          if (newHistory.length > state.maxHistory) {
            newHistory.shift()
          } else {
            state.historyIndex++
          }
          
          state.history = newHistory
        }
      }
    },

    removeDecorationFromCell: (state, action: PayloadAction<{ x: number; y: number; decorationId: string; floorIndex?: number }>) => {
      if (!state.dungeon) return
      
      const { x, y, decorationId, floorIndex = 0 } = action.payload
      const cell = state.dungeon.floors[floorIndex]?.cells[y]?.[x]
      if (cell) {
        cell.decorations = cell.decorations.filter(decoration => decoration.id !== decorationId)
        // 履歴に追加
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push(JSON.parse(JSON.stringify(state.dungeon)))
        
        if (newHistory.length > state.maxHistory) {
          newHistory.shift()
        } else {
          state.historyIndex++
        }
        
        state.history = newHistory
      }
    },

    // ユーザーテンプレート作成アクション
    createTemplateFromSelection: (state, action: PayloadAction<{ 
      floorIndex: number; 
      startPos: { x: number; y: number }; 
      endPos: { x: number; y: number };
      templateName: string;
      templateDescription?: string;
      templateCategory: TemplateCategory;
    }>) => {
      if (!state.dungeon) return
      
      const { floorIndex, startPos, endPos, templateName, templateDescription = '', templateCategory } = action.payload
      const floor = state.dungeon.floors[floorIndex]
      if (!floor) return
      
      // 選択範囲の正規化
      const minX = Math.min(startPos.x, endPos.x)
      const maxX = Math.max(startPos.x, endPos.x)
      const minY = Math.min(startPos.y, endPos.y)
      const maxY = Math.max(startPos.y, endPos.y)
      
      const width = maxX - minX + 1
      const height = maxY - minY + 1
      
      // テンプレートセルを作成
      const templateCells = []
      for (let y = 0; y < height; y++) {
        const row = []
        for (let x = 0; x < width; x++) {
          const sourceCell = floor.cells[minY + y]?.[minX + x]
          if (sourceCell) {
            row.push({
              floor: { ...sourceCell.floor },
              walls: {
                north: sourceCell.walls.north ? { ...sourceCell.walls.north } : null,
                east: sourceCell.walls.east ? { ...sourceCell.walls.east } : null,
                south: sourceCell.walls.south ? { ...sourceCell.walls.south } : null,
                west: sourceCell.walls.west ? { ...sourceCell.walls.west } : null,
              },
              events: [...sourceCell.events],
              decorations: [...sourceCell.decorations]
            })
          } else {
            // デフォルトセル
            row.push({
              floor: { type: 'normal' as const, passable: true },
              walls: { north: null, east: null, south: null, west: null },
              events: [],
              decorations: []
            })
          }
        }
        templateCells.push(row)
      }
      
      // テンプレートをリソースに保存（実際の実装では外部ストレージに保存）
      console.log('ユーザーテンプレートを作成しました:', {
        id: crypto.randomUUID(),
        name: templateName,
        description: templateDescription,
        category: templateCategory,
        size: { width, height },
        cells: templateCells,
        isCustom: true,
        author: state.dungeon.author,
        created: new Date().toISOString()
      })
    },

    // フロア管理アクション
    addFloor: (state, action: PayloadAction<{ name: string; width: number; height: number }>) => {
      if (!state.dungeon) return
      
      addToHistoryHelper(state)
      
      const { name, width, height } = action.payload
      const newFloor = {
        id: crypto.randomUUID(),
        name,
        width,
        height,
        cells: Array.from({ length: height }, (_, y) =>
          Array.from({ length: width }, (_, x) => ({
            x,
            y,
            floor: {
              type: 'normal' as const,
              passable: true,
            },
            walls: {
              north: null,
              east: null,
              south: null,
              west: null,
            },
            events: [],
            decorations: [],
            properties: {},
          }))
        ),
        environment: {
          lighting: {
            ambient: 0.5,
            sources: [],
          },
          ceiling: {
            height: 3,
            texture: 'normal',
          },
          audio: {
            bgm: undefined,
            ambient: undefined,
          },
        },
      }
      
      state.dungeon.floors.push(newFloor)
    },

    removeFloor: (state, action: PayloadAction<number>) => {
      if (!state.dungeon) return
      if (state.dungeon.floors.length <= 1) return // 最低1フロアは残す
      
      addToHistoryHelper(state)
      
      const floorIndex = action.payload
      if (floorIndex >= 0 && floorIndex < state.dungeon.floors.length) {
        state.dungeon.floors.splice(floorIndex, 1)
      }
    },

    renameFloor: (state, action: PayloadAction<{ floorIndex: number; newName: string }>) => {
      if (!state.dungeon) return
      
      addToHistoryHelper(state)
      
      const { floorIndex, newName } = action.payload
      const floor = state.dungeon.floors[floorIndex]
      if (floor) {
        floor.name = newName
      }
    },

    duplicateFloor: (state, action: PayloadAction<{ sourceFloorIndex: number; newName: string }>) => {
      if (!state.dungeon) return
      
      addToHistoryHelper(state)
      
      const { sourceFloorIndex, newName } = action.payload
      const sourceFloor = state.dungeon.floors[sourceFloorIndex]
      if (!sourceFloor) return
      
      const duplicatedFloor = {
        ...JSON.parse(JSON.stringify(sourceFloor)), // ディープコピー
        id: crypto.randomUUID(),
        name: newName,
      }
      
      state.dungeon.floors.push(duplicatedFloor)
    },
  },
})

export const { createNewDungeon, loadDungeon, updateCell, updateCells, undo, redo, placeTemplate, addEventToCell, updateEventInCell, removeEventFromCell, addDecorationToCell, updateDecorationInCell, removeDecorationFromCell, createTemplateFromSelection, addFloor, removeFloor, renameFloor, duplicateFloor } = mapSlice.actions
export default mapSlice.reducer