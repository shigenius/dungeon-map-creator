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
                appearance: { 
                  color: '#4169e1', 
                  icon: 'npc', 
                  visible: true,
                  properties: {
                    // 外観カスタムプロパティ例
                    animationType: 'floating', // アニメーション種類
                    glowEffect: true, // 発光エフェクト
                    opacity: 0.9, // 透明度
                    scale: 1.2, // サイズ倍率
                    rotation: 0, // 回転角度
                    blinkInterval: 2000, // 点滅間隔（ミリ秒）
                    shadowOffset: { x: 2, y: 2 }, // 影のオフセット
                    borderStyle: 'mystical', // 枠線スタイル
                    priority: 'high' // 描画優先度
                  }
                },
                trigger: { 
                  type: 'interact' as const, 
                  properties: {
                    // トリガーカスタムプロパティ例
                    triggerDistance: 1.5, // 接触判定距離
                    requiresFacing: true, // プレイヤーの向きが必要
                    allowWhileMoving: false, // 移動中の実行許可
                    soundEffect: 'interaction_chime',
                    visualFeedback: 'highlight_border'
                  },
                  repeatPolicy: { 
                    type: 'always' as const,
                    properties: {
                      // 実行ポリシーカスタムプロパティ例
                      cooldownTime: 0, // クールダウン時間（秒）
                      maxPerSession: -1, // セッションあたりの最大実行回数
                      resetOnFloorChange: false,
                      persistAcrossSaves: true
                    }
                  }
                },
                actions: [{
                  id: 'guard-dialogue',
                  type: 'message' as const,
                  params: { text: 'この遺跡に何の用だ？危険が潜んでいるぞ。' },
                  properties: {
                    // アクションカスタムプロパティ例
                    messageType: 'dialogue',
                    speakerName: '古い精霊',
                    voiceId: 'ethereal_male',
                    displayDuration: 3000, // ミリ秒
                    fontSize: 'large',
                    textColor: '#4169e1',
                    backgroundEffect: 'mystical_glow',
                    autoAdvance: false,
                    requiresAcknowledgment: true
                  }
                }],
                properties: {
                  // カスタムプロパティの設定例
                  npcLevel: 5,
                  faction: 'neutral',
                  dialogueKey: 'entrance_guard_intro',
                  merchantType: 'information',
                  maxInteractions: 3,
                  specialItems: ['ancient_key', 'relic_map'],
                  isImmortal: true
                },
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
                properties: {
                  // 回復系のカスタムプロパティ例
                  healAmount: 50,
                  healType: 'both', // 'hp', 'mp', 'both'
                  cooldownTime: 300, // 秒
                  maxUses: -1, // -1は無制限
                  requiresItem: false,
                  soundEffect: 'water_splash',
                  particleEffect: 'healing_sparkles',
                  blessingDuration: 600 // 祝福効果の持続時間
                },
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
                properties: {
                  // 宝箱系のカスタムプロパティ例
                  lootTable: 'common_ruins',
                  lockDifficulty: 3, // 1-10の難易度
                  requiredKey: 'rusty_key',
                  trapType: 'poison_needle', // 罠の種類
                  trapDamage: 15,
                  goldRange: [50, 150], // 最小-最大ゴールド
                  itemDropRate: 0.75, // アイテムドロップ率
                  rareItemChance: 0.1, // レアアイテム確率
                  isLocked: true,
                  openAnimation: 'chest_creak'
                },
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
                appearance: { 
                  color: '#ff4500', 
                  icon: 'torch', 
                  visible: true, 
                  layer: 1, 
                  rotation: 0, 
                  scale: 1.0 
                },
                position: { x, y },
                properties: {
                  // 照明系装飾のカスタムプロパティ例
                  lightRadius: 3, // 光の届く範囲
                  lightIntensity: 0.8, // 光の強度
                  fuelType: 'oil',
                  burnDuration: 480, // 燃焼時間（分）
                  flickerPattern: 'normal',
                  lightColor: '#ffaa33',
                  smokeDensity: 0.3,
                  isEternal: false, // 永久燃焼かどうか
                  fuelConsumed: 0.1, // 燃料消費率
                  lightQuality: 'warm' // 'warm', 'cold', 'magical'
                }
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
            
            // セルのカスタムプロパティ設定例
            let cellProperties: Record<string, any> = {}
            
            // 入口セルの例
            if (isEntrance) {
              cellProperties = {
                // 入口セルのカスタムプロパティ例
                cellType: 'entrance',
                spawnPoint: true,
                safeZone: true,
                weatherEffect: 'none',
                ambientSounds: ['wind_whistle', 'distant_echo'],
                temperature: 'cool',
                magicLevel: 'low',
                historicalSignificance: '古代の入口'
              }
            }
            // 中央の部屋
            else if (x === 6 && y === 6) {
              cellProperties = {
                // 特別な部屋のカスタムプロパティ例
                cellType: 'sacred_chamber',
                magicLevel: 'high',
                ambientEnergy: 'healing',
                echoDuration: 3.5,
                resonanceFrequency: 440,
                energyRegenRate: 1.2,
                protectedZone: true,
                spiritualSignificance: 'healing_sanctum'
              }
            }
            // 宝箱の場所
            else if (x === 9 && y === 2) {
              cellProperties = {
                // 宝箱周辺のカスタムプロパティ例
                cellType: 'treasure_alcove',
                dangerLevel: 'moderate',
                hiddenTrap: true,
                archaeologyValue: 'high',
                cursedGround: false,
                magicalResonance: 'gold_detection'
              }
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
              properties: cellProperties
            }
          })
        ),
        environment: {
          lighting: { ambient: 0.4, sources: [] },
          ceiling: { height: 3 },
          audio: {}
        },
        properties: {
          // フロア1のカスタムプロパティ例
          floorTheme: 'entrance',
          difficulty: 1,
          recommendedLevel: [1, 3],
          timeLimit: -1, // -1は無制限
          monstersAllowed: true,
          respawnRate: 300, // 秒
          environmentEffects: ['echo', 'dust'],
          magicZone: false,
          safeZone: true
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
                properties: {
                  // 魔法の宝箱のカスタムプロパティ例
                  lootTable: 'magic_ruins',
                  lockType: 'magical_seal',
                  lockDifficulty: 5, // 魔法的な難易度
                  requiredSpell: 'dispel_magic',
                  magicResistance: true,
                  trapType: 'magic_lightning',
                  trapDamage: 25,
                  goldRange: [100, 300],
                  itemDropRate: 0.9,
                  rareItemChance: 0.25,
                  magicItemChance: 0.5,
                  cursedItemChance: 0.1,
                  auraType: 'enchantment',
                  manaRegeneration: true
                },
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
                properties: {
                  // 石の番兵のカスタムプロパティ例
                  enemyType: 'construct',
                  level: 8,
                  hp: 120,
                  attack: 25,
                  defense: 15,
                  magicResistance: 0.3,
                  physicalResistance: 0.5,
                  elementalWeakness: ['lightning', 'acid'],
                  immunities: ['poison', 'charm', 'sleep'],
                  dropTable: 'construct_parts',
                  experienceValue: 150,
                  territoryRadius: 2,
                  aggroRange: 3,
                  canRespawn: true,
                  respawnTime: 1800, // 30分
                  patrolPattern: 'stationary',
                  alertsNearbyEnemies: true
                },
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
            
            // 2階のセルカスタムプロパティ設定例
            let cellProperties: Record<string, any> = {}
            
            // 中央の十字通路
            if (isCorridor) {
              cellProperties = {
                // 通路のカスタムプロパティ例
                cellType: 'main_corridor',
                trafficLevel: 'high',
                echoLevel: 2.0,
                windFlow: true,
                dustAccumulation: 'low',
                structuralIntegrity: 'good',
                hiddenCompartments: false,
                ambientMagic: 'medium'
              }
            }
            // 宝物の間（魔法の宝箱の場所）
            else if (x === 9 && y === 2) {
              cellProperties = {
                // 宝物の間のカスタムプロパティ例
                cellType: 'treasure_chamber',
                magicLevel: 'very_high',
                protectiveWards: true,
                detectionDifficulty: 8,
                antiTheftTraps: true,
                valuableItems: 'magical_artifacts',
                sanctificationLevel: 'blessed',
                timeDistortion: 'slight'
              }
            }
            // ダメージ床エリア
            else if (x === 6 && y === 9) {
              cellProperties = {
                // ダメージトラップのカスタムプロパティ例
                cellType: 'damage_trap',
                trapType: 'pressure_spikes',
                damageAmount: 15,
                triggerWeight: 20, // kg
                resetTime: 5, // 秒
                bypassMechanism: 'levitation',
                detectionDifficulty: 6,
                disarmDifficulty: 7,
                trapOrigin: 'ancient_security'
              }
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
              properties: cellProperties
            }
          })
        ),
        environment: {
          lighting: { ambient: 0.3, sources: [] },
          ceiling: { height: 4 },
          audio: {}
        },
        properties: {
          // フロア2のカスタムプロパティ例
          floorTheme: 'mystery_chambers',
          difficulty: 2,
          recommendedLevel: [3, 6],
          timeLimit: 1800, // 30分制限
          monstersAllowed: true,
          respawnRate: 240, // 4分
          environmentEffects: ['darkness', 'magical_aura'],
          magicZone: true,
          safeZone: false,
          puzzleFloor: true,
          hiddenSecrets: 3,
          magicalTraps: true
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
                properties: {
                  // 最終ボスのカスタムプロパティ例
                  bossType: 'undead_ruler',
                  level: 15,
                  hp: 500,
                  maxHp: 500,
                  attack: 45,
                  defense: 30,
                  magicPower: 60,
                  agility: 20,
                  magicResistance: 0.6,
                  physicalResistance: 0.4,
                  undeadImmunities: ['poison', 'disease', 'charm', 'sleep', 'paralysis'],
                  elementalAffinities: ['dark', 'necromancy'],
                  weaknesses: ['holy', 'light'],
                  phaseTransitions: [
                    { hpThreshold: 0.75, newAbilities: ['summon_minions'] },
                    { hpThreshold: 0.5, newAbilities: ['area_curse'] },
                    { hpThreshold: 0.25, newAbilities: ['berserk_mode'] }
                  ],
                  dropTable: 'legendary_boss',
                  experienceValue: 2000,
                  uniqueDrops: ['crown_of_ancient_kings', 'spectral_scepter'],
                  defeatConditions: 'hp_zero',
                  cannotFlee: true,
                  fightMusic: 'ancient_king_battle',
                  victoryEvents: ['ending_cutscene', 'dungeon_clear']
                },
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
                properties: {
                  // 最終宝箱のカスタムプロパティ例
                  treasureClass: 'legendary',
                  lootTable: 'ancient_royalty',
                  requiresBossDefeat: true,
                  requiredBossId: 'ancient-king',
                  lockType: 'royal_seal',
                  unsealsOnBossDeath: true,
                  goldRange: [1000, 2000],
                  guaranteedUniqueItems: ['orb_of_ancient_wisdom', 'eternal_flame_gem'],
                  artifactChance: 1.0, // 100% chance
                  cursedItemChance: 0.0, // 最終宝箱は呪われない
                  blessingType: 'ancient_kings_favor',
                  experienceBonus: 500,
                  questCompletion: ['main_quest_ruins'],
                  unlocksCutscene: 'treasure_discovery',
                  historicalValue: 'priceless',
                  dungeonClearReward: true
                },
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
                properties: {
                  // セーブポイントのカスタムプロパティ例
                  saveType: 'ancient_monument',
                  fullHealOnSave: true,
                  fullManaOnSave: true,
                  statusCureOnSave: true,
                  saveSlots: 3,
                  autosaveEnabled: true,
                  backupFrequency: 'every_save',
                  encryptedSave: true,
                  saveCompressionLevel: 'high',
                  includesScreenshot: true,
                  savesCharacterStats: true,
                  savesInventory: true,
                  savesQuestProgress: true,
                  quickSaveAvailable: true,
                  lastUsedTimestamp: null
                },
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
                appearance: { 
                  color: '#708090', 
                  icon: 'pillar', 
                  visible: true, 
                  layer: 2, 
                  rotation: 0, 
                  scale: 1.2 
                },
                position: { x, y },
                properties: {
                  // 古代の柱のカスタムプロパティ例
                  materialType: 'ancient_marble',
                  structuralIntegrity: 'excellent',
                  height: 5.0, // メートル
                  diameter: 0.8,
                  carvingStyle: 'royal_hieroglyphs',
                  magicalResonance: true,
                  supportLoad: 'very_high',
                  weatherResistance: 'immortal',
                  archaeologicalValue: 'priceless',
                  inscriptions: ['ancient_royal_lineage', 'power_blessing'],
                  magicalAura: 'protection',
                  constructionPeriod: 'first_dynasty',
                  craftmanshipLevel: 'master_artisan'
                }
              })
            }
            
            // 3階のセルカスタムプロパティ設定例
            let cellProperties: Record<string, any> = {}
            
            // 王座の間（中央の特別エリア）
            if (isThroneRoom) {
              cellProperties = {
                // 王座の間のカスタムプロパティ例
                cellType: 'throne_chamber',
                royalSanctity: 'highest',
                magicLevel: 'legendary',
                ancientPower: true,
                kinglyAura: 'overwhelming',
                spiritualSignificance: 'seat_of_power',
                historicalImportance: 'founding_dynasty',
                protectiveEnchantments: 'ancient_kings_ward',
                powerAmplification: 2.5,
                voiceEcho: 'royal_authority',
                crownResonance: true
              }
            }
            // 王座（ボス戦エリア）
            else if (x === 6 && y === 6) {
              cellProperties = {
                // ボス戦エリアのカスタムプロパティ例
                cellType: 'boss_arena',
                battleZone: true,
                escapePrevention: true,
                magicAmplification: 'boss_power',
                combatTerrain: 'royal_marble',
                atmosphericEffect: 'supernatural_dread',
                powerNode: true,
                ancientCurse: 'undead_king_wrath',
                finalBattleGround: true
              }
            }
            // 最終宝箱の間
            else if (x === 5 && y === 5) {
              cellProperties = {
                // 最終宝物の間のカスタムプロパティ例
                cellType: 'royal_treasury',
                treasureGrade: 'legendary',
                securityLevel: 'maximum',
                vaultProtection: 'ancient_kings_seal',
                valueBeyondMeasure: true,
                finalReward: true,
                questCulminationPoint: true
              }
            }
            // セーブポイント
            else if (x === 9 && y === 9) {
              cellProperties = {
                // 記録の石碑エリアのカスタムプロパティ例
                cellType: 'record_monument',
                memorialSite: true,
                historicalRecord: 'complete_adventure',
                safeZone: true,
                timelessPreservation: true,
                heroicCommemoration: true
              }
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
              properties: cellProperties
            }
          })
        ),
        environment: {
          lighting: { ambient: 0.2, sources: [] },
          ceiling: { height: 5 },
          audio: {}
        },
        properties: {
          // フロア3のカスタムプロパティ例（ボス階）
          floorTheme: 'ancient_throne_room',
          difficulty: 5,
          recommendedLevel: [8, 12],
          timeLimit: 3600, // 1時間制限
          monstersAllowed: false, // ボス戦のみ
          respawnRate: -1, // リスポーンなし
          environmentEffects: ['divine_aura', 'ancient_power', 'echoing_grandeur'],
          magicZone: true,
          safeZone: false,
          bossFloor: true,
          finalFloor: true,
          epicEncounter: true,
          royalSignificance: true,
          archaeologicalTreasure: 'priceless'
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
    },
    properties: {
      // ダンジョン全体のカスタムプロパティ例
      dungeonType: 'ancient_ruins',
      difficultyLevel: 'intermediate',
      recommendedLevel: 15,
      maxPartySize: 4,
      estimatedCompletionTime: 120, // 分
      dungeonTheme: 'royal_tomb',
      specialFeatures: ['multi_floor', 'boss_battle', 'treasure_hunting', 'npc_interaction'],
      magicLevel: 'high',
      historicalPeriod: 'ancient_kingdom',
      architecturalStyle: 'royal_palace',
      ambientMusic: 'mysterious_ruins',
      lightingCondition: 'dim_magical',
      weatherEffects: 'none',
      dangerRating: 'moderate',
      treasureValue: 'high',
      explorationComplexity: 'medium'
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