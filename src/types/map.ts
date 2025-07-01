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

export type TriggerType = 
  | 'auto'      // 自動実行
  | 'interact'  // 調べる
  | 'contact'   // 接触
  | 'item'      // アイテム使用
  | 'step'      // 踏む
  | 'time'      // 時間経過
  | 'flag'      // フラグ条件
  | 'random'    // ランダム
  | 'battle'    // 戦闘後
  | 'combo'     // 複合条件

export type ActionType = 
  | 'message'      // メッセージ表示
  | 'treasure'     // 宝箱開封
  | 'battle'       // 戦闘開始
  | 'move'         // 移動
  | 'warp'         // ワープ
  | 'heal'         // 回復
  | 'damage'       // ダメージ
  | 'item'         // アイテム取得/使用
  | 'flag'         // フラグ操作
  | 'shop'         // ショップ開始
  | 'save'         // セーブ
  | 'sound'        // 効果音
  | 'cutscene'     // カットシーン
  | 'conditional'  // 条件分岐
  | 'loop'         // ループ
  | 'custom'       // カスタムアクション

export interface EventTrigger {
  type: TriggerType
  conditions?: Array<{
    type: 'flag' | 'item' | 'level' | 'time' | 'random' | 'custom'
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'has' | 'not_has'
    key?: string
    value?: any
    probability?: number // for random
  }>
  repeatPolicy: {
    type: 'once' | 'always' | 'daily' | 'count'
    maxCount?: number
  }
}

export interface EventAction {
  id: string
  type: ActionType
  params: Record<string, any>
  conditions?: Array<{
    type: 'flag' | 'item' | 'level' | 'random' | 'custom'
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'has' | 'not_has'
    key?: string
    value?: any
    probability?: number
  }>
  nextActionId?: string // アクションチェーン用
  branchActions?: Array<{
    conditionId: string
    actionId: string
  }>
}

export interface DungeonEvent {
  id: string
  type: EventType
  name: string
  description?: string
  position: Position
  appearance: {
    sprite?: string
    visible: boolean
    color?: string
    icon?: string
  }
  trigger: EventTrigger
  actions: EventAction[]
  flags: Record<string, any>
  enabled: boolean
  priority: number // 実行優先度
  metadata: {
    created: string
    modified: string
    author?: string
    version: number
  }
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

export type DrawingTool = 'pen' | 'rectangle' | 'fill' | 'eyedropper' | 'select' | 'eraser'
export type Layer = 'floor' | 'walls' | 'events' | 'decorations'
export type ViewMode = '2d' | '3d' | 'preview'