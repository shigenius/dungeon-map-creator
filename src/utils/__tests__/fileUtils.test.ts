import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { downloadDungeonAsJSON, openDungeonFromFile } from '../fileUtils'
import { Dungeon } from '../../types/map'

// グローバルオブジェクトのモック
global.URL = {
  createObjectURL: vi.fn(),
  revokeObjectURL: vi.fn()
} as any

global.document = {
  createElement: vi.fn(),
  querySelector: vi.fn(),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
} as any

global.Blob = vi.fn() as any

// コンソールログをモック
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('fileUtils', () => {
  let testDungeon: Dungeon

  beforeEach(() => {
    testDungeon = {
      id: 'test-dungeon-id',
      name: 'テストダンジョン',
      author: 'テスター',
      version: '1.0.0',
      floors: [
        {
          id: 'floor-1',
          name: 'フロア1',
          width: 3,
          height: 3,
          cells: [
            [
              {
                x: 0,
                y: 0,
                floor: { type: 'normal', passable: true },
                walls: { north: null, east: null, south: null, west: null },
                events: [],
                decorations: [],
                properties: {}
              },
              {
                x: 1,
                y: 0,
                floor: { type: 'damage', passable: true },
                walls: { north: null, east: null, south: null, west: null },
                events: [],
                decorations: [],
                properties: {}
              },
              {
                x: 2,
                y: 0,
                floor: { type: 'normal', passable: true },
                walls: { north: null, east: null, south: null, west: null },
                events: [],
                decorations: [],
                properties: {}
              }
            ],
            [
              {
                x: 0,
                y: 1,
                floor: { type: 'normal', passable: true },
                walls: { north: null, east: null, south: null, west: null },
                events: [],
                decorations: [],
                properties: {}
              },
              {
                x: 1,
                y: 1,
                floor: { type: 'slippery', passable: true },
                walls: { north: null, east: null, south: null, west: null },
                events: [],
                decorations: [],
                properties: {}
              },
              {
                x: 2,
                y: 1,
                floor: { type: 'normal', passable: true },
                walls: { north: null, east: null, south: null, west: null },
                events: [],
                decorations: [],
                properties: {}
              }
            ],
            [
              {
                x: 0,
                y: 2,
                floor: { type: 'normal', passable: true },
                walls: { north: null, east: null, south: null, west: null },
                events: [],
                decorations: [],
                properties: {}
              },
              {
                x: 1,
                y: 2,
                floor: { type: 'normal', passable: true },
                walls: { north: null, east: null, south: null, west: null },
                events: [],
                decorations: [],
                properties: {}
              },
              {
                x: 2,
                y: 2,
                floor: { type: 'normal', passable: true },
                walls: { north: null, east: null, south: null, west: null },
                events: [],
                decorations: [],
                properties: {}
              }
            ]
          ],
          environment: {
            lighting: { ambient: 0.5, sources: [] },
            ceiling: { height: 3 },
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
        created: '2025-01-01T00:00:00.000Z',
        modified: '2025-01-01T12:00:00.000Z'
      }
    }

    // モックをリセット
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('downloadDungeonAsJSON', () => {
    it('ダンジョンをJSONファイルとしてダウンロードできる', () => {
      const mockBlob = {}
      const mockUrl = 'blob:mock-url'
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        style: {}
      }

      // モックの設定
      ;(global.Blob as any).mockReturnValue(mockBlob)
      ;(global.URL.createObjectURL as any).mockReturnValue(mockUrl)
      ;(global.document.createElement as any).mockReturnValue(mockLink)

      // テスト実行
      downloadDungeonAsJSON(testDungeon)

      // 検証
      expect(global.Blob).toHaveBeenCalledWith(
        [JSON.stringify(testDungeon, null, 2)],
        { type: 'application/json' }
      )
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
      expect(global.document.createElement).toHaveBeenCalledWith('a')
      expect(mockLink.href).toBe(mockUrl)
      expect(mockLink.download).toBe('テストダンジョン.json')
      expect(mockLink.click).toHaveBeenCalled()
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl)
    })

    it('ダンジョン名にスペシャル文字が含まれていてもファイル名が正しく設定される', () => {
      const specialDungeon = {
        ...testDungeon,
        name: '特殊/文字\\含む:ダンジョン'
      }

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        style: {}
      }

      ;(global.document.createElement as any).mockReturnValue(mockLink)
      ;(global.Blob as any).mockReturnValue({})
      ;(global.URL.createObjectURL as any).mockReturnValue('mock-url')

      downloadDungeonAsJSON(specialDungeon)

      expect(mockLink.download).toBe('特殊/文字\\含む:ダンジョン.json')
    })

    it('JSONシリアライゼーションが正しく行われる', () => {
      const mockBlob = {}
      ;(global.Blob as any).mockReturnValue(mockBlob)
      ;(global.URL.createObjectURL as any).mockReturnValue('mock-url')
      ;(global.document.createElement as any).mockReturnValue({
        href: '',
        download: '',
        click: vi.fn(),
        style: {}
      })

      downloadDungeonAsJSON(testDungeon)

      const expectedJson = JSON.stringify(testDungeon, null, 2)
      expect(global.Blob).toHaveBeenCalledWith(
        [expectedJson],
        { type: 'application/json' }
      )
    })
  })

  describe('openDungeonFromFile', () => {
    let mockFileInput: any
    let mockFile: any
    let mockFileReader: any

    beforeEach(() => {
      mockFileInput = {
        type: '',
        accept: '',
        style: { display: '' },
        addEventListener: vi.fn(),
        click: vi.fn(),
        files: null
      }

      mockFile = {
        name: 'test-dungeon.json',
        size: 1000,
        type: 'application/json'
      }

      mockFileReader = {
        onload: null,
        onerror: null,
        readAsText: vi.fn(),
        result: null
      }

      ;(global.document.createElement as any).mockReturnValue(mockFileInput)
      ;(global.document.querySelector as any).mockReturnValue(null)
      
      // FileReaderのモック（globalに設定済み）
      global.FileReader = vi.fn(() => mockFileReader) as any
    })

    it('ファイル選択ダイアログが正しく設定される', () => {
      const onLoad = vi.fn()
      
      openDungeonFromFile(onLoad)

      expect(global.document.createElement).toHaveBeenCalledWith('input')
      expect(mockFileInput.type).toBe('file')
      expect(mockFileInput.accept).toBe('.json')
      expect(mockFileInput.style.display).toBe('none')
      expect(global.document.body.appendChild).toHaveBeenCalledWith(mockFileInput)
      expect(mockFileInput.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
      expect(mockFileInput.click).toHaveBeenCalled()
    })

    it('既存のfile inputが削除される', () => {
      const existingInput = { remove: vi.fn() }
      ;(global.document.querySelector as any).mockReturnValue(existingInput)

      const onLoad = vi.fn()
      openDungeonFromFile(onLoad)

      expect(global.document.querySelector).toHaveBeenCalledWith('input[type="file"]')
      expect(existingInput.remove).toHaveBeenCalled()
    })

    it('有効なJSONファイルが正しく読み込まれる', () => {
      const onLoad = vi.fn()
      const onError = vi.fn()

      openDungeonFromFile(onLoad, onError)

      // changeイベントリスナーを取得
      const changeListener = mockFileInput.addEventListener.mock.calls[0][1]

      // ファイルが選択されたイベントをシミュレート
      mockFileInput.files = [mockFile]
      const changeEvent = { target: mockFileInput }
      changeListener(changeEvent)

      expect(global.FileReader).toHaveBeenCalled()
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile)

      // FileReaderのonloadイベントをシミュレート
      const dungeonJson = JSON.stringify(testDungeon)
      mockFileReader.result = dungeonJson
      const loadEvent = { target: { result: dungeonJson } }
      
      if (mockFileReader.onload) {
        mockFileReader.onload(loadEvent)
      }

      expect(onLoad).toHaveBeenCalledWith(testDungeon)
      expect(onError).not.toHaveBeenCalled()
      expect(global.document.body.removeChild).toHaveBeenCalledWith(mockFileInput)
    })

    it('無効なJSONファイルの場合エラーハンドラーが呼ばれる', () => {
      const onLoad = vi.fn()
      const onError = vi.fn()

      openDungeonFromFile(onLoad, onError)

      const changeListener = mockFileInput.addEventListener.mock.calls[0][1]
      mockFileInput.files = [mockFile]
      const changeEvent = { target: mockFileInput }
      changeListener(changeEvent)

      // 無効なJSONでFileReaderのonloadイベントをシミュレート
      const invalidJson = '{ invalid json }'
      const loadEvent = { target: { result: invalidJson } }
      
      if (mockFileReader.onload) {
        mockFileReader.onload(loadEvent)
      }

      expect(onLoad).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('エラーハンドラーが提供されていない場合はコンソールエラーが出力される', () => {
      const onLoad = vi.fn()

      openDungeonFromFile(onLoad) // onErrorなし

      const changeListener = mockFileInput.addEventListener.mock.calls[0][1]
      mockFileInput.files = [mockFile]
      const changeEvent = { target: mockFileInput }
      changeListener(changeEvent)

      // 無効なJSONでFileReaderのonloadイベントをシミュレート
      const invalidJson = '{ invalid json }'
      const loadEvent = { target: { result: invalidJson } }
      
      if (mockFileReader.onload) {
        mockFileReader.onload(loadEvent)
      }

      expect(console.error).toHaveBeenCalledWith('JSONパースエラー:', expect.any(Error))
      expect(console.error).toHaveBeenCalledWith('ファイルの読み込みに失敗しました:', expect.any(Error))
    })

    it('ファイルが選択されない場合の処理', () => {
      const onLoad = vi.fn()
      const onError = vi.fn()

      openDungeonFromFile(onLoad, onError)

      const changeListener = mockFileInput.addEventListener.mock.calls[0][1]
      mockFileInput.files = null // ファイル未選択
      const changeEvent = { target: mockFileInput }
      changeListener(changeEvent)

      expect(console.log).toHaveBeenCalledWith('ファイルが選択されていません')
      expect(global.FileReader).not.toHaveBeenCalled()
      expect(onLoad).not.toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
      expect(global.document.body.removeChild).toHaveBeenCalledWith(mockFileInput)
    })

    it('FileReaderエラーの処理', () => {
      const onLoad = vi.fn()
      const onError = vi.fn()

      openDungeonFromFile(onLoad, onError)

      const changeListener = mockFileInput.addEventListener.mock.calls[0][1]
      mockFileInput.files = [mockFile]
      const changeEvent = { target: mockFileInput }
      changeListener(changeEvent)

      // FileReaderのonerrorイベントをシミュレート
      const errorEvent = { target: { error: new Error('ファイル読み込みエラー') } }
      
      if (mockFileReader.onerror) {
        mockFileReader.onerror(errorEvent)
      }

      expect(console.error).toHaveBeenCalledWith('ファイル読み込みエラー:', errorEvent)
    })

    it('複雑なダンジョンデータが正しくパースされる', () => {
      const complexDungeon: Dungeon = {
        ...testDungeon,
        floors: [
          {
            ...testDungeon.floors[0],
            cells: testDungeon.floors[0].cells.map(row => 
              row.map(cell => ({
                ...cell,
                events: [
                  {
                    id: 'event-1',
                    name: 'テスト宝箱',
                    type: 'treasure',
                    position: { x: cell.x, y: cell.y },
                    appearance: { color: '#ffd700', icon: '💰' },
                    triggers: [],
                    actions: [],
                    metadata: {
                      created: '2025-01-01T00:00:00.000Z',
                      modified: '2025-01-01T00:00:00.000Z',
                      author: 'テスター',
                      version: 1
                    }
                  }
                ],
                decorations: [
                  {
                    id: 'deco-1',
                    name: 'テスト装飾',
                    type: 'furniture',
                    position: { x: cell.x, y: cell.y },
                    appearance: { color: '#8b4513', icon: '🪑' }
                  }
                ]
              }))
            )
          }
        ]
      }

      const onLoad = vi.fn()
      openDungeonFromFile(onLoad)

      const changeListener = mockFileInput.addEventListener.mock.calls[0][1]
      mockFileInput.files = [mockFile]
      const changeEvent = { target: mockFileInput }
      changeListener(changeEvent)

      const dungeonJson = JSON.stringify(complexDungeon)
      const loadEvent = { target: { result: dungeonJson } }
      
      if (mockFileReader.onload) {
        mockFileReader.onload(loadEvent)
      }

      expect(onLoad).toHaveBeenCalledWith(complexDungeon)
    })
  })
})