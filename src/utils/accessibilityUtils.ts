/**
 * アクセシビリティ対応のユーティリティ関数
 * 色覚障害者対応や視覚的な区別を支援
 */

// 床タイプ用のパターン（CSS背景パターン）
export const getFloorTypePattern = (floorType: string): string => {
  const patterns = {
    'stone': 'none', // 無地
    'wood': 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)', // 斜線
    'dirt': 'radial-gradient(circle at 25% 25%, rgba(0,0,0,0.1) 1px, transparent 1px)', // ドット
    'grass': 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)', // 水平線
    'water': 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px)', // 波模様
    'lava': 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 2px, transparent 3px)', // 泡模様
    'ice': 'linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.3) 75%)', // ダイヤモンド
    'sand': 'repeating-conic-gradient(from 0deg at 50% 50%, rgba(0,0,0,0.05) 0deg, rgba(0,0,0,0.05) 30deg, transparent 30deg, transparent 60deg)', // 六角形パターン
  }
  return patterns[floorType as keyof typeof patterns] || 'none'
}

// 床タイプ用のアイコン（Unicode文字）
export const getFloorTypeIcon = (floorType: string): string => {
  const icons = {
    'stone': '🗿', // 石
    'wood': '🪵', // 木材
    'dirt': '🟫', // 土
    'grass': '🌱', // 草
    'water': '💧', // 水
    'lava': '🔥', // 溶岩
    'ice': '❄️', // 氷
    'sand': '🏜️', // 砂
  }
  return icons[floorType as keyof typeof icons] || '⬜'
}

// イベント用の形状パターン
export const getEventShape = (eventType: string): 'circle' | 'square' | 'triangle' | 'diamond' | 'hexagon' => {
  const shapes = {
    'treasure': 'diamond', // 宝箱 = ダイヤモンド
    'npc': 'circle', // NPC = 円
    'enemy': 'triangle', // 敵 = 三角形
    'stairs': 'square', // 階段 = 四角形
    'door': 'square', // ドア = 四角形
    'switch': 'hexagon', // スイッチ = 六角形
    'save': 'circle', // セーブポイント = 円
    'heal': 'circle', // 回復ポイント = 円
    'shop': 'square', // ショップ = 四角形
    'sign': 'square', // 看板 = 四角形
    'harvest': 'hexagon', // 採取ポイント = 六角形
    'custom': 'diamond', // カスタム = ダイヤモンド
  }
  return (shapes[eventType as keyof typeof shapes] || 'circle') as 'circle' | 'square' | 'triangle' | 'diamond' | 'hexagon'
}

// イベント用のパターン
export const getEventPattern = (eventType: string): string => {
  const patterns = {
    'treasure': 'radial-gradient(circle, gold 30%, transparent 30%)', // 金色の中心
    'npc': 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)', // 斜線
    'enemy': 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,0,0,0.3) 1px, rgba(255,0,0,0.3) 3px)', // 赤い横線
    'stairs': 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)', // 階段状
    'door': 'linear-gradient(90deg, rgba(139,69,19,0.5) 20%, transparent 20%, transparent 80%, rgba(139,69,19,0.5) 80%)', // ドア枠
    'switch': 'radial-gradient(circle at center, rgba(255,255,0,0.5) 40%, transparent 40%)', // スイッチのライト
    'save': 'radial-gradient(circle, rgba(0,255,0,0.5) 50%, transparent 50%)', // 緑の中心
    'heal': 'repeating-conic-gradient(from 0deg at 50% 50%, rgba(0,255,255,0.3) 0deg, rgba(0,255,255,0.3) 90deg, transparent 90deg, transparent 180deg)', // 十字
    'shop': 'repeating-linear-gradient(45deg, rgba(255,215,0,0.3), rgba(255,215,0,0.3) 3px, transparent 3px, transparent 6px)', // 金色の斜線
    'sign': 'linear-gradient(180deg, rgba(139,69,19,0.5) 0%, rgba(139,69,19,0.5) 30%, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.8) 100%)', // 看板の木と紙
    'harvest': 'repeating-radial-gradient(circle, rgba(0,128,0,0.3) 0px, rgba(0,128,0,0.3) 1px, transparent 1px, transparent 4px)', // 緑のドット
    'custom': 'none', // カスタムは無地
  }
  return patterns[eventType as keyof typeof patterns] || 'none'
}

// 高コントラストかどうかの判定
export const isHighContrastMode = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches
}

// 動きを控えるかどうかの判定
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// 色覚障害をシミュレートするフィルター（開発・テスト用）
export const getColorBlindnessFilter = (type: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'none' = 'none'): string => {
  const filters = {
    'protanopia': 'filter: url("#protanopia-filter")', // 赤色覚異常
    'deuteranopia': 'filter: url("#deuteranopia-filter")', // 緑色覚異常
    'tritanopia': 'filter: url("#tritanopia-filter")', // 青色覚異常
    'none': '',
  }
  return filters[type]
}

// フォーカスリング用のスタイル
export const getFocusRingStyle = () => ({
  '&:focus-visible': {
    outline: '2px solid #005fcc',
    outlineOffset: '2px',
    borderRadius: '4px',
  },
})

// スキップリンク用のスタイル
export const getSkipLinkStyle = () => ({
  position: 'absolute',
  left: '-10000px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  '&:focus': {
    position: 'static',
    width: 'auto',
    height: 'auto',
    padding: '8px 16px',
    background: '#000',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '4px',
    zIndex: 9999,
  },
})

// ARIA ライブリージョン用の優先度を決める
export const getAriaLivePriority = (messageType: 'error' | 'warning' | 'info' | 'success'): 'assertive' | 'polite' => {
  return messageType === 'error' ? 'assertive' : 'polite'
}

// キーボードナビゲーション用のヘルパー
export const isNavigationKey = (key: string): boolean => {
  return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Tab'].includes(key)
}

// アクション実行用のキー判定
export const isActionKey = (key: string): boolean => {
  return ['Enter', ' ', 'Escape'].includes(key)
}

// タッチデバイス判定
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}