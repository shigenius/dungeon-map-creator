// グローバル変数の型定義
declare global {
  interface Window {
    eventPositionCallback?: (position: { x: number; y: number }) => void
  }
}

export {}