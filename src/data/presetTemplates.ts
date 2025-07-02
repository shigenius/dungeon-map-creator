import { Template, TemplateCell } from '../types/map'

// 空のセルを作成するヘルパー関数
const createEmptyCell = (): TemplateCell => ({
  floor: {
    type: 'normal',
    passable: true
  },
  walls: {
    north: null,
    east: null,
    south: null,
    west: null
  },
  events: [],
  decorations: []
})

// 壁のあるセルを作成するヘルパー関数
const createWallCell = (walls: Partial<TemplateCell['walls']> = {}): TemplateCell => ({
  floor: {
    type: 'normal',
    passable: true
  },
  walls: {
    north: walls.north || null,
    east: walls.east || null,
    south: walls.south || null,
    west: walls.west || null
  },
  events: [],
  decorations: []
})

// 標準の壁オブジェクト
const normalWall = { type: 'normal' as const, transparent: false }
const door = { type: 'door' as const, transparent: false }

// プリセットテンプレート定義
export const presetTemplates: Template[] = [
  // テスト用シンプルテンプレート（回転確認用）
  {
    id: 'test-l-shape',
    name: 'L字テスト',
    description: '回転テスト用のL字形状',
    category: 'room',
    size: { width: 2, height: 2 },
    cells: [
      [
        createWallCell({ north: normalWall }),
        createEmptyCell()
      ],
      [
        createWallCell({ west: normalWall }),
        createEmptyCell()
      ]
    ],
    tags: ['テスト', '回転'],
    createdAt: new Date(),
    isBuiltIn: true
  },
  // 基本的な部屋テンプレート
  {
    id: 'room-3x3',
    name: '3×3の部屋',
    description: '扉付きの基本的な部屋',
    category: 'room',
    size: { width: 3, height: 3 },
    cells: [
      [
        createWallCell({ north: normalWall, west: normalWall }),
        createWallCell({ north: normalWall }),
        createWallCell({ north: normalWall, east: normalWall })
      ],
      [
        createWallCell({ west: normalWall }),
        createEmptyCell(),
        createWallCell({ east: normalWall })
      ],
      [
        createWallCell({ south: normalWall, west: normalWall }),
        createWallCell({ south: door }),
        createWallCell({ south: normalWall, east: normalWall })
      ]
    ],
    tags: ['基本', '部屋', '扉'],
    createdAt: new Date(),
    isBuiltIn: true
  },

  {
    id: 'room-5x5',
    name: '5×5の部屋',
    description: '大きめの部屋テンプレート',
    category: 'room',
    size: { width: 5, height: 5 },
    cells: [
      [
        createWallCell({ north: normalWall, west: normalWall }),
        createWallCell({ north: normalWall }),
        createWallCell({ north: normalWall }),
        createWallCell({ north: normalWall }),
        createWallCell({ north: normalWall, east: normalWall })
      ],
      [
        createWallCell({ west: normalWall }),
        createEmptyCell(),
        createEmptyCell(),
        createEmptyCell(),
        createWallCell({ east: normalWall })
      ],
      [
        createWallCell({ west: normalWall }),
        createEmptyCell(),
        createEmptyCell(),
        createEmptyCell(),
        createWallCell({ east: normalWall })
      ],
      [
        createWallCell({ west: normalWall }),
        createEmptyCell(),
        createEmptyCell(),
        createEmptyCell(),
        createWallCell({ east: normalWall })
      ],
      [
        createWallCell({ south: normalWall, west: normalWall }),
        createWallCell({ south: normalWall }),
        createWallCell({ south: door }),
        createWallCell({ south: normalWall }),
        createWallCell({ south: normalWall, east: normalWall })
      ]
    ],
    tags: ['大部屋', '広間'],
    createdAt: new Date(),
    isBuiltIn: true
  },

  // 廊下テンプレート
  {
    id: 'corridor-horizontal',
    name: '水平廊下',
    description: '左右に続く廊下',
    category: 'corridor',
    size: { width: 5, height: 1 },
    cells: [
      [
        createWallCell({ north: normalWall, south: normalWall }),
        createWallCell({ north: normalWall, south: normalWall }),
        createWallCell({ north: normalWall, south: normalWall }),
        createWallCell({ north: normalWall, south: normalWall }),
        createWallCell({ north: normalWall, south: normalWall })
      ]
    ],
    tags: ['廊下', '水平', '通路'],
    createdAt: new Date(),
    isBuiltIn: true
  },

  {
    id: 'corridor-vertical',
    name: '垂直廊下',
    description: '上下に続く廊下',
    category: 'corridor',
    size: { width: 1, height: 5 },
    cells: [
      [createWallCell({ east: normalWall, west: normalWall })],
      [createWallCell({ east: normalWall, west: normalWall })],
      [createWallCell({ east: normalWall, west: normalWall })],
      [createWallCell({ east: normalWall, west: normalWall })],
      [createWallCell({ east: normalWall, west: normalWall })]
    ],
    tags: ['廊下', '垂直', '通路'],
    createdAt: new Date(),
    isBuiltIn: true
  },

  // 交差点テンプレート
  {
    id: 'junction-cross',
    name: '十字路',
    description: '4方向に続く交差点',
    category: 'junction',
    size: { width: 3, height: 3 },
    cells: [
      [
        createEmptyCell(),
        createWallCell({ north: normalWall, south: normalWall }),
        createEmptyCell()
      ],
      [
        createWallCell({ east: normalWall, west: normalWall }),
        createEmptyCell(),
        createWallCell({ east: normalWall, west: normalWall })
      ],
      [
        createEmptyCell(),
        createWallCell({ north: normalWall, south: normalWall }),
        createEmptyCell()
      ]
    ],
    tags: ['交差点', '十字路', '4方向'],
    createdAt: new Date(),
    isBuiltIn: true
  },

  // トラップテンプレート
  {
    id: 'trap-pit',
    name: '落とし穴の部屋',
    description: '中央に落とし穴がある危険な部屋',
    category: 'trap',
    size: { width: 3, height: 3 },
    cells: [
      [
        createWallCell({ north: normalWall, west: normalWall }),
        createWallCell({ north: normalWall }),
        createWallCell({ north: normalWall, east: normalWall })
      ],
      [
        createWallCell({ west: normalWall }),
        {
          floor: { type: 'pit', passable: false },
          walls: { north: null, east: null, south: null, west: null },
          events: [],
          decorations: []
        },
        createWallCell({ east: normalWall })
      ],
      [
        createWallCell({ south: normalWall, west: normalWall }),
        createWallCell({ south: door }),
        createWallCell({ south: normalWall, east: normalWall })
      ]
    ],
    tags: ['トラップ', '落とし穴', '危険'],
    createdAt: new Date(),
    isBuiltIn: true
  },

  // マップ全体テンプレート
  {
    id: 'fullmap-simple-dungeon',
    name: 'シンプルダンジョン',
    description: '小さなダンジョンの基本レイアウト',
    category: 'fullmap',
    size: { width: 10, height: 10 },
    cells: (() => {
      // 10x10のマップを作成
      const cells = []
      for (let y = 0; y < 10; y++) {
        const row = []
        for (let x = 0; x < 10; x++) {
          if (y === 0 || y === 9 || x === 0 || x === 9) {
            // 外壁
            row.push(createWallCell({
              north: y === 0 ? normalWall : null,
              south: y === 9 ? normalWall : null,
              east: x === 9 ? normalWall : null,
              west: x === 0 ? normalWall : null
            }))
          } else if ((x === 5 && y >= 2 && y <= 7) || (y === 5 && x >= 2 && x <= 7)) {
            // 十字の廊下
            row.push(createEmptyCell())
          } else if ((x === 2 || x === 8) && (y === 2 || y === 8)) {
            // 四隅の部屋
            row.push(createWallCell({
              north: y === 2 ? normalWall : null,
              south: y === 8 ? normalWall : null,
              east: x === 8 ? normalWall : null,
              west: x === 2 ? normalWall : null
            }))
          } else {
            // 空のセル
            row.push(createEmptyCell())
          }
        }
        cells.push(row)
      }
      return cells
    })(),
    tags: ['ダンジョン', '全体', 'シンプル'],
    createdAt: new Date(),
    isBuiltIn: true,
    isFullMap: true
  },

  {
    id: 'fullmap-maze',
    name: '迷路ダンジョン',
    description: '迷路のような複雑なダンジョン',
    category: 'fullmap',
    size: { width: 8, height: 8 },
    cells: (() => {
      // 8x8の迷路を作成
      const cells = []
      for (let y = 0; y < 8; y++) {
        const row = []
        for (let x = 0; x < 8; x++) {
          if (y === 0 || y === 7 || x === 0 || x === 7) {
            // 外壁
            row.push(createWallCell({
              north: y === 0 ? normalWall : null,
              south: y === 7 ? normalWall : null,
              east: x === 7 ? normalWall : null,
              west: x === 0 ? normalWall : null
            }))
          } else {
            // 迷路の通路と壁を交互に配置
            const hasWallNorth = (x + y) % 3 === 0
            const hasWallEast = (x + y) % 3 === 1
            row.push(createWallCell({
              north: hasWallNorth ? normalWall : null,
              east: hasWallEast ? normalWall : null,
              south: null,
              west: null
            }))
          }
        }
        cells.push(row)
      }
      return cells
    })(),
    tags: ['迷路', '複雑', 'チャレンジ'],
    createdAt: new Date(),
    isBuiltIn: true,
    isFullMap: true
  }
]

// カテゴリ別のテンプレート取得関数
export const getTemplatesByCategory = (category: string) => {
  return presetTemplates.filter(template => template.category === category)
}

// 全てのカテゴリ取得関数
export const getAllCategories = () => {
  const categories = [...new Set(presetTemplates.map(template => template.category))]
  return categories.map(category => ({
    category,
    name: getCategoryDisplayName(category),
    templates: getTemplatesByCategory(category)
  }))
}

// カテゴリの表示名を取得
export const getCategoryDisplayName = (category: string) => {
  const categoryNames: Record<string, string> = {
    room: '部屋',
    corridor: '廊下',
    junction: '交差点',
    trap: 'トラップ',
    puzzle: 'パズル',
    decoration: '装飾',
    fullmap: 'マップ全体',
    custom: 'カスタム'
  }
  return categoryNames[category] || category
}