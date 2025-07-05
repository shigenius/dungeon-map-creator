import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2, 15)
  }
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  strokeRect: vi.fn(), // 追加: RightPanelで使用されている
  clearRect: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  setLineDash: vi.fn(), // 追加: 点線描画で使用
  globalAlpha: 1, // 追加: 透明度設定
  lineWidth: 1, // 追加: 線幅設定
  font: '10px Arial', // 追加: フォント設定
  textAlign: 'left', // 追加: テキスト配置
  textBaseline: 'alphabetic', // 追加: テキストベースライン
  fillStyle: '',
  strokeStyle: '',
}))

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn()
global.URL.revokeObjectURL = vi.fn()

// Mock FileReader
global.FileReader = class FileReader {
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  readAsText() {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: '{}' } } as any)
      }
    }, 0)
  }
} as any