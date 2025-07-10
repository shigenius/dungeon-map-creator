import { DungeonEvent, EventType } from '../types/map'

export interface EventTemplate {
  id: string
  name: string
  description: string
  category: 'treasure' | 'npc' | 'puzzle' | 'trap' | 'utility' | 'custom'
  presetEvent: Partial<DungeonEvent>
  previewIcon: string
  tags: string[]
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  // 宝箱系テンプレート
  {
    id: 'basic-treasure',
    name: '基本宝箱',
    description: 'ゴールドが入った基本的な宝箱',
    category: 'treasure',
    presetEvent: {
      type: 'treasure' as EventType,
      name: '宝箱',
      description: 'ゴールドが入った宝箱',
      appearance: { 
        color: '#ffd700', 
        icon: '💰', 
        visible: true,
        direction: 'none'
      },
      trigger: { 
        type: 'interact', 
        repeatPolicy: { type: 'once' } 
      },
      actions: [
        { 
          id: crypto.randomUUID(),
          type: 'message', 
          params: { text: '宝箱を開けた！\n100ゴールドを手に入れた。' } 
        },
        { 
          id: crypto.randomUUID(),
          type: 'item', 
          params: { operation: 'add', itemId: 'gold', count: 100 } 
        }
      ],
      enabled: true,
      priority: 1
    },
    previewIcon: '💰',
    tags: ['treasure', 'gold', 'basic']
  },
  {
    id: 'rare-treasure',
    name: 'レア宝箱',
    description: 'レアアイテムが入った特別な宝箱',
    category: 'treasure',
    presetEvent: {
      type: 'treasure' as EventType,
      name: 'レア宝箱',
      description: 'レアアイテムが入った特別な宝箱',
      appearance: { 
        color: '#ff6b35', 
        icon: '🎁', 
        visible: true,
        direction: 'none'
      },
      trigger: { 
        type: 'interact', 
        repeatPolicy: { type: 'once' } 
      },
      actions: [
        { 
          id: crypto.randomUUID(),
          type: 'message', 
          params: { text: '輝く宝箱を開けた！\nレアアイテムを発見した！' } 
        },
        { 
          id: crypto.randomUUID(),
          type: 'item', 
          params: { operation: 'add', itemId: 'rare_sword', count: 1 } 
        }
      ],
      enabled: true,
      priority: 2
    },
    previewIcon: '🎁',
    tags: ['treasure', 'rare', 'equipment']
  },

  // NPC系テンプレート
  {
    id: 'friendly-npc',
    name: '友好的NPC',
    description: '情報を教えてくれる友好的なNPC',
    category: 'npc',
    presetEvent: {
      type: 'npc' as EventType,
      name: '村人',
      description: '親切な村人',
      appearance: { 
        color: '#40e0d0', 
        icon: '👤', 
        visible: true,
        direction: 'none'
      },
      trigger: { 
        type: 'interact', 
        repeatPolicy: { type: 'always' } 
      },
      actions: [
        { 
          id: crypto.randomUUID(),
          type: 'message', 
          params: { text: 'こんにちは！\nここは平和な村です。' } 
        }
      ],
      enabled: true,
      priority: 1
    },
    previewIcon: '👤',
    tags: ['npc', 'friendly', 'information']
  },
  {
    id: 'merchant-npc',
    name: '商人',
    description: 'アイテムを売買する商人',
    category: 'npc',
    presetEvent: {
      type: 'npc' as EventType,
      name: '商人',
      description: 'アイテムを売買する商人',
      appearance: { 
        color: '#8b4513', 
        icon: '🛒', 
        visible: true,
        direction: 'none'
      },
      trigger: { 
        type: 'interact', 
        repeatPolicy: { type: 'always' } 
      },
      actions: [
        { 
          id: crypto.randomUUID(),
          type: 'message', 
          params: { text: 'いらっしゃい！\n何か買っていきませんか？' } 
        },
        { 
          id: crypto.randomUUID(),
          type: 'shop', 
          params: { shopId: 'basic_shop' } 
        }
      ],
      enabled: true,
      priority: 1
    },
    previewIcon: '🛒',
    tags: ['npc', 'shop', 'merchant']
  },

