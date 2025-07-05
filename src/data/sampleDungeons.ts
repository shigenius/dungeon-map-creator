import { Dungeon } from '../types/map'

export const sampleDungeons: Record<string, Dungeon> = {
  basicDungeon: {
    id: 'sample-basic',
    name: "神秘の遺跡",
    author: "ダンジョンマップクリエイター",
    version: '1.0.0',
    floors: [
      // 1階 - 入口フロア
      {
        id: 'floor-1',
        name: "遺跡の入口",
        width: 12,
        height: 12,
        cells: Array.from({ length: 12 }, (_, y) =>
          Array.from({ length: 12 }, (_, x) => {
            // 外壁で完全に囲む
            const isOuterWall = x === 0 || x === 11 || y === 0 || y === 11
            // 入口ドア
            const isEntrance = x === 6 && y === 0
            // 内部の部屋の壁
            const isInnerWall = (x === 5 && y >= 3 && y <= 8) || (x === 7 && y >= 3 && y <= 8) || (y === 3 && x >= 5 && x <= 7) || (y === 8 && x >= 5 && x <= 7)
            // 部屋のドア
            const isRoomDoor = (x === 6 && y === 3) || (x === 6 && y === 8)
            
            let events = []
            let decorations = []
            let floorType: 'normal' | 'damage' | 'slippery' | 'pit' | 'warp' = 'normal'
            
            // イベント配置
            if (x === 2 && y === 2) {
              events.push({
                id: 'entrance-guard',
                name: '遺跡の番人',
                type: 'npc' as const,
                description: '遺跡を守る古い精霊',
                position: { x, y },
                appearance: { color: '#4169e1', icon: 'npc', visible: true },
                trigger: { type: 'interact' as const, repeatPolicy: { type: 'always' as const } },
                actions: [],
                flags: {},
                enabled: true,
                priority: 1,
                metadata: { created: new Date('2024-01-01').toISOString(), modified: new Date('2024-01-01').toISOString(), author: 'System', version: 1 }
              })
            }
            
            if (x === 6 && y === 6) {
              events.push({
                id: 'healing-fountain',
                name: '癒しの泉',
                type: 'heal' as const,
                description: '体力を回復する神聖な泉',
                position: { x, y },
                appearance: { color: '#20b2aa', icon: 'heal', visible: true },
                trigger: { type: 'interact' as const, repeatPolicy: { type: 'always' as const } },
                actions: [],
                flags: {},
                enabled: true,
                priority: 1,
                metadata: { created: new Date('2024-01-01').toISOString(), modified: new Date('2024-01-01').toISOString(), author: 'System', version: 1 }
              })
              floorType = 'slippery'
            }
            
            if (x === 9 && y === 9) {
              events.push({
                id: 'stairs-up-1',
                name: '2階への階段',
                type: 'stairs' as const,
                description: '上の階へ続く古い石段',
                position: { x, y },
                appearance: { color: '#8b4513', icon: 'stairs', visible: true },
                trigger: { type: 'interact' as const, repeatPolicy: { type: 'always' as const } },
                actions: [{
                  id: 'warp-to-floor-2',
                  type: 'warp' as const,
                  params: { targetFloor: 1, x: 2, y: 2 }
                }],
                flags: {},
                enabled: true,
                priority: 1,
                metadata: { created: new Date('2024-01-01').toISOString(), modified: new Date('2024-01-01').toISOString(), author: 'System', version: 1 }
              })
            }
            
            if (x === 9 && y === 2) {
              events.push({
                id: 'treasure-chest-1',
                name: '古い宝箱',
                type: 'treasure' as const,
                description: '錆びた鍵がかかった宝箱',
                position: { x, y },
                appearance: { color: '#daa520', icon: 'treasure', visible: true },
                trigger: { type: 'interact' as const, repeatPolicy: { type: 'once' as const } },
                actions: [],
                flags: {},
                enabled: true,
                priority: 1,
                metadata: { created: new Date('2024-01-01').toISOString(), modified: new Date('2024-01-01').toISOString(), author: 'System', version: 1 }
              })
            }
            
            // 装飾配置
            if (x === 1 && y === 1) {
              decorations.push({
                id: 'torch-1',
                name: '松明',
                type: 'light' as const,
                appearance: { color: '#ff4500', icon: 'torch', visible: true },
                position: { x, y }
              })
            }
            
            if (x === 10 && y === 1) {
              decorations.push({
                id: 'torch-2',
                name: '松明',
                type: 'light' as const,
                appearance: { color: '#ff4500', icon: 'torch', visible: true },
                position: { x, y }
              })
            }
            
            return {
              x,
              y,
              floor: {
                type: floorType,
                passable: !isOuterWall || isEntrance,
              },
              walls: {
                north: (y === 0 && !isEntrance) || (isInnerWall && !isRoomDoor) ? { type: 'normal' as const, transparent: false } : null,
                east: (x === 11) || (isInnerWall && !isRoomDoor) ? { type: 'normal' as const, transparent: false } : null,
                south: (y === 11) || (isInnerWall && !isRoomDoor) ? { type: 'normal' as const, transparent: false } : null,
                west: (x === 0) || (isInnerWall && !isRoomDoor) ? { type: 'normal' as const, transparent: false } : null,
              },
              events,
              decorations,
              properties: {}
            }
          })
        ),
        environment: {
          lighting: { ambient: 0.4, sources: [] },
          ceiling: { height: 3 },
          audio: {}
        }
      },
      
      // 2階 - 中層フロア
      {
        id: 'floor-2',
        name: "宝物の間",
        width: 12,
        height: 12,
        cells: Array.from({ length: 12 }, (_, y) =>
          Array.from({ length: 12 }, (_, x) => {
            const isOuterWall = x === 0 || x === 11 || y === 0 || y === 11
            // 十字型の通路
            const isCorridor = (x === 6 && y >= 1 && y <= 10) || (y === 6 && x >= 1 && x <= 10)
            // 4つの部屋
            const isRoomWall = 
              (x === 3 && y >= 2 && y <= 4) || (y === 3 && x >= 2 && x <= 4) ||
              (x === 8 && y >= 2 && y <= 4) || (y === 3 && x >= 7 && x <= 9) ||
              (x === 3 && y >= 7 && y <= 9) || (y === 8 && x >= 2 && x <= 4) ||
              (x === 8 && y >= 7 && y <= 9) || (y === 8 && x >= 7 && x <= 9)
            
            let events = []
            let decorations = []
            let floorType: 'normal' | 'damage' | 'slippery' | 'pit' | 'warp' = 'normal'
            
            // 階段（1階から）
            if (x === 2 && y === 2) {
              events.push({
                id: 'stairs-down-2',
                name: '1階への階段',
                type: 'stairs' as const,
                description: '下の階へ続く石段',
                position: { x, y },
                appearance: { color: '#8b4513', icon: 'stairs', visible: true },
                trigger: { type: 'interact' as const, repeatPolicy: { type: 'always' as const } },
                actions: [{
                  id: 'warp-to-floor-1',
                  type: 'warp' as const,
                  params: { targetFloor: 0, x: 9, y: 9 }
                }],
                flags: {},
                enabled: true,
                priority: 1,
                metadata: { created: new Date('2024-01-01').toISOString(), modified: new Date('2024-01-01').toISOString(), author: 'System', version: 1 }
              })
            }
            
            // 3階への階段
            if (x === 9 && y === 9) {
              events.push({
                id: 'stairs-up-2',
                name: '3階への階段',
                type: 'stairs' as const,
                description: '最上階への階段',
                position: { x, y },
                appearance: { color: '#8b4513', icon: 'stairs', visible: true },
                trigger: { type: 'interact' as const, repeatPolicy: { type: 'always' as const } },
                actions: [{
                  id: 'warp-to-floor-3',
                  type: 'warp' as const,
                  params: { targetFloor: 2, x: 2, y: 2 }
                }],
                flags: {},
                enabled: true,
                priority: 1,
                metadata: { created: new Date('2024-01-01').toISOString(), modified: new Date('2024-01-01').toISOString(), author: 'System', version: 1 }
              })
            }
            
            // 宝箱
            if (x === 9 && y === 2) {
              events.push({
                id: 'magic-treasure',
                name: '魔法の宝箱',
                type: 'treasure' as const,
                description: '魔法で封印された宝箱',
                position: { x, y },
                appearance: { color: '#9400d3', icon: 'treasure', visible: true },
                trigger: { type: 'interact' as const, repeatPolicy: { type: 'once' as const } },
                actions: [],
                flags: {},
                enabled: true,
                priority: 1,
                metadata: { created: new Date('2024-01-01').toISOString(), modified: new Date('2024-01-01').toISOString(), author: 'System', version: 1 }
              })
            }
            
            // 敵・トラップ
            if (x === 2 && y === 9) {
              events.push({
                id: 'guardian-enemy',
                name: '石の番兵',
                type: 'enemy' as const,
                description: '遺跡を守る石の番兵',
                position: { x, y },
                appearance: { color: '#696969', icon: 'enemy', visible: true },
                trigger: { type: 'contact' as const, repeatPolicy: { type: 'always' as const } },
                actions: [],
                flags: {},
                enabled: true,
                priority: 1,
                metadata: { created: new Date('2024-01-01').toISOString(), modified: new Date('2024-01-01').toISOString(), author: 'System', version: 1 }
              })
            }
            
            // ダメージ床（トラップエリア）
            if (x === 6 && y === 9) {
              floorType = 'damage'
            }
            
            return {
              x,
              y,
              floor: {
                type: floorType,
                passable: !isOuterWall,
              },
              walls: {
                north: (y === 0) || (isRoomWall && !(x === 3 && y === 3) && !(x === 8 && y === 3)) ? { type: 'normal' as const, transparent: false } : null,
                east: (x === 11) || (isRoomWall && !(x === 3 && y === 3) && !(x === 8 && y === 3)) ? { type: 'normal' as const, transparent: false } : null,
                south: (y === 11) || (isRoomWall && !(x === 3 && y === 8) && !(x === 8 && y === 8)) ? { type: 'normal' as const, transparent: false } : null,
                west: (x === 0) || (isRoomWall && !(x === 3 && y === 3) && !(x === 3 && y === 8)) ? { type: 'normal' as const, transparent: false } : null,
              },
              events,
              decorations,
              properties: {}
            }
          })
        ),
        environment: {
          lighting: { ambient: 0.3, sources: [] },
          ceiling: { height: 4 },
          audio: {}
        }
      },
      
      // 3階 - 最上階（ボス部屋）
      {
        id: 'floor-3',
        name: "古代王の間",
        width: 12,
        height: 12,
        cells: Array.from({ length: 12 }, (_, y) =>
          Array.from({ length: 12 }, (_, x) => {
            const isOuterWall = x === 0 || x === 11 || y === 0 || y === 11
            // 中央の王座の間
            const isThroneRoom = x >= 4 && x <= 7 && y >= 4 && y <= 7
            const isThroneWall = 
              (x === 4 && y >= 4 && y <= 7) || (x === 7 && y >= 4 && y <= 7) ||
              (y === 4 && x >= 4 && x <= 7) || (y === 7 && x >= 4 && x <= 7)
            const isThroneEntrance = x === 6 && y === 4
            
            let events = []
            let decorations = []
            let floorType: 'normal' | 'damage' | 'slippery' | 'pit' | 'warp' = 'normal'
            
            // 2階からの階段
            if (x === 2 && y === 2) {
              events.push({
                id: 'stairs-down-3',
                name: '2階への階段',
                type: 'stairs' as const,
                description: '下の階への階段',
                position: { x, y },
                appearance: { color: '#8b4513', icon: 'stairs', visible: true },
                trigger: { type: 'interact' as const, repeatPolicy: { type: 'always' as const } },
                actions: [{
                  id: 'warp-to-floor-2',
                  type: 'warp' as const,
                  params: { targetFloor: 1, x: 9, y: 9 }
                }],
                flags: {},
                enabled: true,
                priority: 1,
                metadata: { created: new Date('2024-01-01').toISOString(), modified: new Date('2024-01-01').toISOString(), author: 'System', version: 1 }
              })
            }
            
            // 王座（最終ボス）
            if (x === 6 && y === 6) {
              events.push({
                id: 'ancient-king',
                name: '古代王の亡霊',
                type: 'enemy' as const,
                description: '遺跡の主である古代王の亡霊',
                position: { x, y },
                appearance: { color: '#800080', icon: 'enemy', visible: true },
                trigger: { type: 'contact' as const, repeatPolicy: { type: 'once' as const } },
                actions: [],
                flags: {},
                enabled: true,
                priority: 10,
                metadata: { created: new Date('2024-01-01').toISOString(), modified: new Date('2024-01-01').toISOString(), author: 'System', version: 1 }
              })
              floorType = 'warp'
            }
            
            // 最終宝箱
            if (x === 5 && y === 5) {
              events.push({
                id: 'ultimate-treasure',
                name: '古代王の秘宝',
                type: 'treasure' as const,
                description: '伝説の秘宝が眠る宝箱',
                position: { x, y },
                appearance: { color: '#ffd700', icon: 'treasure', visible: true },
                trigger: { type: 'interact' as const, repeatPolicy: { type: 'once' as const } },
                actions: [],
                flags: {},
                enabled: true,
                priority: 1,
                metadata: { created: new Date('2024-01-01').toISOString(), modified: new Date('2024-01-01').toISOString(), author: 'System', version: 1 }
              })
            }
            
            // セーブポイント
            if (x === 9 && y === 9) {
              events.push({
                id: 'final-save',
                name: '記録の石碑',
                type: 'save' as const,
                description: '冒険の記録を刻む石碑',
                position: { x, y },
                appearance: { color: '#00ff00', icon: 'save', visible: true },
                trigger: { type: 'interact' as const, repeatPolicy: { type: 'always' as const } },
                actions: [],
                flags: {},
                enabled: true,
                priority: 1,
                metadata: { created: new Date('2024-01-01').toISOString(), modified: new Date('2024-01-01').toISOString(), author: 'System', version: 1 }
              })
            }
            
            // 装飾（王座の間の柱）
            if ((x === 4 && y === 5) || (x === 7 && y === 5) || (x === 4 && y === 6) || (x === 7 && y === 6)) {
              decorations.push({
                id: `pillar-${x}-${y}`,
                name: '古代の柱',
                type: 'structure' as const,
                appearance: { color: '#708090', icon: 'pillar', visible: true },
                position: { x, y }
              })
            }
            
            return {
              x,
              y,
              floor: {
                type: floorType,
                passable: !isOuterWall,
              },
              walls: {
                north: (y === 0) || (isThroneWall && !isThroneEntrance) ? { type: 'normal' as const, transparent: false } : null,
                east: (x === 11) || (isThroneWall && !isThroneEntrance) ? { type: 'normal' as const, transparent: false } : null,
                south: (y === 11) || (isThroneWall && !isThroneEntrance) ? { type: 'normal' as const, transparent: false } : null,
                west: (x === 0) || (isThroneWall && !isThroneEntrance) ? { type: 'normal' as const, transparent: false } : null,
              },
              events,
              decorations,
              properties: {}
            }
          })
        ),
        environment: {
          lighting: { ambient: 0.2, sources: [] },
          ceiling: { height: 5 },
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
      created: new Date('2024-01-01').toISOString(),
      modified: new Date('2024-01-01').toISOString(),
      description: '3階層からなる本格的なダンジョン遺跡。入口から王座の間まで段階的に難易度が上がる完全なRPGダンジョン体験ができます。'
    }
  }
}

export const getSampleDungeonsList = () => {
  return Object.entries(sampleDungeons).map(([id, dungeon]) => ({
    id,
    name: dungeon.name,
    description: dungeon.metadata.description || '',
    author: dungeon.author,
    difficulty: 'medium',
    tags: ['完全ダンジョン', '3階層', '本格RPG', 'ボス戦', '宝箱', 'NPC'],
    floors: dungeon.floors.length,
    size: `${dungeon.floors[0]?.width || 0}×${dungeon.floors[0]?.height || 0}`
  }))
}