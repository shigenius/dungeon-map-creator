export type FloorType = 
  | 'normal'         // 通常床
  | 'damage'         // ダメージ床
  | 'slippery'       // 滑る床
  | 'pit'            // 落とし穴
  | 'oneway'         // 一方通行床
  | 'switch'         // スイッチ床
  | 'warp'           // ワープ床
  | 'rotate'         // 回転床
  | 'custom'         // カスタム床

export type WallType = 
  | 'normal'      // 通常壁
  | 'door'        // 扉
  | 'locked_door' // 鍵付き扉
  | 'hidden_door' // 隠し扉
  | 'breakable'   // 破壊可能壁
  | 'oneway'      // 片面壁
  | 'invisible'   // 透明壁
  | 'event'       // イベント壁
  | 'custom'      // カスタム壁

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

export type DecorationType = 
  | 'furniture'   // 家具
  | 'statue'      // 彫像
  | 'plant'       // 植物
  | 'torch'       // 松明
  | 'pillar'      // 柱
  | 'rug'         // 絨毯
  | 'painting'    // 絵画
  | 'crystal'     // クリスタル
  | 'rubble'      // 瓦礫
  | 'custom'      // カスタム装飾

export type Direction = 'north' | 'east' | 'south' | 'west'

// 装飾関連の型定義
export interface Decoration {
  id: string
  type: DecorationType
  name: string
  description?: string
  position: {
    x: number
    y: number
  }
  appearance: {
    visible: boolean
    color: string
    icon: string
    layer: number // 重ね順（0が最背面）
    rotation?: number // 回転角度（0-359）
    scale?: number // スケール（0.1-3.0、デフォルト1.0）
  }
  properties: Record<string, any>
  interactable?: boolean
  script?: string
}

// カスタムタイプ関連の型定義
export interface CustomFloorType {
  id: string
  name: string
  description: string
  color: string
  texture?: string
  passable: boolean
  properties: Record<string, any>
  effects?: Array<{
    type: 'damage' | 'heal' | 'teleport' | 'transform' | 'custom'
    value?: number
    targetX?: number
    targetY?: number
    targetFloor?: number
    script?: string
  }>
}

export interface CustomWallType {
  id: string
  name: string
  description: string
  color: string
  texture?: string
  transparent: boolean
  passable: boolean
  properties: Record<string, any>
  behavior?: {
    type: 'door' | 'switch' | 'breakable' | 'teleport' | 'custom'
    requiresKey?: string
    durability?: number
    script?: string
  }
}

// テンプレート関連の型定義
export type TemplateCategory = 
  | 'room'        // 部屋
  | 'corridor'    // 廊下
  | 'junction'    // 交差点
  | 'trap'        // トラップ
  | 'puzzle'      // パズル
  | 'decoration'  // 装飾
  | 'fullmap'     // マップ全体
  | 'custom'      // カスタム

export interface TemplateCell {
  floor: Floor
  walls: {
    north: Wall | null
    east: Wall | null
    south: Wall | null
    west: Wall | null
  }
  events: DungeonEvent[]
  decorations: Decoration[]
}

export interface Template {
  id: string
  name: string
  description: string
  category: TemplateCategory
  size: {
    width: number
    height: number
  }
  cells: TemplateCell[][]
  thumbnail?: string // Base64エンコードされた画像
  tags: string[]
  createdAt: string
  isBuiltIn: boolean // プリセットテンプレートかどうか
  isFullMap?: boolean // マップ全体を置き換えるテンプレートかどうか
}

export interface TemplateGroup {
  category: TemplateCategory
  name: string
  templates: Template[]
}

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
  | 'custom'    // カスタムトリガー

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
  customTypeName?: string // カスタムトリガータイプの名前
  customDescription?: string // カスタムトリガータイプの説明
  properties?: Record<string, any> // トリガーカスタムプロパティ
  conditions?: Array<{
    type: 'flag' | 'item' | 'level' | 'time' | 'random' | 'custom'
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'has' | 'not_has'
    key?: string
    value?: any
    probability?: number // for random
  }>
  repeatPolicy: {
    type: 'once' | 'always' | 'daily' | 'count' | 'custom'
    customPolicyName?: string // カスタム実行ポリシーの名前
    customPolicyDescription?: string // カスタム実行ポリシーの説明
    properties?: Record<string, any> // 実行ポリシーカスタムプロパティ
    maxCount?: number
  }
}

export interface EventAction {
  id: string
  type: ActionType
  params: Record<string, any>
  properties?: Record<string, any> // アクションカスタムプロパティ
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
    properties?: Record<string, any> // 外観カスタムプロパティ
  }
  trigger: EventTrigger
  actions: EventAction[]
  properties: Record<string, any> // カスタムプロパティ用
  flags: Record<string, any>
  enabled: boolean
  priority: number // 実行優先度
  metadata: {
    created: string
    modified: string
    author?: string
    version?: number
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
  decorations: Decoration[]
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
  properties: Record<string, any> // カスタムプロパティ
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
  properties: Record<string, any> // カスタムプロパティ
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

export type DrawingTool = 'pen' | 'rectangle' | 'fill' | 'eyedropper' | 'eraser' | 'template'
export type Layer = 'floor' | 'walls' | 'events' | 'decorations'
export type ViewMode = '2d'