  // ユーティリティ系テンプレート
  {
    id: 'save-point',
    name: 'セーブポイント',
    description: 'ゲームをセーブできるポイント',
    category: 'utility',
    presetEvent: {
      type: 'save' as EventType,
      name: 'セーブポイント',
      description: 'ゲームをセーブできるクリスタル',
      appearance: { 
        color: '#44aaff', 
        icon: '💾', 
        visible: true,
        direction: 'none'
      },
      trigger: { 
        type: 'interact', 
        repeatPolicy: { type: 'always' } 
      },
      actions: [
        { 
          id: crypto.randomUUID(),
          type: 'message', 
          params: { text: 'セーブポイントです。\nゲームをセーブしますか？' } 
        },
        { 
          id: crypto.randomUUID(),
          type: 'save', 
          params: {} 
        }
      ],
      enabled: true,
      priority: 1
    },
    previewIcon: '💾',
    tags: ['utility', 'save', 'checkpoint']
  },
  {
    id: 'heal-point',
    name: '回復ポイント',
    description: 'HPとMPを回復できるポイント',
    category: 'utility',
    presetEvent: {
      type: 'heal' as EventType,
      name: '回復の泉',
      description: 'HPとMPを完全回復できる泉',
      appearance: { 
        color: '#44ffaa', 
        icon: '❤️', 
        visible: true,
        direction: 'none'
      },
      trigger: { 
        type: 'interact', 
        repeatPolicy: { type: 'always' } 
      },
      actions: [
        { 
          id: crypto.randomUUID(),
          type: 'message', 
          params: { text: '回復の泉です。\n体力が完全に回復した！' } 
        },
        { 
          id: crypto.randomUUID(),
          type: 'heal', 
          params: { hp: 'full', mp: 'full' } 
        }
      ],
      enabled: true,
      priority: 1
    },
    previewIcon: '❤️',
    tags: ['utility', 'heal', 'restoration']
  },

  // パズル・トラップ系テンプレート
  {
    id: 'simple-switch',
    name: '簡単なスイッチ',
    description: 'フラグを切り替える簡単なスイッチ',
    category: 'puzzle',
    presetEvent: {
      type: 'switch' as EventType,
      name: 'スイッチ',
      description: '何かを動作させるスイッチ',
      appearance: { 
        color: '#ffaa44', 
        icon: '🔘', 
        visible: true,
        direction: 'none'
      },
      trigger: { 
        type: 'interact', 
        repeatPolicy: { type: 'always' } 
      },
      actions: [
        { 
          id: crypto.randomUUID(),
          type: 'message', 
          params: { text: 'スイッチを押した！\n何かが動いた音がした…' } 
        },
        { 
          id: crypto.randomUUID(),
          type: 'flag', 
          params: { operation: 'toggle', flagName: 'switch_activated' } 
        }
      ],
      enabled: true,
      priority: 1
    },
    previewIcon: '🔘',
    tags: ['puzzle', 'switch', 'flag']
  },
  {
    id: 'pressure-plate',
    name: '感圧板',
    description: '踏むと動作する感圧板',
    category: 'trap',
    presetEvent: {
      type: 'switch' as EventType,
      name: '感圧板',
      description: '踏むと何かが動作する床の仕掛け',
      appearance: { 
        color: '#888888', 
        icon: '⬜', 
        visible: true,
        direction: 'none'
      },
      trigger: { 
        type: 'step', 
        repeatPolicy: { type: 'always' } 
      },
      actions: [
        { 
          id: crypto.randomUUID(),
          type: 'message', 
          params: { text: 'カチッ…\n何かの音がした！' } 
        },
        { 
          id: crypto.randomUUID(),
          type: 'flag', 
          params: { operation: 'set', flagName: 'pressure_plate_stepped', value: true } 
        }
      ],
      enabled: true,
      priority: 1
    },
    previewIcon: '⬜',
    tags: ['trap', 'automatic', 'hidden']
  },

