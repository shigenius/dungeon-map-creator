export type FloorType = 
  | 'normal'      // 通常床
  | 'damage'      // ダメージ床
  | 'slippery'    // 滑る床
  | 'pit'         // 落とし穴
  | 'oneway'      // 一方通行床
  | 'switch'      // スイッチ床
  | 'warp'        // ワープ床
  | 'rotate'      // 回転床

export type WallType = 
  | 'normal'      // 通常壁
  | 'door'        // 扉
  | 'locked_door' // 鍵付き扉
  | 'hidden_door' // 隠し扉
  | 'breakable'   // 破壊可能壁
  | 'oneway'      // 片面壁
  | 'invisible'   // 透明壁
  | 'event'       // イベント壁

export type EventType = 
  | 'treasure'    // 宝箱
  | 'npc'         // NPC
  | 'stairs'      // 階段
  | 'enemy'       // シンボルエンカウント
  | 'save'        // セーブポイント
  | 'heal'        // 回復ポイント
  | 'switch'      // スイッチ
  | 'sign'        // 看板
  | 'harvest'     // 採取ポイント
  | 'custom'      // カスタムイベント

export type Direction = 'north' | 'east' | 'south' | 'west'

export interface Position {
  x: number
  y: number
}

export interface Floor {
  type: FloorType
  texture?: string
  passable: boolean
  properties?: Record<string, any>
}

export interface Wall {
  type: WallType
  texture?: string
  transparent: boolean
  properties?: Record<string, any>
}

export interface DungeonEvent {
  id: string
  type: EventType
  name: string
  position: Position
  appearance: {
    sprite?: string
    visible: boolean
  }
  trigger: {
    type: 'auto' | 'interact' | 'contact' | 'item' | 'step' | 'time' | 'flag' | 'random'
    params?: Record<string, any>
  }
  actions: Array<{
    type: string
    params: Record<string, any>
  }>
  flags: Record<string, any>
  enabled: boolean
}

export interface Cell {
  x: number
  y: number
  floor: Floor
  walls: {
    north: Wall | null
    east: Wall | null
    south: Wall | null
    west: Wall | null
  }
  events: DungeonEvent[]
  decorations: any[]
  properties: Record<string, any>
}

export interface DungeonFloor {
  id: string
  name: string
  width: number
  height: number
  cells: Cell[][]
  environment: {
    lighting: {
      ambient: number
      sources: any[]
    }
    ceiling: {
      height: number
      texture?: string
    }
    audio: {
      bgm?: string
      ambient?: string
    }
  }
}

export interface Dungeon {
  id: string
  name: string
  author: string
  version: string
  floors: DungeonFloor[]
  resources: {
    textures: Record<string, string>
    sprites: Record<string, string>
    audio: Record<string, string>
  }
  metadata: {
    created: string
    modified: string
    description?: string
  }
}

export interface MapEditorState {
  currentFloor: number
  selectedTool: DrawingTool
  selectedLayer: Layer
  zoom: number
  gridVisible: boolean
  coordinatesVisible: boolean
  viewMode: ViewMode
}

export type DrawingTool = 'pen' | 'rectangle' | 'fill' | 'eyedropper' | 'select'
export type Layer = 'floor' | 'walls' | 'events' | 'decorations'
export type ViewMode = '2d' | '3d' | 'preview'