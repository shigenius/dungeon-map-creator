import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  rotateTemplate90, 
  rotateTemplate, 
  getRotatedSize, 
  getRotationDisplayName 
} from '../templateUtils'
import { Template } from '../../types/map'

// コンソールログをモック
vi.spyOn(console, 'log').mockImplementation(() => {})

describe('templateUtils', () => {
  let testTemplate: Template

  beforeEach(() => {
    testTemplate = {
      id: 'test-template',
      name: 'テスト2x3テンプレート',
      description: 'テスト用',
      category: 'room',
      size: { width: 2, height: 3 },
      cells: [
        [
          {
            floor: { type: 'normal', passable: true },
            walls: { 
              north: { type: 'normal', transparent: false }, 
              east: null, 
              south: null, 
              west: { type: 'door', transparent: false } 
            },
            events: [],
            decorations: []
          },
          {
            floor: { type: 'damage', passable: true },
            walls: { 
              north: null, 
              east: { type: 'normal', transparent: false }, 
              south: null, 
              west: null 
            },
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
            floor: { type: 'slippery', passable: true },
            walls: { north: null, east: null, south: null, west: null },
            events: [],
            decorations: []
          }
        ],
        [
          {
            floor: { type: 'normal', passable: true },
            walls: { 
              north: null, 
              east: null, 
              south: { type: 'normal', transparent: false }, 
              west: null 
            },
            events: [],
            decorations: []
          },
          {
            floor: { type: 'normal', passable: true },
            walls: { 
              north: null, 
              east: { type: 'door', transparent: false }, 
              south: { type: 'normal', transparent: false }, 
              west: null 
            },
            events: [],
            decorations: []
          }
        ]
      ],
      tags: ['test'],
      createdAt: new Date().toISOString(),
      isBuiltIn: false
    }
  })

  describe('rotateTemplate90', () => {
    it('2x3テンプレートを90度回転させると3x2になる', () => {
      const rotated = rotateTemplate90(testTemplate)
      
      expect(rotated.size.width).toBe(3)
      expect(rotated.size.height).toBe(2)
      expect(rotated.cells).toHaveLength(2)
      expect(rotated.cells[0]).toHaveLength(3)
      expect(rotated.cells[1]).toHaveLength(3)
    })

    it('セルの位置が正しく変換される', () => {
      const rotated = rotateTemplate90(testTemplate)
      
      // 元の位置(0, 0)は新しい位置(2, 0)になる
      // 90度時計回り: (x, y) → (height-1-y, x) = (0, 0) → (3-1-0, 0) = (2, 0)
      const originalCell = testTemplate.cells[0][0]
      const rotatedCell = rotated.cells[0][2]
      
      expect(rotatedCell.floor.type).toBe(originalCell.floor.type)
    })

    it('壁が正しく回転される', () => {
      const rotated = rotateTemplate90(testTemplate)
      
      // 元の位置(0, 0)のセル: north壁があり、west壁がドア
      const originalCell = testTemplate.cells[0][0]
      const rotatedCell = rotated.cells[0][2]
      
      // 90度時計回り回転: 北→東、東→南、南→西、西→北
      expect(rotatedCell.walls.north).toEqual(originalCell.walls.west) // 西→北
      expect(rotatedCell.walls.east).toEqual(originalCell.walls.north) // 北→東
      expect(rotatedCell.walls.south).toEqual(originalCell.walls.east) // 東→南
      expect(rotatedCell.walls.west).toEqual(originalCell.walls.south) // 南→西
    })

    it('元のテンプレートのプロパティが保持される', () => {
      const rotated = rotateTemplate90(testTemplate)
      
      expect(rotated.id).toBe(testTemplate.id)
      expect(rotated.name).toBe(testTemplate.name)
      expect(rotated.description).toBe(testTemplate.description)
      expect(rotated.category).toBe(testTemplate.category)
      expect(rotated.tags).toEqual(testTemplate.tags)
      expect(rotated.createdAt).toBe(testTemplate.createdAt)
      expect(rotated.isBuiltIn).toBe(testTemplate.isBuiltIn)
    })

    it('正方形テンプレート(2x2)の回転', () => {
      const squareTemplate: Template = {
        ...testTemplate,
        name: '正方形テンプレート',
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
              walls: { north: null, east: { type: 'door', transparent: false }, south: null, west: null },
              events: [],
              decorations: []
            }
          ],
          [
            {
              floor: { type: 'slippery', passable: true },
              walls: { north: null, east: null, south: { type: 'normal', transparent: false }, west: null },
              events: [],
              decorations: []
            },
            {
              floor: { type: 'normal', passable: true },
              walls: { north: null, east: null, south: null, west: { type: 'door', transparent: false } },
              events: [],
              decorations: []
            }
          ]
        ]
      }

      const rotated = rotateTemplate90(squareTemplate)
      
      expect(rotated.size.width).toBe(2)
      expect(rotated.size.height).toBe(2)
      
      // 元の(0,0)は新しい(1,0)に移動: (x, y) → (height-1-y, x) = (0,0) → (2-1-0, 0) = (1,0)
      const originalTopLeft = squareTemplate.cells[0][0]
      const rotatedTopLeft = rotated.cells[0][1]
      expect(rotatedTopLeft.floor.type).toBe(originalTopLeft.floor.type)
    })
  })

  describe('rotateTemplate', () => {
    it('0度回転は元のテンプレートをそのまま返す', () => {
      const rotated = rotateTemplate(testTemplate, 0)
      expect(rotated).toEqual(testTemplate)
    })

    it('90度回転は1回のrotateTemplate90と同じ結果', () => {
      const rotated90Direct = rotateTemplate90(testTemplate)
      const rotated90Function = rotateTemplate(testTemplate, 90)
      
      expect(rotated90Function.size).toEqual(rotated90Direct.size)
      expect(rotated90Function.cells).toEqual(rotated90Direct.cells)
    })

    it('180度回転で元の向きに戻る（サイズは同じ）', () => {
      const rotated180 = rotateTemplate(testTemplate, 180)
      
      expect(rotated180.size.width).toBe(testTemplate.size.width)
      expect(rotated180.size.height).toBe(testTemplate.size.height)
    })

    it('270度回転は90度回転の逆向き', () => {
      const rotated90 = rotateTemplate(testTemplate, 90)
      const rotated270 = rotateTemplate(testTemplate, 270)
      
      // 270度は90度の逆なので、サイズが同じで向きが逆
      expect(rotated270.size.width).toBe(rotated90.size.width)
      expect(rotated270.size.height).toBe(rotated90.size.height)
    })

    it('360度回転(4回90度)で元の状態に戻る', () => {
      const rotated90 = rotateTemplate(testTemplate, 90)
      const rotated180 = rotateTemplate(rotated90, 90)
      const rotated270 = rotateTemplate(rotated180, 90)
      const rotated360 = rotateTemplate(rotated270, 90)
      
      expect(rotated360.size).toEqual(testTemplate.size)
      expect(rotated360.cells).toEqual(testTemplate.cells)
    })

    it('壁の回転の完全性チェック', () => {
      // 各方向に異なる壁があるテンプレートを作成
      const wallTestTemplate: Template = {
        ...testTemplate,
        size: { width: 1, height: 1 },
        cells: [
          [
            {
              floor: { type: 'normal', passable: true },
              walls: { 
                north: { type: 'normal', transparent: false },
                east: { type: 'door', transparent: false },
                south: { type: 'locked_door', transparent: false },
                west: { type: 'hidden_door', transparent: false }
              },
              events: [],
              decorations: []
            }
          ]
        ]
      }

      const rotated90 = rotateTemplate(wallTestTemplate, 90)
      const cell = rotated90.cells[0][0]
      
      // 90度時計回り: 北→東、東→南、南→西、西→北
      expect(cell.walls.north?.type).toBe('hidden_door') // 元の西
      expect(cell.walls.east?.type).toBe('normal') // 元の北
      expect(cell.walls.south?.type).toBe('door') // 元の東
      expect(cell.walls.west?.type).toBe('locked_door') // 元の南
    })
  })

  describe('getRotatedSize', () => {
    it('0度と180度回転ではサイズが変わらない', () => {
      const originalSize = { width: 3, height: 5 }
      
      expect(getRotatedSize(originalSize, 0)).toEqual(originalSize)
      expect(getRotatedSize(originalSize, 180)).toEqual(originalSize)
    })

    it('90度と270度回転では幅と高さが入れ替わる', () => {
      const originalSize = { width: 3, height: 5 }
      const expectedRotatedSize = { width: 5, height: 3 }
      
      expect(getRotatedSize(originalSize, 90)).toEqual(expectedRotatedSize)
      expect(getRotatedSize(originalSize, 270)).toEqual(expectedRotatedSize)
    })

    it('正方形のサイズは回転しても変わらない', () => {
      const squareSize = { width: 4, height: 4 }
      
      expect(getRotatedSize(squareSize, 0)).toEqual(squareSize)
      expect(getRotatedSize(squareSize, 90)).toEqual(squareSize)
      expect(getRotatedSize(squareSize, 180)).toEqual(squareSize)
      expect(getRotatedSize(squareSize, 270)).toEqual(squareSize)
    })
  })

  describe('getRotationDisplayName', () => {
    it('各回転角度の表示名が正しく返される', () => {
      expect(getRotationDisplayName(0)).toBe('0°')
      expect(getRotationDisplayName(90)).toBe('90°')
      expect(getRotationDisplayName(180)).toBe('180°')
      expect(getRotationDisplayName(270)).toBe('270°')
    })
  })

  describe('複雑なテンプレートでの回転テスト', () => {
    it('イベントと装飾を含むテンプレートが正しく回転される', () => {
      const complexTemplate: Template = {
        ...testTemplate,
        size: { width: 2, height: 2 },
        cells: [
          [
            {
              floor: { type: 'normal', passable: true },
              walls: { north: null, east: null, south: null, west: null },
              events: [
                {
                  id: 'event1',
                  name: 'テスト宝箱',
                  type: 'treasure',
                  position: { x: 0, y: 0 },
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
              ],
              decorations: [
                {
                  id: 'deco1',
                  name: 'テスト装飾',
                  type: 'furniture',
                  position: { x: 0, y: 0 },
                  appearance: { color: '#8b4513', icon: '🪑' }
                }
              ]
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
              floor: { type: 'slippery', passable: true },
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
        ]
      }

      const rotated = rotateTemplate90(complexTemplate)
      
      // 元の(0,0)は新しい(1,0)に移動するはず
      const rotatedCell = rotated.cells[0][1]
      
      expect(rotatedCell.events).toHaveLength(1)
      expect(rotatedCell.events[0].name).toBe('テスト宝箱')
      expect(rotatedCell.decorations).toHaveLength(1)
      expect(rotatedCell.decorations[0].name).toBe('テスト装飾')
    })

    it('1x3の縦長テンプレートが正しく回転される', () => {
      const verticalTemplate: Template = {
        ...testTemplate,
        size: { width: 1, height: 3 },
        cells: [
          [
            {
              floor: { type: 'normal', passable: true },
              walls: { north: { type: 'normal', transparent: false }, east: null, south: null, west: null },
              events: [],
              decorations: []
            }
          ],
          [
            {
              floor: { type: 'damage', passable: true },
              walls: { north: null, east: null, south: null, west: null },
              events: [],
              decorations: []
            }
          ],
          [
            {
              floor: { type: 'slippery', passable: true },
              walls: { north: null, east: null, south: { type: 'normal', transparent: false }, west: null },
              events: [],
              decorations: []
            }
          ]
        ]
      }

      const rotated = rotateTemplate90(verticalTemplate)
      
      expect(rotated.size.width).toBe(3)
      expect(rotated.size.height).toBe(1)
      
      // 元の(0,0)は新しい(2,0)に移動
      expect(rotated.cells[0][2].floor.type).toBe('normal')
      // 元の(0,1)は新しい(1,0)に移動
      expect(rotated.cells[0][1].floor.type).toBe('damage')
      // 元の(0,2)は新しい(0,0)に移動
      expect(rotated.cells[0][0].floor.type).toBe('slippery')
    })
  })
})