  // 階段・移動系テンプレート
  {
    id: 'stairs-up',
    name: '上り階段',
    description: '上の階に移動する階段',
    category: 'utility',
    presetEvent: {
      type: 'stairs' as EventType,
      name: '上り階段',
      description: '上の階へ続く階段',
      appearance: { 
        color: '#888888', 
        icon: '🪜', 
        visible: true,
        direction: 'none'
      },
      trigger: { 
        type: 'interact', 
        repeatPolicy: { type: 'always' } 
      },
      actions: [
        { 
          id: crypto.randomUUID(),
          type: 'message', 
          params: { text: '上の階に移動しますか？' } 
        },
        { 
          id: crypto.randomUUID(),
          type: 'warp', 
          params: { targetFloor: 1, x: 0, y: 0 } 
        }
      ],
      enabled: true,
      priority: 1
    },
    previewIcon: '🪜',
    tags: ['utility', 'stairs', 'movement']
  },
  {
    id: 'stairs-down',
    name: '下り階段',
    description: '下の階に移動する階段',
    category: 'utility',
    presetEvent: {
      type: 'stairs' as EventType,
      name: '下り階段',
      description: '下の階へ続く階段',
      appearance: { 
        color: '#666666', 
        icon: '🕳️', 
        visible: true,
        direction: 'none'
      },
      trigger: { 
        type: 'interact', 
        repeatPolicy: { type: 'always' } 
      },
      actions: [
        { 
          id: crypto.randomUUID(),
          type: 'message', 
          params: { text: '下の階に移動しますか？' } 
        },
        { 
          id: crypto.randomUUID(),
          type: 'warp', 
          params: { targetFloor: -1, x: 0, y: 0 } 
        }
      ],
      enabled: true,
      priority: 1
    },
    previewIcon: '🕳️',
    tags: ['utility', 'stairs', 'movement']
  },

  // 敵・戦闘系テンプレート
  {
    id: 'weak-enemy',
    name: '弱い敵',
    description: '初心者向けの弱い敵',
    category: 'trap',
    presetEvent: {
      type: 'enemy' as EventType,
      name: 'スライム',
      description: '弱くて可愛い敵',
      appearance: { 
        color: '#44ff44', 
        icon: '👹', 
        visible: true,
        direction: 'none'
      },
      trigger: { 
        type: 'contact', 
        repeatPolicy: { type: 'once' } 
      },
      actions: [
        { 
          id: crypto.randomUUID(),
          type: 'message', 
          params: { text: 'スライムが現れた！' } 
        },
        { 
          id: crypto.randomUUID(),
          type: 'battle', 
          params: { enemyId: 'slime', escapeAllowed: true } 
        }
      ],
      enabled: true,
      priority: 1
    },
    previewIcon: '👹',
    tags: ['enemy', 'battle', 'weak']
  },

  // カスタム・特殊イベント
  {
    id: 'custom-empty',
    name: '空のカスタムイベント',
    description: '自由にカスタマイズできる空のイベント',
    category: 'custom',
    presetEvent: {
      type: 'custom' as EventType,
      name: 'カスタムイベント',
      description: '',
      appearance: { 
        color: '#9370db', 
        icon: '❓', 
        visible: true,
        direction: 'none'
      },
      trigger: { 
        type: 'interact', 
        repeatPolicy: { type: 'once' } 
      },
      actions: [],
      enabled: true,
      priority: 1
    },
    previewIcon: '❓',
    tags: ['custom', 'empty', 'template']
  }
]

export const getTemplatesByCategory = (category: EventTemplate['category']): EventTemplate[] => {
  return EVENT_TEMPLATES.filter(template => template.category === category)
}

export const getTemplateById = (id: string): EventTemplate | undefined => {
  return EVENT_TEMPLATES.find(template => template.id === id)
}

export const searchTemplates = (query: string): EventTemplate[] => {
  const lowerQuery = query.toLowerCase()
  return EVENT_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

export const TEMPLATE_CATEGORIES = [
  { key: 'treasure', name: '宝箱', icon: '💰', description: '宝箱や報酬系のイベント' },
  { key: 'npc', name: 'NPC', icon: '👤', description: 'NPCや会話系のイベント' },
  { key: 'puzzle', name: 'パズル', icon: '🧩', description: 'パズルや仕掛け系のイベント' },
  { key: 'trap', name: 'トラップ', icon: '⚠️', description: 'トラップや敵系のイベント' },
  { key: 'utility', name: 'ユーティリティ', icon: '🔧', description: 'セーブや回復などの機能系イベント' },
  { key: 'custom', name: 'カスタム', icon: '⚙️', description: 'カスタマイズ可能なイベント' }
] as const