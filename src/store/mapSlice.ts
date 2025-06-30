import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Dungeon, Cell, Position } from '../types/map'

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
      state.history = [structuredClone(newDungeon)]
      state.historyIndex = 0
    },
    
    loadDungeon: (state, action: PayloadAction<Dungeon>) => {
      state.dungeon = action.payload
      state.history = [structuredClone(action.payload)]
      state.historyIndex = 0
    },
    
    updateCell: (state, action: PayloadAction<{ floorIndex: number; position: Position; cell: Partial<Cell> }>) => {
      if (!state.dungeon) return
      
      const { floorIndex, position, cell } = action.payload
      const floor = state.dungeon.floors[floorIndex]
      if (!floor || position.y >= floor.height || position.x >= floor.width) return
      
      Object.assign(floor.cells[position.y][position.x], cell)
      state.dungeon.metadata.modified = new Date().toISOString()
      
      // 履歴に追加
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(structuredClone(state.dungeon))
      
      if (newHistory.length > state.maxHistory) {
        newHistory.shift()
      } else {
        state.historyIndex++
      }
      
      state.history = newHistory
    },
    
    undo: (state) => {
      if (state.historyIndex > 0) {
        state.historyIndex--
        state.dungeon = structuredClone(state.history[state.historyIndex])
      }
    },
    
    redo: (state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++
        state.dungeon = structuredClone(state.history[state.historyIndex])
      }
    },
  },
})

export const { createNewDungeon, loadDungeon, updateCell, undo, redo } = mapSlice.actions
export default mapSlice.reducer