import React, { useState, useCallback, useEffect } from 'react'
import { Box } from '@mui/material'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

/**
 * スクリーンリーダー用のライブリージョンコンポーネント
 * 重要な状態変更やユーザーアクションの結果を音声で通知
 */
const AccessibilityAnnouncer: React.FC = () => {
  const [announcement, setAnnouncement] = useState('')
  const [politeAnnouncement, setPoliteAnnouncement] = useState('')
  
  const { selectedTool, selectedLayer, zoom } = useSelector((state: RootState) => state.editor)
  const dungeon = useSelector((state: RootState) => state.map.dungeon)
  
  // ツール変更の通知
  useEffect(() => {
    if (selectedTool && dungeon) {
      const toolNames = {
        pen: 'ペンツール',
        rectangle: '矩形ツール',
        fill: '塗りつぶしツール',
        eyedropper: 'スポイトツール',
        eraser: '消しゴムツール',
        template: 'テンプレートツール'
      }
      setPoliteAnnouncement(`${toolNames[selectedTool]}が選択されました`)
    }
  }, [selectedTool, dungeon])
  
  // レイヤー変更の通知
  useEffect(() => {
    if (selectedLayer && dungeon) {
      const layerNames = {
        floor: '床レイヤー',
        walls: '壁レイヤー',
        events: 'イベントレイヤー',
        decorations: '装飾レイヤー'
      }
      setPoliteAnnouncement(`${layerNames[selectedLayer]}が選択されました`)
    }
  }, [selectedLayer, dungeon])
  
  // ズーム変更の通知（頻繁すぎるので間引き）
  useEffect(() => {
    const zoomPercent = Math.round(zoom * 100)
    if (zoomPercent % 25 === 0) { // 25%刻みでのみ通知
      setPoliteAnnouncement(`ズーム${zoomPercent}パーセント`)
    }
  }, [zoom])
  
  // プロジェクト状態の通知
  useEffect(() => {
    if (dungeon) {
      setAnnouncement(`新しいプロジェクト「${dungeon.name}」が作成されました。サイズ: ${dungeon.floors[0].width}×${dungeon.floors[0].height}`)
    }
  }, [dungeon])
  
  // アナウンス用のコールバック（他のコンポーネントから使用可能）
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAnnouncement(message)
    } else {
      setPoliteAnnouncement(message)
    }
  }, [])
  
  // グローバルにアクセス可能にする
  useEffect(() => {
    (window as any).accessibilityAnnounce = announce
  }, [announce])
  
  return (
    <>
      {/* 緊急度の高いアナウンス（即座に読み上げ） */}
      <Box
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        sx={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        {announcement}
      </Box>
      
      {/* 通常のアナウンス（他の読み上げが終わってから） */}
      <Box
        role="status"
        aria-live="polite"
        aria-atomic="true"
        sx={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        {politeAnnouncement}
      </Box>
    </>
  )
}

export default AccessibilityAnnouncer

// グローバル関数の型定義
declare global {
  interface Window {
    accessibilityAnnounce?: (message: string, priority?: 'polite' | 'assertive') => void
  }
}